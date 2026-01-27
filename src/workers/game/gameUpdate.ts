/**
 * Game Update - Core game loop logic
 *
 * This module contains the main game update function that processes
 * each frame of the game loop.
 */

import { GAME_CONFIG } from '@/constants/game';
import { moveSnake, hasFoodCollision } from '@/utils/gameLogic';
import { getActivePowerUps, hasPhaseThrough } from '@/utils/powerUps';
import { getActiveObstacles, createObstacleSet } from '@/utils/obstacles';
import { initializeStatistics } from '@/utils/statistics';
import {
  resolveDirection,
  handleBossLogic,
  handleBossCollisionCheck,
  handleFoodInteraction,
} from '../gameHelper';
import { handleGameStateUpdates } from './gameStateUpdates';

// Re-export types
export type { UpdateContext, UpdateResult } from './gameUpdateTypes';
export { createEarlyReturnResult } from './gameUpdateTypes';

// Import helpers
import type { UpdateContext, UpdateResult } from './gameUpdateTypes';
import { createEarlyReturnResult } from './gameUpdateTypes';
import {
  handlePortalTeleport,
  handleCollision,
  handleGuardianFlagCapture,
  handleBossCollision,
  handlePoisonUpdate,
  handleAchievements,
  broadcastParticles,
  buildFinalGameState,
  createBossCollisionResult,
} from './gameUpdateHelpers';

/**
 * Core game update logic
 */
export function updateGameLogic(context: UpdateContext, performanceTime: number): UpdateResult {
  const prev = context.gameState;

  // 1. Resolve Direction
  const activePowerUps = context.activePowerUps ?? getActivePowerUps(prev.activePowerUps);
  const currentTime = context.currentTime ?? performanceTime;
  const nextInput =
    context.directionQueue.length > 0 ? (context.directionQueue.shift() ?? null) : null;
  const currentDirection = resolveDirection(
    prev.direction,
    nextInput,
    activePowerUps,
    prev.snake,
    GAME_CONFIG.gridSize,
  );

  // 2. Move Snake
  const newSnake = moveSnake(prev.snake, currentDirection, GAME_CONFIG.gridSize, false);
  const newHeadPosition = newSnake[0];

  // 3. Handle Portals
  const portalResult = handlePortalTeleport(newHeadPosition, newSnake, prev.portals);
  const finalSnake = portalResult.finalSnake;
  const headPosition = portalResult.headPosition;

  // 4. Check Collisions
  const activeObstacles =
    prev.obstacles.length > 0 ? getActiveObstacles(prev.obstacles) : prev.obstacles;
  const canPhaseThrough = hasPhaseThrough(activePowerUps);
  const obstacleSet =
    activeObstacles.length > 0 ? createObstacleSet(activeObstacles) : new Set<string>();

  const collisionState = handleCollision(
    headPosition,
    finalSnake,
    prev,
    obstacleSet,
    canPhaseThrough,
  );
  if (collisionState) {
    return createEarlyReturnResult(collisionState, context, true);
  }

  if (!headPosition) {
    return createEarlyReturnResult(prev, context, false);
  }

  const statistics = prev.statistics ?? initializeStatistics();

  // 5. Food Interaction
  const ateFood = hasFoodCollision(headPosition, prev.food);
  const foodResult = handleFoodInteraction(
    ateFood,
    prev,
    finalSnake,
    statistics,
    GAME_CONFIG.gridSize,
    GAME_CONFIG.enableCombos,
    GAME_CONFIG.enableParticles,
  );

  broadcastParticles(
    foodResult.particlesToSpawn,
    context.skipOptionalEffects,
    context.framesSkipped,
  );

  // 6. Boss Logic
  const bossLogicResult = handleBossLogic({
    activeBoss: prev.activeBoss,
    bossSnake: prev.bossSnake,
    prevGameState: { ...prev, score: foodResult.newScore },
    finalSnake: foodResult.finalSnake,
    obstacles: prev.obstacles,
    portals: prev.portals,
    bossAbilityCooldowns: context.bossAbilityCooldowns,
    guardianFlag: prev.guardianFlag ?? null,
    guardianFlagSide: prev.guardianFlagSide,
    foodPosition: prev.food.position,
  });

  // Handle Flag Capture
  const flagCapture = handleGuardianFlagCapture(
    headPosition,
    bossLogicResult,
    foodResult,
    prev,
    bossLogicResult.bossAbilityCooldowns,
    bossLogicResult.forcedFoodType ?? context.forcedFoodType,
  );
  foodResult.newScore = flagCapture.newScore;
  foodResult.newLives = flagCapture.newLives;
  const bossAbilityCooldowns = flagCapture.bossAbilityCooldowns;
  const forcedFoodType = flagCapture.forcedFoodType;

  // 7. Boss Collision Check
  const bossCollisionState = handleBossCollision(headPosition, bossLogicResult, prev, foodResult);
  if (bossCollisionState) {
    return createBossCollisionResult(
      bossCollisionState,
      bossAbilityCooldowns,
      forcedFoodType,
      context.lastObstacleSpawnTime,
    );
  }

  const currentBossState = handleBossCollisionCheck(
    headPosition,
    bossLogicResult,
    prev,
  ).collisionResult;

  // 8. Poison Logic
  const poisonUpdate = handlePoisonUpdate(
    context,
    currentBossState,
    headPosition,
    currentDirection,
    currentTime,
  );

  // 9. Game State Updates
  const stateUpdates = handleGameStateUpdates(
    {
      prevGameState: prev,
      activeObstacles: poisonUpdate.poisonResult.newObstacles,
      activePortals: poisonUpdate.newBossState.newPortals,
      activeBoss: poisonUpdate.newBossState.activeBoss,
      lastObstacleSpawnTime: context.lastObstacleSpawnTime,
      ateFood,
      forcedFoodType: poisonUpdate.newForcedFoodType,
      currentTime,
      finalSnake: foodResult.finalSnake,
    },
    poisonUpdate.newBossState.newScore,
  );

  // 10. Achievements
  const updatedAchievements = handleAchievements(
    prev,
    poisonUpdate.newBossState.newScore,
    stateUpdates.newLevel,
    foodResult.finalSnake.length,
    foodResult.newCombo.multiplier,
    foodResult.atePowerUp,
  );

  // 11. Final State Update
  const newGameState = buildFinalGameState({
    prev,
    foodResult,
    stateUpdates,
    poisonUpdate,
    currentDirection,
    updatedAchievements,
  });

  return {
    newGameState,
    newBossAbilityCooldowns: poisonUpdate.newBossAbilityCooldowns,
    newForcedFoodType: poisonUpdate.newForcedFoodType,
    newPendingPoisonShots: [],
    newLastObstacleSpawnTime: stateUpdates.updatedSpawnTime,
    isRenderDirty: true,
  };
}
