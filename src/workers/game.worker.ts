/// <reference lib="webworker" />

import {
  GameStatus,
  GameState,
  Direction,
  FoodType,
  Position,
  Food,
  Obstacle,
  Portal,
  BossSnake,
} from '@/types/game';
import {
  moveSnake,
  hasSelfCollision,
  hasFoodCollision,
  generateRandomFood,
} from '@/utils/gameLogic';
import {
  GAME_CONFIG,
  INITIAL_SNAKE_POSITION,
  INITIAL_DIRECTION,
  PERFORMANCE_CONFIG,
} from '@/constants/game';
import { CHEFS } from '@/constants/phases';
import { calculateGameSpeed } from '@/utils/difficulty';
import { getActivePowerUps, getEffectiveGameSpeed, hasPhaseThrough } from '@/utils/powerUps';
import { hasObstacleCollision, getActiveObstacles } from '@/utils/obstacles';
import { isLivesEnabled, addLife } from '@/utils/lives';
import { initializeStatistics } from '@/utils/statistics';
import { getPortalAtPosition, getPortalPair, getActivePortals } from '@/utils/portals';
import { PORTAL_CONFIG } from '@/constants/portals';
import { getCurrentPhase } from '@/utils/phases';
import { handleBossDefeat } from '@/utils/bosses';
import { initializeBossSnake } from '@/utils/bossSnake';
import { generateGuardianFlagPosition } from '@/utils/bossAbilities';
import { generateBossInitialResources } from '@/utils/bossResources';
import { createPoisonShot } from '@/utils/poison';
import { checkAchievements } from '@/utils/achievements';
import { createPhaseStartSnapshot } from '@/utils/phaseStatistics';
import { logger, LogContext } from '@/utils/logger';
import {
  updateFrameTime,
  updateDeltaSize,
  updateFramesSkipped,
  logMetrics,
} from '@/utils/performanceMetrics';
import {
  resolveDirection,
  handleBossLogic,
  handleBossCollisionCheck,
  handlePoisonShotsUpdate,
  handleFoodInteraction,
  handleGameStateUpdates,
} from './gameHelper';

// Worker state
let gameState: GameState | null = null;
let gameLoopId: number | null = null;
let lastUpdateTime = 0;
let lastObstacleSpawnTime = 0;
const lastPoisonFireTime = 0;
let forcedFoodType: FoodType | null = null;
let bossAbilityCooldowns = new Map<string, number>();
let pendingPoisonShots: import('@/types/game').PoisonShot[] = [];
let renderPort: MessagePort | null = null;

// Frame skipping adaptive performance
let frameTimeHistory: number[] = [];
const FRAME_TIME_HISTORY_SIZE = 10;
const TARGET_FRAME_TIME = 16.67; // 60fps
const MAX_FRAME_TIME = TARGET_FRAME_TIME * 2; // Allow up to 2x target
let skipOptionalEffects = false;
let framesSkipped = 0;

// Input buffer to handle rapid inputs between ticks
let directionQueue: Direction[] = [];

// Delta compression state
let previousState: Partial<GameState> | null = null;
let previousRenderState: {
  snake: Position[];
  bossSnake?: BossSnake;
  shots: import('@/types/game').PoisonShot[];
  food: Food | null;
  obstacles: Obstacle[];
  portals: Portal[];
  activeBoss: { color: string; icon?: string; name?: string } | null;
  guardianFlag: Food | null;
  speed: number;
  status: GameStatus;
} | null = null;

// Dirty flags for optimization
let isRenderDirty = false;

// Helper to check if positions are equal
function positionsEqual(a: Position | undefined, b: Position | undefined): boolean {
  if (!a || !b) return a === b;
  return a.x === b.x && a.y === b.y;
}

// Helper to check if arrays of positions are equal
function positionArraysEqual(a: Position[], b: Position[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!positionsEqual(a[i], b[i])) return false;
  }
  return true;
}

// Convert Position[] to Float32Array for efficient transfer
function positionsToTypedArray(positions: Position[]): Float32Array {
  const array = new Float32Array(positions.length * 2);
  for (let i = 0; i < positions.length; i++) {
    array[i * 2] = positions[i].x;
    array[i * 2 + 1] = positions[i].y;
  }
  return array;
}

// Compute delta between previous and current state
function computeDelta(prev: Partial<GameState> | null, current: GameState): Partial<GameState> {
  if (!prev) return current; // First update, send everything

  const delta: Partial<GameState> = {};

  // Only include changed properties
  if (prev.snake !== current.snake && !positionArraysEqual(prev.snake ?? [], current.snake)) {
    delta.snake = current.snake;
  }
  if (prev.food !== current.food) {
    if (
      !prev.food ||
      !current.food ||
      prev.food.position.x !== current.food.position.x ||
      prev.food.position.y !== current.food.position.y ||
      prev.food.type !== current.food.type
    ) {
      delta.food = current.food;
    }
  }
  if (prev.direction !== current.direction) delta.direction = current.direction;
  if (prev.nextDirection !== current.nextDirection) delta.nextDirection = current.nextDirection;
  if (prev.status !== current.status) delta.status = current.status;
  if (prev.score !== current.score) delta.score = current.score;
  if (prev.highScore !== current.highScore) delta.highScore = current.highScore;
  if (prev.level !== current.level) delta.level = current.level;
  if (prev.gameSpeed !== current.gameSpeed) delta.gameSpeed = current.gameSpeed;
  if (prev.lives !== current.lives) delta.lives = current.lives;
  if (prev.isSpeedBoosted !== current.isSpeedBoosted) delta.isSpeedBoosted = current.isSpeedBoosted;
  if (prev.isFiringPoison !== current.isFiringPoison) delta.isFiringPoison = current.isFiringPoison;

  // Arrays - check if changed
  if (
    prev.obstacles !== current.obstacles &&
    JSON.stringify(prev.obstacles) !== JSON.stringify(current.obstacles)
  ) {
    delta.obstacles = current.obstacles;
  }
  if (
    prev.portals !== current.portals &&
    JSON.stringify(prev.portals) !== JSON.stringify(current.portals)
  ) {
    delta.portals = current.portals;
  }
  if (
    prev.poisonShots !== current.poisonShots &&
    JSON.stringify(prev.poisonShots) !== JSON.stringify(current.poisonShots)
  ) {
    delta.poisonShots = current.poisonShots;
  }
  if (
    prev.activePowerUps !== current.activePowerUps &&
    JSON.stringify(prev.activePowerUps) !== JSON.stringify(current.activePowerUps)
  ) {
    delta.activePowerUps = current.activePowerUps;
  }
  if (
    prev.combo !== current.combo &&
    (prev.combo?.count !== current.combo.count ||
      prev.combo?.multiplier !== current.combo.multiplier)
  ) {
    delta.combo = current.combo;
  }
  if (prev.currentPhase !== current.currentPhase) delta.currentPhase = current.currentPhase;
  if (prev.phaseLevelType !== current.phaseLevelType) delta.phaseLevelType = current.phaseLevelType;
  if (prev.activeBoss?.id !== current.activeBoss?.id) delta.activeBoss = current.activeBoss;
  if (
    prev.bossSnake !== current.bossSnake &&
    JSON.stringify(prev.bossSnake) !== JSON.stringify(current.bossSnake)
  ) {
    delta.bossSnake = current.bossSnake;
  }
  if (
    prev.guardianFlag !== current.guardianFlag &&
    JSON.stringify(prev.guardianFlag) !== JSON.stringify(current.guardianFlag)
  ) {
    delta.guardianFlag = current.guardianFlag;
  }
  if (
    prev.achievements !== current.achievements &&
    JSON.stringify(prev.achievements) !== JSON.stringify(current.achievements)
  ) {
    delta.achievements = current.achievements;
  }

  return delta;
}

// Shallow copy helper for state tracking
function shallowCopyState(state: GameState): Partial<GameState> {
  return {
    snake: state.snake,
    food: state.food,
    direction: state.direction,
    nextDirection: state.nextDirection,
    status: state.status,
    score: state.score,
    highScore: state.highScore,
    level: state.level,
    gameSpeed: state.gameSpeed,
    lives: state.lives,
    obstacles: state.obstacles,
    portals: state.portals,
    poisonShots: state.poisonShots,
    activePowerUps: state.activePowerUps,
    combo: state.combo,
    currentPhase: state.currentPhase,
    phaseLevelType: state.phaseLevelType,
    activeBoss: state.activeBoss,
    bossSnake: state.bossSnake,
    guardianFlag: state.guardianFlag,
    isSpeedBoosted: state.isSpeedBoosted,
    isFiringPoison: state.isFiringPoison,
    achievements: state.achievements,
  };
}

// Initialize Game State
function initGame() {
  const initialStatistics = initializeStatistics();
  logger.info({ context: LogContext.GAME_STATE }, 'Initializing game state');

  directionQueue = []; // Clear queue on init
  previousState = null; // Reset delta compression state
  previousRenderState = null; // Reset render state
  isRenderDirty = true; // Force render update on init

  gameState = {
    snake: [...INITIAL_SNAKE_POSITION],
    food: generateRandomFood(INITIAL_SNAKE_POSITION, GAME_CONFIG.gridSize),
    direction: INITIAL_DIRECTION,
    nextDirection: INITIAL_DIRECTION,
    status: GameStatus.IDLE,
    score: 0,
    highScore: 0, // Highscore will be synced from main thread
    level: 1,
    gameSpeed: GAME_CONFIG.gameSpeed,
    activePowerUps: [],
    obstacles: [],
    portals: [],
    combo: {
      count: 0,
      multiplier: 1,
      lastFoodTime: 0,
    },
    particles: [], // Particles are handled by main thread/particle worker now, but kept in state for type compatibility
    poisonShots: [],
    achievements: [], // Achievements synced/managed here but saved in main thread
    lives: 3,
    statistics: initialStatistics,
    isSpeedBoosted: false,
    isFiringPoison: false,
  };

  lastObstacleSpawnTime = 0;
  bossAbilityCooldowns.clear();
}

// Message Handler
self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'INIT':
      initGame();
      // Sync high score if provided
      if (payload?.highScore && gameState) {
        gameState.highScore = payload.highScore;
      }
      broadcastState();
      logger.info({ context: LogContext.GAME_STATE }, 'Game worker initialized');
      break;

    case 'START_GAME':
      if (gameState) {
        if (gameState.status === GameStatus.IDLE || gameState.status === GameStatus.GAME_OVER) {
          initGame(); // Reset if needed
          // Sync high score again if restarting
          if (payload?.highScore && gameState) {
            gameState.highScore = payload.highScore;
          }
        }
        gameState.status = GameStatus.PLAYING;
        lastUpdateTime = performance.now();
        startGameLoop();
        broadcastState();
        logger.info({ context: LogContext.GAME_STATE, status: gameState.status }, 'Game started');
      }
      break;

    case 'PAUSE_GAME':
      if (gameState) {
        gameState.status =
          gameState.status === GameStatus.PAUSED ? GameStatus.PLAYING : GameStatus.PAUSED;
        if (gameState.status === GameStatus.PLAYING) {
          lastUpdateTime = performance.now();
          startGameLoop();
        } else {
          stopGameLoop();
        }
        broadcastState();
        logger.info(
          { context: LogContext.GAME_STATE, status: gameState.status },
          'Game pause toggled',
        );
      }
      break;

    case 'SET_STATUS':
      if (gameState) {
        gameState.status = payload.status;
        if (payload.status !== GameStatus.PLAYING) {
          stopGameLoop();
          // Clear controls
          gameState.isSpeedBoosted = false;
          gameState.isFiringPoison = false;
        }
        broadcastState();
      }
      break;

    case 'SET_DIRECTION':
      if (gameState && gameState.status === GameStatus.PLAYING) {
        const newDir = payload.direction;
        const lastDir =
          directionQueue.length > 0
            ? directionQueue[directionQueue.length - 1]
            : gameState.direction;

        // Prevent spamming the same direction and limit queue size
        if (newDir !== lastDir && directionQueue.length < 3) {
          directionQueue.push(newDir);
        }
      }
      break;

    case 'SET_SPEED_BOOST':
      if (gameState) {
        gameState.isSpeedBoosted = payload.enabled;
      }
      break;

    case 'FIRE_POISON':
      if (gameState && gameState.status === GameStatus.PLAYING) {
        // Add a poison shot to pending list
        const headPosition = gameState.snake[0];
        if (headPosition) {
          const newShot = createPoisonShot(headPosition, gameState.direction);
          pendingPoisonShots.push(newShot);
        }
      }
      break;

    case 'SET_FIRING_POISON':
      if (gameState) {
        gameState.isFiringPoison = payload.enabled;
      }
      break;

    case 'RESET_GAME':
      initGame();
      if (payload?.highScore && gameState) {
        gameState.highScore = payload.highScore;
      }
      broadcastState();
      logger.info({ context: LogContext.GAME_STATE }, 'Game reset');
      break;

    case 'SELECT_PHASE':
      handleSelectPhase(payload.phaseId);
      break;

    case 'NEXT_PHASE':
      handleNextPhase(payload.phaseNumber);
      break;

    case 'SET_PHASE_COMPLETE':
      handleSetPhaseComplete(payload.defeatedBossPhaseNumber);
      break;

    case 'SPAWN_BOSS':
      handleSpawnBoss(payload.bossId);
      logger.info(
        { context: LogContext.BOSS, bossId: payload.bossId },
        'Spawn boss command received',
      );
      break;

    case 'RESUME_AFTER_DEATH':
      handleResumeAfterDeath();
      logger.info({ context: LogContext.GAME_STATE }, 'Resume after death command received');
      break;

    case 'CONNECT_RENDER_WORKER':
      renderPort = payload.port;
      if (renderPort) {
        renderPort.start();
        logger.info(
          { context: LogContext.GAME_STATE },
          'Connected to render worker via MessageChannel',
        );
      }
      break;
  }
};

function handleResumeAfterDeath() {
  if (!gameState) return;

  if (gameState.lives > 0) {
    // Reset snake position but keep level/score/items
    gameState = {
      ...gameState,
      snake: [...INITIAL_SNAKE_POSITION],
      direction: INITIAL_DIRECTION,
      nextDirection: INITIAL_DIRECTION,
      status: GameStatus.PLAYING,
    };

    lastUpdateTime = performance.now();
    startGameLoop();
  } else {
    gameState.status = GameStatus.GAME_OVER;
    stopGameLoop();
  }
  broadcastState();
}

function handleSpawnBoss(bossId: string | null) {
  if (!gameState) return;

  if (!bossId) {
    // Despawn boss
    const levelPhase = getCurrentPhase(gameState.level);
    gameState.activeBoss = undefined;
    gameState.bossSnake = undefined;
    gameState.currentPhase = levelPhase?.id;
    gameState.phaseLevelType = levelPhase?.type;
    gameState.guardianFlag = null;
  } else {
    const boss = CHEFS.find((c) => c.id === bossId);
    if (boss) {
      gameState.activeBoss = boss;

      // Clean up existing boss/resources if any
      bossAbilityCooldowns.clear();
      forcedFoodType = null;
      gameState.guardianFlag = null;

      const bossResources = generateBossInitialResources(
        boss,
        gameState.snake,
        gameState.obstacles,
        gameState.portals,
        GAME_CONFIG.gridSize,
      );

      gameState.obstacles = bossResources.obstacles;
      gameState.portals = bossResources.portals;

      gameState.bossSnake =
        initializeBossSnake(boss, gameState.snake, gameState.obstacles, GAME_CONFIG.gridSize) ??
        undefined;

      if (boss.id === 'guardian') {
        const flagPos = generateGuardianFlagPosition(
          gameState.snake,
          gameState.bossSnake?.positions ?? [],
          gameState.obstacles,
          GAME_CONFIG.gridSize,
        );
        if (flagPos) {
          gameState.guardianFlag = {
            position: flagPos,
            type: FoodType.EXTRA_LIFE,
            spawnTime: Date.now(),
            duration: undefined,
          };
        }
      }
    }
  }
  broadcastState();
}

function handleSelectPhase(phaseId: number) {
  if (!gameState) return;
  const phase = getCurrentPhase((phaseId - 1) * 5 + 1); // Get config for start of phase
  if (!phase) return;

  const phaseStartLevel = (phaseId - 1) * 5 + 1;
  const nextSpeed = calculateGameSpeed(phaseStartLevel);

  // Reset essential parts
  const initialSnake = [...INITIAL_SNAKE_POSITION];
  const initialFood = generateRandomFood(initialSnake, GAME_CONFIG.gridSize, []);

  const phaseSnapshot = createPhaseStartSnapshot({
    ...gameState,
    level: phaseStartLevel,
    snake: initialSnake,
    score: 0,
  });

  gameState = {
    ...gameState,
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

function handleNextPhase(phaseNumber: number) {
  if (!gameState) return;

  if (phaseNumber <= 10) {
    const nextPhaseStartLevel = (phaseNumber - 1) * 5 + 1;
    const nextPhase = getCurrentPhase(nextPhaseStartLevel);
    const nextSpeed = calculateGameSpeed(nextPhaseStartLevel);

    const initialSnake = [...INITIAL_SNAKE_POSITION];
    const initialFood = generateRandomFood(initialSnake, GAME_CONFIG.gridSize, []);

    const nextPhaseSnapshot = createPhaseStartSnapshot({
      ...gameState,
      level: nextPhaseStartLevel,
      snake: initialSnake,
      score: 0,
    });

    gameState = {
      ...gameState,
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
    gameState.status = GameStatus.GAME_OVER;
    stopGameLoop();
    logger.info({ context: LogContext.GAME_STATE }, 'Game completed (all phases finished)');
  }
  broadcastState();
}

function handleSetPhaseComplete(defeatedBossPhaseNumber?: number) {
  if (!gameState) return;

  const currentPhaseNumber = defeatedBossPhaseNumber ?? (gameState.currentPhase || 1);
  const phaseStartLevel = (currentPhaseNumber - 1) * 5 + 1;

  let snapshot = gameState.phaseStartSnapshot;

  if (!snapshot) {
    snapshot = {
      startTime: gameState.statistics?.startTime ?? Date.now() - 60000,
      startScore: Math.max(0, gameState.score - 500),
      startLevel: phaseStartLevel,
      startStatistics: gameState.statistics
        ? {
            ...gameState.statistics,
            foodsEaten: Math.max(0, (gameState.statistics.foodsEaten ?? 0) - 10),
            maxCombo: 0,
            obstaclesEncountered: Math.max(0, (gameState.statistics.obstaclesEncountered ?? 0) - 5),
            livesLost: gameState.statistics.livesLost ?? 0,
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
  }

  gameState.status = GameStatus.PHASE_COMPLETE;
  gameState.phaseStartSnapshot = snapshot;
  stopGameLoop();
  broadcastState();
  logger.info({ context: LogContext.PHASE, phaseNumber: currentPhaseNumber }, 'Phase completed');
}

function broadcastState() {
  if (!gameState) return;

  // Compute delta for Main Thread (UI Updates)
  const delta = computeDelta(previousState, gameState);
  const hasChanges = Object.keys(delta).length > 0;

  if (hasChanges || !previousState) {
    // Estimate delta size for metrics
    const deltaSize = JSON.stringify(delta).length;
    updateDeltaSize(deltaSize);

    // Send delta to Main Thread
    self.postMessage({
      type: 'GAME_STATE_DELTA',
      payload: delta,
      isFullUpdate: !previousState, // First update sends everything
    });

    // Update previous state
    previousState = shallowCopyState(gameState);
  }

  // Send to Render Worker (High Frequency) - only if visual state changed
  if (renderPort) {
    const currentRenderState = {
      snake: gameState.snake,
      bossSnake: gameState.bossSnake,
      shots: gameState.poisonShots,
      food: gameState.food,
      obstacles: gameState.obstacles,
      portals: gameState.portals,
      activeBoss: gameState.activeBoss
        ? {
            color: gameState.activeBoss.visual.color,
            icon: gameState.activeBoss.visual.icon,
            name: gameState.activeBoss.name,
          }
        : null,
      guardianFlag: gameState.guardianFlag ?? null,
      speed: gameState.gameSpeed,
      status: gameState.status,
    };

    // Check if render state changed
    const renderChanged =
      !previousRenderState ||
      !positionArraysEqual(previousRenderState.snake, currentRenderState.snake) ||
      JSON.stringify(previousRenderState.bossSnake) !==
        JSON.stringify(currentRenderState.bossSnake) ||
      JSON.stringify(previousRenderState.shots) !== JSON.stringify(currentRenderState.shots) ||
      JSON.stringify(previousRenderState.food) !== JSON.stringify(currentRenderState.food) ||
      JSON.stringify(previousRenderState.obstacles) !==
        JSON.stringify(currentRenderState.obstacles) ||
      JSON.stringify(previousRenderState.portals) !== JSON.stringify(currentRenderState.portals) ||
      JSON.stringify(previousRenderState.activeBoss) !==
        JSON.stringify(currentRenderState.activeBoss) ||
      JSON.stringify(previousRenderState.guardianFlag) !==
        JSON.stringify(currentRenderState.guardianFlag) ||
      previousRenderState.speed !== currentRenderState.speed ||
      previousRenderState.status !== currentRenderState.status;

    if (renderChanged || isRenderDirty) {
      // Convert positions to TypedArrays for efficient transfer
      const snakeArray = positionsToTypedArray(currentRenderState.snake);
      const bossSnakeArray = currentRenderState.bossSnake
        ? positionsToTypedArray(currentRenderState.bossSnake.positions)
        : null;

      // Use transferable objects for zero-copy transfer
      const transferList: ArrayBufferLike[] = [snakeArray.buffer];
      if (bossSnakeArray) transferList.push(bossSnakeArray.buffer);

      renderPort.postMessage(
        {
          type: 'UPDATE',
          payload: {
            snake: snakeArray.buffer,
            snakeLength: currentRenderState.snake.length,
            bossSnake: bossSnakeArray ? bossSnakeArray.buffer : null,
            bossSnakeLength: currentRenderState.bossSnake?.positions.length ?? 0,
            shots: currentRenderState.shots, // Keep as regular array (less frequent)
            food: currentRenderState.food,
            obstacles: currentRenderState.obstacles,
            portals: currentRenderState.portals,
            activeBoss: currentRenderState.activeBoss,
            guardianFlag: currentRenderState.guardianFlag ?? null,
            isEating: false,
            speed: currentRenderState.speed,
            status: currentRenderState.status,
          },
        },
        transferList,
      );
      previousRenderState = currentRenderState;
      isRenderDirty = false;
    }
  }
}

function startGameLoop() {
  if (gameLoopId) return;

  function loop() {
    const frameStart = performance.now();
    const now = frameStart;
    if (gameState && gameState.status === GameStatus.PLAYING) {
      const activePowerUps = getActivePowerUps(gameState.activePowerUps);
      let effectiveSpeed = getEffectiveGameSpeed(gameState.gameSpeed, activePowerUps);

      if (gameState.isSpeedBoosted) {
        effectiveSpeed = Math.floor(effectiveSpeed / 4);
      }

      const timeSinceLastUpdate = now - lastUpdateTime;

      if (timeSinceLastUpdate >= effectiveSpeed) {
        updateGame(now);
        lastUpdateTime = now;
        // broadcastState checks dirty flags internally
        broadcastState();
      }
    }

    // Track frame time for adaptive performance
    const frameTime = performance.now() - frameStart;
    frameTimeHistory.push(frameTime);
    if (frameTimeHistory.length > FRAME_TIME_HISTORY_SIZE) {
      frameTimeHistory.shift();
    }

    // Calculate average frame time
    const avgFrameTime = frameTimeHistory.reduce((a, b) => a + b, 0) / frameTimeHistory.length;

    // Enable frame skipping if average frame time is too high
    skipOptionalEffects = avgFrameTime > MAX_FRAME_TIME;
    if (skipOptionalEffects && frameTime > TARGET_FRAME_TIME * 1.5) {
      framesSkipped++;
    }

    // Update performance metrics
    updateFrameTime(frameTime);
    updateFramesSkipped(framesSkipped);

    // Log metrics every 60 frames (1 second at 60fps)
    if (framesSkipped % 60 === 0) {
      logMetrics();
    }

    gameLoopId = requestAnimationFrame(loop);
  }

  gameLoopId = requestAnimationFrame(loop);
}

function stopGameLoop() {
  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;
  }
}

// Core Game Update Logic
function updateGame(currentTime: number) {
  if (!gameState) return;

  const prev = gameState;

  // 1. Resolve Direction
  const activePowerUps = getActivePowerUps(prev.activePowerUps);

  // Process input queue - take next pending direction
  const nextInput = directionQueue.length > 0 ? (directionQueue.shift() ?? null) : null;

  const currentDirection = resolveDirection(
    prev.direction,
    nextInput,
    activePowerUps,
    prev.snake,
    GAME_CONFIG.gridSize,
  );
  // nextDirectionBuffer handling removed as queue is used

  // 2. Move Snake
  const newSnake = moveSnake(prev.snake, currentDirection, GAME_CONFIG.gridSize, false);
  const newHeadPosition = newSnake[0];

  // 3. Handle Portals
  const activePortals = getActivePortals(prev.portals, PERFORMANCE_CONFIG.maxPortals);
  let finalSnake = newSnake;
  let headPosition = newHeadPosition;

  if (headPosition) {
    const portalAtHead = getPortalAtPosition(headPosition, activePortals);
    if (portalAtHead) {
      const pairedPortal = getPortalPair(portalAtHead, activePortals);
      if (pairedPortal) {
        finalSnake = [{ ...pairedPortal.position }, ...finalSnake.slice(1)];
        headPosition = finalSnake[0];

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
      }
    }
  }

  // 4. Check Collisions
  const activeObstacles =
    prev.obstacles.length > 0 ? getActiveObstacles(prev.obstacles) : prev.obstacles;
  const canPhaseThrough = hasPhaseThrough(activePowerUps);

  const hasCollision =
    (GAME_CONFIG.enableObstacles &&
      !canPhaseThrough &&
      hasObstacleCollision(headPosition, activeObstacles)) ||
    (finalSnake.length >= 4 && hasSelfCollision(finalSnake));

  const statistics = prev.statistics || initializeStatistics();

  if (hasCollision) {
    if (isLivesEnabled() && prev.lives > 1) {
      gameState = {
        ...prev,
        status: GameStatus.DYING,
        lives: prev.lives - 1,
        statistics,
      };
      self.postMessage({ type: 'GAME_OVER_OR_DYING', payload: { status: GameStatus.DYING } });
      logger.info(
        { context: LogContext.COLLISION, livesRemaining: prev.lives - 1 },
        'Collision detected (Life Lost)',
      );
    } else {
      gameState = {
        ...prev,
        status: GameStatus.GAME_OVER,
        highScore: Math.max(prev.score, prev.highScore),
        statistics,
      };
      self.postMessage({
        type: 'GAME_OVER_OR_DYING',
        payload: { status: GameStatus.GAME_OVER, score: prev.score },
      });
      logger.info(
        { context: LogContext.COLLISION, score: prev.score },
        'Collision detected (Game Over)',
      );
    }
    return;
  }

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

  // Handle particles from food (skip if performance is low)
  if (!skipOptionalEffects || framesSkipped % 2 === 0) {
    foodResult.particlesToSpawn.forEach((p) => {
      self.postMessage({ type: 'SPAWN_PARTICLES', payload: p });
    });
  }

  // 6. Boss Logic
  const bossLogicResult = handleBossLogic(
    prev.activeBoss,
    prev.bossSnake,
    { ...prev, score: foodResult.newScore }, // Pass updated score
    foodResult.finalSnake,
    prev.obstacles,
    prev.portals,
    bossAbilityCooldowns,
    prev.guardianFlag,
    prev.guardianFlagSide,
    prev.food.position,
  );

  bossAbilityCooldowns = bossLogicResult.bossAbilityCooldowns;
  if (bossLogicResult.forcedFoodType) forcedFoodType = bossLogicResult.forcedFoodType;

  // Handle Flag Capture
  const capturedFlag =
    bossLogicResult.guardianFlag &&
    headPosition.x === bossLogicResult.guardianFlag.position.x &&
    headPosition.y === bossLogicResult.guardianFlag.position.y;

  if (capturedFlag && bossLogicResult.activeBoss?.id === 'guardian') {
    const bossReward = handleBossDefeat(bossLogicResult.activeBoss, {
      score: foodResult.newScore,
      lives: foodResult.newLives,
    } as GameState);
    foodResult.newScore += bossReward.scoreIncrease;
    foodResult.newLives = addLife(foodResult.newLives);
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
    forcedFoodType = null;
  }

  // 7. Boss Collision Check
  const collisionCheck = handleBossCollisionCheck(headPosition, bossLogicResult, prev);

  collisionCheck.collisionResult.particlesToSpawn.forEach((p) => {
    self.postMessage({ type: 'SPAWN_PARTICLES', payload: p });
  });

  if (collisionCheck.gameOverOrDying) {
    if (collisionCheck.gameOverOrDying.status === GameStatus.DYING) {
      gameState = {
        ...prev,
        status: GameStatus.DYING,
        lives: collisionCheck.gameOverOrDying.lives ?? prev.lives,
        snake: foodResult.finalSnake,
      };
      self.postMessage({ type: 'GAME_OVER_OR_DYING', payload: { status: GameStatus.DYING } });
    } else {
      gameState = {
        ...prev,
        status: GameStatus.GAME_OVER,
        score: collisionCheck.gameOverOrDying.score ?? foodResult.newScore,
        lives: 0,
        snake: foodResult.finalSnake,
      };
      self.postMessage({
        type: 'GAME_OVER_OR_DYING',
        payload: { status: GameStatus.GAME_OVER, score: collisionCheck.gameOverOrDying.score },
      });
    }
    return;
  }

  const currentBossState = collisionCheck.collisionResult;

  // 8. Poison Logic
  const poisonResult = handlePoisonShotsUpdate(
    prev.poisonShots,
    pendingPoisonShots,
    currentBossState.newObstacles,
    GAME_CONFIG.gridSize,
    currentBossState,
    prev,
    currentTime,
    lastPoisonFireTime,
    prev.isFiringPoison ?? false,
    foodResult.finalSnake[0],
    currentDirection,
  );

  pendingPoisonShots = []; // Buffer consumed by helper (via copy in helper)

  if (poisonResult.bossUpdate) {
    currentBossState.bossSnake = poisonResult.bossUpdate.bossSnake;
    currentBossState.activeBoss = poisonResult.bossUpdate.activeBoss;
    currentBossState.newScore = poisonResult.bossUpdate.newScore;
    bossAbilityCooldowns = poisonResult.bossUpdate.bossAbilityCooldowns;
    forcedFoodType = poisonResult.bossUpdate.forcedFoodType;
  }

  poisonResult.particlesToSpawn.forEach((p) => {
    self.postMessage({ type: 'SPAWN_PARTICLES', payload: p });
  });

  // 9. Game State Updates
  const stateUpdates = handleGameStateUpdates(
    {
      prevGameState: prev,
      activeObstacles: poisonResult.newObstacles,
      activePortals: currentBossState.newPortals,
      activeBoss: currentBossState.activeBoss,
      lastObstacleSpawnTime,
      ateFood,
      forcedFoodType,
      currentTime,
      finalSnake: foodResult.finalSnake,
    },
    currentBossState.newScore,
  );

  lastObstacleSpawnTime = stateUpdates.updatedSpawnTime;

  // 10. Achievements
  let updatedAchievements = prev.achievements;
  if (GAME_CONFIG.enableAchievements) {
    const achieveRes = checkAchievements(prev.achievements, {
      score: currentBossState.newScore,
      level: stateUpdates.newLevel,
      snakeLength: foodResult.finalSnake.length,
      comboMultiplier: foodResult.newCombo.multiplier,
      atePowerUp: foodResult.atePowerUp,
    });
    updatedAchievements = achieveRes.achievements;
    if (updatedAchievements !== prev.achievements) {
      self.postMessage({ type: 'SAVE_ACHIEVEMENTS', payload: updatedAchievements });
    }
  }

  // 11. Final State Update
  gameState = {
    ...prev,
    snake: foodResult.finalSnake,
    food: stateUpdates.newFood,
    direction: currentDirection,
    nextDirection: currentDirection,
    score: currentBossState.newScore,
    highScore: Math.max(currentBossState.newScore, prev.highScore),
    level: stateUpdates.newLevel,
    gameSpeed: stateUpdates.baseGameSpeed,
    activePowerUps: foodResult.newActivePowerUps,
    obstacles: stateUpdates.newObstacles,
    portals: [...currentBossState.newPortals, ...foodResult.newPortals], // Consolidate portals
    combo: foodResult.newCombo,
    guardianFlag: stateUpdates.newGuardianFlag ?? currentBossState.guardianFlag,
    guardianFlagSide: currentBossState.guardianFlagSide,
    poisonShots: poisonResult.newPoisonShots,
    achievements: updatedAchievements,
    lives: foodResult.newLives,
    statistics: foodResult.statistics,
    currentPhase: stateUpdates.currentPhase ?? prev.currentPhase,
    phaseLevelType: stateUpdates.phaseLevelType ?? prev.phaseLevelType,
    activeBoss: stateUpdates.activeBoss,
    bossSnake: stateUpdates.bossSnake,
  };

  // Mark render as dirty for broadcast
  isRenderDirty = true;
}
