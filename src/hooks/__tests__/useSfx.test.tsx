import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mocks = vi.hoisted(() => {
  const initSpy = vi.fn().mockResolvedValue(undefined);
  const armSpy = vi.fn();
  const playSpy = vi.fn();
  const setMutedSpy = vi.fn();
  const setVolumeSpy = vi.fn();
  let listener: ((s: { isMuted: boolean; volume: number; isReady: boolean }) => void) | null = null;
  let state = { isMuted: false, volume: 0.7, isReady: false };
  return {
    initSpy,
    armSpy,
    playSpy,
    setMutedSpy,
    setVolumeSpy,
    getState: () => state,
    setState: (next: typeof state) => {
      state = next;
      listener?.(next);
    },
    subscribe: (cb: typeof listener) => {
      listener = cb;
      return () => {
        listener = null;
      };
    },
  };
});

vi.mock('@/utils/sfxEngine', () => ({
  sfxEngine: {
    init: mocks.initSpy,
    armAutoplay: mocks.armSpy,
    play: mocks.playSpy,
    setMuted: (m: boolean) => {
      mocks.setMutedSpy(m);
      mocks.setState({ ...mocks.getState(), isMuted: m });
    },
    setVolume: (v: number) => {
      mocks.setVolumeSpy(v);
      mocks.setState({ ...mocks.getState(), volume: v });
    },
    getState: () => mocks.getState(),
    subscribe: (cb: Parameters<typeof mocks.subscribe>[0]) => mocks.subscribe(cb),
  },
}));

import { useSfx } from '@/hooks/useSfx';

describe('useSfx', () => {
  beforeEach(() => {
    mocks.setState({ isMuted: false, volume: 0.7, isReady: false });
    mocks.initSpy.mockClear();
    mocks.armSpy.mockClear();
    mocks.playSpy.mockClear();
    mocks.setMutedSpy.mockClear();
    mocks.setVolumeSpy.mockClear();
  });

  it('boots the engine and arms autoplay on mount', () => {
    renderHook(() => useSfx());
    expect(mocks.initSpy).toHaveBeenCalledTimes(1);
    expect(mocks.armSpy).toHaveBeenCalledTimes(1);
  });

  it('mirrors engine state and re-renders on changes', () => {
    const { result } = renderHook(() => useSfx());
    expect(result.current.isMuted).toBe(false);

    act(() => {
      result.current.setMuted(true);
    });

    expect(result.current.isMuted).toBe(true);
    expect(mocks.setMutedSpy).toHaveBeenCalledWith(true);
  });

  it('exposes a stable play() that delegates to engine.play', () => {
    const { result } = renderHook(() => useSfx());
    act(() => {
      result.current.play('food.eat');
    });
    expect(mocks.playSpy).toHaveBeenCalledWith('food.eat', undefined);
  });
});
