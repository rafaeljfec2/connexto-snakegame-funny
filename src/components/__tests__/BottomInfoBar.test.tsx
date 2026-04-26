import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/PhaseDisplay', () => ({
  PhaseDisplay: () => <div data-testid='phase-display-stub' />,
}));

import { BottomInfoBar } from '@/components/BottomInfoBar';

describe('<BottomInfoBar /> (REF-06 Phase A.2)', () => {
  it('renders the bar wrapper with stable test id', () => {
    render(<BottomInfoBar />);
    expect(screen.getByTestId('bottom-info-bar')).toBeInTheDocument();
  });

  it('mounts the PhaseDisplay child inside the host slot', () => {
    render(<BottomInfoBar />);
    expect(screen.getByTestId('phase-display-stub')).toBeInTheDocument();
  });

  it('exposes role=complementary for assistive tech', () => {
    render(<BottomInfoBar />);
    expect(screen.getByTestId('bottom-info-bar')).toHaveAttribute('role', 'complementary');
  });
});
