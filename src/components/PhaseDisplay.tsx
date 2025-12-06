import React from 'react';
import { getCurrentPhase, getLevelInPhase, getPhaseProgress } from '@/utils/phases';
import styles from './PhaseDisplay.module.css';

interface PhaseDisplayProps {
  level: number;
  currentPhase?: number;
}

export function PhaseDisplay({ level, currentPhase }: PhaseDisplayProps) {
  const phase = getCurrentPhase(level) ?? undefined;
  const phaseNumber = currentPhase ?? phase?.id ?? 1;
  const levelInPhase = getLevelInPhase(level);
  const progress = getPhaseProgress(level);

  if (!phase) {
    return null;
  }

  return (
    <div className={styles.phaseDisplay}>
      <div className={styles.phaseHeader}>
        <span className={styles.phaseLabel}>Fase {phaseNumber}</span>
        <span className={styles.phaseName}>{phase.name}</span>
      </div>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
      </div>
      <div className={styles.levelInfo}>Nível {levelInPhase}/5 da Fase</div>
    </div>
  );
}
