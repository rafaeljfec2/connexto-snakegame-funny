import { useEffect, useState } from "react";
import { ActivePowerUp, FoodType } from "@/types/game";
import { POWER_UP_CONFIG } from "@/constants/powerUps";
import { getActivePowerUps } from "@/utils/powerUps";
import styles from "./ActivePowerUps.module.css";

interface ActivePowerUpsProps {
  powerUps: ActivePowerUp[];
}

export function ActivePowerUps({ powerUps }: ActivePowerUpsProps) {
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

  if (activePowerUps.length === 0) {
    return null;
  }

  const getPowerUpName = (type: FoodType): string => {
    switch (type) {
      case FoodType.SPEED_BOOST:
        return "Speed Boost";
      case FoodType.BONUS_POINTS:
        return "Bonus Points";
      case FoodType.EXTRA_GROWTH:
        return "Extra Growth";
      default:
        return type;
    }
  };

  const getRemainingTime = (powerUp: ActivePowerUp): number => {
    const elapsed = currentTime - powerUp.startTime;
    const remaining = powerUp.duration - elapsed;
    return Math.max(0, Math.ceil(remaining / 1000));
  };

  return (
    <div className={styles.container}>
      {activePowerUps.map((powerUp, index) => {
        const colors = POWER_UP_CONFIG.colors[powerUp.type];
        const remainingTime = getRemainingTime(powerUp);
        const progress = Math.max(
          0,
          Math.min(1, (currentTime - powerUp.startTime) / powerUp.duration)
        );

        return (
          <div
            key={`${powerUp.type}-${powerUp.startTime}-${index}`}
            className={styles.powerUp}
            style={{
              "--powerup-primary": colors.primary,
              "--powerup-secondary": colors.secondary,
            } as React.CSSProperties}
          >
            <div className={styles.icon}>⚡</div>
            <div className={styles.info}>
              <div className={styles.name}>{getPowerUpName(powerUp.type)}</div>
              {remainingTime > 0 && (
                <div className={styles.timer}>{remainingTime}s</div>
              )}
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${(1 - progress) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
