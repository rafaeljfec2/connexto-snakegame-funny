import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getStoredSkin, saveSkin } from '@/utils/skin';
import { SKIN_IDS, STORAGE_KEYS } from '@/types/skin';
import { DEFAULT_SKIN_ID } from '@/constants/skins';

describe('skin utils (REF-08 Phase B)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('getStoredSkin', () => {
    it.each(SKIN_IDS)('returns %s when it is stored verbatim', (id) => {
      localStorage.setItem(STORAGE_KEYS.SKIN, id);
      expect(getStoredSkin()).toBe(id);
    });

    it('returns the default skin when nothing is stored', () => {
      expect(getStoredSkin()).toBe(DEFAULT_SKIN_ID);
    });

    it('returns the default skin when the stored value is not a known SkinId', () => {
      localStorage.setItem(STORAGE_KEYS.SKIN, 'not-a-skin');
      expect(getStoredSkin()).toBe(DEFAULT_SKIN_ID);
    });

    it('returns the default skin when localStorage access throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      expect(getStoredSkin()).toBe(DEFAULT_SKIN_ID);

      spy.mockRestore();
    });
  });

  describe('saveSkin', () => {
    it('writes the skin id to localStorage under the canonical key', () => {
      saveSkin('magenta-blaze');
      expect(localStorage.getItem(STORAGE_KEYS.SKIN)).toBe('magenta-blaze');
    });

    it('round-trips through getStoredSkin for every catalog entry', () => {
      for (const id of SKIN_IDS) {
        saveSkin(id);
        expect(getStoredSkin()).toBe(id);
      }
    });

    it('does not throw when storage is unavailable', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      expect(() => saveSkin('frozen-ice')).not.toThrow();

      spy.mockRestore();
    });
  });
});
