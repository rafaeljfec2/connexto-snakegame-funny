import { GameStatus } from '@/types/game';
import styles from './StatusMessage.module.css';

interface StatusMessageProps {
  status: GameStatus;
}

export function StatusMessage({ status }: StatusMessageProps) {
  const getStatusMessage = () => {
    switch (status) {
      case GameStatus.IDLE:
        return 'Press SPACE to start';
      case GameStatus.PLAYING:
        return 'Playing...';
      case GameStatus.PAUSED:
        return 'Paused - Press SPACE to resume';
      case GameStatus.DYING:
        return 'Press SPACE to continue';
      case GameStatus.GAME_OVER:
        return 'Game Over - Press SPACE to restart';
      default:
        return '';
    }
  };

  return <div className={styles.statusMessage}>{getStatusMessage()}</div>;
}
