import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PhaseStatistics } from '@/utils/phaseStatistics';
import { formatTime } from '@/utils/statistics';
import { createLogger, LogContext } from '@/utils/logger';
import styles from './PhaseCompleteScreen.module.css';

const logger = createLogger(LogContext.TRANSITION);

interface PhaseCompleteScreenProps {
  phaseNumber: number;
  phaseName: string;
  statistics: PhaseStatistics;
  onNextPhase: () => void;
}

export function PhaseCompleteScreen({
  phaseNumber,
  phaseName,
  statistics,
  onNextPhase,
}: PhaseCompleteScreenProps) {
  const { t } = useTranslation();

  useEffect(() => {
    logger.info({ phaseNumber, phaseName, statistics }, 'Phase complete screen displayed');
  }, [phaseNumber, phaseName, statistics]);
  
  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.title}>{t('phaseComplete.title', { phaseNumber })}</div>
          <div className={styles.subtitle}>{phaseName}</div>
        </div>

        <div className={styles.statsContainer}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>{t('phaseComplete.scoreGained')}</div>
              <div className={styles.statValue}>+{statistics.scoreGained}</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>{t('phaseComplete.levelsCompleted')}</div>
              <div className={styles.statValue}>{statistics.levelsCompleted}</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>{t('phaseComplete.foodsEaten')}</div>
              <div className={styles.statValue}>{statistics.foodsEaten}</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>{t('phaseComplete.maxCombo')}</div>
              <div className={styles.statValue}>{statistics.maxCombo}x</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>{t('phaseComplete.obstacles')}</div>
              <div className={styles.statValue}>{statistics.obstaclesEncountered}</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>{t('phaseComplete.time')}</div>
              <div className={styles.statValue}>{formatTime(statistics.playTime)}</div>
            </div>
          </div>
        </div>

        <button className={styles.nextPhaseButton} onClick={onNextPhase}>
          {t('phase.nextPhase')}
        </button>
      </div>
    </div>
  );
}

