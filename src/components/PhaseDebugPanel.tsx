import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PHASES } from '@/constants/phases';
import { PhaseType } from '@/types/phases';
import { getPhaseTranslationKey } from '@/utils/phaseTranslations';
import styles from './PhaseDebugPanel.module.css';

interface PhaseDebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhase: (phase: PhaseType | null) => void;
  currentPhaseId?: number;
}

export function PhaseDebugPanel({
  isOpen,
  onClose,
  onSelectPhase,
  currentPhaseId,
}: PhaseDebugPanelProps) {
  const { t } = useTranslation();
  const [selectedPhaseId, setSelectedPhaseId] = useState<number | null>(null);

  if (!isOpen) {
    return null;
  }

  const handlePhaseSelect = (phase: PhaseType) => {
    setSelectedPhaseId(phase.id);
    onSelectPhase(phase);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t('phaseDebug.title')}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.description}>{t('phaseDebug.selectPhase')}</p>

          <div className={styles.phaseList}>
            {PHASES.map((phase) => {
              const phaseKey = getPhaseTranslationKey(phase.type);
              const isActive = currentPhaseId === phase.id;
              const isSelected = selectedPhaseId === phase.id;

              return (
                <button
                  key={phase.id}
                  className={`${styles.phaseCard} ${isActive ? styles.active : ''} ${isSelected ? styles.selected : ''}`}
                  onClick={() => handlePhaseSelect(phase)}
                  style={
                    {
                      '--phase-color': `hsl(${(phase.id - 1) * 36}, 70%, 50%)`,
                    } as React.CSSProperties
                  }
                >
                  <div className={styles.phaseHeader}>
                    <div className={styles.phaseNumber}>
                      {t('phaseDisplay.phase')} {phase.id}
                    </div>
                    <div className={styles.levelRange}>
                      {t('common.level')}s {phase.levelRange[0]}-{phase.levelRange[1]}
                    </div>
                  </div>
                  <div className={styles.phaseInfo}>
                    <div className={styles.phaseName}>{t(`phases.${phaseKey}.name`)}</div>
                    <div className={styles.phaseDescription}>
                      {t(`phases.${phaseKey}.description`)}
                    </div>
                    <div className={styles.phaseDetails}>
                      {phase.config.obstaclesEnabled && (
                        <span className={styles.detailTag}>
                          {phase.config.obstaclesType === 'moving'
                            ? '🏃 Moving Obstacles'
                            : phase.config.obstaclesType === 'both'
                              ? '🔀 Static & Moving'
                              : '🧱 Static Obstacles'}
                        </span>
                      )}
                      {phase.config.portalsEnabled && (
                        <span className={styles.detailTag}>🌀 Portals</span>
                      )}
                      {phase.config.timedFoodEnabled && (
                        <span className={styles.detailTag}>⏱️ Timed Food</span>
                      )}
                      {phase.config.mazePattern !== 'none' && (
                        <span className={styles.detailTag}>🧩 Maze</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {currentPhaseId && (
            <div className={styles.currentPhase}>
              <div className={styles.currentPhaseLabel}>{t('phaseDebug.currentPhase')}</div>
              <div className={styles.currentPhaseName}>
                {t('phaseDisplay.phase')} {currentPhaseId}:{' '}
                {t(`phases.${getPhaseTranslationKey(PHASES[currentPhaseId - 1]?.type)}.name`)}
              </div>
            </div>
          )}

          <div className={styles.footer}>
            <p className={styles.hint} dangerouslySetInnerHTML={{ __html: t('phaseDebug.hint') }} />
          </div>
        </div>
      </div>
    </div>
  );
}
