import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const sliceState = vi.hoisted(() => ({
  activePowerUps: [] as Array<{ readonly type: string }>,
}));

vi.mock('@/state/gameStateStore', async () => {
  const actual =
    await vi.importActual<typeof import('@/state/gameStateStore')>('@/state/gameStateStore');
  return {
    ...actual,
    useGameStateSlice: <T,>(
      selector: (s: { activePowerUps: ReadonlyArray<{ readonly type: string }> }) => T,
    ): T => selector({ activePowerUps: sliceState.activePowerUps }),
  };
});

vi.mock('@/components/ActivePowerUps', () => ({
  ActivePowerUps: () => <div data-testid='active-powerups-stub' />,
}));

import { ViewportPowerUpsRail } from '@/components/ViewportPowerUpsRail';

describe('<ViewportPowerUpsRail /> (REF-06 Phase A.2)', () => {
  it('renders nothing when no power-ups are active', () => {
    sliceState.activePowerUps = [];
    const { container } = render(<ViewportPowerUpsRail />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the rail when at least one power-up is active', () => {
    sliceState.activePowerUps = [{ type: 'SPEED_BOOST' }];
    render(<ViewportPowerUpsRail />);
    expect(screen.getByTestId('viewport-powerups-rail')).toBeInTheDocument();
    expect(screen.getByTestId('active-powerups-stub')).toBeInTheDocument();
  });

  it('exposes a region role with an accessible label', () => {
    sliceState.activePowerUps = [{ type: 'BONUS_POINTS' }, { type: 'SPEED_BOOST' }];
    render(<ViewportPowerUpsRail />);
    const rail = screen.getByTestId('viewport-powerups-rail');
    expect(rail).toHaveAttribute('role', 'region');
    expect(rail).toHaveAttribute('aria-label', 'active power-ups');
  });
});
