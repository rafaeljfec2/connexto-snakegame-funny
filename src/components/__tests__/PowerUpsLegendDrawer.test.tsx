import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en-US', changeLanguage: vi.fn() },
  }),
}));

import { PowerUpsLegendDrawer } from '@/components/PowerUpsLegendDrawer';
import { ThemeProvider } from '@/contexts/ThemeContext';

function installMatchMedia(): void {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    () =>
      ({
        matches: false,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList,
  );
}

function renderWithTheme(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('<PowerUpsLegendDrawer /> (REF-06 Phase A · REF-07 Phase C)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    installMatchMedia();
  });

  it('reflects the open state via data-open and aria-modal', () => {
    const onClose = vi.fn();
    const { rerender } = renderWithTheme(<PowerUpsLegendDrawer open={false} onClose={onClose} />);
    const drawer = screen.getByTestId('powerups-legend-drawer');
    expect(drawer).toHaveAttribute('data-open', 'false');
    expect(drawer).toHaveAttribute('aria-hidden', 'true');

    rerender(
      <ThemeProvider>
        <PowerUpsLegendDrawer open={true} onClose={onClose} />
      </ThemeProvider>,
    );
    expect(drawer).toHaveAttribute('data-open', 'true');
    expect(drawer).toHaveAttribute('aria-modal', 'true');
    expect(drawer).toHaveAttribute('aria-hidden', 'false');
  });

  it('renders legend sections (positive, negative) and the cross-viewport settings section', () => {
    renderWithTheme(<PowerUpsLegendDrawer open={true} onClose={vi.fn()} />);
    const drawer = screen.getByTestId('powerups-legend-drawer');
    expect(drawer.querySelectorAll('section').length).toBe(3);
    expect(drawer.textContent).toContain('powerUps.legendPositive');
    expect(drawer.textContent).toContain('powerUps.legendNegative');
    expect(drawer.textContent).toContain('drawer.settingsTitle');
  });

  it('renders every legend item (7 positive + 3 negative)', () => {
    renderWithTheme(<PowerUpsLegendDrawer open={true} onClose={vi.fn()} />);
    const drawer = screen.getByTestId('powerups-legend-drawer');
    const sections = drawer.querySelectorAll('section');
    const positiveItems = sections[0]?.children.length ?? 0;
    const negativeItems = sections[1]?.children.length ?? 0;
    expect(positiveItems).toBe(8);
    expect(negativeItems).toBe(4);
    expect(drawer.textContent).toContain('powerUps.speedBoost');
    expect(drawer.textContent).toContain('powerUps.poison');
  });

  it('mounts the Settings section with LanguageSelector and ThemeToggle (REF-07 Phase C)', () => {
    renderWithTheme(<PowerUpsLegendDrawer open={true} onClose={vi.fn()} />);
    const settings = screen.getByTestId('drawer-settings-section');
    expect(settings).toBeInTheDocument();

    const select = settings.querySelector('select');
    expect(select).not.toBeNull();
    expect(select).toHaveAttribute('aria-label', 'language.title');

    const themeToggle = screen.getByTestId('theme-toggle');
    expect(themeToggle).toBeInTheDocument();
    expect(themeToggle).toHaveAttribute('role', 'radiogroup');
    expect(themeToggle).toHaveAttribute('aria-label', 'theme.groupLabel');
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    renderWithTheme(<PowerUpsLegendDrawer open={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('powerups-legend-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the scrim is clicked', () => {
    const onClose = vi.fn();
    const { container } = renderWithTheme(<PowerUpsLegendDrawer open={true} onClose={onClose} />);
    const scrim = container.querySelector('[data-open][aria-hidden="true"]');
    expect(scrim).not.toBeNull();
    fireEvent.click(scrim as Element);
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape when open and ignores key when closed', () => {
    const onClose = vi.fn();
    const { rerender } = renderWithTheme(<PowerUpsLegendDrawer open={false} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();

    rerender(
      <ThemeProvider>
        <PowerUpsLegendDrawer open={true} onClose={onClose} />
      </ThemeProvider>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
