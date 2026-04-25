import { GameStatus, Direction, FoodType } from '@/types/game';
import { INITIAL_SNAKE_POSITION, INITIAL_DIRECTION, GAME_CONFIG } from '@/constants/game';
import { CHEFS } from '@/constants/phases';
import { getCurrentPhase } from '@/utils/phases';
import { calculateGameSpeed } from '@/utils/difficulty';
import { generateRandomFood } from '@/utils/gameLogic';
import { initializeBossSnake } from '@/utils/bossSnake';
import { generateBossInitialResources } from '@/utils/bossResources';
import { generateGuardianFlagPosition } from '@/utils/bossAbilities';
import { createPoisonShot } from '@/utils/poison';
import { createPhaseStartSnapshot } from '@/utils/phaseStatistics';
import { logger, LogContext } from '@/utils/logger';
import type { WorkerState } from './gameState';
import { emitSfx } from './gameSfx';

/**
 * Handle resume after death
 */
export function handleResumeAfterDeath(
  state: WorkerState,
  startGameLoop: () => void,
  stopGameLoop: () => void,
  broadcastState: () => void,
): void {
  if (!state.gameState) return;

  if (state.gameState.lives > 0) {
    state.gameState = {
      ...state.gameState,
      snake: [...INITIAL_SNAKE_POSITION],
      direction: INITIAL_DIRECTION,
      nextDirection: INITIAL_DIRECTION,
      status: GameStatus.PLAYING,
    };

    state.lastUpdateTime = performance.now();
    startGameLoop();
  } else {
    state.gameState.status = GameStatus.GAME_OVER;
    stopGameLoop();
  }
  broadcastState();
}

/**
 * Handle spawn boss
 */
export function handleSpawnBoss(
  state: WorkerState,
  bossId: string | null,
  broadcastState: () => void,
): void {
  if (!state.gameState) return;

  if (bossId === null) {
    // Despawn boss
    const levelPhase = getCurrentPhase(state.gameState.level);
    state.gameState.activeBoss = undefined;
    state.gameState.bossSnake = undefined;
    state.gameState.currentPhase = levelPhase?.id;
    state.gameState.phaseLevelType = levelPhase?.type;
    state.gameState.guardianFlag = null;
    return;
  }

  const boss = CHEFS.find((c) => c.id === bossId);
  if (boss) {
    state.gameState.activeBoss = boss;
    emitSfx('boss.spawn');

    // Clean up existing boss/resources if any
    state.bossAbilityCooldowns.clear();
    state.forcedFoodType = null;
    state.gameState.guardianFlag = null;

    const bossResources = generateBossInitialResources(
      boss,
      state.gameState.snake,
      state.gameState.obstacles,
      state.gameState.portals,
      GAME_CONFIG.gridSize,
    );

    state.gameState.obstacles = bossResources.obstacles;
    state.gameState.portals = bossResources.portals;

    state.gameState.bossSnake =
      initializeBossSnake(
        boss,
        state.gameState.snake,
        state.gameState.obstacles,
        GAME_CONFIG.gridSize,
      ) ?? undefined;

    if (boss.id === 'guardian') {
      const flagPos = generateGuardianFlagPosition(
        state.gameState.snake,
        state.gameState.bossSnake?.positions ?? [],
        state.gameState.obstacles,
        GAME_CONFIG.gridSize,
      );
      if (flagPos) {
        state.gameState.guardianFlag = {
          position: flagPos,
          type: FoodType.EXTRA_LIFE,
          spawnTime: Date.now(),
          duration: undefined,
        };
      }
    }
  }
  broadcastState();
}

/**
 * Handle select phase
 */
export function handleSelectPhase(
  state: WorkerState,
  phaseId: number,
  stopGameLoop: () => void,
  broadcastState: () => void,
): void {
  if (!state.gameState) return;
  const phase = getCurrentPhase((phaseId - 1) * 5 + 1);
  if (!phase) return;

  const phaseStartLevel = (phaseId - 1) * 5 + 1;
  const nextSpeed = calculateGameSpeed(phaseStartLevel);

  const initialSnake = [...INITIAL_SNAKE_POSITION];
  const initialFood = generateRandomFood(initialSnake, GAME_CONFIG.gridSize, []);

  const phaseSnapshot = createPhaseStartSnapshot({
    ...state.gameState,
    level: phaseStartLevel,
    snake: initialSnake,
    score: 0,
  });

  state.gameState = {
    ...state.gameState,
    snake: initialSnake,
    food: initialFood,
    direction: INITIAL_DIRECTION,
    nextDirection: INITIAL_DIRECTION,
    level: phaseStartLevel,
    score: 0,
    gameSpeed: nextSpeed,
    status: GameStatus.PHASE_INTRO,
    currentPhase: phase.id,
    phaseLevelType: phase.type,
    phaseStartSnapshot: phaseSnapshot,
    obstacles: [],
    portals: [],
    activeBoss: undefined,
    bossSnake: undefined,
    activePowerUps: [],
    poisonShots: [],
    guardianFlag: null,
    guardianFlagSide: undefined,
    combo: { count: 0, multiplier: 1, lastFoodTime: 0 },
    isSpeedBoosted: false,
    isFiringPoison: false,
  };

  stopGameLoop();
  broadcastState();
  logger.info(
    { context: LogContext.PHASE, phaseId, level: phaseStartLevel },
    'Phase selected manually',
  );
}

/**
 * Handle next phase
 */
export function handleNextPhase(
  state: WorkerState,
  phaseNumber: number,
  stopGameLoop: () => void,
  broadcastState: () => void,
): void {
  if (!state.gameState) return;

  if (phaseNumber <= 10) {
    const nextPhaseStartLevel = (phaseNumber - 1) * 5 + 1;
    const nextPhase = getCurrentPhase(nextPhaseStartLevel);
    const nextSpeed = calculateGameSpeed(nextPhaseStartLevel);

    const initialSnake = [...INITIAL_SNAKE_POSITION];
    const initialFood = generateRandomFood(initialSnake, GAME_CONFIG.gridSize, []);

    const nextPhaseSnapshot = createPhaseStartSnapshot({
      ...state.gameState,
      level: nextPhaseStartLevel,
      snake: initialSnake,
      score: 0,
    });

    state.gameState = {
      ...state.gameState,
      snake: initialSnake,
      food: initialFood,
      direction: INITIAL_DIRECTION,
      nextDirection: INITIAL_DIRECTION,
      level: nextPhaseStartLevel,
      score: 0,
      gameSpeed: nextSpeed,
      status: GameStatus.PHASE_INTRO,
      currentPhase: nextPhase?.id,
      phaseLevelType: nextPhase?.type,
      phaseStartSnapshot: nextPhaseSnapshot,
      obstacles: [],
      portals: [],
      activeBoss: undefined,
      bossSnake: undefined,
      activePowerUps: [],
      poisonShots: [],
      guardianFlag: null,
      guardianFlagSide: undefined,
      combo: { count: 0, multiplier: 1, lastFoodTime: 0 },
      isSpeedBoosted: false,
      isFiringPoison: false,
    };
    stopGameLoop();
    logger.info({ context: LogContext.PHASE, phaseNumber }, 'Proceeding to next phase');
  } else {
    state.gameState.status = GameStatus.GAME_OVER;
    stopGameLoop();
    logger.info({ context: LogContext.GAME_STATE }, 'Game completed (all phases finished)');
  }
  broadcastState();
}

/**
 * Handle set phase complete
 */
export function handleSetPhaseComplete(
  state: WorkerState,
  defeatedBossPhaseNumber: number | undefined,
  stopGameLoop: () => void,
  broadcastState: () => void,
): void {
  if (!state.gameState) return;

  const currentPhaseNumber = defeatedBossPhaseNumber ?? (state.gameState.currentPhase || 1);
  const phaseStartLevel = (currentPhaseNumber - 1) * 5 + 1;

  const snapshot = state.gameState.phaseStartSnapshot ?? {
    startTime: state.gameState.statistics?.startTime ?? Date.now() - 60000,
    startScore: Math.max(0, state.gameState.score - 500),
    startLevel: phaseStartLevel,
    startStatistics: state.gameState.statistics
      ? {
          ...state.gameState.statistics,
          foodsEaten: Math.max(0, (state.gameState.statistics.foodsEaten ?? 0) - 10),
          maxCombo: 0,
          obstaclesEncountered: Math.max(
            0,
            (state.gameState.statistics.obstaclesEncountered ?? 0) - 5,
          ),
          livesLost: state.gameState.statistics.livesLost ?? 0,
        }
      : {
          startTime: Date.now() - 60000,
          pausedTime: 0,
          foodsEaten: 0,
          foodsByType: {} as Record<FoodType, number>,
          maxSnakeLength: 3,
          maxCombo: 0,
          obstaclesEncountered: 0,
          livesLost: 0,
        },
  };

  state.gameState.status = GameStatus.PHASE_COMPLETE;
  state.gameState.phaseStartSnapshot = snapshot;
  stopGameLoop();
  broadcastState();
  logger.info({ context: LogContext.PHASE, phaseNumber: currentPhaseNumber }, 'Phase completed');
}

/**
 * Handle set direction
 */
export function handleSetDirection(state: WorkerState, direction: Direction): void {
  if (!state.gameState || state.gameState.status !== GameStatus.PLAYING) return;

  const lastDir =
    state.directionQueue.length > 0
      ? state.directionQueue[state.directionQueue.length - 1]
      : state.gameState.direction;

  // Prevent spamming the same direction and limit queue size
  if (direction !== lastDir && state.directionQueue.length < 3) {
    state.directionQueue.push(direction);
  }
}

/**
 * Handle fire poison
 */
export function handleFirePoison(state: WorkerState): void {
  if (!state.gameState || state.gameState.status !== GameStatus.PLAYING) return;

  const headPosition = state.gameState.snake[0];
  if (headPosition) {
    const newShot = createPoisonShot(headPosition, state.gameState.direction);
    state.pendingPoisonShots.push(newShot);
  }
}
