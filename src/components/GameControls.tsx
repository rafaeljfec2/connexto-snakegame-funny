import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './GameControls.module.css';
import { GameStatus } from '@/types/game';
import { useSfx } from '@/hooks/useSfx';

interface GameControlsProps {
  readonly onStart: () => void;
  readonly onPause: () => void;
  readonly onReset: () => void;
  readonly status: GameStatus;
}

export function GameControls({ onStart, onPause, onReset, status }: GameControlsProps) {
  const { t } = useTranslation();
  const { play } = useSfx();

  const withClick = useCallback(
    (handler: () => void) => () => {
      play('ui.click');
      handler();
    },
    [play],
  );

  return (
    <div className={styles.controls}>
      {status === GameStatus.IDLE && (
        <button className={styles.button} onClick={withClick(onStart)}>
          {t('common.start')}
        </button>
      )}
      {status === GameStatus.PLAYING && (
        <button className={styles.button} onClick={withClick(onPause)}>
          {t('common.pause')}
        </button>
      )}
      {status === GameStatus.PAUSED && (
        <>
          <button className={styles.button} onClick={withClick(onPause)}>
            {t('common.resume')}
          </button>
          <button className={styles.button} onClick={withClick(onReset)}>
            {t('common.reset')}
          </button>
        </>
      )}
      {status === GameStatus.GAME_OVER && (
        <button className={styles.button} onClick={withClick(onReset)}>
          {t('common.playAgain')}
        </button>
      )}
      {(status === GameStatus.PHASE_INTRO || status === GameStatus.PHASE_COMPLETE) && null}
    </div>
  );
}
