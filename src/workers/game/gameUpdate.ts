import { GameState, GameStatus, Position } from '@/types/game';
import { GAME_CONFIG, PERFORMANCE_CONFIG } from '@/constants/game';
import { PORTAL_CONFIG } from '@/constants/portals';
import { moveSnake, hasSelfCollision, hasFoodCollision } from '@/utils/gameLogic';
import { getActivePowerUps, hasPhaseThrough } from '@/utils/powerUps';
import { hasObstacleCollision, getActiveObstacles, createObstacleSet } from '@/utils/obstacles';
import { isLivesEnabled, addLife } from '@/utils/lives';
import { initializeStatistics } from '@/utils/statistics';
import { getPortalAtPosition, getPortalPair, getActivePortals } from '@/utils/portals';
import { handleBossDefeat } from '@/utils/bosses';
import { checkAchievements } from '@/utils/achievements';
import { logger, LogContext } from '@/utils/logger';
import {
  resolveDirection,
  handleBossLogic,
  handleBossCollisionCheck,
  handlePoisonShotsUpdate,
  handleFoodInteraction,
} from '../gameHelper';
import { handleGameStateUpdates } from './gameStateUpdates';

export interface UpdateContext {
  gameState: GameState;
  directionQueue: import('@/types/game').Direction[];
  bossAbilityCooldowns: Map<string, number>;
  pendingPoisonShots: import('@/types/game').PoisonShot[];
  lastObstacleSpawnTime: number;
  forcedFoodType: import('@/types/game').FoodType | null;
  lastPoisonFireTime: number;
  skipOptionalEffects: boolean;
  framesSkipped: number;
  activePowerUps?: import('@/types/game').ActivePowerUp[];
  currentTime?: number;
}

export interface UpdateResult {
  newGameState: GameState | null;
  newBossAbilityCooldowns: Map<string, number>;
  newForcedFoodType: import('@/types/game').FoodType | null;
  newPendingPoisonShots: import('@/types/game').PoisonShot[];
  newLastObstacleSpawnTime: number;
  isRenderDirty: boolean;
}

/**
 * Combine boss and food portals efficiently
 */
function combinePortals(
  bossPortals: import('@/types/game').Portal[],
  foodPortals: import('@/types/game').Portal[],
): import('@/types/game').Portal[] {
  if (bossPortals.length === 0) return foodPortals;
  if (foodPortals.length === 0) return bossPortals;
  const combined: typeof bossPortals = [];
  combined.push(...bossPortals);
  combined.push(...foodPortals);
  return combined;
}

/**
 * Handle portal teleportation
 */
function handlePortalTeleport(
  headPosition: Position | undefined,
  snake: Position[],
  portals: import('@/types/game').Portal[],
): { finalSnake: Position[]; headPosition: Position | undefined } {
  if (!headPosition) return { finalSnake: snake, headPosition };

  const activePortals = getActivePortals(portals, PERFORMANCE_CONFIG.maxPortals);
  const portalAtHead = getPortalAtPosition(headPosition, activePortals);

  if (!portalAtHead) return { finalSnake: snake, headPosition };

  const pairedPortal = getPortalPair(portalAtHead, activePortals);
  if (!pairedPortal) return { finalSnake: snake, headPosition };

  const finalSnake = [{ ...pairedPortal.position }, ...snake.slice(1)];
  const newHeadPosition = finalSnake[0];

  if (GAME_CONFIG.enableParticles) {
    const portalColor = PORTAL_CONFIG.colors.portal1.primary;
    self.postMessage({
      type: 'SPAWN_PARTICLES',
      payload: { position: portalAtHead.position, color: portalColor, count: 12 },
    });
    self.postMessage({
      type: 'SPAWN_PARTICLES',
      payload: { position: pairedPortal.position, color: portalColor, count: 12 },
    });
  }

  return { finalSnake, headPosition: newHeadPosition };
}

/**
 * Handle collision detection and game over/dying logic
 */
function handleCollision(
  headPosition: Position | undefined,
  snake: Position[],
  gameState: GameState,
  activeObstacles: import('@/types/game').Obstacle[] | Set<string>,
  canPhaseThrough: boolean,
): GameState | null {
  if (!headPosition) return null;

  const hasCollision =
    (GAME_CONFIG.enableObstacles &&
      !canPhaseThrough &&
      hasObstacleCollision(headPosition, activeObstacles)) ||
    (snake.length >= 4 && hasSelfCollision(snake));

  if (!hasCollision) return null;

  const statistics = gameState.statistics || initializeStatistics();

  if (isLivesEnabled() && gameState.lives > 1) {
    const newState: GameState = {
      ...gameState,
      status: GameStatus.DYING,
      lives: gameState.lives - 1,
      statistics,
    };
    self.postMessage({ type: 'GAME_OVER_OR_DYING', payload: { status: GameStatus.DYING } });
    logger.info(
      { context: LogContext.COLLISION, livesRemaining: gameState.lives - 1 },
      'Collision detected (Life Lost)',
    );
    return newState;
  }

  const newState: GameState = {
    ...gameState,
    status: GameStatus.GAME_OVER,
    highScore: Math.max(gameState.score, gameState.highScore),
    statistics,
  };
  self.postMessage({
    type: 'GAME_OVER_OR_DYING',
    payload: { status: GameStatus.GAME_OVER, score: gameState.score },
  });
  logger.info(
    { context: LogContext.COLLISION, score: gameState.score },
    'Collision detected (Game Over)',
  );
  return newState;
}

/**
 * Handle guardian flag capture
 */
function handleGuardianFlagCapture(
  headPosition: Position,
  bossLogicResult: ReturnType<typeof handleBossLogic>,
  foodResult: ReturnType<typeof handleFoodInteraction>,
  prev: GameState,
  bossAbilityCooldowns: Map<string, number>,
): {
  newScore: number;
  newLives: number;
  bossLogicResult: ReturnType<typeof handleBossLogic>;
  bossAbilityCooldowns: Map<string, number>;
  forcedFoodType: import('@/types/game').FoodType | null;
} {
  const capturedFlag =
    bossLogicResult.guardianFlag &&
    headPosition.x === bossLogicResult.guardianFlag.position.x &&
    headPosition.y === bossLogicResult.guardianFlag.position.y;

  if (!capturedFlag || bossLogicResult.activeBoss?.id !== 'guardian') {
    return {
      newScore: foodResult.newScore,
      newLives: foodResult.newLives,
      bossLogicResult,
      bossAbilityCooldowns,
      forcedFoodType: null,
    };
  }

  const bossReward = handleBossDefeat(bossLogicResult.activeBoss, {
    score: foodResult.newScore,
    lives: foodResult.newLives,
  } as GameState);

  const newScore = foodResult.newScore + bossReward.scoreIncrease;
  const newLives = addLife(foodResult.newLives);

  bossLogicResult.guardianFlag = null;
  bossLogicResult.activeBoss = undefined;
  bossLogicResult.bossSnake = undefined;

  if (GAME_CONFIG.enableParticles && prev.guardianFlag) {
    self.postMessage({
      type: 'SPAWN_PARTICLES',
      payload: { position: prev.guardianFlag.position, color: '#10b981', count: 30 },
    });
  }

  bossAbilityCooldowns.clear();

  return {
    newScore,
    newLives,
    bossLogicResult,
    bossAbilityCooldowns,
    forcedFoodType: null,
  };
}

/**
 * Handle boss collision check
 */
function handleBossCollision(
  headPosition: Position,
  bossLogicResult: ReturnType<typeof handleBossLogic>,
  prev: GameState,
  foodResult: ReturnType<typeof handleFoodInteraction>,
): GameState | null {
  const collisionCheck = handleBossCollisionCheck(headPosition, bossLogicResult, prev);

  collisionCheck.collisionResult.particlesToSpawn.forEach((p) => {
    self.postMessage({ type: 'SPAWN_PARTICLES', payload: p });
  });

  if (!collisionCheck.gameOverOrDying) return null;

  if (collisionCheck.gameOverOrDying.status === GameStatus.DYING) {
    return {
      ...prev,
      status: GameStatus.DYING,
      lives: collisionCheck.gameOverOrDying.lives ?? prev.lives,
      snake: foodResult.finalSnake,
    };
  }

  return {
    ...prev,
    status: GameStatus.GAME_OVER,
    score: collisionCheck.gameOverOrDying.score ?? foodResult.newScore,
    lives: 0,
    snake: foodResult.finalSnake,
  };
}

/**
 * Handle poison shots update
 */
function handlePoisonUpdate(
  context: UpdateContext,
  currentBossState: ReturnType<typeof handleBossCollisionCheck>['collisionResult'],
  headPosition: Position,
  currentDirection: import('@/types/game').Direction,
  currentTime: number,
): {
  poisonResult: ReturnType<typeof handlePoisonShotsUpdate>;
  newBossState: typeof currentBossState;
  newBossAbilityCooldowns: Map<string, number>;
  newForcedFoodType: import('@/types/game').FoodType | null;
} {
  const poisonResult = handlePoisonShotsUpdate({
    prevPoisonShots: context.gameState.poisonShots,
    pendingShots: context.pendingPoisonShots,
    obstacles: currentBossState.newObstacles,
    gridSize: GAME_CONFIG.gridSize,
    bossLogicResult: currentBossState,
    prevGameState: context.gameState,
    currentTime,
    lastPoisonFireTime: context.lastPoisonFireTime,
    isFiringPoison: context.gameState.isFiringPoison ?? false,
    snakeHead: headPosition,
    direction: currentDirection,
  });

  let newBossState = currentBossState;
  let newBossAbilityCooldowns = context.bossAbilityCooldowns;
  let newForcedFoodType = context.forcedFoodType;

  if (poisonResult.bossUpdate) {
    newBossState = {
      ...currentBossState,
      bossSnake: poisonResult.bossUpdate.bossSnake,
      activeBoss: poisonResult.bossUpdate.activeBoss,
      newScore: poisonResult.bossUpdate.newScore,
    };
    newBossAbilityCooldowns = poisonResult.bossUpdate.bossAbilityCooldowns;
    newForcedFoodType = poisonResult.bossUpdate.forcedFoodType;
  }

  if (!context.skipOptionalEffects || context.framesSkipped % 2 === 0) {
    poisonResult.particlesToSpawn.forEach((p) => {
      self.postMessage({ type: 'SPAWN_PARTICLES', payload: p });
    });
  }

  return {
    poisonResult,
    newBossState,
    newBossAbilityCooldowns,
    newForcedFoodType,
  };
}

/**
 * Handle achievements check
 */
function handleAchievements(
  prev: GameState,
  newScore: number,
  newLevel: number,
  snakeLength: number,
  comboMultiplier: number,
  atePowerUp: boolean,
): GameState['achievements'] {
  if (!GAME_CONFIG.enableAchievements) return prev.achievements;

  const achieveRes = checkAchievements(prev.achievements, {
    score: newScore,
    level: newLevel,
    snakeLength,
    comboMultiplier,
    atePowerUp,
  });

  if (achieveRes.achievements !== prev.achievements) {
    self.postMessage({ type: 'SAVE_ACHIEVEMENTS', payload: achieveRes.achievements });
  }

  return achieveRes.achievements;
}

/**
 * Core game update logic
 */
export function updateGameLogic(context: UpdateContext, performanceTime: number): UpdateResult {
  const prev = context.gameState;

  // 1. Resolve Direction - use cached activePowerUps if available, otherwise calculate
  const activePowerUps = context.activePowerUps ?? getActivePowerUps(prev.activePowerUps);
  // Use cached currentTime (Date.now()) if available, otherwise use performanceTime
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

  // 4. Check Collisions - use cached obstacle Set for O(1) lookup
  const activeObstacles =
    prev.obstacles.length > 0 ? getActiveObstacles(prev.obstacles) : prev.obstacles;
  const canPhaseThrough = hasPhaseThrough(activePowerUps);

  // Create obstacle Set for O(1) collision detection (only if obstacles exist)
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
    return {
      newGameState: collisionState,
      newBossAbilityCooldowns: context.bossAbilityCooldowns,
      newForcedFoodType: context.forcedFoodType,
      newPendingPoisonShots: [],
      newLastObstacleSpawnTime: context.lastObstacleSpawnTime,
      isRenderDirty: true,
    };
  }

  if (!headPosition) {
    return {
      newGameState: prev,
      newBossAbilityCooldowns: context.bossAbilityCooldowns,
      newForcedFoodType: context.forcedFoodType,
      newPendingPoisonShots: [],
      newLastObstacleSpawnTime: context.lastObstacleSpawnTime,
      isRenderDirty: false,
    };
  }

  const statistics = prev.statistics || initializeStatistics();

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

  if (!context.skipOptionalEffects || context.framesSkipped % 2 === 0) {
    foodResult.particlesToSpawn.forEach((p) => {
      self.postMessage({ type: 'SPAWN_PARTICLES', payload: p });
    });
  }

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

  let bossAbilityCooldowns = bossLogicResult.bossAbilityCooldowns;
  let forcedFoodType = bossLogicResult.forcedFoodType ?? context.forcedFoodType;

  // Handle Flag Capture (headPosition guaranteed to exist after early return above)
  const flagCapture = handleGuardianFlagCapture(
    headPosition,
    bossLogicResult,
    foodResult,
    prev,
    bossAbilityCooldowns,
  );
  foodResult.newScore = flagCapture.newScore;
  foodResult.newLives = flagCapture.newLives;
  bossAbilityCooldowns = flagCapture.bossAbilityCooldowns;
  forcedFoodType = flagCapture.forcedFoodType;

  // 7. Boss Collision Check
  const bossCollisionState = handleBossCollision(headPosition, bossLogicResult, prev, foodResult);
  if (bossCollisionState) {
    self.postMessage({
      type: 'GAME_OVER_OR_DYING',
      payload: {
        status: bossCollisionState.status,
        score:
          bossCollisionState.status === GameStatus.GAME_OVER ? bossCollisionState.score : undefined,
      },
    });
    return {
      newGameState: bossCollisionState,
      newBossAbilityCooldowns: bossAbilityCooldowns,
      newForcedFoodType: forcedFoodType,
      newPendingPoisonShots: [],
      newLastObstacleSpawnTime: context.lastObstacleSpawnTime,
      isRenderDirty: true,
    };
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
  const newGameState: GameState = {
    ...prev,
    snake: foodResult.finalSnake,
    food: stateUpdates.newFood,
    direction: currentDirection,
    nextDirection: currentDirection,
    score: poisonUpdate.newBossState.newScore,
    highScore: Math.max(poisonUpdate.newBossState.newScore, prev.highScore),
    level: stateUpdates.newLevel,
    gameSpeed: stateUpdates.baseGameSpeed,
    activePowerUps: foodResult.newActivePowerUps,
    obstacles: stateUpdates.newObstacles,
    portals: combinePortals(poisonUpdate.newBossState.newPortals, foodResult.newPortals),
    combo: foodResult.newCombo,
    guardianFlag: stateUpdates.newGuardianFlag ?? poisonUpdate.newBossState.guardianFlag,
    guardianFlagSide: poisonUpdate.newBossState.guardianFlagSide,
    poisonShots: poisonUpdate.poisonResult.newPoisonShots,
    achievements: updatedAchievements,
    lives: foodResult.newLives,
    statistics: foodResult.statistics,
    currentPhase: stateUpdates.currentPhase ?? prev.currentPhase,
    phaseLevelType: stateUpdates.phaseLevelType ?? prev.phaseLevelType,
    activeBoss: stateUpdates.activeBoss,
    // Use stateUpdates.bossSnake only when a new boss was initialized,
    // otherwise use the moved bossSnake from poison/boss logic
    bossSnake:
      stateUpdates.activeBoss?.id !== prev.activeBoss?.id
        ? stateUpdates.bossSnake
        : poisonUpdate.newBossState.bossSnake,
  };

  return {
    newGameState,
    newBossAbilityCooldowns: poisonUpdate.newBossAbilityCooldowns,
    newForcedFoodType: poisonUpdate.newForcedFoodType,
    newPendingPoisonShots: [],
    newLastObstacleSpawnTime: stateUpdates.updatedSpawnTime,
    isRenderDirty: true,
  };
}
