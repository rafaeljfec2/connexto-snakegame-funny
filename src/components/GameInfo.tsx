import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStateSlice } from '@/state/gameStateStore';
import styles from './GameInfo.module.css';

function GameInfoComponent() {
  const { t } = useTranslation();
  const score = useGameStateSlice((s) => s.score);
  const highScore = useGameStateSlice((s) => s.highScore);
  const level = useGameStateSlice((s) => s.level);

  return (
    <div className={styles.gameInfo}>
      <div className={styles.scores}>
        <div className={styles.scoreItem}>
          <span className={styles.label}>{t('gameInfo.level')}</span>
          <span className={styles.value}>{level}</span>
        </div>
        <div className={styles.scoreItem}>
          <span className={styles.label}>{t('gameInfo.score')}</span>
          <span className={styles.value}>{score}</span>
        </div>
        <div className={styles.scoreItem}>
          <span className={styles.label}>{t('gameInfo.highScore')}</span>
          <span className={styles.value}>{highScore}</span>
        </div>
      </div>
    </div>
  );
}

export const GameInfo = memo(GameInfoComponent);
GameInfo.displayName = 'GameInfo';
