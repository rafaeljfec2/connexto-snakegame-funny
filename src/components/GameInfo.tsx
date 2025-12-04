import { GameStatus } from '@/types/game'
import styles from './GameInfo.module.css'

interface GameInfoProps {
  score: number
  highScore: number
  level: number
  status: GameStatus
}

export function GameInfo({ score, highScore, level, status }: GameInfoProps) {
  const getStatusMessage = () => {
    switch (status) {
      case GameStatus.IDLE:
        return 'Press SPACE to start'
      case GameStatus.PLAYING:
        return 'Playing...'
      case GameStatus.PAUSED:
        return 'Paused - Press SPACE to resume'
      case GameStatus.DYING:
        return 'Press SPACE to continue'
      case GameStatus.GAME_OVER:
        return 'Game Over - Press SPACE to restart'
      default:
        return ''
    }
  }

  return (
    <div className={styles.gameInfo}>
      <div className={styles.scores}>
        <div className={styles.scoreItem}>
          <span className={styles.label}>Level:</span>
          <span className={styles.value}>{level}</span>
        </div>
        <div className={styles.scoreItem}>
          <span className={styles.label}>Score:</span>
          <span className={styles.value}>{score}</span>
        </div>
        <div className={styles.scoreItem}>
          <span className={styles.label}>High Score:</span>
          <span className={styles.value}>{highScore}</span>
        </div>
      </div>
      <div className={styles.statusMessage}>{getStatusMessage()}</div>
    </div>
  )
}
