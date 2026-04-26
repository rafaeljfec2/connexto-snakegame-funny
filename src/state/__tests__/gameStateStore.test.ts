import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createGameStateStore,
  shallowEqualArray,
  shallowEqualObject,
  resetGameStoreForTesting,
  getGameStore,
  setGameStateUpdater,
} from '@/state/gameStateStore';
import { getInitialGameState } from '@/state/initialGameState';
import type { GameState, Position } from '@/types/game';

function buildState(overrides: Partial<GameState> = {}): GameState {
  return { ...getInitialGameState(), ...overrides };
}

describe('createGameStateStore', () => {
  it('exposes the initial state via getState', () => {
    const initial = buildState({ score: 42 });
    const store = createGameStateStore(initial);

    expect(store.getState()).toBe(initial);
    expect(store.getState().score).toBe(42);
  });

  it('applies updater functions and notifies subscribers', () => {
    const store = createGameStateStore(buildState({ score: 0 }));
    const listener = vi.fn();
    store.subscribe(listener);

    store.setState((prev) => ({ ...prev, score: prev.score + 10 }));

    expect(store.getState().score).toBe(10);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('skips notification when updater returns the same reference', () => {
    const store = createGameStateStore(buildState({ score: 5 }));
    const listener = vi.fn();
    store.subscribe(listener);

    store.setState((prev) => prev);

    expect(listener).not.toHaveBeenCalled();
  });

  it('returns an unsubscribe function that detaches the listener', () => {
    const store = createGameStateStore(buildState());
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.setState((prev) => ({ ...prev, score: 1 }));
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.setState((prev) => ({ ...prev, score: 2 }));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('AC-2: commits a delta in <16ms for a 5k-segment snake', () => {
    const longSnake: Position[] = Array.from({ length: 5000 }, (_, i) => ({ x: i, y: 0 }));
    const store = createGameStateStore(buildState({ snake: longSnake }));

    const start = performance.now();
    store.setState((prev) => ({ ...prev, score: prev.score + 1 }));
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(16);
  });
});

describe('shallowEqualArray', () => {
  it('returns true for the same reference', () => {
    const a = [1, 2, 3];
    expect(shallowEqualArray(a, a)).toBe(true);
  });

  it('returns true for arrays with identical primitive contents', () => {
    expect(shallowEqualArray([1, 2, 3], [1, 2, 3])).toBe(true);
  });

  it('returns false when lengths differ', () => {
    expect(shallowEqualArray([1, 2], [1, 2, 3])).toBe(false);
  });

  it('returns false when any element differs', () => {
    expect(shallowEqualArray([1, 2, 3], [1, 9, 3])).toBe(false);
  });
});

describe('shallowEqualObject', () => {
  it('returns true for objects with same keys and same primitive values', () => {
    expect(shallowEqualObject({ a: 1, b: 'x' }, { a: 1, b: 'x' })).toBe(true);
  });

  it('returns false when one key value differs', () => {
    expect(shallowEqualObject({ a: 1, b: 'x' }, { a: 1, b: 'y' })).toBe(false);
  });

  it('returns false when key sets differ', () => {
    expect(shallowEqualObject({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });
});

describe('singleton helpers', () => {
  beforeEach(() => {
    resetGameStoreForTesting();
  });

  it('resetGameStoreForTesting installs a fresh store', () => {
    const before = getGameStore();
    setGameStateUpdater((prev) => ({ ...prev, score: 99 }));
    expect(before.getState().score).toBe(99);

    resetGameStoreForTesting();
    const after = getGameStore();
    expect(after).not.toBe(before);
    expect(after.getState().score).toBe(0);
  });

  it('setGameStateUpdater forwards updates to the active singleton', () => {
    setGameStateUpdater((prev) => ({ ...prev, level: 5 }));
    expect(getGameStore().getState().level).toBe(5);
  });
});
