import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivePowerUp, FoodType } from '@/types/game';
import { POWER_UP_CONFIG } from '@/constants/powerUps';
import { getActivePowerUps } from '@/utils/powerUps';
import styles from './ActivePowerUps.module.css';

interface ActivePowerUpsProps {
  powerUps: ActivePowerUp[];
}

export function ActivePowerUps({ powerUps }: ActivePowerUpsProps) {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(Date.now());
  const activePowerUps = getActivePowerUps(powerUps);

  useEffect(() => {
    if (activePowerUps.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 100);

    return () => clearInterval(interval);
  }, [activePowerUps.length]);

  const getAllPowerUps = (): Array<{
    type: FoodType;
    name: string;
    description: string;
    icon: string;
    isPositive: boolean;
  }> => {
    return [
      {
        type: FoodType.SPEED_BOOST,
        name: t('powerUps.speedBoost'),
        description: t('powerUpDescriptions.speedBoost'),
        icon: '⚡',
        isPositive: true,
      },
      {
        type: FoodType.BONUS_POINTS,
        name: t('powerUps.bonusPoints'),
        description: t('powerUpDescriptions.bonusPoints'),
        icon: '💰',
        isPositive: true,
      },
      {
        type: FoodType.EXTRA_GROWTH,
        name: t('powerUps.extraGrowth'),
        description: t('powerUpDescriptions.extraGrowth'),
        icon: '📈',
        isPositive: true,
      },
      {
        type: FoodType.PHASE_THROUGH,
        name: t('powerUps.phaseThrough'),
        description: t('powerUpDescriptions.phaseThrough'),
        icon: '👻',
        isPositive: true,
      },
      {
        type: FoodType.JOKER,
        name: t('powerUps.joker'),
        description: t('powerUpDescriptions.joker'),
        icon: '🎴',
        isPositive: true,
      },
      {
        type: FoodType.EXTRA_LIFE,
        name: t('powerUps.extraLife'),
        description: t('powerUpDescriptions.extraLife'),
        icon: '❤️',
        isPositive: true,
      },
      {
        type: FoodType.POISON,
        name: t('powerUps.poison'),
        description: t('powerUpDescriptions.poison'),
        icon: '☠️',
        isPositive: false,
      },
      {
        type: FoodType.REVERSE_CONTROLS,
        name: t('powerUps.reverseControls'),
        description: t('powerUpDescriptions.reverseControls'),
        icon: '🔄',
        isPositive: false,
      },
      {
        type: FoodType.SLOW_DOWN,
        name: t('powerUps.slowDown'),
        description: t('powerUpDescriptions.slowDown'),
        icon: '🐌',
        isPositive: false,
      },
    ];
  };

  const getPowerUpName = (type: FoodType): string => {
    const powerUpKeyMap: Record<FoodType, string> = {
      [FoodType.NORMAL]: t('powerUps.normal'),
      [FoodType.SPEED_BOOST]: t('powerUps.speedBoost'),
      [FoodType.BONUS_POINTS]: t('powerUps.bonusPoints'),
      [FoodType.EXTRA_GROWTH]: t('powerUps.extraGrowth'),
      [FoodType.PHASE_THROUGH]: t('powerUps.phaseThrough'),
      [FoodType.REVERSE_CONTROLS]: t('powerUps.reverseControls'),
      [FoodType.SLOW_DOWN]: t('powerUps.slowDown'),
      [FoodType.JOKER]: t('powerUps.joker'),
      [FoodType.EXTRA_LIFE]: t('powerUps.extraLife'),
      [FoodType.PORTAL]: t('powerUps.portal'),
      [FoodType.POISON]: t('powerUps.poison'),
    };
    return powerUpKeyMap[type] ?? type;
  };

  const getRemainingTime = (powerUp: ActivePowerUp): number => {
    const elapsed = currentTime - powerUp.startTime;
    const remaining = powerUp.duration - elapsed;
    return Math.max(0, Math.ceil(remaining / 1000));
  };

  if (activePowerUps.length === 0) {
    const allPowerUps = getAllPowerUps();

    return (
      <div className={styles.container}>
        <div className={styles.powerUpsList}>
          {allPowerUps.map((powerUp) => {
            const colors = POWER_UP_CONFIG.colors[powerUp.type];
            const powerUpTypeClass = powerUp.type.toLowerCase().replace(/_/g, '-');
            return (
              <div
                key={powerUp.type}
                className={`${styles.powerUpItem} ${!powerUp.isPositive ? styles.negative : ''} ${styles[powerUpTypeClass] ?? ''}`}
                style={
                  {
                    '--powerup-primary': colors.primary,
                    '--powerup-secondary': colors.secondary,
                  } as React.CSSProperties
                }
              >
                <div className={styles.itemIcon}>{powerUp.icon}</div>
                <div className={styles.itemInfo}>
                  <div className={styles.itemName}>{powerUp.name}</div>
                  <div className={styles.itemDescription}>{powerUp.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {activePowerUps.map((powerUp, index) => {
        const colors = POWER_UP_CONFIG.colors[powerUp.type];
        const remainingTime = getRemainingTime(powerUp);
        const progress = Math.max(
          0,
          Math.min(1, (currentTime - powerUp.startTime) / powerUp.duration),
        );

        return (
          <div
            key={`${powerUp.type}-${powerUp.startTime}-${index}`}
            className={styles.powerUp}
            style={
              {
                '--powerup-primary': colors.primary,
                '--powerup-secondary': colors.secondary,
              } as React.CSSProperties
            }
          >
            <div className={styles.info}>
              <div className={styles.icon}>⚡</div>
              <div className={styles.nameContainer}>
                <div className={styles.name}>{getPowerUpName(powerUp.type)}</div>
                {remainingTime > 0 && <div className={styles.timer}>{remainingTime}s</div>}
              </div>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${(1 - progress) * 100}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
