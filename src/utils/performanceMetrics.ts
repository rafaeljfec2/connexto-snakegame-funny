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

// Circular buffer for frame time history - optimized implementation
const METRICS_HISTORY_SIZE = 60; // 1 second at 60fps
const frameTimeHistory: number[] = new Array(METRICS_HISTORY_SIZE).fill(0);
let frameTimeHistoryIndex = 0;
let frameTimeHistoryCount = 0;
let frameTimeSum = 0;

export function updateFrameTime(frameTime: number): void {
  // Circular buffer: replace oldest entry
  const oldValue = frameTimeHistory[frameTimeHistoryIndex] ?? 0;
  frameTimeHistory[frameTimeHistoryIndex] = frameTime;
  frameTimeHistoryIndex = (frameTimeHistoryIndex + 1) % METRICS_HISTORY_SIZE;

  // Update sum incrementally (O(1) instead of O(n) reduce)
  if (frameTimeHistoryCount < METRICS_HISTORY_SIZE) {
    frameTimeSum += frameTime;
    frameTimeHistoryCount++;
  } else {
    frameTimeSum = frameTimeSum - oldValue + frameTime;
  }

  metrics.frameTime = frameTime;
  metrics.avgFrameTime =
    frameTimeHistoryCount > 0 ? frameTimeSum / frameTimeHistoryCount : frameTime;
  metrics.fps = metrics.avgFrameTime > 0 ? 1000 / metrics.avgFrameTime : 0;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const perfMemory = (performance as any).memory;
    metrics.memoryUsage = perfMemory.usedJSHeapSize / 1024 / 1024; // MB
  }

  return { ...metrics };
}

export function resetMetrics(): void {
  // Reset circular buffer
  frameTimeHistory.fill(0);
  frameTimeHistoryIndex = 0;
  frameTimeHistoryCount = 0;
  frameTimeSum = 0;

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
  // Use import.meta.env for Vite instead of process.env
  if (import.meta.env.DEV) {
    const m = getMetrics();
    console.log(
      `[Performance] FPS: ${m.fps.toFixed(1)}, Avg Frame: ${m.avgFrameTime.toFixed(2)}ms, Delta: ${m.deltaSize}B, Skipped: ${m.framesSkipped}`,
    );
  }
}
