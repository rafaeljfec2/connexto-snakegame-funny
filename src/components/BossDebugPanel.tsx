import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CHEFS } from '@/constants/phases';
import { Chef } from '@/types/phases';
import styles from './BossDebugPanel.module.css';

interface BossDebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBoss: (boss: Chef | null) => void;
  currentBoss?: Chef;
}

export function BossDebugPanel({
  isOpen,
  onClose,
  onSelectBoss,
  currentBoss,
}: BossDebugPanelProps) {
  const { t } = useTranslation();
  const [selectedBossId, setSelectedBossId] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleBossSelect = (boss: Chef) => {
    setSelectedBossId(boss.id);
    onSelectBoss(boss);
  };

  const handleRemoveBoss = () => {
    // Pass null to remove boss
    onSelectBoss(null);
    setSelectedBossId(null);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t('debug.title')}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.description}>{t('debug.selectBoss')}</p>

          <div className={styles.bossList}>
            {CHEFS.map((boss) => (
              <button
                key={boss.id}
                className={`${styles.bossCard} ${currentBoss?.id === boss.id ? styles.active : ''} ${selectedBossId === boss.id ? styles.selected : ''}`}
                onClick={() => handleBossSelect(boss)}
                style={
                  {
                    '--boss-color': boss.visual.color,
                  } as React.CSSProperties
                }
              >
                <div className={styles.bossIcon}>{boss.visual.icon}</div>
                <div className={styles.bossInfo}>
                  <div className={styles.bossName}>{t(`bosses.${boss.id}.name`)}</div>
                  <div className={styles.bossDescription}>{t(`bosses.${boss.id}.description`)}</div>
                  <div className={styles.bossDetails}>
                    <span className={styles.bossPhase}>{t('debug.phase')} {boss.phase}</span>
                    <span className={styles.bossBehavior}>• {t(`bossBehaviors.${boss.behavior ?? 'random'}`)}</span>
                    <span className={styles.bossLength}>• {t('debug.size')}: {boss.initialLength ?? 3}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {currentBoss && (
            <div className={styles.currentBoss}>
              <div className={styles.currentBossLabel}>{t('debug.activeBoss')}</div>
              <div className={styles.currentBossName}>
                {currentBoss.visual.icon} {t(`bosses.${currentBoss.id}.name`)}
              </div>
              <button className={styles.removeButton} onClick={handleRemoveBoss}>
                {t('debug.removeBoss')}
              </button>
            </div>
          )}

          <div className={styles.footer}>
            <p className={styles.hint} dangerouslySetInnerHTML={{ __html: t('debug.hint') }} />
          </div>
        </div>
      </div>
    </div>
  );
}
