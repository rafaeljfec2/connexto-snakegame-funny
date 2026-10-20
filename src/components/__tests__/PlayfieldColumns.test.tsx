import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { LEGEND_ITEMS } from '@/components/PowerUpsLegendDrawer';

const sliceState = vi.hoisted(() => ({
  level: 4,
  currentPhase: 1 as number | null,
  activePowerUps: [] as Array<{ readonly type: string }>,
  combo: { count: 0, multiplier: 1, lastFoodTime: 0 },
}));

vi.mock('@/state/gameStateStore', async () => {
  const actual =
    await vi.importActual<typeof import('@/state/gameStateStore')>('@/state/gameStateStore');
  return {
    ...actual,
    useGameStateSlice: <T,>(selector: (s: typeof sliceState) => T): T => selector(sliceState),
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/components/ActivePowerUps', () => ({
  ActivePowerUps: () => <div data-testid='active-powerups-stub' />,
}));

import { PlayfieldColumns } from '@/components/PlayfieldColumns';

describe('<PlayfieldColumns /> side column (REF-09-AC-2)', () => {
  it('shows phase, all 10 power-ups, and combo while the combo count is 0', () => {
    sliceState.level = 4;
    sliceState.currentPhase = 1;
    sliceState.activePowerUps = [];
    sliceState.combo = { count: 0, multiplier: 1, lastFoodTime: 0 };

    render(
      <PlayfieldColumns
        controls={<div data-testid='controls-stub' />}
        board={<div data-testid='board-stub' />}
      />,
    );

    const side = screen.getByTestId('playfield-side');
    expect(within(side).getByTestId('playfield-phase-name')).toHaveTextContent(
      'phases.classicSnake.name',
    );
    expect(within(side).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '4');
    expect(within(side).getByTestId('playfield-phase-step')).toHaveTextContent('4/5');
    expect(within(side).getByTestId('playfield-phase-objective')).toHaveTextContent(
      'phases.classicSnake.description',
    );

    const items = within(side).getAllByTestId('playfield-legend-item');
    expect(items).toHaveLength(LEGEND_ITEMS.length);
    expect(LEGEND_ITEMS).toHaveLength(10);
    for (const item of LEGEND_ITEMS) {
      const card = items.find((node) => node.textContent?.includes(item.nameKey));
      expect(card).toBeDefined();
      expect(card).toHaveTextContent(item.descriptionKey);
    }

    expect(within(side).getByTestId('playfield-combo')).toHaveTextContent('PANELS.COMBO');
    expect(within(side).queryByTestId('viewport-powerups-rail')).not.toBeInTheDocument();
  });

  it('shows keyboard keycaps in the controls card and the instruction pill under the board', () => {
    render(<PlayfieldColumns controls={<span />} board={<span />} />);

    expect(screen.getByText('playfield.controls')).toBeInTheDocument();
    expect(screen.getByTestId('playfield-arrow-keys').textContent).toContain('↑');
    expect(screen.getByText('playfield.or')).toBeInTheDocument();
    expect(screen.getByTestId('playfield-wasd-keys').textContent).toContain('W');
    expect(screen.queryByTestId('playfield-key-hint')).not.toBeInTheDocument();

    const footer = within(screen.getByTestId('playfield-board')).getByTestId('playfield-footer');
    expect(footer.querySelector('[data-variant="touch"]')).toHaveTextContent(
      'controls.touchInstructions',
    );
    expect(footer.querySelector('[data-variant="keyboard"]')).toHaveTextContent(
      'controls.instructions',
    );
  });

  it('places an active buff rail above the catalogue', () => {
    sliceState.activePowerUps = [{ type: 'SPEED_BOOST' }];

    render(<PlayfieldColumns controls={<span />} board={<span />} />);

    const side = screen.getByTestId('playfield-side');
    const rail = within(side).getByTestId('viewport-powerups-rail');
    const legend = within(side).getByTestId('playfield-legend');
    expect(rail.compareDocumentPosition(legend) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
