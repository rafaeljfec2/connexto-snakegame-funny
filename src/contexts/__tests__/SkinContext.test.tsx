import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { SkinProvider, useSkin } from '@/contexts/SkinContext';
import { SKIN_CATALOG, DEFAULT_SKIN_ID } from '@/constants/skins';
import { STORAGE_KEYS } from '@/types/skin';

function wrapper({ children }: { readonly children: ReactNode }) {
  return <SkinProvider>{children}</SkinProvider>;
}

describe('SkinContext (REF-08 Phase B)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('defaults to the default skin when nothing is stored', () => {
    const { result } = renderHook(() => useSkin(), { wrapper });

    expect(result.current.skinId).toBe(DEFAULT_SKIN_ID);
    expect(result.current.palette).toBe(SKIN_CATALOG[DEFAULT_SKIN_ID]);
  });

  it('hydrates from localStorage on mount', () => {
    localStorage.setItem(STORAGE_KEYS.SKIN, 'frozen-ice');

    const { result } = renderHook(() => useSkin(), { wrapper });

    expect(result.current.skinId).toBe('frozen-ice');
    expect(result.current.palette).toBe(SKIN_CATALOG['frozen-ice']);
  });

  it('exposes the palette matching the active skinId', () => {
    const { result } = renderHook(() => useSkin(), { wrapper });

    act(() => {
      result.current.setSkin('magenta-blaze');
    });

    expect(result.current.skinId).toBe('magenta-blaze');
    expect(result.current.palette).toBe(SKIN_CATALOG['magenta-blaze']);
  });

  it('persists skin changes to localStorage', () => {
    const { result } = renderHook(() => useSkin(), { wrapper });

    act(() => {
      result.current.setSkin('retro-arcade');
    });

    expect(localStorage.getItem(STORAGE_KEYS.SKIN)).toBe('retro-arcade');
  });

  it('falls back to the default skin when a malformed value is persisted', () => {
    localStorage.setItem(STORAGE_KEYS.SKIN, 'not-a-skin');

    const { result } = renderHook(() => useSkin(), { wrapper });

    expect(result.current.skinId).toBe(DEFAULT_SKIN_ID);
  });

  it('throws if useSkin is called outside SkinProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderHook(() => useSkin())).toThrow(/useSkin must be used within a SkinProvider/);

    spy.mockRestore();
  });
});
