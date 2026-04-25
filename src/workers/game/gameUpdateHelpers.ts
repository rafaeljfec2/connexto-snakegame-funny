import { GameState, GameStatus, Position, Portal, Direction, FoodType } from '@/types/game';
import { GAME_CONFIG, PERFORMANCE_CONFIG } from '@/constants/game';
import { PORTAL_CONFIG } from '@/constants/portals';
import { hasSelfCollision } from '@/utils/gameLogic';
import { hasObstacleCollision } from '@/utils/obstacles';
import { isLivesEnabled, addLife } from '@/utils/lives';
import { initializeStatistics } from '@/utils/statistics';
import { getPortalAtPosition, getPortalPair, getActivePortals } from '@/utils/portals';
import { handleBossDefeat } from '@/utils/bosses';
import { emitSfx } from './gameSfx';
import { checkAchievements } from '@/utils/achievements';
import { logger, LogContext } from '@/utils/logger';
import {
  handleBossLogic,
  handleBossCollisionCheck,
  handlePoisonShotsUpdate,
  handleFoodInteraction,
} from '../gameHelper';
import type { UpdateContext } from './gameUpdateTypes';

/**
 * Combine boss and food portals efficiently
 */
export function combinePortals(bossPortals: Portal[], foodPortals: Portal[]): Portal[] {
  if (bossPortals.length === 0) return foodPortals;
  if (foodPortals.length === 0) return bossPortals;
  return [...bossPortals, ...foodPortals];
}

/**
 * Handle portal teleportation
 */
export function handlePortalTeleport(
  headPosition: Position | undefined,
  snake: Position[],
  portals: Portal[],
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
export function handleCollision(
  headPosition: Position | undefined,
  snake: Position[],
  gameState: GameState,
  activeObstacles: Set<string>,
  canPhaseThrough: boolean,
): GameState | null {
  if (!headPosition) return null;

  const hasCollision =
    (GAME_CONFIG.enableObstacles &&
      !canPhaseThrough &&
      hasObstacleCollision(headPosition, activeObstacles)) ||
    (snake.length >= 4 && hasSelfCollision(snake));

  if (!hasCollision) return null;

  const statistics = gameState.statistics ?? initializeStatistics();

  if (isLivesEnabled() && gameState.lives > 1) {
    const newState: GameState = {
      ...gameState,
      status: GameStatus.DYING,
      lives: gameState.lives - 1,
      statistics,
    };
    self.postMessage({ type: 'GAME_OVER_OR_DYING', payload: { status: GameStatus.DYING } });
    emitSfx('damage.hit');
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
  emitSfx('damage.death');
  logger.info(
    { context: LogContext.COLLISION, score: gameState.score },
    'Collision detected (Game Over)',
  );
  return newState;
}

/**
 * Handle guardian flag capture
 */
export function handleGuardianFlagCapture(
  headPosition: Position,
  bossLogicResult: ReturnType<typeof handleBossLogic>,
  foodResult: ReturnType<typeof handleFoodInteraction>,
  prev: GameState,
  bossAbilityCooldowns: Map<string, number>,
  currentForcedFoodType: FoodType | null,
): {
  newScore: number;
  newLives: number;
  bossLogicResult: ReturnType<typeof handleBossLogic>;
  bossAbilityCooldowns: Map<string, number>;
  forcedFoodType: FoodType | null;
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
      forcedFoodType: currentForcedFoodType,
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
  emitSfx('boss.defeat');
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
export function handleBossCollision(
  headPosition: Position,
  bossLogicResult: ReturnType<typeof handleBossLogic>,
  prev: GameState,
  foodResult: ReturnType<typeof handleFoodInteraction>,
): GameState | null {
  const collisionCheck = handleBossCollisionCheck(headPosition, bossLogicResult, prev);

  const particlesLen = collisionCheck.collisionResult.particlesToSpawn.length;
  for (let i = 0; i < particlesLen; i++) {
    const p = collisionCheck.collisionResult.particlesToSpawn[i];
    if (p) self.postMessage({ type: 'SPAWN_PARTICLES', payload: p });
  }

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
export function handlePoisonUpdate(
  context: UpdateContext,
  currentBossState: ReturnType<typeof handleBossCollisionCheck>['collisionResult'],
  headPosition: Position,
  currentDirection: Direction,
  currentTime: number,
): {
  poisonResult: ReturnType<typeof handlePoisonShotsUpdate>;
  newBossState: typeof currentBossState;
  newBossAbilityCooldowns: Map<string, number>;
  newForcedFoodType: FoodType | null;
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
    const particlesLen = poisonResult.particlesToSpawn.length;
    for (let i = 0; i < particlesLen; i++) {
      const p = poisonResult.particlesToSpawn[i];
      if (p) self.postMessage({ type: 'SPAWN_PARTICLES', payload: p });
    }
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
export function handleAchievements(
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
 * Particle payload type
 */
type ParticlePayload = { position: Position; color: string; count: number };

/**
 * Broadcast particles to spawn
 */
export function broadcastParticles(
  particles: ParticlePayload[],
  skipOptionalEffects: boolean,
  framesSkipped: number,
): void {
  if (skipOptionalEffects && framesSkipped % 2 !== 0) return;

  const len = particles.length;
  for (let i = 0; i < len; i++) {
    const p = particles[i];
    if (p) self.postMessage({ type: 'SPAWN_PARTICLES', payload: p });
  }
}

/**
 * Context for building final game state
 */
export interface FinalStateContext {
  readonly prev: GameState;
  readonly foodResult: ReturnType<typeof handleFoodInteraction>;
  readonly stateUpdates: {
    readonly newFood: GameState['food'];
    readonly newLevel: number;
    readonly baseGameSpeed: number;
    readonly newObstacles: GameState['obstacles'];
    readonly newGuardianFlag?: GameState['guardianFlag'];
    readonly currentPhase?: GameState['currentPhase'];
    readonly phaseLevelType?: GameState['phaseLevelType'];
    readonly activeBoss?: GameState['activeBoss'];
    readonly bossSnake?: GameState['bossSnake'];
    readonly updatedSpawnTime: number;
  };
  readonly poisonUpdate: {
    readonly poisonResult: { readonly newPoisonShots: GameState['poisonShots'] };
    readonly newBossState: {
      readonly newPortals: Portal[];
      readonly guardianFlag?: GameState['guardianFlag'];
      readonly guardianFlagSide?: GameState['guardianFlagSide'];
      readonly bossSnake?: GameState['bossSnake'];
      readonly newScore: number;
    };
    readonly newBossAbilityCooldowns: Map<string, number>;
    readonly newForcedFoodType: FoodType | null;
  };
  readonly currentDirection: Direction;
  readonly updatedAchievements: GameState['achievements'];
}

/**
 * Build the final game state from all processed results
 */
export function buildFinalGameState(ctx: FinalStateContext): GameState {
  const { prev, foodResult, stateUpdates, poisonUpdate, currentDirection, updatedAchievements } =
    ctx;

  return {
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
    bossSnake:
      stateUpdates.activeBoss?.id === prev.activeBoss?.id
        ? poisonUpdate.newBossState.bossSnake
        : stateUpdates.bossSnake,
  };
}

/**
 * Create boss collision result when game is over or dying
 */
export function createBossCollisionResult(
  bossCollisionState: GameState,
  bossAbilityCooldowns: Map<string, number>,
  forcedFoodType: FoodType | null,
  lastObstacleSpawnTime: number,
): import('./gameUpdateTypes').UpdateResult {
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
    newLastObstacleSpawnTime: lastObstacleSpawnTime,
    isRenderDirty: true,
  };
}
