import type { PerfBatchMessage, PerfSampleSource } from '@/types/perf';

interface PerfReporterOptions {
  source: PerfSampleSource;
  flushIntervalMs?: number;
  maxBufferSize?: number;
  postMessage: (message: PerfBatchMessage) => void;
  now?: () => number;
}

interface PerfReporter {
  record(frameTimeMs: number): void;
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

  let buffer: number[] = [];
  let lastFlushAt = now();

  const flush = (force = false): void => {
    const ts = now();
    const elapsed = ts - lastFlushAt;
    if (!force && elapsed < flushIntervalMs && buffer.length < maxBufferSize) {
      return;
    }
    if (buffer.length === 0) {
      lastFlushAt = ts;
      return;
    }
    postMessage({ type: 'PERF_SAMPLE', source, samples: buffer, batchEndTs: ts });
    buffer = [];
    lastFlushAt = ts;
  };

  return {
    record(frameTimeMs) {
      if (!Number.isFinite(frameTimeMs) || frameTimeMs < 0) return;
      buffer.push(frameTimeMs);
      flush(false);
    },
    flush,
  };
}
