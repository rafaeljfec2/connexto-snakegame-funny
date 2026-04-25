import { describe, it, expect, beforeEach, vi } from 'vitest';
import { perfBus } from '@/utils/perfBus';
import { buildPerfSnapshot, downloadPerfSnapshot } from '@/utils/perfSnapshot';

describe('perfSnapshot', () => {
  beforeEach(() => {
    perfBus.reset();
  });

  describe('buildPerfSnapshot', () => {
    it('captures current metrics, viewport, ua, and context fields', () => {
      for (let i = 0; i < 30; i++) {
        perfBus.recordFrameTime('render', 16);
      }
      perfBus.recordWebVital({ metric: 'LCP', value: 1234, rating: 'good' });

      perfBus.recordLongTask(60);
      perfBus.recordLongTask(90);

      const snapshot = buildPerfSnapshot({ phaseId: 3, bossId: 'guardian' });

      expect(snapshot.phaseId).toBe(3);
      expect(snapshot.bossId).toBe('guardian');
      expect(snapshot.frameTime).toBeCloseTo(16);
      expect(snapshot.longTasksPerMinute).toBe(2);
      expect(snapshot.longTasksTotalMsPerMinute).toBe(150);
      expect(snapshot.webVitals).toHaveLength(1);
      expect(snapshot.webVitals?.[0]?.metric).toBe('LCP');
      expect(snapshot.viewport).toMatchObject({ w: expect.any(Number), h: expect.any(Number) });
      expect(typeof snapshot.ua).toBe('string');
      expect(typeof snapshot.capturedAt).toBe('string');
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
