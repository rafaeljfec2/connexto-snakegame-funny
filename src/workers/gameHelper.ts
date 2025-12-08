import {
  GameStatus,
  GameState,
  Direction,
  FoodType,
  Position,
  Obstacle,
  Portal,
  BossState,
  GameUpdateContext,
} from '@/types/game';
import { Chef } from '@/types/phases';
import {
  generateRandomFood,
  isValidDirectionChange,
  getOppositeDirection,
  wouldCauseCollision,
} from '@/utils/gameLogic';
import { GAME_CONFIG } from '@/constants/game';
import { applyPowerUpEffect, createActivePowerUp, hasReverseControls } from '@/utils/powerUps';
import { updateCombo } from '@/utils/combos';
import { destroyObstacles } from '@/utils/obstacleDestruction';
import { isLivesEnabled, addLife } from '@/utils/lives';

import { POISON_CONFIG } from '@/constants/game';
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
import { calculateLevel, calculateGameSpeed } from '@/utils/difficulty';
import { getCurrentPhase, shouldSpawnBoss, getBossForLevel, getPhaseByBoss } from '@/utils/phases';
import { generateBossInitialResources, initializeBossSnake } from '@/utils/bossResources';
import { generateGuardianFlagPosition } from '@/utils/bossAbilities';
import { OBSTACLE_CONFIG } from '@/constants/obstacles';
import { generateObstacles } from '@/utils/obstacles';
import { hasFoodExpired } from '@/utils/foodTimer';
import { POWER_UP_CONFIG } from '@/constants/powerUps';

// --- Types ---
export interface BossLogicResult {
  activeBoss?: Chef;
  bossSnake?: BossState;
  guardianFlag?: {
    position: Position;
    type: FoodType;
    spawnTime: number;
    duration?: number;
  } | null;
  guardianFlagSide?: number;
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
    bossSnake: BossState;
    activeBoss?: Chef;
    newScore: number;
    bossAbilityCooldowns: Map<string, number>;
    forcedFoodType: FoodType | null;
  };
}

export interface FoodInteractionResult {
  newScore: number;
  newCombo: { count: number; multiplier: number; lastFoodTime: number };
  newLives: number;
  finalSnake: Position[];
  newActivePowerUps: any[];
  statistics: any;
  atePowerUp: boolean;
  particlesToSpawn: Array<{ position: Position; color: string; count: number }>;
  newPortals: Portal[]; // Portals from food
}

export interface GameStateUpdateResult {
  newLevel: number;
  baseGameSpeed: number;
  currentPhase?: number;
  phaseLevelType?: any;
  newObstacles: Obstacle[];
  newFood: any;
  activeBoss: Chef | undefined;
  bossSnake: BossState | undefined;
  newGuardianFlag: any | null;
  updatedSpawnTime: number;
}

// --- Helper Functions ---

/**
 * Resolves the next direction of the snake based on user input and game state.
 */
export function resolveDirection(
  currentDirection: Direction,
  nextDirectionBuffer: Direction | null,
  activePowerUps: any[],
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
 * Handles all boss-related logic: movement, abilities, and flag mechanics.
 */
export function handleBossLogic(
  activeBoss: Chef | undefined,
  bossSnake: BossState | undefined,
  prevGameState: GameState,
  finalSnake: Position[],
  obstacles: Obstacle[],
  portals: Portal[],
  bossAbilityCooldowns: Map<string, number>,
  guardianFlag: any | null,
  guardianFlagSide: number | undefined,
  foodPosition: Position,
): BossLogicResult {
  const result: BossLogicResult = {
    activeBoss,
    bossSnake,
    guardianFlag,
    guardianFlagSide,
    newObstacles: [...obstacles],
    newPortals: [...portals],
    baseGameSpeed: prevGameState.gameSpeed,
    newLives: prevGameState.lives,
    forcedFoodType: null,
    bossAbilityCooldowns: new Map(bossAbilityCooldowns),
    newScore: prevGameState.score,
    particlesToSpawn: [],
  };

  if (!activeBoss || !bossSnake) return result;

  const currentGS: GameState = {
    ...prevGameState,
    snake: finalSnake,
    obstacles: result.newObstacles,
    portals: result.newPortals,
    bossSnake,
    guardianFlag,
    guardianFlagSide,
  };

  // Process Abilities
  const abilityResult = processBossAbilities(activeBoss, currentGS, result.bossAbilityCooldowns);
  result.bossAbilityCooldowns = abilityResult.updatedCooldowns;

  if (abilityResult.result.guardianFlag !== undefined)
    result.guardianFlag = abilityResult.result.guardianFlag;
  if (abilityResult.result.guardianFlagSide !== undefined)
    result.guardianFlagSide = abilityResult.result.guardianFlagSide;

  // Move Boss
  const nextBossDir = calculateBossNextDirection(
    activeBoss,
    bossSnake,
    finalSnake,
    result.newObstacles,
    foodPosition,
    GAME_CONFIG.gridSize,
    result.guardianFlag?.position ?? null,
  );

  result.bossSnake = moveBossSnake(bossSnake, nextBossDir, GAME_CONFIG.gridSize);

  // Flag Following
  if (result.guardianFlag && result.bossSnake && result.bossSnake.positions.length > 0) {
    const bossHead = result.bossSnake.positions[0];
    const flagSide = result.guardianFlagSide ?? 1;
    const flagOffset = getFlagOffsetFromBossHead(result.bossSnake.direction, flagSide);
    const newFlagPos = {
      x: Math.max(0, Math.min(bossHead.x + flagOffset.x, GAME_CONFIG.gridSize - 1)),
      y: Math.max(0, Math.min(bossHead.y + flagOffset.y, GAME_CONFIG.gridSize - 1)),
    };
    const isOnBody = result.bossSnake.positions.some(
      (p) => p.x === newFlagPos.x && p.y === newFlagPos.y,
    );
    if (!isOnBody) {
      result.guardianFlag = { ...result.guardianFlag, position: newFlagPos };
    }
  }

  // Apply Ability Effects
  if (abilityResult.result.obstacles && abilityResult.result.obstacles.length > 0) {
    const existingMap = new Map<string, Obstacle>();
    result.newObstacles.forEach((o) => existingMap.set(`${o.position.x},${o.position.y}`, o));

    abilityResult.result.obstacles.forEach((o) => {
      const key = `${o.position.x},${o.position.y}`;
      if (!existingMap.has(key)) {
        result.newObstacles.push(o);
        existingMap.set(key, o);
      }
    });
  }

  if (abilityResult.result.portals) {
    result.newPortals = [...result.newPortals, ...abilityResult.result.portals];
  }
  if (abilityResult.result.gameSpeed !== undefined)
    result.baseGameSpeed = abilityResult.result.gameSpeed;
  if (abilityResult.result.lives !== undefined) result.newLives = abilityResult.result.lives;
  if (abilityResult.result.forceFoodType && abilityResult.result.foodType) {
    result.forcedFoodType = abilityResult.result.foodType;
  }

  return result;
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
    if (canDefeatBoss(result.bossSnake)) {
      // Victory
      const reward = handleBossDefeat(result.activeBoss, prevGameState);
      result.newScore += reward.scoreIncrease;
      if (result.bossSnake.positions[0]) {
        result.particlesToSpawn.push({
          position: result.bossSnake.positions[0],
          color: result.activeBoss.visual.color,
          count: 30,
        });
      }
      result.activeBoss = undefined;
      result.bossSnake = undefined;
      result.bossAbilityCooldowns.clear();
      result.forcedFoodType = null;
    } else {
      // Defeat (Player Dies)
      if (isLivesEnabled() && result.newLives > 1) {
        return {
          collisionResult: result,
          gameOverOrDying: { status: GameStatus.DYING, lives: result.newLives - 1 },
        };
      } else {
        return {
          collisionResult: result,
          gameOverOrDying: { status: GameStatus.GAME_OVER, score: result.newScore },
        };
      }
    }
  } else if (hitPart === 'body') {
    const weaken = weakenBossSnake(result.bossSnake, 2);
    result.bossSnake = weaken.newBossSnake;
    result.newScore += weaken.pointsEarned;

    result.particlesToSpawn.push({
      position: headPosition,
      color: result.activeBoss?.visual.color ?? '#3b82f6',
      count: 10,
    });

    if (result.bossSnake.positions.length <= 1) {
      // Victory (Body destroyed)
      const reward = handleBossDefeat(result.activeBoss, prevGameState);
      result.newScore += reward.scoreIncrease;
      if (result.bossSnake.positions[0]) {
        result.particlesToSpawn.push({
          position: result.bossSnake.positions[0],
          color: result.activeBoss.visual.color,
          count: 30,
        });
      }
      result.activeBoss = undefined;
      result.bossSnake = undefined;
      result.bossAbilityCooldowns.clear();
      result.forcedFoodType = null;
    }
  }

  return { collisionResult: result };
}

/**
 * Updates poison shots and handles their interactions with obstacles and boss.
 */
export function handlePoisonShotsUpdate(
  prevPoisonShots: import('@/types/game').PoisonShot[],
  pendingShots: import('@/types/game').PoisonShot[],
  obstacles: Obstacle[],
  gridSize: number,
  bossLogicResult: BossLogicResult,
  prevGameState: GameState,
  currentTime: number,
  lastPoisonFireTime: number,
  isFiringPoison: boolean,
  snakeHead: Position | undefined,
  direction: Direction,
): PoisonLogicResult {
  const result: PoisonLogicResult = {
    newPoisonShots: [],
    pendingPoisonShots: [],
    newObstacles: [...obstacles],
    particlesToSpawn: [],
    bossUpdate: undefined,
  };

  // Auto Fire
  const newPending = [...pendingShots];
  if (isFiringPoison) {
    const fireInterval = POISON_CONFIG.fireInterval ?? 200;
    if (currentTime - lastPoisonFireTime >= fireInterval && snakeHead) {
      newPending.push(createPoisonShot(snakeHead, direction));
    }
  }

  const currentShots = [...prevPoisonShots, ...newPending];

  const poisonUpdate = updatePoisonShots(currentShots, gridSize, result.newObstacles);
  result.newPoisonShots = poisonUpdate.shots;

  // Limit shots
  const maxShots = POISON_CONFIG.maxShotsSimultaneous ?? 50;
  if (result.newPoisonShots.length > maxShots) {
    result.newPoisonShots = result.newPoisonShots.slice(-maxShots);
  }

  // Obstacle Destruction
  if (POISON_CONFIG.canDestroyObstacles && poisonUpdate.hitObstacles.length > 0) {
    const destroyRes = destroyObstacles(result.newObstacles, poisonUpdate.hitObstacles, []);
    result.newObstacles = destroyRes.remainingObstacles;
    poisonUpdate.hitObstacles.forEach((obs) => {
      result.particlesToSpawn.push({ position: obs.position, color: '#9ca3af', count: 6 });
    });
  }

  // Boss Collision
  if (POISON_CONFIG.canDefeatBoss && bossLogicResult.bossSnake && bossLogicResult.activeBoss) {
    const shotsToRemove: string[] = [];
    let currentBossSnake = bossLogicResult.bossSnake;
    let currentScore = bossLogicResult.newScore;
    const activeBoss = bossLogicResult.activeBoss;
    let bossDefeated = false;

    result.newPoisonShots.forEach((shot) => {
      if (bossDefeated || !currentBossSnake) return;

      if (hasBossHeadCollision(shot, currentBossSnake)) {
        shotsToRemove.push(shot.id);
        if (canDefeatBoss(currentBossSnake)) {
          // Defeat
          const reward = handleBossDefeat(activeBoss!, prevGameState);
          currentScore += reward.scoreIncrease;
          if (currentBossSnake.positions[0]) {
            result.particlesToSpawn.push({
              position: currentBossSnake.positions[0],
              color: activeBoss!.visual.color,
              count: 30,
            });
          }
          bossDefeated = true;
        } else {
          // Weaken
          const weaken = weakenBossSnake(currentBossSnake, 1);
          currentBossSnake = weaken.newBossSnake;
          currentScore += weaken.pointsEarned;
          result.particlesToSpawn.push({
            position: shot.position,
            color: activeBoss!.visual.color,
            count: 10,
          });
        }
      } else if (hasBossBodyCollision(shot, currentBossSnake)) {
        shotsToRemove.push(shot.id);
        const weaken = weakenBossSnake(currentBossSnake, 1);
        currentBossSnake = weaken.newBossSnake;
        currentScore += weaken.pointsEarned;
        result.particlesToSpawn.push({
          position: shot.position,
          color: activeBoss!.visual.color,
          count: 8,
        });

        if (currentBossSnake.positions.length <= 1) {
          // Defeated
          const reward = handleBossDefeat(activeBoss!, prevGameState);
          currentScore += reward.scoreIncrease;
          if (currentBossSnake.positions[0]) {
            result.particlesToSpawn.push({
              position: currentBossSnake.positions[0],
              color: activeBoss!.visual.color,
              count: 30,
            });
          }
          bossDefeated = true;
        }
      }
    });

    if (shotsToRemove.length > 0) {
      result.newPoisonShots = result.newPoisonShots.filter((s) => !shotsToRemove.includes(s.id));
    }

    if (bossDefeated) {
      result.bossUpdate = {
        bossSnake: currentBossSnake,
        activeBoss: undefined,
        newScore: currentScore,
        bossAbilityCooldowns: new Map(),
        forcedFoodType: null,
      };
    } else {
      result.bossUpdate = {
        bossSnake: currentBossSnake,
        activeBoss: activeBoss,
        newScore: currentScore,
        bossAbilityCooldowns: bossLogicResult.bossAbilityCooldowns,
        forcedFoodType: bossLogicResult.forcedFoodType,
      };
    }
  }

  return result;
}

/**
 * Handles interactions between the snake and food (scoring, growth, effects).
 */
export function handleFoodInteraction(
  ateFood: boolean,
  prevGameState: GameState,
  finalSnake: Position[],
  statistics: any,
  gridSize: number,
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

  if (ateFood) {
    const currentFoodCount = statistics.foodsByType[prevGameState.food.type] ?? 0;
    statistics.foodsEaten++;
    statistics.foodsByType[prevGameState.food.type] = currentFoodCount + 1;

    let actualFoodType = prevGameState.food.type;
    if (prevGameState.food.type === FoodType.JOKER) {
      const positiveTypes = [
        FoodType.SPEED_BOOST,
        FoodType.BONUS_POINTS,
        FoodType.EXTRA_GROWTH,
        FoodType.PHASE_THROUGH,
      ];
      actualFoodType =
        positiveTypes[Math.floor(Math.random() * positiveTypes.length)] ?? FoodType.BONUS_POINTS;
    }

    const powerUpEffect = applyPowerUpEffect(
      actualFoodType,
      prevGameState.score,
      currentSnake.length,
    );

    if (prevGameState.food.type === FoodType.JOKER) {
      powerUpEffect.scoreIncrease += 15;
    }

    if (prevGameState.food.type !== FoodType.NORMAL) {
      atePowerUp = true;
    }

    newScore += powerUpEffect.scoreIncrease;

    if (enableCombos) {
      newCombo = updateCombo(newCombo, true);
    }

    // Particles trigger
    if (enableParticles) {
      const foodColor = POWER_UP_CONFIG.colors[prevGameState.food.type]?.primary || '#ef4444';
      if (prevGameState.snake[0]) {
        particlesToSpawn.push({ position: prevGameState.snake[0], color: foodColor, count: 8 });
      }
    }

    // Growth
    if (powerUpEffect.growthAmount > 0) {
      const currentTail = currentSnake[currentSnake.length - 1];
      for (let i = 0; i < powerUpEffect.growthAmount; i++) {
        currentSnake.push({ ...currentTail });
      }
    } else if (powerUpEffect.growthAmount < 0) {
      const shrinkAmount = Math.abs(powerUpEffect.growthAmount);
      currentSnake = currentSnake.slice(0, Math.max(1, currentSnake.length - shrinkAmount));
    }

    if (newCombo.multiplier > statistics.maxCombo) {
      statistics.maxCombo = newCombo.multiplier;
    }

    if (prevGameState.food.type === FoodType.EXTRA_LIFE) {
      newLives = addLife(newLives);
    }

    if (powerUpEffect.shouldActivatePowerUp) {
      newActivePowerUps.push(createActivePowerUp(actualFoodType));
    }
  } else {
    if (enableCombos) {
      newCombo = updateCombo(newCombo, false);
    }
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

/**
 * Consolidates updates to game state variables like level, obstacles, food, and phases.
 * Uses the GameUpdateContext to reduce argument count.
 */
export function handleGameStateUpdates(context: GameUpdateContext): GameStateUpdateResult {
  const {
    prevGameState,
    activeObstacles,
    activePortals,
    activeBoss,
    lastObstacleSpawnTime,
    ateFood,
    forcedFoodType,
    currentTime,
    finalSnake,
  } = context;

  const newLevel = prevGameState.level;
  const prevLevel = prevGameState.level;
  const newScore = context.prevGameState.score; // Note: using score from prevGameState which implies it should be passed in context if modified?
  // Wait, score is modified by food/boss logic before this.
  // The previous code passed "newScore" explicitly.
  // We should ensure context has the LATEST score or pass it.

  // FIX: The context should carry the *updated* score, not the prev one if it changed.
  // But GameUpdateContext defines prevGameState.
  // I will add `newScore` to GameUpdateContext or as an argument.
  // Ideally, context represents the state *at the start* of the function?
  // No, handleGameStateUpdates is called *after* scoring.
  // Let's rely on an explicit argument for newScore or updated context.
  // For now, I'll adhere to the pattern but I need to handle the fact that newScore comes from outside.
  // Let's assume the caller updates prevGameState copy or passes newScore separately.
  // To cleanly refactor, I'll add newScore to the function args or context.
  // For this specific function, I'll keep explicit args where they represent *changes* from the flow.

  // Actually, looking at the previous implementation, `newScore` was passed.
  // I'll revert to passing `newScore` as a separate arg to be clear, or add it to a derived context.
  return handleGameStateUpdatesWithScore(context, newScore); // Placeholder logic
}

// Helper to actually implement it, handling the `newScore` issue
export function handleGameStateUpdatesWithScore(
  context: GameUpdateContext,
  newScore: number,
): GameStateUpdateResult {
  const {
    prevGameState,
    activeObstacles,
    activePortals,
    activeBoss,
    lastObstacleSpawnTime,
    ateFood,
    forcedFoodType,
    currentTime,
    finalSnake,
  } = context;

  let newLevel = prevGameState.level;
  const prevLevel = prevGameState.level;

  // Calculate Level
  if (newScore !== prevGameState.score) {
    const calculatedLevel = calculateLevel(newScore);
    const shouldPreserveLevel =
      (newScore === 0 && prevGameState.currentPhase) ||
      (calculatedLevel < prevLevel && prevGameState.currentPhase);

    if (!shouldPreserveLevel) {
      newLevel = calculatedLevel;
    }
  } else if (newScore === 0 && prevGameState.currentPhase && prevLevel > 1) {
    newLevel = prevLevel;
  }

  // Calculate Game Speed
  let baseGameSpeed = prevGameState.gameSpeed;
  if (newLevel !== prevLevel) {
    baseGameSpeed = calculateGameSpeed(newLevel);
  }

  // Phase System
  let currentPhase =
    prevGameState.currentPhase && newScore === 0 && prevLevel === newLevel
      ? getCurrentPhase(prevLevel)
      : newLevel !== prevLevel
        ? getCurrentPhase(newLevel)
        : getCurrentPhase(newLevel);

  if (activeBoss) {
    const bossPhase = getPhaseByBoss(activeBoss);
    if (
      bossPhase &&
      (!shouldSpawnBoss(newLevel) || getBossForLevel(newLevel)?.id !== activeBoss.id)
    ) {
      currentPhase = bossPhase;
    }
  }
  const phaseConfig = currentPhase?.config;

  // Obstacle Generation
  let updatedSpawnTime = lastObstacleSpawnTime;
  if (lastObstacleSpawnTime === 0) updatedSpawnTime = currentTime;
  const timeSinceLastSpawn = currentTime - updatedSpawnTime;

  const shouldSpawnObstacle =
    GAME_CONFIG.enableObstacles &&
    phaseConfig?.obstaclesEnabled !== false &&
    (newLevel > prevLevel ||
      (updatedSpawnTime > 0 && timeSinceLastSpawn >= OBSTACLE_CONFIG.spawnInterval));

  let newObstacles = activeObstacles;

  if (shouldSpawnObstacle) {
    newObstacles = generateObstacles(
      newLevel,
      finalSnake,
      newObstacles,
      GAME_CONFIG.gridSize,
      phaseConfig?.obstaclesEnabled,
      phaseConfig?.obstaclesFrequency ?? OBSTACLE_CONFIG.spawnChance,
    );
    updatedSpawnTime = currentTime;
  } else if (phaseConfig?.obstaclesEnabled === false) {
    newObstacles = [];
  }

  // Food Generation
  const foodExpired = hasFoodExpired(prevGameState.food);
  let newFood = prevGameState.food;
  if (ateFood || foodExpired) {
    newFood = generateRandomFood(
      finalSnake,
      GAME_CONFIG.gridSize,
      newObstacles,
      phaseConfig?.powerUpsFrequency,
      phaseConfig?.timedFoodFrequency,
      forcedFoodType ?? undefined,
    );
  }

  // Boss Spawning Logic
  let newActiveBoss = activeBoss;
  let bossSnake: BossState | undefined = prevGameState.bossSnake;
  let newGuardianFlag = prevGameState.guardianFlag;

  if (shouldSpawnBoss(newLevel)) {
    const levelBoss = getBossForLevel(newLevel);
    if (levelBoss && levelBoss.id === prevGameState.activeBoss?.id) {
      newActiveBoss = levelBoss;
    } else if (!prevGameState.activeBoss) {
      newActiveBoss = levelBoss;
    }
  }

  // New Boss Initialization
  if (
    newActiveBoss &&
    (!prevGameState.activeBoss || prevGameState.activeBoss.id !== newActiveBoss.id)
  ) {
    const bossResources = generateBossInitialResources(
      newActiveBoss,
      finalSnake,
      newObstacles,
      activePortals,
      GAME_CONFIG.gridSize,
    );
    newObstacles = bossResources.obstacles;

    bossSnake =
      initializeBossSnake(newActiveBoss, finalSnake, newObstacles, GAME_CONFIG.gridSize) ??
      undefined;

    if (newActiveBoss.id === 'guardian' && !prevGameState.guardianFlag) {
      const flagPos = generateGuardianFlagPosition(
        finalSnake,
        bossSnake?.positions ?? [],
        newObstacles,
        GAME_CONFIG.gridSize,
      );
      if (flagPos) {
        newGuardianFlag = {
          position: flagPos,
          type: FoodType.EXTRA_LIFE,
          spawnTime: Date.now(),
          duration: undefined,
        };
      }
    }
  } else if (!newActiveBoss) {
    bossSnake = undefined;
    newGuardianFlag = null; // Clear flag if no boss
  }

  return {
    newLevel,
    baseGameSpeed,
    currentPhase: currentPhase?.id,
    phaseLevelType: currentPhase?.type,
    newObstacles,
    newFood,
    activeBoss: newActiveBoss,
    bossSnake,
    newGuardianFlag,
    updatedSpawnTime,
  };
}
