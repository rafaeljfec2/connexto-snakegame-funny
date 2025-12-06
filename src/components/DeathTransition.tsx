import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GameStatus } from '@/types/game';
import { createLogger, LogContext } from '@/utils/logger';
import styles from './DeathTransition.module.css';

const logger = createLogger(LogContext.TRANSITION);

interface DeathTransitionProps {
  status: GameStatus;
  lives: number;
}

const TRANSITION_DURATION = 3000; // 3 seconds

export function DeathTransition({ status, lives }: DeathTransitionProps) {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState(3);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (status === GameStatus.DYING && lives > 0) {
      logger.info({ lives, status }, 'Death transition started');
      setCountdown(3);
      setProgress(0);

      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, TRANSITION_DURATION - elapsed);
        const newCountdown = Math.ceil(remaining / 1000);
        const newProgress = (elapsed / TRANSITION_DURATION) * 100;

        setCountdown(newCountdown);
        setProgress(Math.min(100, newProgress));

        if (remaining <= 0) {
          clearInterval(interval);
          logger.info({ livesRemaining: lives - 1 }, 'Death transition completed');
        }
      }, 50); // Update every 50ms for smooth animation

      return () => clearInterval(interval);
    } else {
      setCountdown(3);
      setProgress(0);
    }
  }, [status, lives, logger]);

  if (status !== GameStatus.DYING || lives <= 0) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.icon}>💀</div>
          <h2 className={styles.title}>{t('death.lifeLost')}</h2>
          <p className={styles.message}>{t('death.continuingIn', { seconds: countdown })}</p>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <p className={styles.livesRemaining}>{t('death.livesRemaining', { count: lives - 1 })}</p>
        </div>
      </div>
    </div>
  );
}
