import { useState, useEffect, useRef } from 'react';
import { Chef } from '@/types/phases';
import { createLogger, LogContext } from '@/utils/logger';
import styles from './BossDefeatTransition.module.css';

const logger = createLogger(LogContext.TRANSITION);

interface BossDefeatTransitionProps {
  boss: Chef;
  score: number;
  onComplete: () => void;
}

const TRANSITION_DURATION = 4000; // 4 seconds total

export function BossDefeatTransition({ boss, score, onComplete }: BossDefeatTransitionProps) {
  const [progress, setProgress] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref up to date
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    logger.info({ bossId: boss.id, bossName: boss.name, score }, 'Boss defeat transition started');
    setProgress(0);
    setShowCelebration(false);

    const startTime = Date.now();
    let hasShownCelebration = false;
    let isComplete = false;

    const interval = setInterval(() => {
      if (isComplete) {
        return;
      }

      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / TRANSITION_DURATION) * 100;

      const currentProgress = Math.min(100, newProgress);
      setProgress(currentProgress);

      // Show celebration after 20% of transition
      if (currentProgress >= 20 && !hasShownCelebration) {
        hasShownCelebration = true;
        setShowCelebration(true);
      }

      if (currentProgress >= 100) {
        isComplete = true;
        clearInterval(interval);
        logger.info({ bossId: boss.id }, 'Boss defeat transition completed');
        setTimeout(() => {
          onCompleteRef.current();
        }, 100);
      }
    }, 16); // ~60fps

    return () => {
      clearInterval(interval);
    };
  }, [boss.id, boss.name, score, logger]);

  // Calculate zoom and fade based on progress
  // 0-40%: Boss explodes and zooms
  // 40-70%: Victory text appears
  // 70-100%: Results appear
  const explodeProgress = Math.min(1, progress / 40);
  const textProgress = progress >= 40 && progress <= 70 
    ? (progress - 40) / 30 
    : progress > 70 
    ? 1 
    : 0;
  const resultsProgress = progress >= 70 ? (progress - 70) / 30 : 0;

  return (
    <div className={styles.overlay}>
      {/* Background with particle effect */}
      <div className={styles.particleBackground}>
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className={styles.particle}
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              backgroundColor: boss.visual.color,
            }}
          />
        ))}
      </div>

      {/* Boss explosion effect */}
      {showCelebration && (
        <div 
          className={styles.explosion}
          style={{
            transform: `scale(${1 + explodeProgress * 3})`,
            opacity: 1 - explodeProgress,
          }}
        >
          <div 
            className={styles.explosionRing}
            style={{
              borderColor: boss.visual.color,
            }}
          />
        </div>
      )}

      {/* Victory text */}
      <div 
        className={styles.victoryText}
        style={{
          opacity: textProgress,
          transform: `scale(${0.5 + textProgress * 0.5})`,
        }}
      >
        <div className={styles.victoryTitle}>VITÓRIA!</div>
        <div className={styles.bossName}>{boss.name} Derrotado!</div>
      </div>

      {/* Results */}
      {progress >= 70 && (
        <div 
          className={styles.results}
          style={{
            opacity: resultsProgress,
            transform: `translateY(${(1 - resultsProgress) * 50}px)`,
          }}
        >
          <div className={styles.scoreGained}>+{score} Pontos</div>
          <div className={styles.continueHint}>Preparando próxima fase...</div>
        </div>
      )}
    </div>
  );
}

