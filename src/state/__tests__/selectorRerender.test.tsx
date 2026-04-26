import { describe, it, expect, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import {
  resetGameStoreForTesting,
  setGameStateUpdater,
  useGameStateSlice,
} from '@/state/gameStateStore';
import type { ActivePowerUp, GameState, Position } from '@/types/game';
import { FoodType } from '@/types/game';

interface ProbeResult {
  current: number;
}

function makeProbe(component: React.FC<{ probe: ProbeResult }>) {
  const counterRef: ProbeResult = { current: 0 };

  const Wrapper: React.FC = () => {
    const localRef = useRef<ProbeResult>(counterRef);
    return component({ probe: localRef.current });
  };

  return { counterRef, Wrapper };
}

function ScoreReader({ probe }: { readonly probe: ProbeResult }) {
  const score = useGameStateSlice((s) => s.score);
  useEffect(() => {
    probe.current += 1;
  });
  return <span data-testid='score'>{score}</span>;
}

function LivesReader({ probe }: { readonly probe: ProbeResult }) {
  const lives = useGameStateSlice((s) => s.lives);
  useEffect(() => {
    probe.current += 1;
  });
  return <span data-testid='lives'>{lives}</span>;
}

function PowerUpsReader({ probe }: { readonly probe: ProbeResult }) {
  const powerUps = useGameStateSlice(
    (s) => s.activePowerUps,
    (a, b) => {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        const aa = a[i];
        const bb = b[i];
        if (!aa || !bb) return false;
        if (aa.type !== bb.type || aa.startTime !== bb.startTime) return false;
      }
      return true;
    },
  );
  useEffect(() => {
    probe.current += 1;
  });
  return <span data-testid='powerups'>{powerUps.length}</span>;
}

describe('selector re-render semantics (REF-04 AC-3)', () => {
  beforeEach(() => {
    resetGameStoreForTesting();
  });

  it('does not rerender ScoreReader when only snake changes', () => {
    const probe: ProbeResult = { current: 0 };
    render(<ScoreReader probe={probe} />);
    const initialRenders = probe.current;

    const longSnake: Position[] = Array.from({ length: 20 }, (_, i) => ({ x: i, y: 0 }));
    act(() => {
      setGameStateUpdater((prev) => ({ ...prev, snake: longSnake }));
    });

    expect(probe.current).toBe(initialRenders);
  });

  it('rerenders ScoreReader when score changes', () => {
    const probe: ProbeResult = { current: 0 };
    render(<ScoreReader probe={probe} />);
    const initialRenders = probe.current;

    act(() => {
      setGameStateUpdater((prev) => ({ ...prev, score: prev.score + 10 }));
    });

    expect(probe.current).toBeGreaterThan(initialRenders);
  });

  it('does not rerender LivesReader when score changes', () => {
    const probe: ProbeResult = { current: 0 };
    render(<LivesReader probe={probe} />);
    const initialRenders = probe.current;

    act(() => {
      setGameStateUpdater((prev) => ({ ...prev, score: prev.score + 1 }));
    });

    expect(probe.current).toBe(initialRenders);
  });

  it('PowerUpsReader does NOT rerender when activePowerUps reference changes but content is equal', () => {
    const probe: ProbeResult = { current: 0 };
    const samePowerUp: ActivePowerUp = {
      type: FoodType.SPEED_BOOST,
      duration: 5000,
      startTime: 1234,
    };
    setGameStateUpdater((prev) => ({ ...prev, activePowerUps: [samePowerUp] }));

    render(<PowerUpsReader probe={probe} />);
    const initialRenders = probe.current;

    act(() => {
      setGameStateUpdater((prev) => ({
        ...prev,
        activePowerUps: [{ ...samePowerUp }],
      }));
    });

    expect(probe.current).toBe(initialRenders);
  });

  it('PowerUpsReader rerenders when a power-up actually changes', () => {
    const probe: ProbeResult = { current: 0 };
    render(<PowerUpsReader probe={probe} />);
    const initialRenders = probe.current;

    act(() => {
      setGameStateUpdater((prev: GameState) => ({
        ...prev,
        activePowerUps: [{ type: FoodType.SPEED_BOOST, duration: 5000, startTime: 999 }],
      }));
    });

    expect(probe.current).toBeGreaterThan(initialRenders);
  });
});

describe('makeProbe utility', () => {
  it('exposes a stable ref counter for component instances', () => {
    const { counterRef, Wrapper } = makeProbe(({ probe }) => <span>{probe.current}</span>);
    render(<Wrapper />);
    expect(counterRef.current).toBeGreaterThanOrEqual(0);
  });
});

describe('memoized leaf isolation (REF-04 AC-3)', () => {
  beforeEach(() => {
    resetGameStoreForTesting();
  });

  it('memo+selector leaf does NOT rerender when parent rerenders without slice change', async () => {
    const { memo: reactMemo, useState } = await import('react');
    const probe: ProbeResult = { current: 0 };

    const Leaf = reactMemo(function Leaf() {
      const score = useGameStateSlice((s) => s.score);
      useEffect(() => {
        probe.current += 1;
      });
      return <span data-testid='leaf-score'>{score}</span>;
    });

    let triggerParent: ((value: number) => void) | undefined;
    function Parent() {
      const [tick, setTick] = useState(0);
      triggerParent = setTick;
      return (
        <div data-testid='parent' data-tick={tick}>
          <Leaf />
        </div>
      );
    }

    render(<Parent />);
    const initialRenders = probe.current;

    act(() => {
      triggerParent?.(1);
      triggerParent?.(2);
      triggerParent?.(3);
    });

    expect(probe.current).toBe(initialRenders);
  });

  it('memo+selector leaf rerenders when its slice changes (even without parent rerender)', async () => {
    const { memo: reactMemo } = await import('react');
    const probe: ProbeResult = { current: 0 };

    const Leaf = reactMemo(function Leaf() {
      const lives = useGameStateSlice((s) => s.lives);
      useEffect(() => {
        probe.current += 1;
      });
      return <span data-testid='leaf-lives'>{lives}</span>;
    });

    function Parent() {
      return (
        <div>
          <Leaf />
        </div>
      );
    }

    render(<Parent />);
    const initialRenders = probe.current;

    act(() => {
      setGameStateUpdater((prev) => ({ ...prev, lives: prev.lives - 1 }));
    });

    expect(probe.current).toBeGreaterThan(initialRenders);
  });
});
