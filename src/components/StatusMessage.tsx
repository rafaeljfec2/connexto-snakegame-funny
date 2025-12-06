import { useTranslation } from 'react-i18next';
import { GameStatus } from '@/types/game';
import styles from './StatusMessage.module.css';

interface StatusMessageProps {
  status: GameStatus;
}

export function StatusMessage({ status }: StatusMessageProps) {
  const { t } = useTranslation();

  const getStatusMessage = () => {
    switch (status) {
      case GameStatus.IDLE:
        return t('gameStatus.pressSpaceToStart');
      case GameStatus.PLAYING:
        return t('gameStatus.playing');
      case GameStatus.PAUSED:
        return t('gameStatus.paused');
      case GameStatus.DYING:
        return t('gameStatus.continuingAutomatically');
      case GameStatus.GAME_OVER:
        return t('gameStatus.gameOver');
      default:
        return '';
    }
  };

  return <div className={styles.statusMessage}>{getStatusMessage()}</div>;
}
