import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { LIVES_CONFIG } from '@/constants/lives';
import { useGameStateSlice } from '@/state/gameStateStore';
import styles from './LivesDisplay.module.css';

function LivesDisplayComponent() {
  const { t } = useTranslation();
  const lives = useGameStateSlice((s) => s.lives);
  if (!LIVES_CONFIG.enabled) {
    return null;
  }

  return (
    <div className={styles.livesContainer}>
      <span className={styles.livesLabel}>{t('livesDisplay.lives')}</span>
      <div className={styles.livesIcons}>
        {Array.from({ length: LIVES_CONFIG.maxLives }, (_, index) => (
          <span
            key={index}
            className={`${styles.lifeIcon} ${index < lives ? styles.active : styles.inactive}`}
            aria-label={index < lives ? t('statusBar.lifeRemaining') : t('statusBar.lifeLost')}
          >
            ❤️
          </span>
        ))}
      </div>
    </div>
  );
}

export const LivesDisplay = memo(LivesDisplayComponent);
LivesDisplay.displayName = 'LivesDisplay';
