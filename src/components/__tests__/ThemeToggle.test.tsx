import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en-US', changeLanguage: vi.fn() },
  }),
}));

import { ThemeToggle } from '@/components/ThemeToggle';
import { ThemeProvider } from '@/contexts/ThemeContext';

function installMatchMedia(prefersDark = false): void {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    () =>
      ({
        matches: prefersDark,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList,
  );
}

function renderWithTheme(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('<ThemeToggle /> (REF-07 Phase C)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    installMatchMedia(false);
  });

  it('renders 3 radio options with the expected ARIA structure', () => {
    renderWithTheme(<ThemeToggle />);

    const group = screen.getByTestId('theme-toggle');
    expect(group).toHaveAttribute('role', 'radiogroup');
    expect(group).toHaveAttribute('aria-label', 'theme.groupLabel');

    const radios = group.querySelectorAll('[role="radio"]');
    expect(radios).toHaveLength(3);
  });

  it('marks the dark option selected by default', () => {
    renderWithTheme(<ThemeToggle />);
    expect(screen.getByTestId('theme-toggle-dark')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('theme-toggle-light')).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByTestId('theme-toggle-auto')).toHaveAttribute('aria-checked', 'false');
  });

  it('reflects the stored preference when the provider mounts', () => {
    localStorage.setItem('snake-game-theme', 'light');
    renderWithTheme(<ThemeToggle />);
    expect(screen.getByTestId('theme-toggle-light')).toHaveAttribute('aria-checked', 'true');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('switches selection and writes data-theme attribute on click', () => {
    renderWithTheme(<ThemeToggle />);

    fireEvent.click(screen.getByTestId('theme-toggle-light'));

    expect(screen.getByTestId('theme-toggle-light')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('theme-toggle-dark')).toHaveAttribute('aria-checked', 'false');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('snake-game-theme')).toBe('light');
  });

  it('resolves auto preference through matchMedia', () => {
    installMatchMedia(true);
    renderWithTheme(<ThemeToggle />);

    fireEvent.click(screen.getByTestId('theme-toggle-auto'));

    expect(screen.getByTestId('theme-toggle-auto')).toHaveAttribute('aria-checked', 'true');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('cycles via ArrowRight and ArrowLeft (WAI-ARIA radiogroup)', () => {
    renderWithTheme(<ThemeToggle />);
    const group = screen.getByTestId('theme-toggle');

    fireEvent.keyDown(group, { key: 'ArrowRight' });
    expect(screen.getByTestId('theme-toggle-auto')).toHaveAttribute('aria-checked', 'true');

    fireEvent.keyDown(group, { key: 'ArrowRight' });
    expect(screen.getByTestId('theme-toggle-light')).toHaveAttribute('aria-checked', 'true');

    fireEvent.keyDown(group, { key: 'ArrowRight' });
    expect(screen.getByTestId('theme-toggle-dark')).toHaveAttribute('aria-checked', 'true');

    fireEvent.keyDown(group, { key: 'ArrowLeft' });
    expect(screen.getByTestId('theme-toggle-light')).toHaveAttribute('aria-checked', 'true');
  });

  it('manages roving tabIndex (selected = 0, others = -1)', () => {
    renderWithTheme(<ThemeToggle />);

    expect(screen.getByTestId('theme-toggle-dark')).toHaveAttribute('tabindex', '0');
    expect(screen.getByTestId('theme-toggle-light')).toHaveAttribute('tabindex', '-1');
    expect(screen.getByTestId('theme-toggle-auto')).toHaveAttribute('tabindex', '-1');

    fireEvent.click(screen.getByTestId('theme-toggle-auto'));

    expect(screen.getByTestId('theme-toggle-auto')).toHaveAttribute('tabindex', '0');
    expect(screen.getByTestId('theme-toggle-dark')).toHaveAttribute('tabindex', '-1');
  });

  it('ignores unrelated keys', () => {
    renderWithTheme(<ThemeToggle />);
    const group = screen.getByTestId('theme-toggle');

    fireEvent.keyDown(group, { key: 'Enter' });
    fireEvent.keyDown(group, { key: 'a' });

    expect(screen.getByTestId('theme-toggle-dark')).toHaveAttribute('aria-checked', 'true');
  });
});
