import type { PerfBatchMessage, PerfSampleSource } from '@/types/perf';

interface PerfReporterOptions {
  source: PerfSampleSource;
  flushIntervalMs?: number;
  maxBufferSize?: number;
  postMessage: (message: PerfBatchMessage) => void;
  now?: () => number;
}

interface PerfReporter {
  recordWorkTime(workTimeMs: number): void;
  recordInterval(intervalMs: number): void;
  flush(force?: boolean): void;
}

const DEFAULT_INTERVAL_MS = 250;
const DEFAULT_MAX_BUFFER = 240;

export function createPerfReporter(options: PerfReporterOptions): PerfReporter {
  const {
    source,
    flushIntervalMs = DEFAULT_INTERVAL_MS,
    maxBufferSize = DEFAULT_MAX_BUFFER,
    postMessage,
    now = () => performance.now(),
  } = options;

  let workTimes: number[] = [];
  let intervals: number[] = [];
  let lastFlushAt = now();

  const shouldFlush = (ts: number, force: boolean): boolean => {
    if (force) return true;
    const elapsed = ts - lastFlushAt;
    if (elapsed >= flushIntervalMs) return true;
    return workTimes.length >= maxBufferSize || intervals.length >= maxBufferSize;
  };

  const flush = (force = false): void => {
    const ts = now();
    if (!shouldFlush(ts, force)) return;
    if (workTimes.length === 0 && intervals.length === 0) {
      lastFlushAt = ts;
      return;
    }
    postMessage({
      type: 'PERF_SAMPLE',
      source,
      workTimes,
      intervals,
      batchEndTs: ts,
    });
    workTimes = [];
    intervals = [];
    lastFlushAt = ts;
  };

  return {
    recordWorkTime(workTimeMs) {
      if (!Number.isFinite(workTimeMs) || workTimeMs < 0) return;
      workTimes.push(workTimeMs);
      flush(false);
    },
    recordInterval(intervalMs) {
      if (!Number.isFinite(intervalMs) || intervalMs < 0) return;
      intervals.push(intervalMs);
      flush(false);
    },
    flush,
  };
}
