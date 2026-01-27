import { FoodType, ActivePowerUp } from '@/types/game';
import { POWER_UP_CONFIG } from '@/constants/powerUps';

interface PowerUpResult {
  scoreIncrease: number;
  growthAmount: number;
  shouldActivatePowerUp: boolean;
}

const DEFAULT_RESULT: PowerUpResult = {
  scoreIncrease: 5,
  growthAmount: 1,
  shouldActivatePowerUp: false,
};

/**
 * Get bonus points effect
 */
function getBonusPointsEffect(): PowerUpResult {
  const effect = POWER_UP_CONFIG.effects[FoodType.BONUS_POINTS];
  return {
    scoreIncrease: 'points' in effect ? (effect.points ?? 0) : 0,
    growthAmount: 1,
    shouldActivatePowerUp: false,
  };
}

/**
 * Get extra growth effect
 */
function getExtraGrowthEffect(): PowerUpResult {
  const effect = POWER_UP_CONFIG.effects[FoodType.EXTRA_GROWTH];
  return {
    scoreIncrease: 10,
    growthAmount: 'growth' in effect ? (effect.growth ?? 2) : 2,
    shouldActivatePowerUp: false,
  };
}

/**
 * Get poison effect based on snake length
 */
function getPoisonEffect(currentSnakeLength: number): PowerUpResult {
  const effect = POWER_UP_CONFIG.effects[FoodType.POISON];
  const shrinkAmount = 'shrinkAmount' in effect ? (effect.shrinkAmount ?? 2) : 2;
  const points = 'points' in effect ? (effect.points ?? -5) : -5;
  return {
    scoreIncrease: points,
    growthAmount: -Math.min(shrinkAmount, currentSnakeLength - 1),
    shouldActivatePowerUp: false,
  };
}

/**
 * Static power-up effects map
 */
const STATIC_EFFECTS: Partial<Record<FoodType, PowerUpResult>> = {
  [FoodType.NORMAL]: { scoreIncrease: 10, growthAmount: 1, shouldActivatePowerUp: false },
  [FoodType.SPEED_BOOST]: { scoreIncrease: 10, growthAmount: 1, shouldActivatePowerUp: true },
  [FoodType.PHASE_THROUGH]: { scoreIncrease: 10, growthAmount: 1, shouldActivatePowerUp: true },
  [FoodType.REVERSE_CONTROLS]: { scoreIncrease: 0, growthAmount: 0, shouldActivatePowerUp: true },
  [FoodType.SLOW_DOWN]: { scoreIncrease: 0, growthAmount: 0, shouldActivatePowerUp: true },
  [FoodType.JOKER]: { scoreIncrease: 15, growthAmount: 1, shouldActivatePowerUp: false },
  [FoodType.EXTRA_LIFE]: { scoreIncrease: 20, growthAmount: 1, shouldActivatePowerUp: false },
  [FoodType.PORTAL]: { scoreIncrease: 15, growthAmount: 1, shouldActivatePowerUp: false },
};

/**
 * Dynamic effect handlers that need context
 */
const DYNAMIC_EFFECTS: Partial<Record<FoodType, (snakeLength: number) => PowerUpResult>> = {
  [FoodType.BONUS_POINTS]: getBonusPointsEffect,
  [FoodType.EXTRA_GROWTH]: getExtraGrowthEffect,
  [FoodType.POISON]: getPoisonEffect,
};

export function applyPowerUpEffect(
  foodType: FoodType,
  _currentScore: number,
  currentSnakeLength: number,
): PowerUpResult {
  const staticEffect = STATIC_EFFECTS[foodType];
  if (staticEffect) return staticEffect;

  const dynamicHandler = DYNAMIC_EFFECTS[foodType];
  if (dynamicHandler) return dynamicHandler(currentSnakeLength);

  return DEFAULT_RESULT;
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
