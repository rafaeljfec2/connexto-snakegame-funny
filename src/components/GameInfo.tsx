import { useTranslation } from 'react-i18next';
import styles from './GameInfo.module.css';

interface GameInfoProps {
  score: number;
  highScore: number;
  level: number;
}

export function GameInfo({ score, highScore, level }: GameInfoProps) {
  const { t } = useTranslation();
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
