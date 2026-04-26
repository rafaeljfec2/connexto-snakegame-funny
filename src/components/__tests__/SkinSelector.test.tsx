import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en-US', changeLanguage: vi.fn() },
  }),
}));

import { SkinSelector } from '@/components/SkinSelector';
import { SkinProvider, useSkin } from '@/contexts/SkinContext';
import { SKIN_IDS, STORAGE_KEYS, type SkinId } from '@/types/skin';
import { DEFAULT_SKIN_ID } from '@/constants/skins';

function Wrapper({ children }: { readonly children: ReactNode }) {
  return <SkinProvider>{children}</SkinProvider>;
}

function CurrentSkinProbe() {
  const { skinId } = useSkin();
  return <div data-testid='current-skin'>{skinId}</div>;
}

describe('<SkinSelector /> (REF-08 Phase C)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders a radiogroup with one radio per catalog entry', () => {
    render(
      <Wrapper>
        <SkinSelector />
      </Wrapper>,
    );

    const group = screen.getByTestId('skin-selector');
    expect(group).toHaveAttribute('role', 'radiogroup');
    expect(group).toHaveAttribute('aria-label', 'skin.groupLabel');

    const radios = group.querySelectorAll('[role="radio"]');
    expect(radios).toHaveLength(SKIN_IDS.length);
  });

  it('marks the default skin as checked on first mount', () => {
    render(
      <Wrapper>
        <SkinSelector />
      </Wrapper>,
    );

    const defaultRadio = screen.getByTestId(`skin-selector-${DEFAULT_SKIN_ID}`);
    expect(defaultRadio).toHaveAttribute('aria-checked', 'true');
    expect(defaultRadio).toHaveAttribute('data-selected', 'true');
    expect(defaultRadio).toHaveAttribute('tabindex', '0');

    for (const id of SKIN_IDS.filter((s) => s !== DEFAULT_SKIN_ID)) {
      const radio = screen.getByTestId(`skin-selector-${id}`);
      expect(radio).toHaveAttribute('aria-checked', 'false');
      expect(radio).toHaveAttribute('tabindex', '-1');
    }
  });

  it('updates the context skin on click and exposes it via useSkin', () => {
    render(
      <Wrapper>
        <SkinSelector />
        <CurrentSkinProbe />
      </Wrapper>,
    );

    fireEvent.click(screen.getByTestId('skin-selector-magenta-blaze'));

    expect(screen.getByTestId('current-skin').textContent).toBe('magenta-blaze');
    expect(screen.getByTestId('skin-selector-magenta-blaze')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(localStorage.getItem(STORAGE_KEYS.SKIN)).toBe('magenta-blaze');
  });

  it('cycles forward with ArrowRight and wraps at the end', () => {
    render(
      <Wrapper>
        <SkinSelector />
        <CurrentSkinProbe />
      </Wrapper>,
    );

    const group = screen.getByTestId('skin-selector');
    for (let i = 0; i < SKIN_IDS.length; i += 1) {
      fireEvent.keyDown(group, { key: 'ArrowRight' });
    }

    expect(screen.getByTestId('current-skin').textContent).toBe(DEFAULT_SKIN_ID);
  });

  it('cycles backward with ArrowLeft and wraps at the start', () => {
    render(
      <Wrapper>
        <SkinSelector />
        <CurrentSkinProbe />
      </Wrapper>,
    );

    const group = screen.getByTestId('skin-selector');
    fireEvent.keyDown(group, { key: 'ArrowLeft' });

    const expectedIndex = SKIN_IDS.length - 1;
    const expected: SkinId | undefined = SKIN_IDS[expectedIndex];
    expect(expected).toBeDefined();
    expect(screen.getByTestId('current-skin').textContent).toBe(expected);
  });

  it('renders a decorative preview chip per option (aria-hidden)', () => {
    render(
      <Wrapper>
        <SkinSelector />
      </Wrapper>,
    );

    for (const id of SKIN_IDS) {
      const radio = screen.getByTestId(`skin-selector-${id}`);
      const preview = radio.querySelector('[aria-hidden="true"]');
      expect(preview).not.toBeNull();
    }
  });

  it('exposes a readable label per option even when the visual label is sr-only', () => {
    render(
      <Wrapper>
        <SkinSelector />
      </Wrapper>,
    );

    for (const id of SKIN_IDS) {
      const radio = screen.getByTestId(`skin-selector-${id}`);
      expect(radio).toHaveAttribute('aria-label');
      expect(radio.getAttribute('aria-label')).not.toBe('');
    }
  });

  it('ignores unrelated keyboard events', () => {
    render(
      <Wrapper>
        <SkinSelector />
        <CurrentSkinProbe />
      </Wrapper>,
    );

    const group = screen.getByTestId('skin-selector');
    fireEvent.keyDown(group, { key: 'Enter' });
    fireEvent.keyDown(group, { key: 'Tab' });
    fireEvent.keyDown(group, { key: 'ArrowUp' });

    expect(screen.getByTestId('current-skin').textContent).toBe(DEFAULT_SKIN_ID);
  });
});
