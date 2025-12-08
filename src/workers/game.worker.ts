/// <reference lib="webworker" />

import { GameStatus, GameState, Direction, FoodType } from '@/types/game';
import {
  moveSnake,
  hasSelfCollision,
  hasFoodCollision,
  generateRandomFood,
} from '@/utils/gameLogic';
import { GAME_CONFIG, INITIAL_SNAKE_POSITION, INITIAL_DIRECTION } from '@/constants/game';
import { CHEFS } from '@/constants/phases';
import { calculateGameSpeed } from '@/utils/difficulty';
import { getActivePowerUps, getEffectiveGameSpeed, hasPhaseThrough } from '@/utils/powerUps';
import { hasObstacleCollision, getActiveObstacles } from '@/utils/obstacles';
import { isLivesEnabled, addLife } from '@/utils/lives';
import { initializeStatistics } from '@/utils/statistics';
import { getPortalAtPosition, getPortalPair, getActivePortals } from '@/utils/portals';
import { PERFORMANCE_CONFIG } from '@/constants/game';
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

// Input buffer to handle rapid inputs between ticks
let nextDirectionBuffer: Direction | null = null;

// Initialize Game State
function initGame() {
  const initialStatistics = initializeStatistics();
  logger.info({ context: LogContext.GAME_STATE }, 'Initializing game state');

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
        // Buffer the direction change for the next tick
        // This prevents multiple direction changes in a single tick causing collisions
        nextDirectionBuffer = payload.direction;
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

  // Send to Main Thread (UI Updates)
  self.postMessage({
    type: 'GAME_STATE_UPDATE',
    payload: gameState,
  });

  // Send to Render Worker (High Frequency)
  if (renderPort) {
    renderPort.postMessage({
      type: 'UPDATE',
      payload: {
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
        guardianFlag: gameState.guardianFlag,
        isEating: false, // Animation handled locally or ignored for now
        speed: gameState.gameSpeed, // effective speed might be better?
        status: gameState.status,
      },
    });
  }
}

function startGameLoop() {
  if (gameLoopId) return;

  function loop() {
    const now = performance.now();
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
        broadcastState();
      }
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
  const currentDirection = resolveDirection(
    prev.direction,
    nextDirectionBuffer,
    activePowerUps,
    prev.snake,
    GAME_CONFIG.gridSize,
  );
  nextDirectionBuffer = null;

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

  // Handle particles from food
  foodResult.particlesToSpawn.forEach((p) => {
    self.postMessage({ type: 'SPAWN_PARTICLES', payload: p });
  });

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
    gameState.isFiringPoison,
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
    prev,
    currentBossState.newScore,
    foodResult.finalSnake,
    poisonResult.newObstacles,
    currentBossState.newPortals,
    currentBossState.activeBoss,
    currentTime,
    lastObstacleSpawnTime,
    ateFood,
    forcedFoodType,
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
}
