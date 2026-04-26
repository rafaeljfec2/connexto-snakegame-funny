import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { LIVES_CONFIG } from '@/constants/lives';

const sliceState = vi.hoisted(() => ({
  score: 1234,
  highScore: 9876,
  level: 4,
  lives: 2,
  currentPhase: 1,
}));

vi.mock('@/state/gameStateStore', () => ({
  useGameStateSlice: <T,>(selector: (s: typeof sliceState) => T): T => selector(sliceState),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && typeof opts.count === 'number') return `${key}:${opts.count}`;
      if (opts && Object.keys(opts).length > 0) {
        const args = Object.entries(opts)
          .map(([k, v]) => `${k}=${v}`)
          .join(',');
        return `${key}{${args}}`;
      }
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

vi.mock('@/utils/phases', () => ({
  getCurrentPhase: (level: number) => ({
    id: Math.ceil(level / 5),
    type: 'classicSnake',
  }),
  getLevelInPhase: (level: number) => ((level - 1) % 5) + 1,
  getPhaseProgress: (level: number) => (((level - 1) % 5) + 1) / 5,
}));

vi.mock('@/utils/phaseTranslations', () => ({
  getPhaseTranslationKey: () => 'classicSnake',
}));

import { HudStrip } from '@/components/HudStrip';

describe('<HudStrip /> (REF-06 Phase A.3)', () => {
  beforeEach(() => {
    sliceState.score = 1234;
    sliceState.highScore = 9876;
    sliceState.level = 4;
    sliceState.lives = 2;
    sliceState.currentPhase = 1;
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

  it('renders the phase slot with phase number, name and step counter', () => {
    render(<HudStrip />);
    const phaseSlot = screen.getByTestId('hud-phase-slot');
    expect(within(phaseSlot).getByText('1')).toBeInTheDocument();
    expect(within(phaseSlot).getByText('phases.classicSnake.name')).toBeInTheDocument();
    expect(screen.getByTestId('hud-phase-step')).toHaveTextContent('4/5');
  });

  it('exposes the phase progress bar with proper aria attributes', () => {
    render(<HudStrip />);
    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('aria-valuemin', '0');
    expect(progress).toHaveAttribute('aria-valuemax', '5');
    expect(progress).toHaveAttribute('aria-valuenow', '4');
  });

  it('does not render the legacy "Level" metric label anywhere', () => {
    render(<HudStrip />);
    expect(screen.queryByText('hud.level')).not.toBeInTheDocument();
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
