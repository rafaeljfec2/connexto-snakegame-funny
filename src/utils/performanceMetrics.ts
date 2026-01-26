// Performance metrics for monitoring and debugging

export interface PerformanceMetrics {
  frameTime: number;
  avgFrameTime: number;
  fps: number;
  deltaSize: number;
  framesSkipped: number;
  memoryUsage?: number;
  gcPauses?: number;
}

let metrics: PerformanceMetrics = {
  frameTime: 0,
  avgFrameTime: 0,
  fps: 0,
  deltaSize: 0,
  framesSkipped: 0,
};

let frameTimeHistory: number[] = [];
const METRICS_HISTORY_SIZE = 60; // 1 second at 60fps

export function updateFrameTime(frameTime: number): void {
  frameTimeHistory.push(frameTime);
  if (frameTimeHistory.length > METRICS_HISTORY_SIZE) {
    frameTimeHistory.shift();
  }

  metrics.frameTime = frameTime;
  metrics.avgFrameTime =
    frameTimeHistory.reduce((a, b) => a + b, 0) / frameTimeHistory.length;
  metrics.fps = 1000 / metrics.avgFrameTime;
}

export function updateDeltaSize(size: number): void {
  metrics.deltaSize = size;
}

export function updateFramesSkipped(count: number): void {
  metrics.framesSkipped = count;
}

export function getMetrics(): PerformanceMetrics {
  // Try to get memory usage if available
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const perfMemory = (performance as any).memory;
    metrics.memoryUsage = perfMemory.usedJSHeapSize / 1024 / 1024; // MB
  }

  return { ...metrics };
}

export function resetMetrics(): void {
  frameTimeHistory = [];
  metrics = {
    frameTime: 0,
    avgFrameTime: 0,
    fps: 0,
    deltaSize: 0,
    framesSkipped: 0,
  };
}

// Log metrics to console in dev mode
export function logMetrics(): void {
  if (process.env.NODE_ENV === 'development') {
    const m = getMetrics();
    console.log(
      `[Performance] FPS: ${m.fps.toFixed(1)}, Avg Frame: ${m.avgFrameTime.toFixed(2)}ms, Delta: ${m.deltaSize}B, Skipped: ${m.framesSkipped}`,
    );
  }
}
