import { useCallback, useId, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@/types/theme';
import styles from './ThemeToggle.module.css';

interface ThemeOption {
  readonly value: Theme;
  readonly labelKey: string;
  readonly icon: JSX.Element;
}

const OPTIONS: readonly ThemeOption[] = [
  {
    value: 'dark',
    labelKey: 'theme.dark',
    icon: (
      <svg viewBox='0 0 20 20' width='14' height='14' aria-hidden='true' focusable='false'>
        <path d='M14.5 11.5a5.6 5.6 0 0 1-6-6 5.6 5.6 0 1 0 6 6Z' fill='currentColor' />
      </svg>
    ),
  },
  {
    value: 'auto',
    labelKey: 'theme.auto',
    icon: (
      <svg viewBox='0 0 20 20' width='14' height='14' aria-hidden='true' focusable='false'>
        <circle cx='10' cy='10' r='5.4' fill='currentColor' fillOpacity='0.35' />
        <path d='M10 3.6v12.8a6.4 6.4 0 0 0 0-12.8Z' fill='currentColor' />
        <circle cx='10' cy='10' r='5.4' fill='none' stroke='currentColor' strokeWidth='1.1' />
      </svg>
    ),
  },
  {
    value: 'light',
    labelKey: 'theme.light',
    icon: (
      <svg viewBox='0 0 20 20' width='14' height='14' aria-hidden='true' focusable='false'>
        <circle cx='10' cy='10' r='3.4' fill='currentColor' />
        <g stroke='currentColor' strokeWidth='1.4' strokeLinecap='round'>
          <line x1='10' y1='2' x2='10' y2='4.5' />
          <line x1='10' y1='15.5' x2='10' y2='18' />
          <line x1='2' y1='10' x2='4.5' y2='10' />
          <line x1='15.5' y1='10' x2='18' y2='10' />
          <line x1='4.3' y1='4.3' x2='6.1' y2='6.1' />
          <line x1='13.9' y1='13.9' x2='15.7' y2='15.7' />
          <line x1='4.3' y1='15.7' x2='6.1' y2='13.9' />
          <line x1='13.9' y1='6.1' x2='15.7' y2='4.3' />
        </g>
      </svg>
    ),
  },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const groupId = useId();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const index = OPTIONS.findIndex((o) => o.value === theme);
      const delta = event.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = (index + delta + OPTIONS.length) % OPTIONS.length;
      const next = OPTIONS[nextIndex];
      if (next) setTheme(next.value);
    },
    [theme, setTheme],
  );

  return (
    <div
      id={groupId}
      className={styles.segmented}
      role='radiogroup'
      aria-label={t('theme.groupLabel')}
      data-testid='theme-toggle'
      onKeyDown={handleKeyDown}
    >
      {OPTIONS.map((option) => {
        const selected = option.value === theme;
        return (
          <button
            key={option.value}
            type='button'
            role='radio'
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            className={styles.option}
            data-selected={selected}
            data-testid={`theme-toggle-${option.value}`}
            onClick={() => setTheme(option.value)}
          >
            <span className={styles.icon} aria-hidden='true'>
              {option.icon}
            </span>
            <span className={styles.label}>{t(option.labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}
