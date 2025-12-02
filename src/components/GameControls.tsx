import styles from './GameControls.module.css'

interface GameControlsProps {
  onStart: () => void
  onPause: () => void
  onReset: () => void
  status: 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'
}

export function GameControls({
  onStart,
  onPause,
  onReset,
  status,
}: GameControlsProps) {
  return (
    <div className={styles.controls}>
      {status === 'IDLE' && (
        <button className={styles.button} onClick={onStart}>
          Start
        </button>
      )}
      {status === 'PLAYING' && (
        <button className={styles.button} onClick={onPause}>
          Pause
        </button>
      )}
      {status === 'PAUSED' && (
        <>
          <button className={styles.button} onClick={onPause}>
            Resume
          </button>
          <button className={styles.button} onClick={onReset}>
            Reset
          </button>
        </>
      )}
      {status === 'GAME_OVER' && (
        <button className={styles.button} onClick={onReset}>
          Play Again
        </button>
      )}
    </div>
  )
}
