import type { GameState, Direction, FoodType, PoisonShot, ActivePowerUp } from '@/types/game';

/**
 * Context for game update logic
 */
export interface UpdateContext {
  readonly gameState: GameState;
  readonly directionQueue: Direction[];
  readonly bossAbilityCooldowns: Map<string, number>;
  readonly pendingPoisonShots: PoisonShot[];
  readonly lastObstacleSpawnTime: number;
  readonly forcedFoodType: FoodType | null;
  readonly lastPoisonFireTime: number;
  readonly skipOptionalEffects: boolean;
  readonly framesSkipped: number;
  readonly activePowerUps?: ActivePowerUp[];
  readonly currentTime?: number;
}

/**
 * Result of game update logic
 */
export interface UpdateResult {
  newGameState: GameState | null;
  newBossAbilityCooldowns: Map<string, number>;
  newForcedFoodType: FoodType | null;
  newPendingPoisonShots: PoisonShot[];
  newLastObstacleSpawnTime: number;
  isRenderDirty: boolean;
}

/**
 * Create an early return result (collision, no head position, etc.)
 */
export function createEarlyReturnResult(
  gameState: GameState | null,
  context: UpdateContext,
  isRenderDirty: boolean,
): UpdateResult {
  return {
    newGameState: gameState,
    newBossAbilityCooldowns: context.bossAbilityCooldowns,
    newForcedFoodType: context.forcedFoodType,
    newPendingPoisonShots: [],
    newLastObstacleSpawnTime: context.lastObstacleSpawnTime,
    isRenderDirty,
  };
}
