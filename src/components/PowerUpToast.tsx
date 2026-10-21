import { useEffect, useState } from 'react';
import { FoodType } from '@/types/game';
import styles from './PowerUpToast.module.css';

const INSTANT_TOAST_MS = 1500;

interface PowerUpToastProps {
  readonly type: FoodType;
  readonly name: string;
  readonly icon: string;
  readonly duration: number;
  readonly startTime: number;
  readonly onComplete: () => void;
}

export function PowerUpToast({
  type,
  name,
  icon,
  duration,
  startTime,
  onComplete,
}: PowerUpToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(duration > 0 ? Math.ceil(duration / 1000) : 0);

  useEffect(() => {
    if (duration <= 0) {
      const timeout = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onComplete, 300);
      }, INSTANT_TOAST_MS);
      return () => clearTimeout(timeout);
    }

    const now = Date.now();
    const elapsed = now - startTime;
    const remaining = Math.max(0, duration - elapsed);
    setSecondsLeft(Math.ceil(remaining / 1000));

    const interval = setInterval(() => {
      const currentNow = Date.now();
      const currentElapsed = currentNow - startTime;
      const currentRemaining = Math.max(0, duration - currentElapsed);

      if (currentRemaining <= 0) {
        setIsVisible(false);
        clearInterval(interval);
        setTimeout(onComplete, 300);
      } else {
        setSecondsLeft(Math.ceil(currentRemaining / 1000));
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [duration, startTime, onComplete]);

  const isNegative =
    type === FoodType.POISON || type === FoodType.REVERSE_CONTROLS || type === FoodType.SLOW_DOWN;

  const initialElapsed = Math.max(0, Date.now() - startTime);
  const animationDelay = -initialElapsed;

  return (
    <div
      className={`${styles.toast} ${isVisible ? styles.visible : styles.hidden} ${isNegative ? styles.negative : ''}`}
    >
      <div className={styles.toastContent}>
        <span className={styles.toastIcon}>{icon}</span>
        <div className={styles.toastInfo}>
          <span className={styles.toastName}>{name}</span>
          {duration > 0 && (
            <div className={styles.toastTimer}>
              <div className={styles.toastProgressBar}>
                <div
                  className={styles.toastProgressFill}
                  style={{
                    animationDuration: `${duration}ms`,
                    animationDelay: `${animationDelay}ms`,
                  }}
                />
              </div>
              <span className={styles.toastSeconds}>{secondsLeft}s</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
