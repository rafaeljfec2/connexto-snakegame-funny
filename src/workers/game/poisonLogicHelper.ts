import {
  GameState,
  Direction,
  FoodType,
  Position,
  Obstacle,
  BossSnake,
  PoisonShot,
} from '@/types/game';
import { Chef } from '@/types/phases';
import { POISON_CONFIG } from '@/constants/game';
import { handleBossDefeat } from '@/utils/bosses';
import { weakenBossSnake, canDefeatBoss } from '@/utils/bossSnake';
import { destroyObstacles } from '@/utils/obstacleDestruction';
import {
  createPoisonShot,
  updatePoisonShots,
  hasBossHeadCollision,
  hasBossBodyCollision,
} from '@/utils/poison';
import type { BossLogicResult } from './bossLogicHelper';

// --- Types ---
export interface PoisonLogicResult {
  newPoisonShots: PoisonShot[];
  pendingPoisonShots: PoisonShot[];
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
  readonly prevPoisonShots: PoisonShot[];
  readonly pendingShots: PoisonShot[];
  readonly obstacles: Obstacle[];
  readonly gridSize: number;
  readonly bossLogicResult: BossLogicResult;
  readonly prevGameState: GameState;
  readonly currentTime: number;
  readonly lastPoisonFireTime: number;
  readonly isFiringPoison: boolean;
  readonly snakeHead: Position | undefined;
  readonly direction: Direction;
}

// --- Helper Functions ---

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
