import styles from './GameInfo.module.css';

interface GameInfoProps {
  score: number;
  highScore: number;
  level: number;
}

export function GameInfo({ score, highScore, level }: GameInfoProps) {
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
    </div>
  );
}
