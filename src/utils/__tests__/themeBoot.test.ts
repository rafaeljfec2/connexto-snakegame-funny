import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  applyBootTheme,
  parseStoredTheme,
  resolveBootTheme,
  resolveEffectiveTheme,
} from '@/utils/themeBoot';

describe('themeBoot (REF-07 Phase B)', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
    vi.restoreAllMocks();
  });

  describe('parseStoredTheme', () => {
    it.each([
      ['dark', 'dark'],
      ['light', 'light'],
      ['auto', 'auto'],
    ] as const)('accepts %s as a valid theme', (input, expected) => {
      expect(parseStoredTheme(input)).toBe(expected);
    });

    it.each([null, '', 'invalid', 'DARK', 'system'])(
      'falls back to dark for invalid input %j',
      (input) => {
        expect(parseStoredTheme(input)).toBe('dark');
      },
    );
  });

  describe('resolveEffectiveTheme', () => {
    it('returns the explicit theme when not auto', () => {
      expect(resolveEffectiveTheme('dark', true)).toBe('dark');
      expect(resolveEffectiveTheme('dark', false)).toBe('dark');
      expect(resolveEffectiveTheme('light', true)).toBe('light');
      expect(resolveEffectiveTheme('light', false)).toBe('light');
    });

    it('maps auto to OS preference', () => {
      expect(resolveEffectiveTheme('auto', true)).toBe('dark');
      expect(resolveEffectiveTheme('auto', false)).toBe('light');
    });
  });

  describe('resolveBootTheme', () => {
    it('returns explicit light when stored is light, ignoring OS', () => {
      const deps = {
        readStored: () => 'light',
        prefersDark: () => true,
      };
      expect(resolveBootTheme(deps)).toBe('light');
    });

    it('returns explicit dark when stored is dark, ignoring OS', () => {
      const deps = {
        readStored: () => 'dark',
        prefersDark: () => false,
      };
      expect(resolveBootTheme(deps)).toBe('dark');
    });

    it('follows OS preference when stored is auto', () => {
      expect(
        resolveBootTheme({
          readStored: () => 'auto',
          prefersDark: () => true,
        }),
      ).toBe('dark');
      expect(
        resolveBootTheme({
          readStored: () => 'auto',
          prefersDark: () => false,
        }),
      ).toBe('light');
    });

    it('falls back to dark when storage throws', () => {
      const deps = {
        readStored: (): string | null => {
          throw new Error('SecurityError');
        },
        prefersDark: () => true,
      };
      expect(resolveBootTheme(deps)).toBe('dark');
    });

    it('falls back to dark when matchMedia throws in auto mode', () => {
      const deps = {
        readStored: () => 'auto',
        prefersDark: (): boolean => {
          throw new Error('not supported');
        },
      };
      expect(resolveBootTheme(deps)).toBe('light');
    });

    it('falls back to dark when both storage and matchMedia fail', () => {
      const deps = {
        readStored: (): string | null => {
          throw new Error('blocked');
        },
        prefersDark: (): boolean => {
          throw new Error('not supported');
        },
      };
      expect(resolveBootTheme(deps)).toBe('dark');
    });

    it('returns dark when nothing is stored and matchMedia prefers dark', () => {
      const deps = {
        readStored: () => null,
        prefersDark: () => true,
      };
      expect(resolveBootTheme(deps)).toBe('dark');
    });
  });

  describe('applyBootTheme', () => {
    it('writes data-theme attribute on <html> using current window state', () => {
      localStorage.setItem('snake-game-theme', 'light');

      const effective = applyBootTheme();

      expect(effective).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');

      localStorage.removeItem('snake-game-theme');
    });

    it('defaults to dark when storage is empty and OS cannot be detected', () => {
      localStorage.removeItem('snake-game-theme');
      vi.spyOn(window, 'matchMedia').mockImplementation(
        () =>
          ({
            matches: false,
            addEventListener: () => undefined,
            removeEventListener: () => undefined,
          }) as unknown as MediaQueryList,
      );

      const effective = applyBootTheme();

      expect(effective).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });
});
