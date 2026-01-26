import {
  GameStatus,
  GameState,
  Direction,
  FoodType,
  Position,
  Obstacle,
  Portal,
  BossSnake,
  Food,
  ActivePowerUp,
  PoisonShot,
} from '@/types/game';
import { Chef } from '@/types/phases';
import type { GameStatisticsTracking } from '@/types/statistics';
import {
  isValidDirectionChange,
  getOppositeDirection,
  wouldCauseCollision,
} from '@/utils/gameLogic';
import { GAME_CONFIG, POISON_CONFIG } from '@/constants/game';
import { applyPowerUpEffect, createActivePowerUp, hasReverseControls } from '@/utils/powerUps';
import { updateCombo } from '@/utils/combos';
import { destroyObstacles } from '@/utils/obstacleDestruction';
import { isLivesEnabled, addLife } from '@/utils/lives';

import { handleBossDefeat } from '@/utils/bosses';
import {
  moveBossSnake,
  calculateBossNextDirection,
  getBossHitPart,
  weakenBossSnake,
  canDefeatBoss,
} from '@/utils/bossSnake';
import { processBossAbilities, getFlagOffsetFromBossHead } from '@/utils/bossAbilities';
import {
  createPoisonShot,
  updatePoisonShots,
  hasBossHeadCollision,
  hasBossBodyCollision,
} from '@/utils/poison';
import { POWER_UP_CONFIG } from '@/constants/powerUps';

// --- Types ---
export interface BossLogicContext {
  activeBoss: Chef | undefined;
  bossSnake: BossSnake | undefined;
  prevGameState: GameState;
  finalSnake: Position[];
  obstacles: Obstacle[];
  portals: Portal[];
  bossAbilityCooldowns: Map<string, number>;
  guardianFlag: Food | null;
  guardianFlagSide: -1 | 1 | undefined;
  foodPosition: Position;
}

interface InitializeBossResultParams {
  activeBoss: Chef | undefined;
  bossSnake: BossSnake | undefined;
  prevGameState: GameState;
  obstacles: Obstacle[];
  portals: Portal[];
  bossAbilityCooldowns: Map<string, number>;
  guardianFlag: Food | null;
  guardianFlagSide: -1 | 1 | undefined;
}

export interface BossLogicResult {
  activeBoss?: Chef;
  bossSnake?: BossSnake;
  guardianFlag?: Food | null;
  guardianFlagSide?: -1 | 1;
  newObstacles: Obstacle[];
  newPortals: Portal[];
  baseGameSpeed: number;
  newLives: number;
  forcedFoodType: FoodType | null;
  bossAbilityCooldowns: Map<string, number>;
  newScore: number;
  particlesToSpawn: Array<{ position: Position; color: string; count: number }>;
}

export interface PoisonLogicResult {
  newPoisonShots: import('@/types/game').PoisonShot[];
  pendingPoisonShots: import('@/types/game').PoisonShot[];
  newObstacles: Obstacle[];
  particlesToSpawn: Array<{ position: Position; color: string; count: number }>;
  bossUpdate?: {
    bossSnake: BossSnake;
    activeBoss?: Chef;
    newScore: number;
    bossAbilityCooldowns: Map<string, number>;
    forcedFoodType: FoodType | null;
  };
}

export interface PoisonShotsUpdateContext {
  prevPoisonShots: import('@/types/game').PoisonShot[];
  pendingShots: import('@/types/game').PoisonShot[];
  obstacles: Obstacle[];
  gridSize: number;
  bossLogicResult: BossLogicResult;
  prevGameState: GameState;
  currentTime: number;
  lastPoisonFireTime: number;
  isFiringPoison: boolean;
  snakeHead: Position | undefined;
  direction: Direction;
}

export interface FoodInteractionResult {
  newScore: number;
  newCombo: { count: number; multiplier: number; lastFoodTime: number };
  newLives: number;
  finalSnake: Position[];
  newActivePowerUps: ActivePowerUp[];
  statistics: GameStatisticsTracking;
  atePowerUp: boolean;
  particlesToSpawn: Array<{ position: Position; color: string; count: number }>;
  newPortals: Portal[]; // Portals from food
}

// --- Helper Functions ---

/**
 * Resolves the next direction of the snake based on user input and game state.
 */
export function resolveDirection(
  currentDirection: Direction,
  nextDirectionBuffer: Direction | null,
  activePowerUps: ActivePowerUp[],
  snake: Position[],
  gridSize: number,
): Direction {
  if (!nextDirectionBuffer) return currentDirection;

  const reverseControls = hasReverseControls(activePowerUps);
  let nextDir = nextDirectionBuffer;

  if (reverseControls && nextDir !== currentDirection) {
    nextDir = getOppositeDirection(nextDir);
  }

  if (
    isValidDirectionChange(currentDirection, nextDir) &&
    !wouldCauseCollision(snake, nextDir, gridSize)
  ) {
    return nextDir;
  }
  return currentDirection;
}

/**
 * Initialize boss logic result
 */
function initializeBossResult(params: InitializeBossResultParams): BossLogicResult {
  const {
    activeBoss,
    bossSnake,
    prevGameState,
    obstacles,
    portals,
    bossAbilityCooldowns,
    guardianFlag,
    guardianFlagSide,
  } = params;

  return {
    activeBoss,
    bossSnake,
    guardianFlag: guardianFlag
      ? {
          position: guardianFlag.position,
          type: guardianFlag.type,
          spawnTime: guardianFlag.spawnTime ?? Date.now(),
          duration: guardianFlag.duration,
        }
      : null,
    guardianFlagSide:
      guardianFlagSide === 1 || guardianFlagSide === -1 ? guardianFlagSide : undefined,
    newObstacles: [...obstacles],
    newPortals: [...portals],
    baseGameSpeed: prevGameState.gameSpeed,
    newLives: prevGameState.lives,
    forcedFoodType: null,
    bossAbilityCooldowns: new Map(bossAbilityCooldowns),
    newScore: prevGameState.score,
    particlesToSpawn: [],
  };
}

/**
 * Process boss abilities and update result
 */
function processBossAbilitiesLogic(
  activeBoss: Chef,
  currentGS: GameState,
  result: BossLogicResult,
): ReturnType<typeof processBossAbilities> {
  const abilityResult = processBossAbilities(activeBoss, currentGS, result.bossAbilityCooldowns);
  result.bossAbilityCooldowns = abilityResult.updatedCooldowns;

  if (abilityResult.result.guardianFlag !== undefined) {
    result.guardianFlag = abilityResult.result.guardianFlag;
  }
  if (abilityResult.result.guardianFlagSide !== undefined) {
    result.guardianFlagSide = abilityResult.result.guardianFlagSide;
  }

  return abilityResult;
}

/**
 * Handle boss movement
 */
function handleBossMovement(
  activeBoss: Chef,
  bossSnake: BossSnake,
  finalSnake: Position[],
  obstacles: Obstacle[],
  foodPosition: Position,
  guardianFlagPos: Position | null,
): BossSnake {
  const nextBossDir = calculateBossNextDirection(
    activeBoss,
    bossSnake,
    finalSnake,
    obstacles,
    foodPosition,
    GAME_CONFIG.gridSize,
    guardianFlagPos,
  );

  return moveBossSnake(bossSnake, nextBossDir, GAME_CONFIG.gridSize);
}

/**
 * Update guardian flag position following boss
 */
function updateGuardianFlagPosition(result: BossLogicResult, bossSnake: BossSnake): void {
  if (!result.guardianFlag || bossSnake.positions.length === 0) {
    return;
  }

  const bossHead = bossSnake.positions[0];
  const flagSide = result.guardianFlagSide ?? 1;
  const flagOffset = getFlagOffsetFromBossHead(bossSnake.direction, flagSide);
  const newFlagPos = {
    x: Math.max(0, Math.min(bossHead.x + flagOffset.x, GAME_CONFIG.gridSize - 1)),
    y: Math.max(0, Math.min(bossHead.y + flagOffset.y, GAME_CONFIG.gridSize - 1)),
  };
  const isOnBody = bossSnake.positions.some(
    (p: Position) => p.x === newFlagPos.x && p.y === newFlagPos.y,
  );

  if (!isOnBody) {
    result.guardianFlag = { ...result.guardianFlag, position: newFlagPos };
  }
}

/**
 * Merge new obstacles into existing list avoiding duplicates
 */
function mergeObstacles(existing: Obstacle[], newObs: Obstacle[]): void {
  if (newObs.length === 0) return;

  const existingMap = new Map<string, boolean>();
  const len = existing.length;
  for (let i = 0; i < len; i++) {
    const o = existing[i];
    if (o) existingMap.set(`${o.position.x},${o.position.y}`, true);
  }

  const newLen = newObs.length;
  for (let i = 0; i < newLen; i++) {
    const o = newObs[i];
    if (!o) continue;
    const key = `${o.position.x},${o.position.y}`;
    if (!existingMap.has(key)) {
      existing.push(o);
      existingMap.set(key, true);
    }
  }
}

/**
 * Apply simple ability effects (portals, speed, lives, food type)
 */
function applySimpleEffects(
  effectResult: ReturnType<typeof processBossAbilities>['result'],
  result: BossLogicResult,
): void {
  if (effectResult.portals) {
    result.newPortals = [...result.newPortals, ...effectResult.portals];
  }
  if (effectResult.gameSpeed !== undefined) {
    result.baseGameSpeed = effectResult.gameSpeed;
  }
  if (effectResult.lives !== undefined) {
    result.newLives = effectResult.lives;
  }
  if (effectResult.forceFoodType && effectResult.foodType) {
    result.forcedFoodType = effectResult.foodType;
  }
}

/**
 * Apply ability effects to result
 */
function applyAbilityEffects(
  abilityResult: ReturnType<typeof processBossAbilities>,
  result: BossLogicResult,
): void {
  const effectResult = abilityResult.result;

  if (effectResult.obstacles && effectResult.obstacles.length > 0) {
    mergeObstacles(result.newObstacles, effectResult.obstacles);
  }

  applySimpleEffects(effectResult, result);
}

/**
 * Handles all boss-related logic: movement, abilities, and flag mechanics.
 */
export function handleBossLogic(context: BossLogicContext): BossLogicResult {
  const {
    activeBoss,
    bossSnake,
    prevGameState,
    finalSnake,
    obstacles,
    portals,
    bossAbilityCooldowns,
    guardianFlag,
    guardianFlagSide,
    foodPosition,
  } = context;

  const result = initializeBossResult({
    activeBoss,
    bossSnake,
    prevGameState,
    obstacles,
    portals,
    bossAbilityCooldowns,
    guardianFlag,
    guardianFlagSide,
  });

  if (!activeBoss || !bossSnake) {
    return result;
  }

  const currentGS: GameState = {
    ...prevGameState,
    snake: finalSnake,
    obstacles: result.newObstacles,
    portals: result.newPortals,
    bossSnake,
    guardianFlag,
    guardianFlagSide,
  };

  const abilityResult = processBossAbilitiesLogic(activeBoss, currentGS, result);

  result.bossSnake = handleBossMovement(
    activeBoss,
    bossSnake,
    finalSnake,
    result.newObstacles,
    foodPosition,
    result.guardianFlag?.position ?? null,
  );

  if (result.bossSnake) {
    updateGuardianFlagPosition(result, result.bossSnake);
  }

  applyAbilityEffects(abilityResult, result);

  return result;
}

/**
 * Handle boss defeat victory logic
 */
function handleBossDefeatVictory(
  result: BossLogicResult,
  activeBoss: Chef,
  prevGameState: GameState,
  bossHeadPosition: Position | undefined,
): void {
  const reward = handleBossDefeat(activeBoss, prevGameState);
  result.newScore += reward.scoreIncrease;

  if (bossHeadPosition) {
    result.particlesToSpawn.push({
      position: bossHeadPosition,
      color: activeBoss.visual.color,
      count: 30,
    });
  }

  result.activeBoss = undefined;
  result.bossSnake = undefined;
  result.bossAbilityCooldowns.clear();
  result.forcedFoodType = null;
}

/**
 * Handle boss head collision
 */
function handleBossHeadCollision(
  result: BossLogicResult,
  bossSnake: BossSnake,
  activeBoss: Chef,
  prevGameState: GameState,
): { gameOverOrDying?: { status: GameStatus; score?: number; lives?: number } } | null {
  if (canDefeatBoss(bossSnake)) {
    handleBossDefeatVictory(result, activeBoss, prevGameState, bossSnake.positions[0]);
    return null;
  }

  if (isLivesEnabled() && result.newLives > 1) {
    return {
      gameOverOrDying: { status: GameStatus.DYING, lives: result.newLives - 1 },
    };
  }

  return {
    gameOverOrDying: { status: GameStatus.GAME_OVER, score: result.newScore },
  };
}

/**
 * Handle boss body collision
 */
function handleBossBodyCollision(
  result: BossLogicResult,
  bossSnake: BossSnake,
  headPosition: Position,
  activeBoss: Chef,
  prevGameState: GameState,
): void {
  const weaken = weakenBossSnake(bossSnake, 2);
  result.bossSnake = weaken.newBossSnake;
  result.newScore += weaken.pointsEarned;

  result.particlesToSpawn.push({
    position: headPosition,
    color: activeBoss.visual.color ?? '#3b82f6',
    count: 10,
  });

  if (result.bossSnake && result.bossSnake.positions.length <= 1) {
    handleBossDefeatVictory(result, activeBoss, prevGameState, result.bossSnake.positions[0]);
  }
}

/**
 * Checks for collisions between the snake and the boss.
 */
export function handleBossCollisionCheck(
  headPosition: Position | undefined,
  bossState: BossLogicResult,
  prevGameState: GameState,
): {
  collisionResult: BossLogicResult;
  gameOverOrDying?: { status: GameStatus; score?: number; lives?: number };
} {
  const result = { ...bossState };

  if (!result.bossSnake || !headPosition || !result.activeBoss) {
    return { collisionResult: result };
  }

  const hitPart = getBossHitPart(headPosition, result.bossSnake);

  if (hitPart === 'head') {
    const gameOverResult = handleBossHeadCollision(
      result,
      result.bossSnake,
      result.activeBoss,
      prevGameState,
    );
    if (gameOverResult) {
      return { collisionResult: result, ...gameOverResult };
    }
  } else if (hitPart === 'body') {
    handleBossBodyCollision(
      result,
      result.bossSnake,
      headPosition,
      result.activeBoss,
      prevGameState,
    );
  }

  return { collisionResult: result };
}

// --- Poison Shots Helper Functions ---

function processAutoFire(
  pendingShots: PoisonShot[],
  isFiringPoison: boolean,
  currentTime: number,
  lastPoisonFireTime: number,
  snakeHead: Position | undefined,
  direction: Direction,
): PoisonShot[] {
  const newPending = [...pendingShots];
  if (!isFiringPoison) return newPending;
  const fireInterval = POISON_CONFIG.fireInterval ?? 200;
  if (currentTime - lastPoisonFireTime >= fireInterval && snakeHead) {
    newPending.push(createPoisonShot(snakeHead, direction));
  }
  return newPending;
}

function processObstacleDestruction(
  obstacles: Obstacle[],
  hitObstacles: Obstacle[],
  particlesToSpawn: Array<{ position: Position; color: string; count: number }>,
): Obstacle[] {
  if (!POISON_CONFIG.canDestroyObstacles || hitObstacles.length === 0) return obstacles;
  const destroyRes = destroyObstacles(obstacles, hitObstacles, []);
  const len = hitObstacles.length;
  for (let i = 0; i < len; i++) {
    const obs = hitObstacles[i];
    if (obs) particlesToSpawn.push({ position: obs.position, color: '#9ca3af', count: 6 });
  }
  return destroyRes.remainingObstacles;
}

// --- Boss Collision Helper Types and Functions ---

interface BossCollisionState {
  bossSnake: BossSnake;
  score: number;
  defeated: boolean;
}

interface BossCollisionContext {
  activeBoss: Chef;
  prevGameState: GameState;
  particles: Array<{ position: Position; color: string; count: number }>;
}

function addDefeatParticles(ctx: BossCollisionContext, bossSnake: BossSnake): void {
  const headPos = bossSnake.positions[0];
  if (headPos) {
    ctx.particles.push({ position: headPos, color: ctx.activeBoss.visual.color, count: 30 });
  }
}

function processBossDefeat(
  ctx: BossCollisionContext,
  state: BossCollisionState,
): BossCollisionState {
  const reward = handleBossDefeat(ctx.activeBoss, ctx.prevGameState);
  addDefeatParticles(ctx, state.bossSnake);
  return { ...state, score: state.score + reward.scoreIncrease, defeated: true };
}

function processBossWeaken(
  ctx: BossCollisionContext,
  state: BossCollisionState,
  hitPosition: Position,
  particleCount: number,
): BossCollisionState {
  const weaken = weakenBossSnake(state.bossSnake, 1);
  ctx.particles.push({
    position: hitPosition,
    color: ctx.activeBoss.visual.color,
    count: particleCount,
  });
  return {
    bossSnake: weaken.newBossSnake,
    score: state.score + weaken.pointsEarned,
    defeated: false,
  };
}

function handleHeadCollision(
  ctx: BossCollisionContext,
  state: BossCollisionState,
  shotPosition: Position,
): BossCollisionState {
  if (canDefeatBoss(state.bossSnake)) {
    return processBossDefeat(ctx, state);
  }
  return processBossWeaken(ctx, state, shotPosition, 10);
}

function handleBodyCollision(
  ctx: BossCollisionContext,
  state: BossCollisionState,
  shotPosition: Position,
): BossCollisionState {
  const weakened = processBossWeaken(ctx, state, shotPosition, 8);
  if (weakened.bossSnake.positions.length <= 1) {
    return processBossDefeat(ctx, weakened);
  }
  return weakened;
}

function processBossCollisions(
  shots: PoisonShot[],
  initialState: BossCollisionState,
  ctx: BossCollisionContext,
): { state: BossCollisionState; shotsToRemove: string[] } {
  const shotsToRemove: string[] = [];
  let state = initialState;

  const len = shots.length;
  for (let i = 0; i < len; i++) {
    if (state.defeated) break;

    const shot = shots[i];
    if (!shot) continue;

    if (hasBossHeadCollision(shot, state.bossSnake)) {
      shotsToRemove.push(shot.id);
      state = handleHeadCollision(ctx, state, shot.position);
    } else if (hasBossBodyCollision(shot, state.bossSnake)) {
      shotsToRemove.push(shot.id);
      state = handleBodyCollision(ctx, state, shot.position);
    }
  }

  return { state, shotsToRemove };
}

function filterShotsByIds(shots: PoisonShot[], idsToRemove: string[]): PoisonShot[] {
  if (idsToRemove.length === 0) return shots;

  const removeSet = new Set(idsToRemove);
  const filtered: PoisonShot[] = [];
  const len = shots.length;
  for (let i = 0; i < len; i++) {
    const shot = shots[i];
    if (shot && !removeSet.has(shot.id)) filtered.push(shot);
  }
  return filtered;
}

function createBossUpdate(
  state: BossCollisionState,
  activeBoss: Chef,
  bossLogicResult: BossLogicResult,
): PoisonLogicResult['bossUpdate'] {
  if (state.defeated) {
    return {
      bossSnake: state.bossSnake,
      activeBoss: undefined,
      newScore: state.score,
      bossAbilityCooldowns: new Map(),
      forcedFoodType: null,
    };
  }
  return {
    bossSnake: state.bossSnake,
    activeBoss,
    newScore: state.score,
    bossAbilityCooldowns: bossLogicResult.bossAbilityCooldowns,
    forcedFoodType: bossLogicResult.forcedFoodType,
  };
}

/**
 * Updates poison shots and handles their interactions with obstacles and boss.
 */
export function handlePoisonShotsUpdate(context: PoisonShotsUpdateContext): PoisonLogicResult {
  const {
    prevPoisonShots,
    pendingShots,
    obstacles,
    gridSize,
    bossLogicResult,
    prevGameState,
    currentTime,
    lastPoisonFireTime,
    isFiringPoison,
    snakeHead,
    direction,
  } = context;

  const result: PoisonLogicResult = {
    newPoisonShots: [],
    pendingPoisonShots: [],
    newObstacles: [...obstacles],
    particlesToSpawn: [],
    bossUpdate: undefined,
  };

  const newPending = processAutoFire(
    pendingShots,
    isFiringPoison,
    currentTime,
    lastPoisonFireTime,
    snakeHead,
    direction,
  );
  const poisonUpdate = updatePoisonShots(
    [...prevPoisonShots, ...newPending],
    gridSize,
    result.newObstacles,
  );

  result.newPoisonShots = poisonUpdate.shots;
  const maxShots = POISON_CONFIG.maxShotsSimultaneous ?? 50;
  if (result.newPoisonShots.length > maxShots) {
    result.newPoisonShots = result.newPoisonShots.slice(-maxShots);
  }

  result.newObstacles = processObstacleDestruction(
    result.newObstacles,
    poisonUpdate.hitObstacles,
    result.particlesToSpawn,
  );

  if (!POISON_CONFIG.canDefeatBoss || !bossLogicResult.bossSnake || !bossLogicResult.activeBoss) {
    return result;
  }

  const collisionCtx: BossCollisionContext = {
    activeBoss: bossLogicResult.activeBoss,
    prevGameState,
    particles: result.particlesToSpawn,
  };

  const initialState: BossCollisionState = {
    bossSnake: bossLogicResult.bossSnake,
    score: bossLogicResult.newScore,
    defeated: false,
  };

  const { state, shotsToRemove } = processBossCollisions(
    result.newPoisonShots,
    initialState,
    collisionCtx,
  );
  result.newPoisonShots = filterShotsByIds(result.newPoisonShots, shotsToRemove);
  result.bossUpdate = createBossUpdate(state, bossLogicResult.activeBoss, bossLogicResult);

  return result;
}

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

export { handleGameStateUpdates } from './game/gameStateUpdates';
export type { GameStateUpdateResult } from './game/gameStateUpdates';
