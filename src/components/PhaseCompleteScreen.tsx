import { PhaseStatistics } from '@/utils/phaseStatistics';
import { formatTime } from '@/utils/statistics';
import styles from './PhaseCompleteScreen.module.css';

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
  console.log('📊 PhaseCompleteScreen rendering', {
    phaseNumber,
    phaseName,
    statistics,
  });
  
  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.title}>FASE {phaseNumber} COMPLETA!</div>
          <div className={styles.subtitle}>{phaseName}</div>
        </div>

        <div className={styles.statsContainer}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Pontuação</div>
              <div className={styles.statValue}>+{statistics.scoreGained}</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>Níveis Completos</div>
              <div className={styles.statValue}>{statistics.levelsCompleted}</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>Comidas</div>
              <div className={styles.statValue}>{statistics.foodsEaten}</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>Combo Máximo</div>
              <div className={styles.statValue}>{statistics.maxCombo}x</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>Obstáculos</div>
              <div className={styles.statValue}>{statistics.obstaclesEncountered}</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>Tempo</div>
              <div className={styles.statValue}>{formatTime(statistics.playTime)}</div>
            </div>
          </div>
        </div>

        <button className={styles.nextPhaseButton} onClick={onNextPhase}>
          Próxima Fase
        </button>
      </div>
    </div>
  );
}

