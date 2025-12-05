import { useEffect, useState } from 'react';
import { FoodType } from '@/types/game';
import styles from './PowerUpToast.module.css';

interface PowerUpToastProps {
  type: FoodType;
  name: string;
  icon: string;
  duration: number;
  onComplete: () => void;
}

export function PowerUpToast({ type, name, icon, duration, onComplete }: PowerUpToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    // Auto-dismiss after 3 seconds or when duration ends
    const dismissTime = Math.min(3000, duration);

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // Wait for fade-out animation
    }, dismissTime);

    // Update remaining time
    const interval = setInterval(() => {
      setRemaining((prev) => {
        const newRemaining = prev - 100;
        if (newRemaining <= 0) {
          clearInterval(interval);
          return 0;
        }
        return newRemaining;
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [duration, onComplete]);

  const isNegative =
    type === FoodType.POISON || type === FoodType.REVERSE_CONTROLS || type === FoodType.SLOW_DOWN;

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
                  style={{ width: `${(remaining / duration) * 100}%` }}
                />
              </div>
              <span className={styles.toastSeconds}>{Math.ceil(remaining / 1000)}s</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
