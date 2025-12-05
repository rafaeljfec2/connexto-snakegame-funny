import { ActivePowerUp, ComboState, FoodType } from '@/types/game';
import { getActivePowerUps } from '@/utils/powerUps';
import { useEffect, useState, useRef } from 'react';
import { getCurrentPhase } from '@/utils/phases';
import { COMBO_CONFIG } from '@/constants/game';
import { PowerUpToast } from './PowerUpToast';
import styles from './MobileFloatingInfo.module.css';

interface MobileFloatingInfoProps {
  activePowerUps: ActivePowerUp[];
  combo: ComboState;
  snakeLength: number;
  lives: number;
  level: number;
}

interface Toast {
  id: string;
  type: FoodType;
  name: string;
  icon: string;
  duration: number;
}

export function MobileFloatingInfo({
  activePowerUps,
  combo,
  snakeLength,
  lives,
  level,
}: MobileFloatingInfoProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const previousPowerUpsRef = useRef<ActivePowerUp[]>([]);
  const phase = getCurrentPhase(level);

  // Get power-up info
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

  // Detect new power-ups and show toasts
  useEffect(() => {
    const currentPowerUps = getActivePowerUps(activePowerUps);
    const previousPowerUps = previousPowerUpsRef.current;

    // Create a map of previous power-ups by their unique identifier
    const previousPowerUpMap = new Map<string, ActivePowerUp>();
    previousPowerUps.forEach((powerUp) => {
      const key = `${powerUp.type}-${powerUp.startTime}`;
      previousPowerUpMap.set(key, powerUp);
    });

    // Find newly activated power-ups (those not in previous list)
    const newPowerUps = currentPowerUps.filter((current) => {
      const key = `${current.type}-${current.startTime}`;
      return !previousPowerUpMap.has(key);
    });

    // Create toasts for new power-ups
    if (newPowerUps.length > 0) {
      const newToasts: Toast[] = newPowerUps
        .filter((powerUp) => powerUp.type !== FoodType.NORMAL)
        .map((powerUp) => {
          const info = getPowerUpInfo(powerUp.type);
          return {
            id: `${powerUp.type}-${powerUp.startTime}`,
            type: powerUp.type,
            name: info.name,
            icon: info.icon,
            duration: powerUp.duration,
          };
        });

      setToasts((prev) => [...prev, ...newToasts]);
    }

    previousPowerUpsRef.current = currentPowerUps;
  }, [activePowerUps]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <div className={styles.mobileFloatingInfo}>
      {/* Power-Up Toasts */}
      <div className={styles.toastContainer}>
        {toasts.map((toast) => (
          <PowerUpToast
            key={toast.id}
            type={toast.type}
            name={toast.name}
            icon={toast.icon}
            duration={toast.duration}
            onComplete={() => removeToast(toast.id)}
          />
        ))}
      </div>

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
