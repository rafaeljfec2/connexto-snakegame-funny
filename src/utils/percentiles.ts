export interface FrameTimeRing {
  readonly capacity: number;
  buffer: Float64Array;
  index: number;
  size: number;
  sum: number;
}

export function createFrameTimeRing(capacity: number): FrameTimeRing {
  return {
    capacity,
    buffer: new Float64Array(capacity),
    index: 0,
    size: 0,
    sum: 0,
  };
}

export function pushFrameTime(ring: FrameTimeRing, frameTimeMs: number): void {
  if (ring.size < ring.capacity) {
    ring.buffer[ring.index] = frameTimeMs;
    ring.sum += frameTimeMs;
    ring.size += 1;
  } else {
    const replaced = ring.buffer[ring.index] ?? 0;
    ring.buffer[ring.index] = frameTimeMs;
    ring.sum = ring.sum - replaced + frameTimeMs;
  }
  ring.index = (ring.index + 1) % ring.capacity;
}

export function resetFrameTimeRing(ring: FrameTimeRing): void {
  ring.buffer.fill(0);
  ring.index = 0;
  ring.size = 0;
  ring.sum = 0;
}

export interface PercentileSummary {
  count: number;
  mean: number;
  p1: number;
  p5: number;
  p50: number;
  p95: number;
}

export function summarize(ring: FrameTimeRing): PercentileSummary {
  if (ring.size === 0) {
    return { count: 0, mean: 0, p1: 0, p5: 0, p50: 0, p95: 0 };
  }

  const sorted = new Float64Array(ring.size);
  for (let i = 0; i < ring.size; i++) {
    sorted[i] = ring.buffer[i] ?? 0;
  }
  sorted.sort();

  const mean = ring.sum / ring.size;

  return {
    count: ring.size,
    mean,
    p1: pickPercentile(sorted, 0.01),
    p5: pickPercentile(sorted, 0.05),
    p50: pickPercentile(sorted, 0.5),
    p95: pickPercentile(sorted, 0.95),
  };
}

function pickPercentile(sortedAsc: Float64Array, fraction: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(sortedAsc.length - 1, Math.max(0, Math.floor(sortedAsc.length * fraction)));
  return sortedAsc[idx] ?? 0;
}
