import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en-US' },
  }),
}));

vi.mock('@/components/ActivePowerUps', () => ({
  ActivePowerUps: () => <div data-testid='active-powerups-stub' />,
}));

vi.mock('@/components/ComboDisplay', () => ({
  ComboDisplay: () => <div data-testid='combo-display-stub' />,
}));

vi.mock('@/components/PhaseDisplay', () => ({
  PhaseDisplay: () => <div data-testid='phase-display-stub' />,
}));

import { BoardOverlays } from '@/components/BoardOverlays';

describe('<BoardOverlays /> (REF-06 Phase A)', () => {
  it('renders the overlay layer with stable test id', () => {
    render(<BoardOverlays />);
    expect(screen.getByTestId('board-overlays')).toBeInTheDocument();
  });

  it('mounts ActivePowerUps, ComboDisplay and PhaseDisplay slots', () => {
    render(<BoardOverlays />);
    expect(screen.getByTestId('active-powerups-stub')).toBeInTheDocument();
    expect(screen.getByTestId('combo-display-stub')).toBeInTheDocument();
    expect(screen.getByTestId('phase-display-stub')).toBeInTheDocument();
  });

  it('keeps overlays accessible to assistive tech (aria-hidden=false)', () => {
    render(<BoardOverlays />);
    expect(screen.getByTestId('board-overlays')).toHaveAttribute('aria-hidden', 'false');
  });
});
