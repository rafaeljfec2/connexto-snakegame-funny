import { useTranslation } from 'react-i18next';
import { LIVES_CONFIG } from '@/constants/lives';
import { getCurrentPhase, getPhaseNumber } from '@/utils/phases';
import { getPhaseTranslationKey } from '@/utils/phaseTranslations';
import styles from './StatusBar.module.css';

interface StatusBarProps {
  length: number;
  lives: number;
  level: number;
}

export function StatusBar({ length, lives, level }: StatusBarProps) {
  const { t } = useTranslation();
  const phase = getCurrentPhase(level);
  const phaseNumber = phase ? getPhaseNumber(level) : 1;

  return (
    <div className={styles.statusBar}>
      {/* Length - Always visible */}
      <div className={styles.statusItem}>
        <span className={styles.statusIcon}>🐍</span>
        <div className={styles.statusContent}>
          <span className={styles.statusLabel}>{t('statusBar.length')}</span>
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
              <span className={styles.statusLabel}>{t('statusBar.lives')}</span>
              <div className={styles.livesDisplay}>
                {Array.from({ length: LIVES_CONFIG.maxLives }, (_, index) => (
                  <span
                    key={index}
                    className={`${styles.lifeDot} ${index < lives ? styles.lifeActive : styles.lifeInactive}`}
                    aria-label={
                      index < lives ? t('statusBar.lifeRemaining') : t('statusBar.lifeLost')
                    }
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
              <span className={styles.statusLabel}>
                {t('common.phase')} {phaseNumber}
              </span>
              <span
                className={`${styles.statusValue} ${styles.phaseName}`}
                title={t(`phases.${getPhaseTranslationKey(phase.type)}.name`)}
              >
                {t(`phases.${getPhaseTranslationKey(phase.type)}.name`)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
