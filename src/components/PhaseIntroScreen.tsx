import { useState, useEffect } from 'react';
import { getCurrentPhase } from '@/utils/phases';
import styles from './PhaseIntroScreen.module.css';

interface PhaseIntroScreenProps {
  phaseNumber: number;
  level: number;
  onComplete: () => void;
}

const COUNTDOWN_DURATION = 4000; // 4 seconds (1 second per number: 3, 2, 1, GO)

export function PhaseIntroScreen({ phaseNumber, level, onComplete }: PhaseIntroScreenProps) {
  const [countdown, setCountdown] = useState<number | string>(3);
  const phase = getCurrentPhase(level);

  useEffect(() => {
    let count = 3;
    setCountdown(3);

    const interval = setInterval(() => {
      count--;

      if (count > 0) {
        setCountdown(count);
      } else if (count === 0) {
        setCountdown('GO!');
        setTimeout(() => {
          onComplete();
        }, 500);
        clearInterval(interval);
      } else {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phaseNumber, onComplete]);

  if (!phase) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.phaseInfo}>
          <div className={styles.phaseNumber}>FASE {phaseNumber}</div>
          <div className={styles.phaseName}>{phase.name}</div>
          <div className={styles.phaseDescription}>{phase.description}</div>
        </div>

        <div className={styles.countdownContainer}>
          <div
            className={`${styles.countdown} ${
              typeof countdown === 'string' ? styles.go : ''
            }`}
            key={countdown}
          >
            {countdown}
          </div>
        </div>
      </div>
    </div>
  );
}

