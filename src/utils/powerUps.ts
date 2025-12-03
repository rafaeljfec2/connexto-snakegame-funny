import { FoodType, ActivePowerUp } from "@/types/game";
import { POWER_UP_CONFIG } from "@/constants/powerUps";

export function applyPowerUpEffect(
  foodType: FoodType,
  currentScore: number,
  currentSnakeLength: number
): {
  scoreIncrease: number;
  growthAmount: number;
  shouldActivatePowerUp: boolean;
} {
  const effect = POWER_UP_CONFIG.effects[foodType];
  
  if (foodType === FoodType.BONUS_POINTS) {
    return {
      scoreIncrease: effect.points ?? 0,
      growthAmount: 1,
      shouldActivatePowerUp: false,
    };
  }
  
  if (foodType === FoodType.EXTRA_GROWTH) {
    return {
      scoreIncrease: 10,
      growthAmount: effect.growth ?? 2,
      shouldActivatePowerUp: false,
    };
  }
  
  if (foodType === FoodType.SPEED_BOOST) {
    return {
      scoreIncrease: 10,
      growthAmount: 1,
      shouldActivatePowerUp: true,
    };
  }
  
  // Normal food
  return {
    scoreIncrease: 10,
    growthAmount: 1,
    shouldActivatePowerUp: false,
  };
}

export function createActivePowerUp(type: FoodType): ActivePowerUp {
  return {
    type,
    duration: POWER_UP_CONFIG.durations[type] ?? 0,
    startTime: Date.now(),
  };
}

export function getActivePowerUps(
  powerUps: ActivePowerUp[]
): ActivePowerUp[] {
  const now = Date.now();
  return powerUps.filter(
    (powerUp) => now - powerUp.startTime < powerUp.duration
  );
}

export function getEffectiveGameSpeed(
  baseSpeed: number,
  activePowerUps: ActivePowerUp[]
): number {
  const speedBoost = activePowerUps.find(
    (p) => p.type === FoodType.SPEED_BOOST
  );
  
  if (speedBoost !== undefined) {
    const effect = POWER_UP_CONFIG.effects[FoodType.SPEED_BOOST];
    return Math.floor(baseSpeed * (effect.speedMultiplier ?? 0.6));
  }
  
  return baseSpeed;
}
