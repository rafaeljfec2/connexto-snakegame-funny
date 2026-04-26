import { ActivePowerUp, FoodType } from '@/types/game';
import { useTranslation } from 'react-i18next';
import { getActivePowerUps } from '@/utils/powerUps';
import { memo, useEffect, useState, useRef, useCallback } from 'react';
import { COMBO_CONFIG } from '@/constants/game';
import { useGameStateSlice } from '@/state/gameStateStore';
import { PowerUpToast } from './PowerUpToast';
import styles from './MobileFloatingInfo.module.css';

interface Toast {
  id: string;
  type: FoodType;
  name: string;
  icon: string;
  duration: number;
  startTime: number;
}

function powerUpsEqual(a: readonly ActivePowerUp[], b: readonly ActivePowerUp[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const aa = a[i];
    const bb = b[i];
    if (!aa || !bb) return false;
    if (aa.type !== bb.type || aa.startTime !== bb.startTime || aa.duration !== bb.duration) {
      return false;
    }
  }
  return true;
}

function MobileFloatingInfoComponent() {
  const { t } = useTranslation();
  const activePowerUps = useGameStateSlice((s) => s.activePowerUps, powerUpsEqual);
  const comboCount = useGameStateSlice((s) => s.combo.count);
  const comboMultiplier = useGameStateSlice((s) => s.combo.multiplier);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const previousPowerUpsRef = useRef<ActivePowerUp[]>([]);

  const getPowerUpInfo = useCallback(
    (type: FoodType) => {
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
    },
    [t],
  );

  useEffect(() => {
    const currentPowerUps = getActivePowerUps(activePowerUps);
    const previousPowerUps = previousPowerUpsRef.current;

    const previousPowerUpMap = new Map<string, ActivePowerUp>();
    previousPowerUps.forEach((powerUp) => {
      const key = `${powerUp.type}-${powerUp.startTime}`;
      previousPowerUpMap.set(key, powerUp);
    });

    const newPowerUps = currentPowerUps.filter((current) => {
      const key = `${current.type}-${current.startTime}`;
      return !previousPowerUpMap.has(key);
    });

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

    const activePowerUpIds = new Set(
      currentPowerUps.map((powerUp) => `${powerUp.type}-${powerUp.startTime}`),
    );
    setToasts((prev) => prev.filter((toast) => activePowerUpIds.has(toast.id)));

    previousPowerUpsRef.current = currentPowerUps;
  }, [activePowerUps, getPowerUpInfo]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <div className={styles.mobileFloatingInfo}>
      <div className={styles.toastContainer}>
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

      {comboCount >= COMBO_CONFIG.minCombo && (
        <div className={`${styles.mobileOverlay} ${styles.statsOverlay}`}>
          <div className={styles.floatingCard}>
            <div className={styles.compactCombo}>
              <span className={styles.compactComboLabel}>{t('panels.combo')}</span>
              <span className={styles.compactComboValue}>x{comboMultiplier}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const MobileFloatingInfo = memo(MobileFloatingInfoComponent);
MobileFloatingInfo.displayName = 'MobileFloatingInfo';
