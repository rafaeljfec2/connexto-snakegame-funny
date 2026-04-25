import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const hookState = vi.hoisted(() => {
  return {
    isMuted: false,
    isReady: true,
    volume: 0.7,
    setMutedSpy: vi.fn(),
    playSpy: vi.fn(),
  };
});

vi.mock('@/hooks/useSfx', () => ({
  useSfx: () => ({
    play: hookState.playSpy,
    setMuted: (m: boolean) => {
      hookState.setMutedSpy(m);
      hookState.isMuted = m;
    },
    setVolume: () => undefined,
    isMuted: hookState.isMuted,
    volume: hookState.volume,
    isReady: hookState.isReady,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

import { AudioToggle } from '@/components/AudioToggle';

describe('<AudioToggle />', () => {
  beforeEach(() => {
    hookState.isMuted = false;
    hookState.isReady = true;
    hookState.setMutedSpy.mockClear();
    hookState.playSpy.mockClear();
  });

  it('renders accessible button reflecting unmuted state', () => {
    render(<AudioToggle />);
    const btn = screen.getByTestId('audio-toggle');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(btn).toHaveAttribute('aria-label', 'audio.toggle.on');
    expect(btn).toHaveAttribute('data-ready', 'true');
  });

  it('toggles mute and plays ui.toggle when unmuting from muted', () => {
    hookState.isMuted = true;
    const { rerender } = render(<AudioToggle />);
    fireEvent.click(screen.getByTestId('audio-toggle'));
    expect(hookState.setMutedSpy).toHaveBeenCalledWith(false);
    expect(hookState.playSpy).toHaveBeenCalledWith('ui.toggle');
    rerender(<AudioToggle />);
  });

  it('does not play ui.toggle when muting (would be silenced anyway)', () => {
    hookState.isMuted = false;
    render(<AudioToggle />);
    fireEvent.click(screen.getByTestId('audio-toggle'));
    expect(hookState.setMutedSpy).toHaveBeenCalledWith(true);
    expect(hookState.playSpy).not.toHaveBeenCalled();
  });
});
