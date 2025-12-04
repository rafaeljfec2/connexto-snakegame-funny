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
        name: "Speed Boost",
        description: "Move faster for 5s",
        icon: "⚡",
        isPositive: true,
      },
      {
        type: FoodType.BONUS_POINTS,
        name: "Bonus Points",
        description: "+30 points",
        icon: "💰",
        isPositive: true,
      },
      {
        type: FoodType.EXTRA_GROWTH,
        name: "Extra Growth",
        description: "Grow by 2 segments",
        icon: "📈",
        isPositive: true,
      },
            {
              type: FoodType.PHASE_THROUGH,
              name: "Phase Through",
              description: "Pass obstacles for 6s",
              icon: "👻",
              isPositive: true,
            },
            {
              type: FoodType.JOKER,
              name: "Joker",
              description: "Random positive effect",
              icon: "🎴",
              isPositive: true,
            },
            {
              type: FoodType.EXTRA_LIFE,
              name: "Extra Life",
              description: "Add one life",
              icon: "❤️",
              isPositive: true,
            },
      {
        type: FoodType.POISON,
        name: "Poison",
        description: "Lose 2 segments, -5 pts",
        icon: "☠️",
        isPositive: false,
      },
      {
        type: FoodType.REVERSE_CONTROLS,
        name: "Reverse Controls",
        description: "Controls reversed for 4s",
        icon: "🔄",
        isPositive: false,
      },
      {
        type: FoodType.SLOW_DOWN,
        name: "Slow Down",
        description: "Move slower for 3s",
        icon: "🐌",
        isPositive: false,
      },
    ];
  };

  const getPowerUpName = (type: FoodType): string => {
    switch (type) {
      case FoodType.SPEED_BOOST:
        return "Speed Boost";
      case FoodType.BONUS_POINTS:
        return "Bonus Points";
      case FoodType.EXTRA_GROWTH:
        return "Extra Growth";
      case FoodType.PHASE_THROUGH:
        return "Phase Through";
      case FoodType.REVERSE_CONTROLS:
        return "Reverse Controls";
      case FoodType.SLOW_DOWN:
        return "Slow Down";
      case FoodType.JOKER:
        return "Joker";
      case FoodType.EXTRA_LIFE:
        return "Extra Life";
      default:
        return type;
    }
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
            const powerUpTypeClass = powerUp.type.toLowerCase().replace(/_/g, "-");
            return (
              <div
                key={powerUp.type}
                className={`${styles.powerUpItem} ${!powerUp.isPositive ? styles.negative : ""} ${styles[powerUpTypeClass] ?? ""}`}
                style={{
                  "--powerup-primary": colors.primary,
                  "--powerup-secondary": colors.secondary,
                } as React.CSSProperties}
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
            <div className={styles.info}>
              <div className={styles.icon}>⚡</div>
              <div className={styles.nameContainer}>
                <div className={styles.name}>{getPowerUpName(powerUp.type)}</div>
                {remainingTime > 0 && (
                  <div className={styles.timer}>{remainingTime}s</div>
                )}
              </div>
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
