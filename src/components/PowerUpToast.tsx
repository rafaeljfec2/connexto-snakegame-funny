import { useEffect, useState } from 'react';
import { FoodType } from '@/types/game';
import styles from './PowerUpToast.module.css';

interface PowerUpToastProps {
  type: FoodType;
  name: string;
  icon: string;
  duration: number;
  startTime: number;
  onComplete: () => void;
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
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(duration / 1000));

  useEffect(() => {
    // Initial calculation
    const now = Date.now();
    const elapsed = now - startTime;
    const remaining = Math.max(0, duration - elapsed);
    setSecondsLeft(Math.ceil(remaining / 1000));

    // Update text every 1 second (much lighter than 100ms)
    const interval = setInterval(() => {
      const currentNow = Date.now();
      const currentElapsed = currentNow - startTime;
      const currentRemaining = Math.max(0, duration - currentElapsed);

      if (currentRemaining <= 0) {
        setIsVisible(false);
        clearInterval(interval);
        setTimeout(onComplete, 300); // Fade out
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

  // Calculate initial animation delay if toast started late (e.g. re-render)
  const initialElapsed = Math.max(0, Date.now() - startTime);
  const animationDelay = -initialElapsed; // Negative delay fast-forwards animation

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
