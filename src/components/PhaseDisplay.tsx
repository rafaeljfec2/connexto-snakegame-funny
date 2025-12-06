import React from 'react';
import { useTranslation } from 'react-i18next';
import { getCurrentPhase, getLevelInPhase, getPhaseProgress } from '@/utils/phases';
import { getPhaseTranslationKey } from '@/utils/phaseTranslations';
import styles from './PhaseDisplay.module.css';

interface PhaseDisplayProps {
  level: number;
  currentPhase?: number;
}

export function PhaseDisplay({ level, currentPhase }: PhaseDisplayProps) {
  const { t } = useTranslation();
  const phase = getCurrentPhase(level) ?? undefined;
  const phaseNumber = currentPhase ?? phase?.id ?? 1;
  const levelInPhase = getLevelInPhase(level);
  const progress = getPhaseProgress(level);

  if (!phase) {
    return null;
  }

  const phaseKey = getPhaseTranslationKey(phase.type);

  return (
    <div className={styles.phaseDisplay}>
      <div className={styles.phaseHeader}>
        <span className={styles.phaseLabel}>{t('phaseDisplay.phase')} {phaseNumber}</span>
        <span className={styles.phaseName}>{t(`phases.${phaseKey}.name`)}</span>
      </div>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
      </div>
      <div className={styles.levelInfo}>{t('phaseDisplay.levelInPhase', { current: levelInPhase })}</div>
    </div>
  );
}
