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
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    // Calculate remaining time based on startTime and duration
    const calculateRemaining = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const remainingTime = Math.max(0, duration - elapsed);
      return remainingTime;
    };

    // Initialize remaining time
    setRemaining(calculateRemaining());

    // Update remaining time every 100ms
    const interval = setInterval(() => {
      const remainingTime = calculateRemaining();
      setRemaining(remainingTime);

      // When time expires, hide and remove toast
      if (remainingTime <= 0) {
        setIsVisible(false);
        clearInterval(interval);
        setTimeout(onComplete, 300); // Wait for fade-out animation
      }
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [duration, startTime, onComplete]);

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
