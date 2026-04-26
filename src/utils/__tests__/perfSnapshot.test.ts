import { describe, it, expect, beforeEach, vi } from 'vitest';
import { perfBus } from '@/utils/perfBus';
import {
  buildPerfSnapshot,
  dedupeLatestPerMetric,
  downloadPerfSnapshot,
} from '@/utils/perfSnapshot';

describe('perfSnapshot', () => {
  beforeEach(() => {
    perfBus.reset();
  });

  describe('buildPerfSnapshot', () => {
    it('captures current metrics, viewport, ua, and context fields', () => {
      for (let i = 0; i < 30; i++) {
        perfBus.recordInterval('render', 16);
        perfBus.recordWorkTime('render', 4);
      }
      perfBus.recordWebVital({ metric: 'LCP', value: 1234, rating: 'good' });

      perfBus.recordLongTask(60);
      perfBus.recordLongTask(90);

      const snapshot = buildPerfSnapshot({ phaseId: 3, bossId: 'guardian' });

      expect(snapshot.version).toBe(2);
      expect(snapshot.phaseId).toBe(3);
      expect(snapshot.bossId).toBe('guardian');
      expect(snapshot.frameIntervalMs).toBeCloseTo(16);
      expect(snapshot.frameWorkTimeMs).toBeCloseTo(4);
      expect(snapshot.fps).toBeCloseTo(62.5);
      expect(snapshot.longTasksPerMinute).toBe(2);
      expect(snapshot.longTasksTotalMsPerMinute).toBe(150);
      expect(snapshot.webVitals).toHaveLength(1);
      expect(snapshot.webVitals?.[0]?.metric).toBe('LCP');
      expect(snapshot.viewport).toMatchObject({ w: expect.any(Number), h: expect.any(Number) });
      expect(typeof snapshot.ua).toBe('string');
      expect(typeof snapshot.capturedAt).toBe('string');
    });
  });

  describe('dedupeLatestPerMetric (Phase F)', () => {
    it('keeps only the latest event per metric, preserving metric identity', () => {
      const events = [
        { metric: 'CLS' as const, value: 0.01, rating: 'good' as const },
        { metric: 'LCP' as const, value: 1200, rating: 'good' as const },
        { metric: 'CLS' as const, value: 0.03, rating: 'good' as const },
        { metric: 'INP' as const, value: 95, rating: 'good' as const },
        { metric: 'CLS' as const, value: 0.07, rating: 'good' as const },
      ];

      const deduped = dedupeLatestPerMetric(events);

      expect(deduped).toHaveLength(3);
      const byMetric = new Map(deduped.map((e) => [e.metric, e]));
      expect(byMetric.get('CLS')?.value).toBeCloseTo(0.07);
      expect(byMetric.get('LCP')?.value).toBe(1200);
      expect(byMetric.get('INP')?.value).toBe(95);
    });

    it('returns an empty array when no events are recorded', () => {
      expect(dedupeLatestPerMetric([])).toEqual([]);
    });

    it('emits a single entry per metric in the snapshot when reportAllChanges fires many times', () => {
      perfBus.recordWebVital({ metric: 'CLS', value: 0.01, rating: 'good' });
      perfBus.recordWebVital({ metric: 'CLS', value: 0.02, rating: 'good' });
      perfBus.recordWebVital({ metric: 'INP', value: 80, rating: 'good' });
      perfBus.recordWebVital({ metric: 'INP', value: 120, rating: 'good' });
      perfBus.recordWebVital({ metric: 'CLS', value: 0.05, rating: 'good' });

      const snapshot = buildPerfSnapshot({ phaseId: 1 });

      expect(snapshot.webVitals).toHaveLength(2);
      const byMetric = new Map(snapshot.webVitals!.map((e) => [e.metric, e]));
      expect(byMetric.get('CLS')?.value).toBeCloseTo(0.05);
      expect(byMetric.get('INP')?.value).toBe(120);
    });
  });

  describe('downloadPerfSnapshot', () => {
    it('creates an object URL, triggers a download, then revokes it', () => {
      const snapshot = buildPerfSnapshot({ phaseId: 1 });

      const createUrl = vi.fn(() => 'blob:fake-url');
      const revokeUrl = vi.fn();
      const originalCreate = URL.createObjectURL;
      const originalRevoke = URL.revokeObjectURL;
      URL.createObjectURL = createUrl as unknown as typeof URL.createObjectURL;
      URL.revokeObjectURL = revokeUrl as unknown as typeof URL.revokeObjectURL;

      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      downloadPerfSnapshot(snapshot);

      expect(createUrl).toHaveBeenCalledTimes(1);
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(revokeUrl).toHaveBeenCalledWith('blob:fake-url');

      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      clickSpy.mockRestore();
    });
  });
});
