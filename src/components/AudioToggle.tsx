import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSfx } from '@/hooks/useSfx';
import styles from './AudioToggle.module.css';

export const AudioToggle = memo(function AudioToggle() {
  const { t } = useTranslation();
  const { isMuted, isReady, setMuted, play } = useSfx();

  const handleClick = useCallback(() => {
    const nextMuted = !isMuted;
    setMuted(nextMuted);
    if (!nextMuted && isReady) {
      play('ui.toggle');
    }
  }, [isMuted, isReady, setMuted, play]);

  const label = isMuted ? t('audio.toggle.off') : t('audio.toggle.on');

  return (
    <button
      type='button'
      className={styles.button}
      onClick={handleClick}
      aria-label={label}
      aria-pressed={isMuted}
      data-muted={isMuted}
      data-ready={isReady}
      data-testid='audio-toggle'
    >
      {isMuted ? '\u{1F507}' : '\u{1F50A}'}
    </button>
  );
});
