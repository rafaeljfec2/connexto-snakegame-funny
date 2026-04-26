import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getStoredTheme, saveTheme, getEffectiveTheme } from '@/utils/theme';
import { STORAGE_KEYS } from '@/types/theme';

describe('theme utils (REF-07 Phase B)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('getStoredTheme', () => {
    it.each([['dark'], ['light'], ['auto']] as const)(
      'returns %s when it is stored verbatim',
      (value) => {
        localStorage.setItem(STORAGE_KEYS.THEME, value);
        expect(getStoredTheme()).toBe(value);
      },
    );

    it('returns dark when nothing is stored', () => {
      expect(getStoredTheme()).toBe('dark');
    });

    it('returns dark when the stored value is unrecognised', () => {
      localStorage.setItem(STORAGE_KEYS.THEME, 'sepia');
      expect(getStoredTheme()).toBe('dark');
    });

    it('returns dark when localStorage access throws (e.g., sandboxed iframe)', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      expect(getStoredTheme()).toBe('dark');

      spy.mockRestore();
    });
  });

  describe('saveTheme', () => {
    it('writes the theme to localStorage under the canonical key', () => {
      saveTheme('light');
      expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe('light');
    });

    it('does not throw when storage is unavailable', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      expect(() => saveTheme('dark')).not.toThrow();

      spy.mockRestore();
    });
  });

  describe('getEffectiveTheme', () => {
    it('echoes explicit dark/light choices', () => {
      expect(getEffectiveTheme('dark')).toBe('dark');
      expect(getEffectiveTheme('light')).toBe('light');
    });

    it('resolves auto to dark when OS prefers dark', () => {
      vi.spyOn(window, 'matchMedia').mockImplementation(
        () =>
          ({
            matches: true,
            addEventListener: () => undefined,
            removeEventListener: () => undefined,
          }) as unknown as MediaQueryList,
      );
      expect(getEffectiveTheme('auto')).toBe('dark');
    });

    it('resolves auto to light when OS prefers light', () => {
      vi.spyOn(window, 'matchMedia').mockImplementation(
        () =>
          ({
            matches: false,
            addEventListener: () => undefined,
            removeEventListener: () => undefined,
          }) as unknown as MediaQueryList,
      );
      expect(getEffectiveTheme('auto')).toBe('light');
    });
  });
});
