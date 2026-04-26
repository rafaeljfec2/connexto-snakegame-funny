import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

interface MediaQueryListLike {
  matches: boolean;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
  dispatchEvent: () => boolean;
}

function installMatchMedia(prefersDark: boolean): { trigger: () => void } {
  let listener: (() => void) | null = null;
  const mql: MediaQueryListLike = {
    matches: prefersDark,
    addEventListener: (_type, cb) => {
      listener = cb;
    },
    removeEventListener: () => {
      listener = null;
    },
    dispatchEvent: () => true,
  };
  vi.spyOn(window, 'matchMedia').mockImplementation(() => mql as unknown as MediaQueryList);
  return {
    trigger: () => {
      mql.matches = !mql.matches;
      listener?.();
    },
  };
}

function wrapper({ children }: { readonly children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('ThemeContext (REF-07 Phase B)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.restoreAllMocks();
  });

  it('defaults to dark theme when nothing is stored', () => {
    installMatchMedia(false);
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe('dark');
    expect(result.current.effectiveTheme).toBe('dark');
  });

  it('writes data-theme attribute on <html> after mount', () => {
    installMatchMedia(false);
    localStorage.setItem('snake-game-theme', 'light');

    renderHook(() => useTheme(), { wrapper });

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('persists theme changes to localStorage', () => {
    installMatchMedia(false);
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setTheme('light');
    });

    expect(localStorage.getItem('snake-game-theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('cycles dark → light → auto → dark via toggleTheme', () => {
    installMatchMedia(false);
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe('dark');

    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('light');

    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('auto');

    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('dark');
  });

  it('maps auto theme to OS preference (prefers-color-scheme: dark → dark)', () => {
    installMatchMedia(true);
    localStorage.setItem('snake-game-theme', 'auto');

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe('auto');
    expect(result.current.effectiveTheme).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('maps auto theme to light when OS prefers light', () => {
    installMatchMedia(false);
    localStorage.setItem('snake-game-theme', 'auto');

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.effectiveTheme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('reacts to OS preference changes only while in auto mode', () => {
    const mm = installMatchMedia(false);
    localStorage.setItem('snake-game-theme', 'auto');

    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.effectiveTheme).toBe('light');

    act(() => {
      mm.trigger();
    });

    expect(result.current.effectiveTheme).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('throws if useTheme is called outside ThemeProvider', () => {
    installMatchMedia(false);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderHook(() => useTheme())).toThrow(
      /useTheme must be used within a ThemeProvider/,
    );

    spy.mockRestore();
  });
});
