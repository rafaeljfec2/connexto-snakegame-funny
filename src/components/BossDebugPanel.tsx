import { useState } from 'react';
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
          <h2 className={styles.title}>🐛 Boss Debug Mode</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.description}>Selecione um boss para testar:</p>

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
                  <div className={styles.bossName}>{boss.name}</div>
                  <div className={styles.bossDescription}>{boss.description}</div>
                  <div className={styles.bossDetails}>
                    <span className={styles.bossPhase}>Fase {boss.phase}</span>
                    <span className={styles.bossBehavior}>• {boss.behavior}</span>
                    <span className={styles.bossLength}>• Tamanho: {boss.initialLength ?? 3}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {currentBoss && (
            <div className={styles.currentBoss}>
              <div className={styles.currentBossLabel}>Boss Ativo:</div>
              <div className={styles.currentBossName}>
                {currentBoss.visual.icon} {currentBoss.name}
              </div>
              <button className={styles.removeButton} onClick={handleRemoveBoss}>
                Remover Boss
              </button>
            </div>
          )}

          <div className={styles.footer}>
            <p className={styles.hint}>
              Pressione <kbd>F1</kbd> ou <kbd>Ctrl+D</kbd> para abrir/fechar este painel
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
