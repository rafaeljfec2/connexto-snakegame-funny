import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { LIVES_CONFIG } from '@/constants/lives';

const sliceState = vi.hoisted(() => ({
  score: 1234,
  highScore: 9876,
  level: 4,
  lives: 2,
}));

vi.mock('@/state/gameStateStore', () => ({
  useGameStateSlice: <T,>(selector: (s: typeof sliceState) => T): T => selector(sliceState),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && typeof opts.count === 'number') return `${key}:${opts.count}`;
      return key;
    },
    i18n: { language: 'en-US', changeLanguage: vi.fn() },
  }),
}));

vi.mock('@/hooks/useSfx', () => ({
  useSfx: () => ({
    play: vi.fn(),
    setMuted: vi.fn(),
    setVolume: vi.fn(),
    isMuted: false,
    volume: 0.7,
    isReady: true,
  }),
}));

import { HudStrip } from '@/components/HudStrip';

describe('<HudStrip /> (REF-06 Phase A)', () => {
  beforeEach(() => {
    sliceState.score = 1234;
    sliceState.highScore = 9876;
    sliceState.level = 4;
    sliceState.lives = 2;
  });

  it('renders banner role with HUD aria-label', () => {
    render(<HudStrip />);
    expect(screen.getByRole('banner')).toHaveAttribute('aria-label', 'hud.ariaLabel');
  });

  it('formats score and high score with locale separators', () => {
    render(<HudStrip />);
    const metricsGroup = screen.getByRole('group', { name: 'hud.metricsAriaLabel' });
    expect(within(metricsGroup).getByText('1,234')).toBeInTheDocument();
    expect(within(metricsGroup).getByText('9,876')).toBeInTheDocument();
  });

  it('renders the current level', () => {
    render(<HudStrip />);
    const metricsGroup = screen.getByRole('group', { name: 'hud.metricsAriaLabel' });
    expect(within(metricsGroup).getByText('4')).toBeInTheDocument();
  });

  it('renders one lives section with maxLives dots when lives system is enabled', () => {
    render(<HudStrip />);
    if (!LIVES_CONFIG.enabled) return;
    const livesGroup = screen.getByRole('group', {
      name: `hud.livesAriaLabel:${sliceState.lives}`,
    });
    const dots = livesGroup.querySelectorAll('[data-active]');
    expect(dots.length).toBe(LIVES_CONFIG.maxLives);
    const active = livesGroup.querySelectorAll('[data-active="true"]');
    expect(active.length).toBe(sliceState.lives);
  });

  it('toggles the legend drawer via button and reflects aria-expanded', () => {
    render(<HudStrip />);
    const button = screen.getByTestId('hud-legend-toggle');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('powerups-legend-drawer')).toHaveAttribute('data-open', 'true');
  });
});
