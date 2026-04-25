export type PerfSampleSource = 'render' | 'game' | 'main';

export const PERF_SNAPSHOT_VERSION = 2 as const;

export interface PerfFrameSample {
  source: PerfSampleSource;
  frameTimeMs: number;
  ts: number;
}

export interface PerfBatchMessage {
  type: 'PERF_SAMPLE';
  source: PerfSampleSource;
  workTimes: number[];
  intervals: number[];
  batchEndTs: number;
}

export interface PerfMetricsView {
  fps: number;
  frameIntervalMs: number;
  frameIntervalP1: number;
  frameIntervalP5: number;
  frameIntervalP50: number;
  frameIntervalP95: number;
  frameWorkTimeMs: number;
  frameWorkTimeP50: number;
  frameWorkTimeP95: number;
  longTasksPerMinute: number;
  longTasksLastMinute: number;
  longTasksTotalMsLastMinute: number;
  longTasksTotalMsPerMinute: number;
  heapMB?: number;
  intervalSampleCount: number;
  workTimeSampleCount: number;
}

export interface PerfWebVitalsEvent {
  metric: 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export interface PerfSnapshot {
  version: typeof PERF_SNAPSHOT_VERSION;
  fps: number;
  frameIntervalMs: number;
  frameIntervalP1: number;
  frameIntervalP5: number;
  frameIntervalP50: number;
  frameIntervalP95: number;
  frameWorkTimeMs: number;
  frameWorkTimeP50: number;
  frameWorkTimeP95: number;
  longTasksPerMinute: number;
  longTasksTotalMsPerMinute: number;
  heapMB?: number;
  phaseId: number;
  bossId?: string;
  ua: string;
  viewport: {
    w: number;
    h: number;
    dpr: number;
  };
  capturedAt: string;
  webVitals?: PerfWebVitalsEvent[];
}
