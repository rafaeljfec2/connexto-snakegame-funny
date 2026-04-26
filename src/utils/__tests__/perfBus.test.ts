import { describe, it, expect, beforeEach, vi } from 'vitest';
import { perfBus } from '@/utils/perfBus';

describe('perfBus', () => {
  beforeEach(() => {
    perfBus.reset();
  });

  describe('recordInterval', () => {
    it('feeds the interval ring and exposes fps via getMetricsBySource', () => {
      for (let i = 1; i <= 50; i++) {
        perfBus.recordInterval('render', 16);
      }

      const view = perfBus.getMetricsBySource('render');

      expect(view.intervalSampleCount).toBe(50);
      expect(view.frameIntervalMs).toBeCloseTo(16);
      expect(view.fps).toBeCloseTo(62.5);
      expect(view.frameIntervalP95).toBe(16);
      expect(view.frameIntervalP1).toBe(16);
    });

    it('ignores invalid samples (negative, NaN, Infinity)', () => {
      perfBus.recordInterval('render', -1);
      perfBus.recordInterval('render', Number.NaN);
      perfBus.recordInterval('render', Number.POSITIVE_INFINITY);

      expect(perfBus.getMetricsBySource('render').intervalSampleCount).toBe(0);
    });
  });

  describe('recordWorkTime', () => {
    it('feeds the work-time ring without affecting fps', () => {
      for (let i = 0; i < 30; i++) {
        perfBus.recordWorkTime('game', 4);
      }

      const view = perfBus.getMetricsBySource('game');
      expect(view.workTimeSampleCount).toBe(30);
      expect(view.frameWorkTimeMs).toBeCloseTo(4);
      expect(view.fps).toBe(0);
    });
  });

  describe('recordBatch', () => {
    it('aggregates work-time and interval samples received from a worker batch message', () => {
      perfBus.recordBatch({
        type: 'PERF_SAMPLE',
        source: 'game',
        workTimes: [1, 2, 3, 4],
        intervals: [10, 20, 30, 40],
        batchEndTs: 0,
      });

      const view = perfBus.getMetricsBySource('game');
      expect(view.workTimeSampleCount).toBe(4);
      expect(view.intervalSampleCount).toBe(4);
      expect(view.frameWorkTimeMs).toBe(2.5);
      expect(view.frameIntervalMs).toBe(25);
    });
  });

  describe('attachWorker', () => {
    it('routes PERF_SAMPLE messages from a worker-like target', () => {
      const listeners: Array<(evt: MessageEvent) => void> = [];
      const fakeWorker = {
        addEventListener: vi.fn((_type: string, handler: EventListener) => {
          listeners.push(handler as (evt: MessageEvent) => void);
        }),
        removeEventListener: vi.fn(),
      } as unknown as Worker;

      const dispose = perfBus.attachWorker(fakeWorker, 'render');

      const evt = {
        data: {
          type: 'PERF_SAMPLE',
          source: 'render',
          workTimes: [5, 6],
          intervals: [12, 13, 14],
        },
      } as MessageEvent;
      listeners[0]?.(evt);

      const view = perfBus.getMetricsBySource('render');
      expect(view.workTimeSampleCount).toBe(2);
      expect(view.intervalSampleCount).toBe(3);
      dispose();
      expect(fakeWorker.removeEventListener).toHaveBeenCalledTimes(1);
    });

    it('ignores messages with other types', () => {
      const listeners: Array<(evt: MessageEvent) => void> = [];
      const fakeWorker = {
        addEventListener: vi.fn((_type: string, handler: EventListener) => {
          listeners.push(handler as (evt: MessageEvent) => void);
        }),
        removeEventListener: vi.fn(),
      } as unknown as Worker;

      perfBus.attachWorker(fakeWorker, 'render');

      const evt = {
        data: { type: 'OTHER', source: 'render', workTimes: [1], intervals: [1] },
      } as MessageEvent;
      listeners[0]?.(evt);

      const view = perfBus.getMetricsBySource('render');
      expect(view.workTimeSampleCount).toBe(0);
      expect(view.intervalSampleCount).toBe(0);
    });
  });

  describe('long tasks and web vitals', () => {
    it('records long tasks and reports counts within the rolling window', () => {
      perfBus.recordLongTask(80);
      perfBus.recordLongTask(120);

      const view = perfBus.getMetricsBySource('render');
      expect(view.longTasksLastMinute).toBe(2);
      expect(view.longTasksPerMinute).toBe(2);
      expect(view.longTasksTotalMsLastMinute).toBe(200);
      expect(view.longTasksTotalMsPerMinute).toBe(200);
    });

    it('ignores invalid long-task durations', () => {
      perfBus.recordLongTask(0);
      perfBus.recordLongTask(-10);
      perfBus.recordLongTask(Number.NaN);

      const view = perfBus.getMetricsBySource('render');
      expect(view.longTasksLastMinute).toBe(0);
      expect(view.longTasksTotalMsLastMinute).toBe(0);
    });

    it('exposes captured web vitals', () => {
      perfBus.recordWebVital({ metric: 'LCP', value: 1200, rating: 'good' });
      perfBus.recordWebVital({ metric: 'INP', value: 80, rating: 'good' });

      const vitals = perfBus.getWebVitals();
      expect(vitals).toHaveLength(2);
      expect(vitals[0]?.metric).toBe('LCP');
    });
  });

  describe('reset', () => {
    it('clears samples, long tasks and web vitals', () => {
      perfBus.recordInterval('render', 16);
      perfBus.recordWorkTime('render', 4);
      perfBus.recordLongTask(50);
      perfBus.recordWebVital({ metric: 'CLS', value: 0.05, rating: 'good' });

      perfBus.reset();

      const view = perfBus.getMetricsBySource('render');
      expect(view.intervalSampleCount).toBe(0);
      expect(view.workTimeSampleCount).toBe(0);
      expect(view.longTasksLastMinute).toBe(0);
      expect(perfBus.getWebVitals()).toHaveLength(0);
    });
  });
});
