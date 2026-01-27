import { GameState, FoodType, Position, Portal, ActivePowerUp } from '@/types/game';
import type { GameStatisticsTracking } from '@/types/statistics';
import { applyPowerUpEffect, createActivePowerUp } from '@/utils/powerUps';
import { updateCombo } from '@/utils/combos';
import { addLife } from '@/utils/lives';
import { POWER_UP_CONFIG } from '@/constants/powerUps';

// --- Types ---
export interface FoodInteractionResult {
  newScore: number;
  newCombo: { count: number; multiplier: number; lastFoodTime: number };
  newLives: number;
  finalSnake: Position[];
  newActivePowerUps: ActivePowerUp[];
  statistics: GameStatisticsTracking;
  atePowerUp: boolean;
  particlesToSpawn: Array<{ position: Position; color: string; count: number }>;
  newPortals: Portal[];
}

// --- Helper Functions ---

/**
 * Update food statistics
 */
function updateFoodStatistics(statistics: GameStatisticsTracking, foodType: FoodType): void {
  const currentFoodCount = statistics.foodsByType[foodType] ?? 0;
  statistics.foodsEaten++;
  statistics.foodsByType[foodType] = currentFoodCount + 1;
}

/**
 * Resolve actual food type (handles JOKER)
 */
function resolveActualFoodType(foodType: FoodType): FoodType {
  if (foodType !== FoodType.JOKER) {
    return foodType;
  }

  const positiveTypes = [
    FoodType.SPEED_BOOST,
    FoodType.BONUS_POINTS,
    FoodType.EXTRA_GROWTH,
    FoodType.PHASE_THROUGH,
  ];
  return positiveTypes[Math.floor(Math.random() * positiveTypes.length)] ?? FoodType.BONUS_POINTS;
}

/**
 * Apply food growth or shrink to snake
 */
function applySnakeGrowth(snake: Position[], growthAmount: number): Position[] {
  if (growthAmount > 0) {
    const currentTail = snake[snake.length - 1];
    const newSnake = [...snake];
    for (let i = 0; i < growthAmount; i++) {
      newSnake.push({ ...currentTail });
    }
    return newSnake;
  }

  if (growthAmount < 0) {
    const shrinkAmount = Math.abs(growthAmount);
    return snake.slice(0, Math.max(1, snake.length - shrinkAmount));
  }

  return snake;
}

/**
 * Process food consumption effects
 */
function processFoodConsumption(
  prevGameState: GameState,
  actualFoodType: FoodType,
  currentSnake: Position[],
  statistics: GameStatisticsTracking,
  enableCombos: boolean,
  enableParticles: boolean,
  particlesToSpawn: Array<{ position: Position; color: string; count: number }>,
): {
  newScore: number;
  newLives: number;
  newCombo: { count: number; multiplier: number; lastFoodTime: number };
  finalSnake: Position[];
  atePowerUp: boolean;
  powerUpEffect: ReturnType<typeof applyPowerUpEffect>;
} {
  const powerUpEffect = applyPowerUpEffect(
    actualFoodType,
    prevGameState.score,
    currentSnake.length,
  );

  if (prevGameState.food.type === FoodType.JOKER) {
    powerUpEffect.scoreIncrease += 15;
  }

  const atePowerUp = prevGameState.food.type !== FoodType.NORMAL;
  const newScore = prevGameState.score + powerUpEffect.scoreIncrease;

  let newCombo = prevGameState.combo;
  if (enableCombos) {
    newCombo = updateCombo(newCombo, true);
  }

  if (enableParticles && prevGameState.snake[0]) {
    const foodColor = POWER_UP_CONFIG.colors[prevGameState.food.type]?.primary || '#ef4444';
    particlesToSpawn.push({ position: prevGameState.snake[0], color: foodColor, count: 8 });
  }

  const finalSnake = applySnakeGrowth(currentSnake, powerUpEffect.growthAmount);

  if (newCombo.multiplier > statistics.maxCombo) {
    statistics.maxCombo = newCombo.multiplier;
  }

  let newLives = prevGameState.lives;
  if (prevGameState.food.type === FoodType.EXTRA_LIFE) {
    newLives = addLife(newLives);
  }

  return {
    newScore,
    newLives,
    newCombo,
    finalSnake,
    atePowerUp,
    powerUpEffect,
  };
}

/**
 * Handles interactions between the snake and food (scoring, growth, effects).
 */
export function handleFoodInteraction(
  ateFood: boolean,
  prevGameState: GameState,
  finalSnake: Position[],
  statistics: GameStatisticsTracking,
  _gridSize: number,
  enableCombos: boolean,
  enableParticles: boolean,
): FoodInteractionResult {
  let newScore = prevGameState.score;
  let newLives = prevGameState.lives;
  let newCombo = prevGameState.combo;
  let currentSnake = [...finalSnake];
  const newActivePowerUps = [...prevGameState.activePowerUps];
  let atePowerUp = false;
  const particlesToSpawn: Array<{ position: Position; color: string; count: number }> = [];
  const newPortals: Portal[] = [];

  if (!ateFood) {
    if (enableCombos) {
      newCombo = updateCombo(newCombo, false);
    }
    return {
      newScore,
      newCombo,
      newLives,
      finalSnake: currentSnake,
      newActivePowerUps,
      statistics,
      atePowerUp,
      particlesToSpawn,
      newPortals,
    };
  }

  updateFoodStatistics(statistics, prevGameState.food.type);

  const actualFoodType = resolveActualFoodType(prevGameState.food.type);

  const consumptionResult = processFoodConsumption(
    prevGameState,
    actualFoodType,
    currentSnake,
    statistics,
    enableCombos,
    enableParticles,
    particlesToSpawn,
  );

  newScore = consumptionResult.newScore;
  newLives = consumptionResult.newLives;
  newCombo = consumptionResult.newCombo;
  currentSnake = consumptionResult.finalSnake;
  atePowerUp = consumptionResult.atePowerUp;

  if (consumptionResult.powerUpEffect.shouldActivatePowerUp) {
    newActivePowerUps.push(createActivePowerUp(actualFoodType));
  }

  return {
    newScore,
    newCombo,
    newLives,
    finalSnake: currentSnake,
    newActivePowerUps,
    statistics,
    atePowerUp,
    particlesToSpawn,
    newPortals,
  };
}
