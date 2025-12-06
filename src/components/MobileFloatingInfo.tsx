import { ActivePowerUp, ComboState, FoodType } from '@/types/game';
import { useTranslation } from 'react-i18next';
import { getActivePowerUps } from '@/utils/powerUps';
import { useEffect, useState, useRef } from 'react';
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
  startTime: number;
}

export function MobileFloatingInfo({
  activePowerUps,
  combo,
  snakeLength: _snakeLength,
  lives: _lives,
  level: _level,
}: MobileFloatingInfoProps) {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const previousPowerUpsRef = useRef<ActivePowerUp[]>([]);
  const [headerHeight, setHeaderHeight] = useState(65); // Default height
  const toastContainerRef = useRef<HTMLDivElement>(null);

  // Get power-up info
  const getPowerUpInfo = (type: FoodType) => {
    const powerUpInfoMap: Record<FoodType, { name: string; icon: string }> = {
      [FoodType.NORMAL]: { name: t('powerUps.normal'), icon: '🍎' },
      [FoodType.SPEED_BOOST]: { name: t('powerUps.speedBoost'), icon: '⚡' },
      [FoodType.BONUS_POINTS]: { name: t('powerUps.bonusPoints'), icon: '💰' },
      [FoodType.EXTRA_GROWTH]: { name: t('powerUps.extraGrowth'), icon: '📈' },
      [FoodType.PHASE_THROUGH]: { name: t('powerUps.phaseThrough'), icon: '👻' },
      [FoodType.JOKER]: { name: t('powerUps.joker'), icon: '🎴' },
      [FoodType.EXTRA_LIFE]: { name: t('powerUps.extraLife'), icon: '❤️' },
      [FoodType.PORTAL]: { name: t('powerUps.portal'), icon: '🌀' },
      [FoodType.POISON]: { name: t('powerUps.poison'), icon: '☠️' },
      [FoodType.REVERSE_CONTROLS]: { name: t('powerUps.reverseControls'), icon: '🔄' },
      [FoodType.SLOW_DOWN]: { name: t('powerUps.slowDown'), icon: '🐌' },
    };
    return powerUpInfoMap[type] ?? { name: t('powerUps.normal'), icon: '✨' };
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
            startTime: powerUp.startTime,
          };
        });

      setToasts((prev) => [...prev, ...newToasts]);
    }

    // Remove toasts for expired power-ups
    const activePowerUpIds = new Set(
      currentPowerUps.map((powerUp) => `${powerUp.type}-${powerUp.startTime}`),
    );
    setToasts((prev) => prev.filter((toast) => activePowerUpIds.has(toast.id)));

    previousPowerUpsRef.current = currentPowerUps;
  }, [activePowerUps]);

  // Calculate header height dynamically
  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.querySelector('header') as HTMLElement | null;
      if (header) {
        const height = header.offsetHeight;
        setHeaderHeight(height + 8); // Add 8px padding
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    window.addEventListener('orientationchange', updateHeaderHeight);

    // Also update after a short delay to ensure header is rendered
    const timeout = setTimeout(updateHeaderHeight, 100);

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      window.removeEventListener('orientationchange', updateHeaderHeight);
      clearTimeout(timeout);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <div className={styles.mobileFloatingInfo}>
      {/* Power-Up Toasts */}
      <div
        ref={toastContainerRef}
        className={styles.toastContainer}
        style={{ top: `${headerHeight}px` }}
      >
        {toasts.map((toast) => (
          <PowerUpToast
            key={toast.id}
            type={toast.type}
            name={toast.name}
            icon={toast.icon}
            duration={toast.duration}
            startTime={toast.startTime}
            onComplete={() => removeToast(toast.id)}
          />
        ))}
      </div>

      {/* Top Right - Combo Only */}
      {combo.count >= COMBO_CONFIG.minCombo && (
        <div className={`${styles.mobileOverlay} ${styles.statsOverlay}`}>
          <div className={styles.floatingCard}>
            <div className={styles.compactCombo}>
              <span className={styles.compactComboLabel}>{t('panels.combo')}</span>
              <span className={styles.compactComboValue}>x{combo.multiplier}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
