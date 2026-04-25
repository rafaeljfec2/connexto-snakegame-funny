import { BossSnake, Food, FoodType, GameUpdateContext } from '@/types/game';
import { Chef, PhaseLevelType, PhaseType } from '@/types/phases';
import { GAME_CONFIG } from '@/constants/game';
import { OBSTACLE_CONFIG } from '@/constants/obstacles';
import { calculateLevel, calculateGameSpeed } from '@/utils/difficulty';
import { getCurrentPhase, shouldSpawnBoss, getBossForLevel, getPhaseByBoss } from '@/utils/phases';
import { generateBossInitialResources } from '@/utils/bossResources';
import { generateGuardianFlagPosition } from '@/utils/bossAbilities';
import { generateObstacles } from '@/utils/obstacles';
import { generateRandomFood } from '@/utils/gameLogic';
import { hasFoodExpired } from '@/utils/foodTimer';
import { initializeBossSnake } from '@/utils/bossSnake';
import type { Obstacle } from '@/types/game';
import { emitSfx } from './gameSfx';

export interface GameStateUpdateResult {
  newLevel: number;
  baseGameSpeed: number;
  currentPhase?: number;
  phaseLevelType?: PhaseLevelType;
  newObstacles: Obstacle[];
  newFood: Food;
  activeBoss?: Chef;
  bossSnake?: BossSnake;
  newGuardianFlag: Food | null;
  updatedSpawnTime: number;
}

/**
 * Calculate the new level based on score
 */
function calculateNewLevel(
  newScore: number,
  prevScore: number,
  prevLevel: number,
  currentPhase: number | undefined,
): number {
  if (newScore === prevScore) {
    if (newScore === 0 && currentPhase && prevLevel > 1) {
      return prevLevel;
    }
    return prevLevel;
  }

  const calculatedLevel = calculateLevel(newScore);
  const shouldPreserveLevel =
    (newScore === 0 && currentPhase) || (calculatedLevel < prevLevel && currentPhase);

  return shouldPreserveLevel ? prevLevel : calculatedLevel;
}

/**
 * Calculate game speed based on level
 */
function calculateNewGameSpeed(newLevel: number, prevLevel: number, prevGameSpeed: number): number {
  if (newLevel === prevLevel) {
    return prevGameSpeed;
  }
  return calculateGameSpeed(newLevel);
}

/**
 * Determine the current phase
 */
function determineCurrentPhase(
  newLevel: number,
  prevLevel: number,
  newScore: number,
  prevPhase: number | undefined,
  activeBoss?: Chef,
): PhaseType | undefined {
  let currentPhase: PhaseType | undefined;

  if (prevPhase && newScore === 0 && prevLevel === newLevel) {
    currentPhase = getCurrentPhase(prevLevel);
  } else {
    currentPhase = getCurrentPhase(newLevel);
  }

  if (activeBoss) {
    const bossPhase = getPhaseByBoss(activeBoss);
    if (bossPhase) {
      const levelBoss = getBossForLevel(newLevel);
      const isBossStillActive = levelBoss?.id === activeBoss.id;
      const shouldSpawnNewBoss = shouldSpawnBoss(newLevel);

      if (!shouldSpawnNewBoss || !isBossStillActive) {
        currentPhase = bossPhase;
      }
    }
  }

  return currentPhase;
}

/**
 * Handle obstacle generation
 */
function handleObstacleGeneration(
  context: GameUpdateContext,
  newLevel: number,
  prevLevel: number,
  currentPhase: PhaseType | undefined,
): { newObstacles: Obstacle[]; updatedSpawnTime: number } {
  const phaseConfig = currentPhase?.config;
  let updatedSpawnTime = context.lastObstacleSpawnTime;
  if (updatedSpawnTime === 0) updatedSpawnTime = context.currentTime;

  const timeSinceLastSpawn = context.currentTime - updatedSpawnTime;

  const shouldSpawnObstacle =
    GAME_CONFIG.enableObstacles &&
    phaseConfig?.obstaclesEnabled !== false &&
    (newLevel > prevLevel ||
      (updatedSpawnTime > 0 && timeSinceLastSpawn >= OBSTACLE_CONFIG.spawnInterval));

  let newObstacles = context.activeObstacles;

  if (shouldSpawnObstacle) {
    newObstacles = generateObstacles(
      newLevel,
      context.finalSnake,
      newObstacles,
      GAME_CONFIG.gridSize,
      phaseConfig?.obstaclesEnabled,
      phaseConfig?.obstaclesFrequency ?? OBSTACLE_CONFIG.spawnChance,
    );
    updatedSpawnTime = context.currentTime;
  } else if (phaseConfig?.obstaclesEnabled === false) {
    newObstacles = [];
  }

  return { newObstacles, updatedSpawnTime };
}

/**
 * Handle food generation
 */
function handleFoodGeneration(
  context: GameUpdateContext,
  newObstacles: Obstacle[],
  currentPhase: PhaseType | undefined,
): Food {
  const phaseConfig = currentPhase?.config;
  const foodExpired = hasFoodExpired(context.prevGameState.food);
  if (!context.ateFood && !foodExpired) {
    return context.prevGameState.food;
  }

  if (foodExpired && !context.ateFood) {
    emitSfx('food.timed.expire');
  }

  return generateRandomFood(
    context.finalSnake,
    GAME_CONFIG.gridSize,
    newObstacles,
    phaseConfig?.powerUpsFrequency,
    phaseConfig?.timedFoodFrequency,
    context.forcedFoodType ?? undefined,
  );
}

/**
 * Handle boss spawning logic
 */
function handleBossSpawning(
  newLevel: number,
  prevActiveBoss?: Chef,
): { newActiveBoss?: Chef; shouldInitialize: boolean } {
  if (!shouldSpawnBoss(newLevel)) {
    return { newActiveBoss: prevActiveBoss, shouldInitialize: false };
  }

  const levelBoss = getBossForLevel(newLevel);
  if (!levelBoss) {
    return { newActiveBoss: prevActiveBoss, shouldInitialize: false };
  }

  if (levelBoss.id === prevActiveBoss?.id) {
    return { newActiveBoss: levelBoss, shouldInitialize: false };
  }

  if (!prevActiveBoss) {
    return { newActiveBoss: levelBoss, shouldInitialize: true };
  }

  return { newActiveBoss: levelBoss, shouldInitialize: true };
}

/**
 * Initialize boss resources
 */
function initializeBossResources(
  newActiveBoss: Chef,
  context: GameUpdateContext,
  newObstacles: Obstacle[],
): {
  obstacles: Obstacle[];
  bossSnake?: BossSnake;
  guardianFlag: Food | null;
} {
  const bossResources = generateBossInitialResources(
    newActiveBoss,
    context.finalSnake,
    newObstacles,
    context.activePortals,
    GAME_CONFIG.gridSize,
  );

  const updatedObstacles = bossResources.obstacles;
  const bossSnake =
    initializeBossSnake(
      newActiveBoss,
      context.finalSnake,
      updatedObstacles,
      GAME_CONFIG.gridSize,
    ) ?? undefined;

  let guardianFlag: Food | null = null;
  if (newActiveBoss.id === 'guardian' && !context.prevGameState.guardianFlag) {
    const flagPos = generateGuardianFlagPosition(
      context.finalSnake,
      bossSnake?.positions ?? [],
      updatedObstacles,
      GAME_CONFIG.gridSize,
    );
    if (flagPos) {
      guardianFlag = {
        position: flagPos,
        type: FoodType.EXTRA_LIFE,
        spawnTime: Date.now(),
        duration: undefined,
      };
    }
  }

  return {
    obstacles: updatedObstacles,
    bossSnake,
    guardianFlag,
  };
}

/**
 * Main function to handle game state updates
 */
export function handleGameStateUpdates(
  context: GameUpdateContext,
  newScore: number,
): GameStateUpdateResult {
  const { prevGameState, activeBoss } = context;

  // 1. Calculate Level
  const newLevel = calculateNewLevel(
    newScore,
    prevGameState.score,
    prevGameState.level,
    prevGameState.currentPhase,
  );
  const prevLevel = prevGameState.level;

  // 2. Calculate Game Speed
  const baseGameSpeed = calculateNewGameSpeed(newLevel, prevLevel, prevGameState.gameSpeed);

  // 3. Determine Phase
  const currentPhase = determineCurrentPhase(
    newLevel,
    prevLevel,
    newScore,
    prevGameState.currentPhase,
    activeBoss,
  );

  if (currentPhase?.id !== prevGameState.currentPhase) {
    if (prevGameState.currentPhase !== undefined) emitSfx('phase.complete');
    if (currentPhase?.id !== undefined) emitSfx('phase.intro');
  }

  // 4. Handle Obstacle Generation
  const obstacleResult = handleObstacleGeneration(context, newLevel, prevLevel, currentPhase);

  // 5. Handle Food Generation
  const newFood = handleFoodGeneration(context, obstacleResult.newObstacles, currentPhase);

  // 6. Handle Boss Spawning
  const bossSpawning = handleBossSpawning(newLevel, prevGameState.activeBoss);
  const newActiveBoss = bossSpawning.newActiveBoss;
  let bossSnake: BossSnake | undefined = prevGameState.bossSnake;
  let newGuardianFlag: Food | null = prevGameState.guardianFlag ?? null;

  // 7. Initialize Boss Resources if needed
  if (bossSpawning.shouldInitialize && newActiveBoss) {
    const bossResources = initializeBossResources(
      newActiveBoss,
      context,
      obstacleResult.newObstacles,
    );
    obstacleResult.newObstacles = bossResources.obstacles;
    bossSnake = bossResources.bossSnake;
    newGuardianFlag = bossResources.guardianFlag;
  } else if (!newActiveBoss) {
    bossSnake = undefined;
    newGuardianFlag = null;
  }

  return {
    newLevel,
    baseGameSpeed,
    currentPhase: currentPhase?.id,
    phaseLevelType: currentPhase?.type,
    newObstacles: obstacleResult.newObstacles,
    newFood,
    activeBoss: newActiveBoss,
    bossSnake,
    newGuardianFlag: newGuardianFlag ?? null,
    updatedSpawnTime: obstacleResult.updatedSpawnTime,
  };
}
