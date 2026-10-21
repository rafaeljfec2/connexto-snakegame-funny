import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FoodType } from '@/types/game';
import { PowerUpToast } from '@/components/PowerUpToast';

describe('PowerUpToast (REF-10)', () => {
  it('shows remaining seconds and progress for temporary effects', () => {
    render(
      <PowerUpToast
        type={FoodType.SPEED_BOOST}
        name='Speed Boost'
        icon='⚡'
        duration={5000}
        startTime={Date.now()}
        onComplete={vi.fn()}
      />,
    );

    expect(screen.getByText('Speed Boost')).toBeInTheDocument();
    expect(screen.getByText(/\d+s/)).toBeInTheDocument();
  });

  it('does not show a progress bar for instant effects (duration 0)', () => {
    const { container } = render(
      <PowerUpToast
        type={FoodType.EXTRA_LIFE}
        name='Extra Life'
        icon='❤️'
        duration={0}
        startTime={Date.now()}
        onComplete={vi.fn()}
      />,
    );

    expect(screen.getByText('Extra Life')).toBeInTheDocument();
    expect(container.querySelector('[class*="toastProgressBar"]')).toBeNull();
  });
});
