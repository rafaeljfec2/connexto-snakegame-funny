export type PerfSampleSource = 'render' | 'game' | 'main';

export interface PerfFrameSample {
  source: PerfSampleSource;
  frameTimeMs: number;
  ts: number;
}

export interface PerfBatchMessage {
  type: 'PERF_SAMPLE';
  source: PerfSampleSource;
  samples: number[];
  batchEndTs: number;
}

export interface PerfMetricsView {
  fps: number;
  frameTime: number;
  p1: number;
  p5: number;
  p50: number;
  p95: number;
  longTasksPerMinute: number;
  longTasksLastMinute: number;
  longTasksTotalMsLastMinute: number;
  longTasksTotalMsPerMinute: number;
  heapMB?: number;
  sampleCount: number;
}

export interface PerfWebVitalsEvent {
  metric: 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export interface PerfSnapshot {
  fps: number;
  frameTime: number;
  p1: number;
  p5: number;
  p50: number;
  p95: number;
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
