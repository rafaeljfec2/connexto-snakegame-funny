import {
  GameStatus,
  GameState,
  FoodType,
  Position,
  Obstacle,
  Portal,
  BossSnake,
  Food,
} from '@/types/game';
import { Chef } from '@/types/phases';
import { GAME_CONFIG } from '@/constants/game';
import { isLivesEnabled } from '@/utils/lives';
import { handleBossDefeat } from '@/utils/bosses';
import {
  moveBossSnake,
  calculateBossNextDirection,
  getBossHitPart,
  weakenBossSnake,
  canDefeatBoss,
} from '@/utils/bossSnake';
import { processBossAbilities, getFlagOffsetFromBossHead } from '@/utils/bossAbilities';

// --- Types ---
export interface BossLogicContext {
  readonly activeBoss: Chef | undefined;
  readonly bossSnake: BossSnake | undefined;
  readonly prevGameState: GameState;
  readonly finalSnake: Position[];
  readonly obstacles: Obstacle[];
  readonly portals: Portal[];
  readonly bossAbilityCooldowns: Map<string, number>;
  readonly guardianFlag: Food | null;
  readonly guardianFlagSide: -1 | 1 | undefined;
  readonly foodPosition: Position;
}

interface InitializeBossResultParams {
  readonly activeBoss: Chef | undefined;
  readonly bossSnake: BossSnake | undefined;
  readonly prevGameState: GameState;
  readonly obstacles: Obstacle[];
  readonly portals: Portal[];
  readonly bossAbilityCooldowns: Map<string, number>;
  readonly guardianFlag: Food | null;
  readonly guardianFlagSide: -1 | 1 | undefined;
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

// --- Helper Functions ---

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
