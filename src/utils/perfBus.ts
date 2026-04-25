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
  private readonly longTasks: { ts: number; durationMs: number }[] = [];
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
    this.longTasks.push({ ts: now, durationMs });
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
    const fresh = this.pruneLongTasks(nowMs());
    const longTasksLastMinute = fresh.length;
    const longTasksTotalMsLastMinute = fresh.reduce((acc, lt) => acc + lt.durationMs, 0);
    const heapMB = readHeapMB();
    const fps = summary.mean > 0 ? 1000 / summary.mean : 0;
    const minuteScale = 60_000 / LONG_TASK_WINDOW_MS;

    return {
      fps,
      frameTime: summary.mean,
      p1: summary.p1,
      p5: summary.p5,
      p50: summary.p50,
      p95: summary.p95,
      longTasksPerMinute: longTasksLastMinute * minuteScale,
      longTasksLastMinute,
      longTasksTotalMsLastMinute,
      longTasksTotalMsPerMinute: longTasksTotalMsLastMinute * minuteScale,
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
    this.longTasks.length = 0;
    this.webVitals.length = 0;
  }

  private preferredSource(): PerfSampleSource {
    if (this.rings.render.size > 0) return 'render';
    if (this.rings.game.size > 0) return 'game';
    return 'main';
  }

  private pruneLongTasks(now: number): readonly { ts: number; durationMs: number }[] {
    const cutoff = now - LONG_TASK_WINDOW_MS;
    while (this.longTasks.length > 0 && (this.longTasks[0]?.ts ?? 0) < cutoff) {
      this.longTasks.shift();
    }
    return this.longTasks;
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
