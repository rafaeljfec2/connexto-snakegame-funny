import { describe, it, expect } from 'vitest';
import {
  createFrameTimeRing,
  pushFrameTime,
  resetFrameTimeRing,
  summarize,
} from '@/utils/percentiles';

describe('percentiles', () => {
  describe('createFrameTimeRing', () => {
    it('initializes empty ring with the given capacity', () => {
      const ring = createFrameTimeRing(10);

      expect(ring.capacity).toBe(10);
      expect(ring.size).toBe(0);
      expect(ring.sum).toBe(0);
      expect(ring.buffer.length).toBe(10);
    });
  });

  describe('pushFrameTime', () => {
    it('grows size up to capacity then overwrites oldest', () => {
      const ring = createFrameTimeRing(3);

      pushFrameTime(ring, 10);
      pushFrameTime(ring, 20);
      pushFrameTime(ring, 30);
      expect(ring.size).toBe(3);
      expect(ring.sum).toBe(60);

      pushFrameTime(ring, 40);
      expect(ring.size).toBe(3);
      expect(ring.sum).toBe(20 + 30 + 40);
    });

    it('keeps sum O(1) consistent across many pushes', () => {
      const ring = createFrameTimeRing(5);
      for (let i = 1; i <= 50; i++) {
        pushFrameTime(ring, i);
      }

      const expectedSum = 46 + 47 + 48 + 49 + 50;
      expect(ring.size).toBe(5);
      expect(ring.sum).toBe(expectedSum);
    });
  });

  describe('summarize', () => {
    it('returns zeros when ring is empty', () => {
      const ring = createFrameTimeRing(8);
      const summary = summarize(ring);

      expect(summary).toEqual({ count: 0, mean: 0, p1: 0, p5: 0, p50: 0, p95: 0 });
    });

    it('uses gaming convention where p1 is the slow tail and p95 is the fast tail', () => {
      const ring = createFrameTimeRing(100);
      for (let i = 1; i <= 100; i++) {
        pushFrameTime(ring, i);
      }

      const summary = summarize(ring);

      expect(summary.count).toBe(100);
      expect(summary.mean).toBeCloseTo(50.5);
      expect(summary.p1).toBe(100);
      expect(summary.p5).toBe(96);
      expect(summary.p50).toBe(51);
      expect(summary.p95).toBe(6);
    });

    it('reflects only the last capacity samples', () => {
      const ring = createFrameTimeRing(10);
      for (let i = 1; i <= 100; i++) {
        pushFrameTime(ring, i);
      }

      const summary = summarize(ring);

      expect(summary.count).toBe(10);
      expect(summary.mean).toBeCloseTo(95.5);
      expect(summary.p1).toBe(100);
      expect(summary.p50).toBe(96);
    });

    it('is idempotent across calls without mutating the ring', () => {
      const ring = createFrameTimeRing(5);
      pushFrameTime(ring, 16);
      pushFrameTime(ring, 17);
      pushFrameTime(ring, 18);

      const a = summarize(ring);
      const b = summarize(ring);

      expect(a).toEqual(b);
    });
  });

  describe('resetFrameTimeRing', () => {
    it('clears state to fresh', () => {
      const ring = createFrameTimeRing(5);
      pushFrameTime(ring, 10);
      pushFrameTime(ring, 20);

      resetFrameTimeRing(ring);

      expect(ring.size).toBe(0);
      expect(ring.sum).toBe(0);
      expect(summarize(ring)).toEqual({ count: 0, mean: 0, p1: 0, p5: 0, p50: 0, p95: 0 });
    });
  });
});
