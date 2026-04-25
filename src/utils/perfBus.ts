import type {
  PerfBatchMessage,
  PerfMetricsView,
  PerfSampleSource,
  PerfWebVitalsEvent,
} from '@/types/perf';
import {
  createFrameTimeRing,
  pushFrameTime,
  resetFrameTimeRing,
  summarize,
  type FrameTimeRing,
} from '@/utils/percentiles';

const FRAME_RING_CAPACITY = 240;
const LONG_TASK_WINDOW_MS = 60_000;

interface MemoryLikePerformance {
  memory?: { usedJSHeapSize: number };
}

class PerfBus {
  private readonly rings: Record<PerfSampleSource, FrameTimeRing> = {
    render: createFrameTimeRing(FRAME_RING_CAPACITY),
    game: createFrameTimeRing(FRAME_RING_CAPACITY),
    main: createFrameTimeRing(FRAME_RING_CAPACITY),
  };
  private readonly longTaskTimestamps: number[] = [];
  private readonly webVitals: PerfWebVitalsEvent[] = [];

  recordFrameTime(source: PerfSampleSource, frameTimeMs: number): void {
    if (!Number.isFinite(frameTimeMs) || frameTimeMs < 0) return;
    pushFrameTime(this.rings[source], frameTimeMs);
  }

  recordBatch(message: PerfBatchMessage): void {
    const ring = this.rings[message.source];
    if (!ring) return;
    for (let i = 0; i < message.samples.length; i++) {
      const sample = message.samples[i] ?? 0;
      pushFrameTime(ring, sample);
    }
  }

  recordLongTask(durationMs: number): void {
    if (!Number.isFinite(durationMs) || durationMs <= 0) return;
    const now = nowMs();
    this.longTaskTimestamps.push(now);
    this.pruneLongTasks(now);
  }

  recordWebVital(event: PerfWebVitalsEvent): void {
    this.webVitals.push(event);
  }

  attachWorker(worker: Worker | MessagePort, defaultSource: PerfSampleSource): () => void {
    const handler = (evt: MessageEvent): void => {
      const data = evt.data;
      if (!data || data.type !== 'PERF_SAMPLE') return;
      this.recordBatch({
        type: 'PERF_SAMPLE',
        source: data.source ?? defaultSource,
        samples: Array.isArray(data.samples) ? data.samples : [],
        batchEndTs: data.batchEndTs ?? nowMs(),
      });
    };
    worker.addEventListener('message', handler as EventListener);
    return () => worker.removeEventListener('message', handler as EventListener);
  }

  getMetricsBySource(source: PerfSampleSource): PerfMetricsView {
    const summary = summarize(this.rings[source]);
    const longTasksLastMinute = this.pruneLongTasks(nowMs()).length;
    const heapMB = readHeapMB();
    const fps = summary.mean > 0 ? 1000 / summary.mean : 0;

    return {
      fps,
      frameTime: summary.mean,
      p1: summary.p1,
      p5: summary.p5,
      p50: summary.p50,
      p95: summary.p95,
      longTasksPerMinute: (longTasksLastMinute * 60_000) / LONG_TASK_WINDOW_MS,
      longTasksLastMinute,
      heapMB,
      sampleCount: summary.count,
    };
  }

  getMetrics(): PerfMetricsView {
    return this.getMetricsBySource(this.preferredSource());
  }

  getWebVitals(): readonly PerfWebVitalsEvent[] {
    return this.webVitals;
  }

  reset(): void {
    resetFrameTimeRing(this.rings.render);
    resetFrameTimeRing(this.rings.game);
    resetFrameTimeRing(this.rings.main);
    this.longTaskTimestamps.length = 0;
    this.webVitals.length = 0;
  }

  private preferredSource(): PerfSampleSource {
    if (this.rings.render.size > 0) return 'render';
    if (this.rings.game.size > 0) return 'game';
    return 'main';
  }

  private pruneLongTasks(now: number): readonly number[] {
    const cutoff = now - LONG_TASK_WINDOW_MS;
    while (this.longTaskTimestamps.length > 0 && (this.longTaskTimestamps[0] ?? 0) < cutoff) {
      this.longTaskTimestamps.shift();
    }
    return this.longTaskTimestamps;
  }
}

function nowMs(): number {
  if (typeof performance !== 'undefined') return performance.now();
  return Date.now();
}

function readHeapMB(): number | undefined {
  if (typeof performance === 'undefined') return undefined;
  const memory = (performance as unknown as MemoryLikePerformance).memory;
  if (!memory || typeof memory.usedJSHeapSize !== 'number') return undefined;
  return memory.usedJSHeapSize / 1024 / 1024;
}

export const perfBus = new PerfBus();

export type { PerfBus };
