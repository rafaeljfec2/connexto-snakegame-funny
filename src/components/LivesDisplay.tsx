import { LIVES_CONFIG } from '@/constants/lives';
import styles from './LivesDisplay.module.css';

interface LivesDisplayProps {
  lives: number;
}

export function LivesDisplay({ lives }: LivesDisplayProps) {
  if (!LIVES_CONFIG.enabled) {
    return null;
  }

  return (
    <div className={styles.livesContainer}>
      <span className={styles.livesLabel}>Lives:</span>
      <div className={styles.livesIcons}>
        {Array.from({ length: LIVES_CONFIG.maxLives }, (_, index) => (
          <span
            key={index}
            className={`${styles.lifeIcon} ${index < lives ? styles.active : styles.inactive}`}
            aria-label={index < lives ? 'Life remaining' : 'Life lost'}
          >
            ❤️
          </span>
        ))}
      </div>
    </div>
  );
}
