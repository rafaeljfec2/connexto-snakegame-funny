import { useTranslation } from 'react-i18next';
import styles from './GameControls.module.css';
import { GameStatus } from '@/types/game';

interface GameControlsProps {
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  status: GameStatus;
}

export function GameControls({ onStart, onPause, onReset, status }: GameControlsProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.controls}>
      {status === GameStatus.IDLE && (
        <button className={styles.button} onClick={onStart}>
          {t('common.start')}
        </button>
      )}
      {status === GameStatus.PLAYING && (
        <button className={styles.button} onClick={onPause}>
          {t('common.pause')}
        </button>
      )}
      {status === GameStatus.PAUSED && (
        <>
          <button className={styles.button} onClick={onPause}>
            {t('common.resume')}
          </button>
          <button className={styles.button} onClick={onReset}>
            {t('common.reset')}
          </button>
        </>
      )}
      {status === GameStatus.GAME_OVER && (
        <button className={styles.button} onClick={onReset}>
          {t('common.playAgain')}
        </button>
      )}
      {(status === GameStatus.PHASE_INTRO || status === GameStatus.PHASE_COMPLETE) && (
        // Hide controls during phase transitions
        null
      )}
    </div>
  );
}
