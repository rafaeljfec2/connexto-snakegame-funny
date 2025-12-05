import styles from './GameControls.module.css';
import { GameStatus } from '@/types/game';

interface GameControlsProps {
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  status: GameStatus;
}

export function GameControls({ onStart, onPause, onReset, status }: GameControlsProps) {
  return (
    <div className={styles.controls}>
      {status === GameStatus.IDLE && (
        <button className={styles.button} onClick={onStart}>
          Start
        </button>
      )}
      {status === GameStatus.PLAYING && (
        <button className={styles.button} onClick={onPause}>
          Pause
        </button>
      )}
      {status === GameStatus.PAUSED && (
        <>
          <button className={styles.button} onClick={onPause}>
            Resume
          </button>
          <button className={styles.button} onClick={onReset}>
            Reset
          </button>
        </>
      )}
      {status === GameStatus.GAME_OVER && (
        <button className={styles.button} onClick={onReset}>
          Play Again
        </button>
      )}
      {(status === GameStatus.PHASE_INTRO || status === GameStatus.PHASE_COMPLETE) && (
        // Hide controls during phase transitions
        null
      )}
    </div>
  );
}
