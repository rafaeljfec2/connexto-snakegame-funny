import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const postMessage = vi.hoisted(() => vi.fn());

const boardState = vi.hoisted(() => ({
  status: 'IDLE',
  level: 1,
  activeBoss: null as { id: string } | null,
  food: { position: { x: 1, y: 2 }, type: 'NORMAL' },
  snake: [] as Array<{ x: number; y: number }>,
}));

vi.mock('@/state/gameStateStore', async () => {
  const actual =
    await vi.importActual<typeof import('@/state/gameStateStore')>('@/state/gameStateStore');
  return {
    ...actual,
    useGameStateSlice: <T,>(selector: (s: typeof boardState) => T): T => selector(boardState),
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/contexts/SkinContext', () => ({
  useSkin: () => ({ palette: { id: 'classic' } }),
}));

vi.mock('@/components/WeatherCanvas', () => ({
  WeatherCanvas: () => null,
}));

vi.mock('@/components/ParticleSystem', () => ({
  ParticleSystem: () => null,
}));

vi.mock('@/components/GameBackground', () => ({
  GameBackground: () => null,
}));

import { GameBoard } from '@/components/GameBoard';

describe('<GameBoard /> canvas fill (REF-09-AC-4)', () => {
  beforeEach(() => {
    postMessage.mockClear();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: 2,
    });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 470,
      height: 470,
      top: 0,
      left: 0,
      bottom: 470,
      right: 470,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    vi.stubGlobal(
      'Worker',
      class {
        postMessage = postMessage;
        addEventListener(): void {
          return undefined;
        }
        removeEventListener(): void {
          return undefined;
        }
        terminate(): void {
          return undefined;
        }
      },
    );
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe(): void {
          return undefined;
        }
        disconnect(): void {
          return undefined;
        }
        unobserve(): void {
          return undefined;
        }
      },
    );
  });

  it('fills the parent and posts RESIZE with the CSS box and device pixel ratio', async () => {
    render(<GameBoard />);

    const board = screen.getByTestId('game-board');
    expect(board).toHaveStyle({ width: '100%', height: '100%' });

    await waitFor(() => {
      expect(postMessage).toHaveBeenCalledWith({
        type: 'RESIZE',
        payload: { width: 470, height: 470, dpr: 2 },
      });
    });
  });
});
