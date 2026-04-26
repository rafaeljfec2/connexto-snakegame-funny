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

interface SourceRings {
  workTimes: FrameTimeRing;
  intervals: FrameTimeRing;
}

class PerfBus {
  private readonly rings: Record<PerfSampleSource, SourceRings> = {
    render: createSourceRings(),
    game: createSourceRings(),
    main: createSourceRings(),
  };
  private readonly longTasks: { ts: number; durationMs: number }[] = [];
  private readonly webVitals: PerfWebVitalsEvent[] = [];

  recordWorkTime(source: PerfSampleSource, workTimeMs: number): void {
    if (!Number.isFinite(workTimeMs) || workTimeMs < 0) return;
    pushFrameTime(this.rings[source].workTimes, workTimeMs);
  }

  recordInterval(source: PerfSampleSource, intervalMs: number): void {
    if (!Number.isFinite(intervalMs) || intervalMs < 0) return;
    pushFrameTime(this.rings[source].intervals, intervalMs);
  }

  recordBatch(message: PerfBatchMessage): void {
    const ring = this.rings[message.source];
    if (!ring) return;
    const workTimes = message.workTimes;
    for (let i = 0; i < workTimes.length; i++) {
      pushFrameTime(ring.workTimes, workTimes[i] ?? 0);
    }
    const intervals = message.intervals;
    for (let i = 0; i < intervals.length; i++) {
      pushFrameTime(ring.intervals, intervals[i] ?? 0);
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
        workTimes: Array.isArray(data.workTimes) ? data.workTimes : [],
        intervals: Array.isArray(data.intervals) ? data.intervals : [],
        batchEndTs: data.batchEndTs ?? nowMs(),
      });
    };
    worker.addEventListener('message', handler as EventListener);
    return () => worker.removeEventListener('message', handler as EventListener);
  }

  getMetricsBySource(source: PerfSampleSource): PerfMetricsView {
    const sourceRings = this.rings[source];
    const intervalSummary = summarize(sourceRings.intervals);
    const workSummary = summarize(sourceRings.workTimes);
    const fresh = this.pruneLongTasks(nowMs());
    const longTasksLastMinute = fresh.length;
    const longTasksTotalMsLastMinute = fresh.reduce((acc, lt) => acc + lt.durationMs, 0);
    const heapMB = readHeapMB();
    const fps = intervalSummary.mean > 0 ? 1000 / intervalSummary.mean : 0;
    const minuteScale = 60_000 / LONG_TASK_WINDOW_MS;

    return {
      fps,
      frameIntervalMs: intervalSummary.mean,
      frameIntervalP1: intervalSummary.p1,
      frameIntervalP5: intervalSummary.p5,
      frameIntervalP50: intervalSummary.p50,
      frameIntervalP95: intervalSummary.p95,
      frameWorkTimeMs: workSummary.mean,
      frameWorkTimeP50: workSummary.p50,
      frameWorkTimeP95: workSummary.p95,
      longTasksPerMinute: longTasksLastMinute * minuteScale,
      longTasksLastMinute,
      longTasksTotalMsLastMinute,
      longTasksTotalMsPerMinute: longTasksTotalMsLastMinute * minuteScale,
      heapMB,
      intervalSampleCount: intervalSummary.count,
      workTimeSampleCount: workSummary.count,
    };
  }

  getMetrics(): PerfMetricsView {
    return this.getMetricsBySource(this.preferredSource());
  }

  getWebVitals(): readonly PerfWebVitalsEvent[] {
    return this.webVitals;
  }

  getLatestWebVital(metric: PerfWebVitalsEvent['metric']): PerfWebVitalsEvent | undefined {
    for (let i = this.webVitals.length - 1; i >= 0; i--) {
      const event = this.webVitals[i];
      if (event && event.metric === metric) return event;
    }
    return undefined;
  }

  reset(): void {
    resetFrameTimeRing(this.rings.render.workTimes);
    resetFrameTimeRing(this.rings.render.intervals);
    resetFrameTimeRing(this.rings.game.workTimes);
    resetFrameTimeRing(this.rings.game.intervals);
    resetFrameTimeRing(this.rings.main.workTimes);
    resetFrameTimeRing(this.rings.main.intervals);
    this.longTasks.length = 0;
    this.webVitals.length = 0;
  }

  private preferredSource(): PerfSampleSource {
    if (this.rings.render.intervals.size > 0 || this.rings.render.workTimes.size > 0)
      return 'render';
    if (this.rings.game.intervals.size > 0 || this.rings.game.workTimes.size > 0) return 'game';
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

function createSourceRings(): SourceRings {
  return {
    workTimes: createFrameTimeRing(FRAME_RING_CAPACITY),
    intervals: createFrameTimeRing(FRAME_RING_CAPACITY),
  };
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
