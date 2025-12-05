import { ActivePowerUp, ComboState } from '@/types/game';
import { getActivePowerUps } from '@/utils/powerUps';
import { POWER_UP_CONFIG } from '@/constants/powerUps';
import { useEffect, useState } from 'react';
import { getPhaseByLevel } from '@/utils/phases';
import { COMBO_CONFIG } from '@/constants/game';
import styles from './MobileFloatingInfo.module.css';

interface MobileFloatingInfoProps {
  activePowerUps: ActivePowerUp[];
  combo: ComboState;
  snakeLength: number;
  lives: number;
  level: number;
}

export function MobileFloatingInfo({
  activePowerUps,
  combo,
  snakeLength,
  lives,
  level,
}: MobileFloatingInfoProps) {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const activePowerUpsList = getActivePowerUps(activePowerUps);
  const phase = getPhaseByLevel(level);

  useEffect(() => {
    if (activePowerUpsList.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 100);

    return () => clearInterval(interval);
  }, [activePowerUpsList.length]);

  return (
    <div className={styles.mobileFloatingInfo}>
      {/* Top Left - Active Power-Ups */}
      {activePowerUpsList.length > 0 && (
        <div className={`${styles.mobileOverlay} ${styles.powerUpsOverlay}`}>
          <div className={styles.floatingCard}>
            <h4 className={styles.floatingCardTitle}>Power-Ups</h4>
            <div>
              {activePowerUpsList.map((powerUp) => {
                const config = POWER_UP_CONFIG[powerUp.type];
                if (!config) return null;

                const remaining = Math.max(0, powerUp.expiresAt - currentTime);
                const seconds = Math.ceil(remaining / 1000);

                return (
                  <div key={powerUp.type} className={styles.compactPowerUp}>
                    <span className={styles.compactPowerUpIcon}>{config.icon}</span>
                    <span className={styles.compactPowerUpName}>{config.name}</span>
                    <span className={styles.compactPowerUpTimer}>{seconds}s</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Top Right - Stats & Combo */}
      <div className={`${styles.mobileOverlay} ${styles.statsOverlay}`}>
        {/* Combo */}
        {combo.count >= COMBO_CONFIG.minCombo && (
          <div className={styles.floatingCard}>
            <div className={styles.compactCombo}>
              <span className={styles.compactComboLabel}>Combo</span>
              <span className={styles.compactComboValue}>x{combo.multiplier}</span>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className={styles.floatingCard}>
          <div className={styles.compactStatItem}>
            <span className={styles.compactStatLabel}>Length</span>
            <span className={styles.compactStatValue}>{snakeLength}</span>
          </div>
          {lives > 0 && (
            <div className={styles.compactStatItem}>
              <span className={styles.compactStatLabel}>Lives</span>
              <span className={styles.compactStatValue}>{lives}</span>
            </div>
          )}
          {phase && (
            <div className={styles.compactStatItem}>
              <span className={styles.compactStatLabel}>Phase</span>
              <span className={styles.compactStatValue}>{phase.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
