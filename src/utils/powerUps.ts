import { FoodType, ActivePowerUp } from '@/types/game';
import { POWER_UP_CONFIG } from '@/constants/powerUps';

export function applyPowerUpEffect(
  foodType: FoodType,
  _currentScore: number,
  currentSnakeLength: number,
): {
  scoreIncrease: number;
  growthAmount: number;
  shouldActivatePowerUp: boolean;
} {
  // Handle NORMAL food type first (not in effects)
  if (foodType === FoodType.NORMAL) {
    return {
      scoreIncrease: 5,
      growthAmount: 1,
      shouldActivatePowerUp: false,
    };
  }

  if (foodType === FoodType.BONUS_POINTS) {
    const effect = POWER_UP_CONFIG.effects[FoodType.BONUS_POINTS];
    return {
      scoreIncrease: 'points' in effect ? effect.points ?? 0 : 0,
      growthAmount: 1,
      shouldActivatePowerUp: false,
    };
  }

  if (foodType === FoodType.EXTRA_GROWTH) {
    const effect = POWER_UP_CONFIG.effects[FoodType.EXTRA_GROWTH];
    return {
      scoreIncrease: 10,
      growthAmount: 'growth' in effect ? effect.growth ?? 2 : 2,
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

  if (foodType === FoodType.POISON) {
    const effect = POWER_UP_CONFIG.effects[FoodType.POISON];
    const shrinkAmount = 'shrinkAmount' in effect ? effect.shrinkAmount ?? 2 : 2;
    const points = 'points' in effect ? effect.points ?? -5 : -5;
    return {
      scoreIncrease: points,
      growthAmount: -Math.min(shrinkAmount, currentSnakeLength - 1), // Don't shrink below 1 segment
      shouldActivatePowerUp: false,
    };
  }

  if (foodType === FoodType.PHASE_THROUGH) {
    return {
      scoreIncrease: 10,
      growthAmount: 1,
      shouldActivatePowerUp: true,
    };
  }

  if (foodType === FoodType.REVERSE_CONTROLS || foodType === FoodType.SLOW_DOWN) {
    return {
      scoreIncrease: 0, // No points for negative power-ups
      growthAmount: 0, // No growth for negative power-ups
      shouldActivatePowerUp: true,
    };
  }

  // Joker - randomly choose a positive power-up effect
  if (foodType === FoodType.JOKER) {
    // Return effect that will trigger random selection in game loop
    return {
      scoreIncrease: 15, // Base points for joker
      growthAmount: 1,
      shouldActivatePowerUp: false, // Will be handled specially
    };
  }

  if (foodType === FoodType.EXTRA_LIFE) {
    return {
      scoreIncrease: 20, // Bonus points for extra life
      growthAmount: 1,
      shouldActivatePowerUp: false,
    };
  }

  if (foodType === FoodType.PORTAL) {
    return {
      scoreIncrease: 15, // Points for portal power-up
      growthAmount: 1,
      shouldActivatePowerUp: false, // Portals are created directly, not as active power-up
    };
  }

  // Normal food (fallback)
  return {
    scoreIncrease: 5,
    growthAmount: 1,
    shouldActivatePowerUp: false,
  };
}

export function createActivePowerUp(type: FoodType): ActivePowerUp {
  return {
    type,
    duration: POWER_UP_CONFIG.durations[type as keyof typeof POWER_UP_CONFIG.durations] ?? 0,
    startTime: Date.now(),
  };
}

export function getActivePowerUps(powerUps: ActivePowerUp[]): ActivePowerUp[] {
  const now = Date.now();
  return powerUps.filter((powerUp) => now - powerUp.startTime < powerUp.duration);
}

export function getEffectiveGameSpeed(baseSpeed: number, activePowerUps: ActivePowerUp[]): number {
  let speed = baseSpeed;

  const speedBoost = activePowerUps.find((p) => p.type === FoodType.SPEED_BOOST);

  if (speedBoost !== undefined) {
    const effect = POWER_UP_CONFIG.effects[FoodType.SPEED_BOOST];
    speed = Math.floor(speed * (effect.speedMultiplier ?? 0.6));
  }

  const slowDown = activePowerUps.find((p) => p.type === FoodType.SLOW_DOWN);

  if (slowDown !== undefined) {
    const effect = POWER_UP_CONFIG.effects[FoodType.SLOW_DOWN];
    speed = Math.floor(speed * (effect.speedMultiplier ?? 1.8));
  }

  return speed;
}

export function hasReverseControls(activePowerUps: ActivePowerUp[]): boolean {
  return activePowerUps.some((p) => p.type === FoodType.REVERSE_CONTROLS);
}

export function hasPhaseThrough(activePowerUps: ActivePowerUp[]): boolean {
  return activePowerUps.some((p) => p.type === FoodType.PHASE_THROUGH);
}
