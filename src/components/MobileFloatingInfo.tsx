import { ActivePowerUp, ComboState, FoodType } from '@/types/game';
import { getActivePowerUps } from '@/utils/powerUps';
import { useEffect, useState } from 'react';
import { getCurrentPhase } from '@/utils/phases';
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
  const phase = getCurrentPhase(level);

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
                // Skip NORMAL food type - it's not a power-up
                if (powerUp.type === FoodType.NORMAL) return null;

                const elapsed = currentTime - powerUp.startTime;
                const remaining = Math.max(0, powerUp.duration - elapsed);
                const seconds = Math.ceil(remaining / 1000);

                // Get power-up name and icon
                const getPowerUpInfo = (type: FoodType) => {
                  switch (type) {
                    case FoodType.SPEED_BOOST:
                      return { name: 'Speed Boost', icon: '⚡' };
                    case FoodType.BONUS_POINTS:
                      return { name: 'Bonus Points', icon: '💰' };
                    case FoodType.EXTRA_GROWTH:
                      return { name: 'Extra Growth', icon: '📈' };
                    case FoodType.PHASE_THROUGH:
                      return { name: 'Phase Through', icon: '👻' };
                    case FoodType.JOKER:
                      return { name: 'Joker', icon: '🎴' };
                    case FoodType.EXTRA_LIFE:
                      return { name: 'Extra Life', icon: '❤️' };
                    case FoodType.POISON:
                      return { name: 'Poison', icon: '☠️' };
                    case FoodType.REVERSE_CONTROLS:
                      return { name: 'Reverse', icon: '🔄' };
                    case FoodType.SLOW_DOWN:
                      return { name: 'Slow Down', icon: '🐌' };
                    default:
                      return { name: 'Power-Up', icon: '✨' };
                  }
                };

                const powerUpInfo = getPowerUpInfo(powerUp.type);

                return (
                  <div key={powerUp.type} className={styles.compactPowerUp}>
                    <span className={styles.compactPowerUpIcon}>{powerUpInfo.icon}</span>
                    <span className={styles.compactPowerUpName}>{powerUpInfo.name}</span>
                    {seconds > 0 && <span className={styles.compactPowerUpTimer}>{seconds}s</span>}
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
