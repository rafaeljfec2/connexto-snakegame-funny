import { LIVES_CONFIG } from '@/constants/lives';
import { getCurrentPhase, getPhaseNumber } from '@/utils/phases';
import styles from './StatusBar.module.css';

interface StatusBarProps {
  length: number;
  lives: number;
  level: number;
}

export function StatusBar({ length, lives, level }: StatusBarProps) {
  const phase = getCurrentPhase(level);
  const phaseNumber = phase ? getPhaseNumber(level) : 1;

  return (
    <div className={styles.statusBar}>
      {/* Length - Always visible */}
      <div className={styles.statusItem}>
        <span className={styles.statusIcon}>🐍</span>
        <div className={styles.statusContent}>
          <span className={styles.statusLabel}>Length</span>
          <span className={styles.statusValue}>{length}</span>
        </div>
      </div>

      {/* Lives - Show if enabled */}
      {LIVES_CONFIG.enabled && (
        <>
          <div className={styles.separator} />
          <div className={styles.statusItem}>
            <span className={styles.statusIcon}>❤️</span>
            <div className={styles.statusContent}>
              <span className={styles.statusLabel}>Lives</span>
              <div className={styles.livesDisplay}>
                {Array.from({ length: LIVES_CONFIG.maxLives }, (_, index) => (
                  <span
                    key={index}
                    className={`${styles.lifeDot} ${index < lives ? styles.lifeActive : styles.lifeInactive}`}
                    aria-label={index < lives ? 'Life remaining' : 'Life lost'}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Phase - Show if exists */}
      {phase && (
        <>
          <div className={styles.separator} />
          <div className={styles.statusItem}>
            <span className={styles.statusIcon}>⭐</span>
            <div className={styles.statusContent}>
              <span className={styles.statusLabel}>Fase {phaseNumber}</span>
              <span className={`${styles.statusValue} ${styles.phaseName}`} title={phase.name}>
                {phase.name}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
