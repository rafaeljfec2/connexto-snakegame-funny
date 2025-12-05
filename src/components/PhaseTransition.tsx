import { useState, useEffect } from 'react';
import { getCurrentPhase } from '@/utils/phases';
import styles from './PhaseTransition.module.css';

interface PhaseTransitionProps {
  phaseNumber: number;
  level: number;
  onComplete: () => void;
}

const TRANSITION_DURATION = 3000; // 3 seconds total

export function PhaseTransition({ phaseNumber, level, onComplete }: PhaseTransitionProps) {
  const [progress, setProgress] = useState(0);
  const [showText, setShowText] = useState(false);
  const phase = getCurrentPhase(level);

  useEffect(() => {
    setProgress(0);
    setShowText(false);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / TRANSITION_DURATION) * 100;

      setProgress(Math.min(100, newProgress));

      // Show text after 30% of transition
      if (newProgress >= 30 && !showText) {
        setShowText(true);
      }

      if (newProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 100);
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [phaseNumber, onComplete, showText]);

  if (!phase) {
    return null;
  }

  // Calculate slide positions based on progress
  // 0-30%: top and bottom slide in from edges
  // 30-70%: text appears and stays
  // 70-100%: slides continue to center
  const slideProgress =
    progress < 30 ? progress / 30 : progress > 70 ? 1 - (progress - 70) / 30 : 1;

  return (
    <div className={styles.overlay}>
      {/* Top slide */}
      <div
        className={`${styles.slide} ${styles.topSlide}`}
        style={{
          transform: `translateY(${-100 + slideProgress * 50}%)`,
        }}
      />

      {/* Bottom slide */}
      <div
        className={`${styles.slide} ${styles.bottomSlide}`}
        style={{
          transform: `translateY(${100 - slideProgress * 50}%)`,
        }}
      />

      {/* Phase text */}
      {showText && (
        <div
          className={styles.phaseText}
          style={{
            opacity: progress >= 30 && progress <= 70 ? 1 : 0,
          }}
        >
          <div className={styles.phaseNumber}>FASE {phaseNumber}</div>
          <div className={styles.phaseName}>{phase.name}</div>
        </div>
      )}
    </div>
  );
}
