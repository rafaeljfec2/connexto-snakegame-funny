import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en-US' },
  }),
}));

import { PowerUpsLegendDrawer } from '@/components/PowerUpsLegendDrawer';

describe('<PowerUpsLegendDrawer /> (REF-06 Phase A)', () => {
  it('reflects the open state via data-open and aria-modal', () => {
    const onClose = vi.fn();
    const { rerender } = render(<PowerUpsLegendDrawer open={false} onClose={onClose} />);
    const drawer = screen.getByTestId('powerups-legend-drawer');
    expect(drawer).toHaveAttribute('data-open', 'false');
    expect(drawer).toHaveAttribute('aria-hidden', 'true');

    rerender(<PowerUpsLegendDrawer open={true} onClose={onClose} />);
    expect(drawer).toHaveAttribute('data-open', 'true');
    expect(drawer).toHaveAttribute('aria-modal', 'true');
    expect(drawer).toHaveAttribute('aria-hidden', 'false');
  });

  it('renders both legend sections with positive and negative groups', () => {
    render(<PowerUpsLegendDrawer open={true} onClose={vi.fn()} />);
    const drawer = screen.getByTestId('powerups-legend-drawer');
    expect(drawer.querySelectorAll('section').length).toBe(2);
    expect(drawer.textContent).toContain('powerUps.legendPositive');
    expect(drawer.textContent).toContain('powerUps.legendNegative');
  });

  it('renders every legend item (7 positive + 3 negative)', () => {
    render(<PowerUpsLegendDrawer open={true} onClose={vi.fn()} />);
    const drawer = screen.getByTestId('powerups-legend-drawer');
    const sections = drawer.querySelectorAll('section');
    const positiveItems = sections[0]?.children.length ?? 0;
    const negativeItems = sections[1]?.children.length ?? 0;
    expect(positiveItems).toBe(8);
    expect(negativeItems).toBe(4);
    expect(drawer.textContent).toContain('powerUps.speedBoost');
    expect(drawer.textContent).toContain('powerUps.poison');
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(<PowerUpsLegendDrawer open={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('powerups-legend-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the scrim is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<PowerUpsLegendDrawer open={true} onClose={onClose} />);
    const scrim = container.querySelector('[data-open][aria-hidden="true"]');
    expect(scrim).not.toBeNull();
    fireEvent.click(scrim as Element);
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape when open and ignores key when closed', () => {
    const onClose = vi.fn();
    const { rerender } = render(<PowerUpsLegendDrawer open={false} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();

    rerender(<PowerUpsLegendDrawer open={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
