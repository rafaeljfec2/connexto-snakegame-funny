import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { COMBO_CONFIG } from '@/constants/game';

const sliceState = vi.hoisted(() => ({
  comboCount: 0,
}));

vi.mock('@/state/gameStateStore', async () => {
  const actual =
    await vi.importActual<typeof import('@/state/gameStateStore')>('@/state/gameStateStore');
  return {
    ...actual,
    useGameStateSlice: <T,>(selector: (s: { combo: { count: number } }) => T): T =>
      selector({ combo: { count: sliceState.comboCount } }),
  };
});

vi.mock('@/components/ComboDisplay', () => ({
  ComboDisplay: () => <div data-testid='combo-display-stub' />,
}));

import { ViewportComboBadge } from '@/components/ViewportComboBadge';

describe('<ViewportComboBadge /> (REF-06 Phase A.2)', () => {
  it('renders nothing when combo is below the activation threshold', () => {
    sliceState.comboCount = COMBO_CONFIG.minCombo - 1;
    const { container } = render(<ViewportComboBadge />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the badge when the combo reaches the activation threshold', () => {
    sliceState.comboCount = COMBO_CONFIG.minCombo;
    render(<ViewportComboBadge />);
    expect(screen.getByTestId('viewport-combo-badge')).toBeInTheDocument();
    expect(screen.getByTestId('combo-display-stub')).toBeInTheDocument();
  });

  it('exposes role=status and aria-live=polite for assistive tech', () => {
    sliceState.comboCount = COMBO_CONFIG.minCombo + 2;
    render(<ViewportComboBadge />);
    const badge = screen.getByTestId('viewport-combo-badge');
    expect(badge).toHaveAttribute('role', 'status');
    expect(badge).toHaveAttribute('aria-live', 'polite');
  });
});
