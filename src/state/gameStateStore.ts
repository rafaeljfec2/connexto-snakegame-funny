import { useDebugValue, useRef, useSyncExternalStore } from 'react';
import type { GameState } from '@/types/game';
import { getInitialGameState } from '@/state/initialGameState';

export type GameStateSelector<T> = (state: GameState) => T;
export type EqualityFn<T> = (a: T, b: T) => boolean;

export interface GameStateStore {
  getState(): GameState;
  setState(updater: GameStateUpdater): void;
  subscribe(listener: () => void): () => void;
}

export type GameStateUpdater = (prev: GameState) => GameState;

export function createGameStateStore(initial: GameState): GameStateStore {
  let state = initial;
  const listeners = new Set<() => void>();

  return {
    getState() {
      return state;
    },
    setState(updater) {
      const next = updater(state);
      if (Object.is(next, state)) return;
      state = next;
      listeners.forEach((listener) => {
        listener();
      });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

let activeStore: GameStateStore = createGameStateStore(getInitialGameState());

export function getGameStore(): GameStateStore {
  return activeStore;
}

export function setGameStateUpdater(updater: GameStateUpdater): void {
  activeStore.setState(updater);
}

export function replaceGameStoreForTesting(store: GameStateStore): void {
  activeStore = store;
}

export function resetGameStoreForTesting(initial?: GameState): void {
  activeStore = createGameStateStore(initial ?? getInitialGameState());
}

export function useGameStateSlice<T>(
  selector: GameStateSelector<T>,
  equalityFn: EqualityFn<T> = Object.is,
): T {
  const cacheRef = useRef<{ ready: boolean; value: T }>({
    ready: false,
    value: undefined as unknown as T,
  });

  const getSnapshot = (): T => {
    const next = selector(activeStore.getState());
    const cache = cacheRef.current;
    if (cache.ready && equalityFn(cache.value, next)) {
      return cache.value;
    }
    cacheRef.current = { ready: true, value: next };
    return next;
  };

  const slice = useSyncExternalStore(activeStore.subscribe, getSnapshot, getSnapshot);
  useDebugValue(slice);
  return slice;
}

export function shallowEqualArray<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}

export function shallowEqualObject<T extends Record<string, unknown>>(a: T, b: T): boolean {
  if (a === b) return true;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.is(a[key], b[key])) return false;
  }
  return true;
}
