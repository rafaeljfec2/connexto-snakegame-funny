/// <reference lib="webworker" />

import { GameStatus, GameState, Direction, FoodType } from '@/types/game';
import {
  moveSnake,
  hasSelfCollision,
  hasFoodCollision,
  generateRandomFood,
  isValidDirectionChange,
  getOppositeDirection,
  wouldCauseCollision,
} from '@/utils/gameLogic';
import { GAME_CONFIG, INITIAL_SNAKE_POSITION, INITIAL_DIRECTION } from '@/constants/game';
import { calculateLevel, calculateGameSpeed } from '@/utils/difficulty';
import {
  applyPowerUpEffect,
  createActivePowerUp,
  getActivePowerUps,
  getEffectiveGameSpeed,
  hasReverseControls,
  hasPhaseThrough,
} from '@/utils/powerUps';
import { updateCombo } from '@/utils/combos';
import { generateObstacles, hasObstacleCollision, getActiveObstacles } from '@/utils/obstacles';
import { destroyObstacles } from '@/utils/obstacleDestruction';
import { hasFoodExpired } from '@/utils/foodTimer';
import { isLivesEnabled, addLife } from '@/utils/lives';
import { initializeStatistics } from '@/utils/statistics';
import {
  generatePortalPair,
  getPortalAtPosition,
  getPortalPair,
  getActivePortals,
} from '@/utils/portals';
import { PERFORMANCE_CONFIG, POISON_CONFIG } from '@/constants/game';
import { PORTAL_CONFIG } from '@/constants/portals';
import { getCurrentPhase, getBossForLevel, shouldSpawnBoss, getPhaseByBoss } from '@/utils/phases';
import { handleBossDefeat } from '@/utils/bosses';
import {
  initializeBossSnake,
  moveBossSnake,
  calculateBossNextDirection,
  getBossHitPart,
  weakenBossSnake,
  canDefeatBoss,
} from '@/utils/bossSnake';
import {
  processBossAbilities,
  generateGuardianFlagPosition,
  getFlagOffsetFromBossHead,
} from '@/utils/bossAbilities';
import { generateBossInitialResources } from '@/utils/bossResources';
import {
  createPoisonShot,
  updatePoisonShots,
  hasBossHeadCollision,
  hasBossBodyCollision,
} from '@/utils/poison';
import { checkAchievements } from '@/utils/achievements';
import { OBSTACLE_CONFIG } from '@/constants/obstacles';
import { POWER_UP_CONFIG } from '@/constants/powerUps';
import { createPhaseStartSnapshot } from '@/utils/phaseStatistics';

// Worker state
let gameState: GameState | null = null;
let gameLoopId: number | null = null;
let lastUpdateTime = 0;
let lastObstacleSpawnTime = 0;
let lastPoisonFireTime = 0;
let forcedFoodType: FoodType | null = null;
let bossAbilityCooldowns = new Map<string, number>();
let pendingPoisonShots: import('@/types/game').PoisonShot[] = [];

// Input buffer to handle rapid inputs between ticks
let nextDirectionBuffer: Direction | null = null;

// Initialize Game State
function initGame() {
  const initialStatistics = initializeStatistics();

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
      break;

    case 'RESUME_AFTER_DEATH':
      handleResumeAfterDeath();
      break;
  }
};

function handleResumeAfterDeath() {
  if (!gameState) return;

  // Reset snake position but keep level/score/items
  gameState = {
    ...gameState,
    snake: [...INITIAL_SNAKE_POSITION],
    direction: INITIAL_DIRECTION,
    nextDirection: INITIAL_DIRECTION,
    status: GameStatus.PLAYING,
    // Add temporary invulnerability or safe space clearing if needed
    // For now just reset pos
  };

  lastUpdateTime = performance.now();
  startGameLoop();
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
  } else {
    // Spawn specific boss (debug)
    // Find boss by ID
    // Since we don't have CHEFS imported directly (it's in constants), we might need to rely on getBossForLevel or passed payload
    // Ideally payload should contain full boss object or we import CHEFS
    // For now, let's assume we can't easily get the boss object by ID without iterating CHEFS which might not be available here
    // But getBossForLevel works by level.
    // Let's assume we pass the full boss object in payload or logic handles it in main thread?
    // No, worker needs to do it.
    // Let's import CHEFS or just ignore debug spawn for a moment or implement a helper
  }
  broadcastState();
}

function handleSelectPhase(phaseId: number) {
  if (!gameState) return;
  const phase = getCurrentPhase((phaseId - 1) * 5 + 1); // Get config for start of phase
  if (!phase) return;

  // Hardcoded level range calculation since type might not have it
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
  } else {
    gameState.status = GameStatus.GAME_OVER;
    stopGameLoop();
  }
  broadcastState();
}

function handleSetPhaseComplete(defeatedBossPhaseNumber?: number) {
  if (!gameState) return;

  const currentPhaseNumber = defeatedBossPhaseNumber ?? (gameState.currentPhase || 1);
  const phaseStartLevel = (currentPhaseNumber - 1) * 5 + 1;

  let snapshot = gameState.phaseStartSnapshot;

  if (!snapshot) {
    // Fallback snapshot creation similar to App.tsx
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
}

function broadcastState() {
  if (!gameState) return;

  // Send state to main thread
  // We can optimize this by sending only diffs later if needed
  self.postMessage({
    type: 'GAME_STATE_UPDATE',
    payload: gameState,
  });
}

function startGameLoop() {
  if (gameLoopId) return; // Already running

  function loop() {
    const now = performance.now();
    // We use a simpler loop here, tick based on game speed
    // But we check frequently (e.g. 60fps) to handle inputs and smooth movement

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

      // Handle continuous poison firing separately from movement tick if needed
      // For now simplified into updateGame or we can add separate timer
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

  // Apply buffered direction if valid
  let currentDirection = prev.direction;
  if (nextDirectionBuffer) {
    // Validate direction change
    const activePowerUps = getActivePowerUps(prev.activePowerUps);
    const reverseControls = hasReverseControls(activePowerUps);
    let nextDir = nextDirectionBuffer;

    if (reverseControls && nextDir !== prev.direction) {
      nextDir = getOppositeDirection(nextDir);
    }

    if (
      isValidDirectionChange(prev.direction, nextDir) &&
      !wouldCauseCollision(prev.snake, nextDir, GAME_CONFIG.gridSize)
    ) {
      currentDirection = nextDir;
    }
    nextDirectionBuffer = null; // Clear buffer
  }

  // --- Game Logic from useGameLoop.ts adapted ---

  // Move snake
  const newSnake = moveSnake(prev.snake, currentDirection, GAME_CONFIG.gridSize, false);
  const newHeadPosition = newSnake[0];
  const previousHeadPosition = prev.snake[0];

  // Handle Portal Teleportation
  // Simplified logic for worker: we don't generate particles here, just emit event if needed
  // Actually, main thread handles particles. We just need to update position.
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

  // Check Collisions
  // Filter obstacles
  const activeObstacles =
    prev.obstacles.length > 0 ? getActiveObstacles(prev.obstacles) : prev.obstacles;
  const activePowerUps = getActivePowerUps(prev.activePowerUps);
  const canPhaseThrough = hasPhaseThrough(activePowerUps);

  const hasCollision =
    (GAME_CONFIG.enableObstacles &&
      !canPhaseThrough &&
      hasObstacleCollision(headPosition, activeObstacles)) ||
    (finalSnake.length >= 4 && hasSelfCollision(finalSnake));

  // Stats initialization
  const statistics = prev.statistics || initializeStatistics();

  if (hasCollision) {
    if (isLivesEnabled() && prev.lives > 0) {
      gameState = {
        ...prev,
        status: GameStatus.DYING,
        lives: prev.lives - 1, // Decrement life here
        statistics,
      };
      // Main thread should handle the dying animation timer
      self.postMessage({ type: 'GAME_OVER_OR_DYING', payload: { status: GameStatus.DYING } });
      return;
    } else {
      gameState = {
        ...prev,
        status: GameStatus.GAME_OVER,
        highScore: Math.max(prev.score, prev.highScore),
        statistics,
      };
      // Main thread saves score
      self.postMessage({
        type: 'GAME_OVER_OR_DYING',
        payload: { status: GameStatus.GAME_OVER, score: prev.score },
      });
      return;
    }
  }

  // Food Collision
  const ateFood = hasFoodCollision(headPosition, prev.food);

  // Flag Capture (Guardian Boss)
  const capturedFlag =
    prev.guardianFlag &&
    headPosition.x === prev.guardianFlag.position.x &&
    headPosition.y === prev.guardianFlag.position.y;

  // Boss Logic Variables
  let activeBoss = prev.activeBoss;
  let bossSnake = prev.bossSnake;
  let newGuardianFlag = prev.guardianFlag;
  let newGuardianFlagSide = prev.guardianFlagSide;
  let newScore = prev.score;
  let newActivePowerUps = [...prev.activePowerUps];
  let newCombo = prev.combo;
  let newLives = prev.lives;
  let atePowerUp = false;

  // Handle Food
  if (ateFood) {
    const currentFoodCount = statistics.foodsByType[prev.food.type] ?? 0;
    statistics.foodsEaten++;
    statistics.foodsByType[prev.food.type] = currentFoodCount + 1;

    let actualFoodType = prev.food.type;
    if (prev.food.type === FoodType.JOKER) {
      const positiveTypes = [
        FoodType.SPEED_BOOST,
        FoodType.BONUS_POINTS,
        FoodType.EXTRA_GROWTH,
        FoodType.PHASE_THROUGH,
      ];
      actualFoodType =
        positiveTypes[Math.floor(Math.random() * positiveTypes.length)] ?? FoodType.BONUS_POINTS;
    }

    const powerUpEffect = applyPowerUpEffect(actualFoodType, prev.score, finalSnake.length);

    if (prev.food.type === FoodType.JOKER) {
      powerUpEffect.scoreIncrease += 15;
    }

    if (prev.food.type !== FoodType.NORMAL) {
      atePowerUp = true;
    }

    newScore += powerUpEffect.scoreIncrease;

    if (GAME_CONFIG.enableCombos) {
      newCombo = updateCombo(newCombo, true);
    }

    // Particles trigger
    if (GAME_CONFIG.enableParticles) {
      const foodColor = POWER_UP_CONFIG.colors[prev.food.type]?.primary || '#ef4444';
      self.postMessage({
        type: 'SPAWN_PARTICLES',
        payload: { position: previousHeadPosition, color: foodColor, count: 8 },
      });
    }

    // Growth
    if (powerUpEffect.growthAmount > 0) {
      const currentTail = finalSnake[finalSnake.length - 1];
      for (let i = 0; i < powerUpEffect.growthAmount; i++) {
        finalSnake.push({ ...currentTail });
      }
    } else if (powerUpEffect.growthAmount < 0) {
      const shrinkAmount = Math.abs(powerUpEffect.growthAmount);
      finalSnake = finalSnake.slice(0, Math.max(1, finalSnake.length - shrinkAmount));
    }

    if (newCombo.multiplier > statistics.maxCombo) {
      statistics.maxCombo = newCombo.multiplier;
    }

    if (prev.food.type === FoodType.EXTRA_LIFE) {
      newLives = addLife(newLives);
    }

    if (powerUpEffect.shouldActivatePowerUp) {
      newActivePowerUps.push(createActivePowerUp(actualFoodType));
    }
  } else {
    if (GAME_CONFIG.enableCombos) {
      newCombo = updateCombo(newCombo, false);
    }
  }

  // Handle Guardian Flag Capture
  if (capturedFlag && activeBoss && activeBoss.id === 'guardian') {
    const bossReward = handleBossDefeat(activeBoss, {
      score: prev.score,
      lives: prev.lives,
    } as GameState);
    newScore += bossReward.scoreIncrease;
    newLives = addLife(newLives);
    newGuardianFlag = null;
    activeBoss = undefined;
    bossSnake = undefined;

    if (GAME_CONFIG.enableParticles && prev.guardianFlag) {
      self.postMessage({
        type: 'SPAWN_PARTICLES',
        payload: { position: prev.guardianFlag.position, color: '#10b981', count: 30 },
      });
    }

    bossAbilityCooldowns.clear();
    forcedFoodType = null;
  }

  // Calculate Level
  let newLevel = prev.level;
  if (newScore !== prev.score) {
    const calculatedLevel = calculateLevel(newScore);
    // Logic to preserve level on phase start
    const shouldPreserveLevel =
      (newScore === 0 && prev.currentPhase) || (calculatedLevel < prev.level && prev.currentPhase);

    if (!shouldPreserveLevel) {
      newLevel = calculatedLevel;
    }
  } else if (newScore === 0 && prev.currentPhase && prev.level > 1) {
    newLevel = prev.level;
  }

  // Calculate Game Speed
  let baseGameSpeed = prev.gameSpeed;
  if (newLevel !== prev.level) {
    baseGameSpeed = calculateGameSpeed(newLevel);
  }

  // Phase System
  let currentPhase =
    prev.currentPhase && newScore === 0 && prev.level === newLevel
      ? getCurrentPhase(prev.level)
      : newLevel !== prev.level
        ? getCurrentPhase(newLevel)
        : getCurrentPhase(newLevel);

  if (prev.activeBoss) {
    const bossPhase = getPhaseByBoss(prev.activeBoss);
    if (
      bossPhase &&
      (!shouldSpawnBoss(newLevel) || getBossForLevel(newLevel)?.id !== prev.activeBoss.id)
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
    (newLevel > prev.level ||
      (updatedSpawnTime > 0 && timeSinceLastSpawn >= OBSTACLE_CONFIG.spawnInterval));

  let newObstacles = activeObstacles;

  if (shouldSpawnObstacle) {
    const prevCount = newObstacles.length;
    newObstacles = generateObstacles(
      newLevel,
      finalSnake,
      newObstacles,
      GAME_CONFIG.gridSize,
      phaseConfig?.obstaclesEnabled,
      phaseConfig?.obstaclesFrequency ?? OBSTACLE_CONFIG.spawnChance,
    );
    updatedSpawnTime = currentTime;
    if (newObstacles.length > prevCount) {
      statistics.obstaclesEncountered += newObstacles.length - prevCount;
    }
  } else if (phaseConfig?.obstaclesEnabled === false) {
    newObstacles = [];
  }
  lastObstacleSpawnTime = updatedSpawnTime;

  // Max snake length stat
  if (finalSnake.length > statistics.maxSnakeLength) {
    statistics.maxSnakeLength = finalSnake.length;
  }

  // Food Generation
  const foodExpired = hasFoodExpired(prev.food);
  let newFood = prev.food;
  if (ateFood || foodExpired) {
    newFood = generateRandomFood(
      finalSnake,
      GAME_CONFIG.gridSize,
      newObstacles,
      phaseConfig?.powerUpsFrequency,
      phaseConfig?.timedFoodFrequency,
      forcedFoodType ?? undefined,
    );
    if (forcedFoodType) forcedFoodType = null;
  }

  // Portal Power-up
  let newPortals = getActivePortals(prev.portals, PERFORMANCE_CONFIG.maxPortals);
  if (ateFood && prev.food.type === FoodType.PORTAL && phaseConfig?.portalsEnabled) {
    const portalPair = generatePortalPair(finalSnake, newObstacles, GAME_CONFIG.gridSize);
    if (portalPair && newPortals.length + portalPair.length <= PERFORMANCE_CONFIG.maxPortals) {
      newPortals = [...newPortals, ...portalPair];
    }
  }
  if (newPortals.length > PERFORMANCE_CONFIG.maxPortals) {
    newPortals = [...newPortals]
      .sort((a, b) => b.spawnTime - a.spawnTime)
      .slice(0, PERFORMANCE_CONFIG.maxPortals);
  }

  // Boss Spawning
  if (shouldSpawnBoss(newLevel)) {
    const levelBoss = getBossForLevel(newLevel);
    if (levelBoss && levelBoss.id === prev.activeBoss?.id) {
      activeBoss = levelBoss;
    } else if (!prev.activeBoss) {
      activeBoss = levelBoss;
    }
  }

  // Boss Logic Update
  if (activeBoss && (!prev.activeBoss || prev.activeBoss.id !== activeBoss.id)) {
    // New boss logic
    const bossResources = generateBossInitialResources(
      activeBoss,
      finalSnake,
      newObstacles,
      newPortals,
      GAME_CONFIG.gridSize,
    );
    newObstacles = bossResources.obstacles;
    newPortals = bossResources.portals;

    bossSnake =
      initializeBossSnake(activeBoss, finalSnake, newObstacles, GAME_CONFIG.gridSize) ?? undefined;
    bossAbilityCooldowns.clear();
    forcedFoodType = null;

    if (activeBoss.id === 'guardian' && !prev.guardianFlag) {
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
  } else if (!activeBoss) {
    bossSnake = undefined;
    bossAbilityCooldowns.clear();
    forcedFoodType = null;
  } else if (bossSnake && activeBoss) {
    // Existing boss logic
    const currentGS: GameState = {
      ...prev,
      snake: finalSnake,
      obstacles: newObstacles,
      portals: newPortals,
      bossSnake,
      guardianFlag: newGuardianFlag,
      guardianFlagSide: newGuardianFlagSide,
    };

    const abilityResult = processBossAbilities(activeBoss, currentGS, bossAbilityCooldowns);
    bossAbilityCooldowns = abilityResult.updatedCooldowns;

    if (abilityResult.result.guardianFlag !== undefined)
      newGuardianFlag = abilityResult.result.guardianFlag;
    if (abilityResult.result.guardianFlagSide !== undefined)
      newGuardianFlagSide = abilityResult.result.guardianFlagSide;

    const nextBossDir = calculateBossNextDirection(
      activeBoss,
      bossSnake,
      finalSnake,
      newObstacles,
      prev.food.position,
      GAME_CONFIG.gridSize,
      newGuardianFlag?.position ?? null,
    );

    bossSnake = moveBossSnake(bossSnake, nextBossDir, GAME_CONFIG.gridSize);

    // Flag follows boss
    if (newGuardianFlag && bossSnake && bossSnake.positions.length > 0) {
      const bossHead = bossSnake.positions[0];
      const flagSide = newGuardianFlagSide ?? 1;
      const flagOffset = getFlagOffsetFromBossHead(bossSnake.direction, flagSide);
      const newFlagPos = {
        x: Math.max(0, Math.min(bossHead.x + flagOffset.x, GAME_CONFIG.gridSize - 1)),
        y: Math.max(0, Math.min(bossHead.y + flagOffset.y, GAME_CONFIG.gridSize - 1)),
      };
      const isOnBody = bossSnake.positions.some(
        (p) => p.x === newFlagPos.x && p.y === newFlagPos.y,
      );
      if (!isOnBody) {
        newGuardianFlag = { ...newGuardianFlag, position: newFlagPos };
      }
    }

    // Apply ability effects (simplified merger)
    if (abilityResult.result.obstacles) {
      const resultObstacles = abilityResult.result.obstacles;
      if (resultObstacles.length > 0) {
        const existingMap = new Map<string, import('@/types/game').Obstacle>();
        newObstacles.forEach((o) => existingMap.set(`${o.position.x},${o.position.y}`, o));

        resultObstacles.forEach((o) => {
          const key = `${o.position.x},${o.position.y}`;
          if (!existingMap.has(key)) {
            newObstacles.push(o);
            existingMap.set(key, o);
          } else {
            const existing = existingMap.get(key);
            if (existing && existing.id !== o.id) {
              const idx = newObstacles.findIndex((no) => no.id === existing.id);
              if (idx !== -1) newObstacles[idx] = o;
            }
          }
        });
      }
    }

    if (abilityResult.result.portals) newPortals = [...newPortals, ...abilityResult.result.portals];
    if (abilityResult.result.gameSpeed !== undefined)
      baseGameSpeed = abilityResult.result.gameSpeed;
    if (abilityResult.result.lives !== undefined) newLives = abilityResult.result.lives;
    if (abilityResult.result.forceFoodType && abilityResult.result.foodType)
      forcedFoodType = abilityResult.result.foodType;
  }

  // Boss Collision Check
  if (bossSnake && headPosition) {
    const hitPart = getBossHitPart(headPosition, bossSnake);
    if (hitPart === 'head') {
      if (canDefeatBoss(bossSnake)) {
        if (activeBoss) {
          const reward = handleBossDefeat(activeBoss, prev);
          newScore += reward.scoreIncrease;
          if (GAME_CONFIG.enableParticles && bossSnake.positions[0]) {
            self.postMessage({
              type: 'SPAWN_PARTICLES',
              payload: {
                position: bossSnake.positions[0],
                color: activeBoss.visual.color,
                count: 30,
              },
            });
          }
          activeBoss = undefined;
          bossSnake = undefined;
          bossAbilityCooldowns.clear();
          forcedFoodType = null;
        }
      } else {
        // Dying
        if (isLivesEnabled() && newLives > 0) {
          gameState = { ...prev, snake: finalSnake, status: GameStatus.DYING, lives: newLives };
          self.postMessage({ type: 'GAME_OVER_OR_DYING', payload: { status: GameStatus.DYING } });
          return;
        } else {
          gameState = {
            ...prev,
            snake: finalSnake,
            status: GameStatus.GAME_OVER,
            lives: 0,
            highScore: Math.max(newScore, prev.highScore),
          };
          self.postMessage({
            type: 'GAME_OVER_OR_DYING',
            payload: { status: GameStatus.GAME_OVER, score: newScore },
          });
          return;
        }
      }
    } else if (hitPart === 'body') {
      const weaken = weakenBossSnake(bossSnake, 2);
      bossSnake = weaken.newBossSnake;
      newScore += weaken.pointsEarned;

      if (GAME_CONFIG.enableParticles && headPosition) {
        self.postMessage({
          type: 'SPAWN_PARTICLES',
          payload: {
            position: headPosition,
            color: activeBoss?.visual.color ?? '#3b82f6',
            count: 10,
          },
        });
      }

      if (bossSnake.positions.length <= 1) {
        // Defeated
        if (activeBoss) {
          const reward = handleBossDefeat(activeBoss, prev);
          newScore += reward.scoreIncrease;
          if (GAME_CONFIG.enableParticles && bossSnake.positions[0]) {
            self.postMessage({
              type: 'SPAWN_PARTICLES',
              payload: {
                position: bossSnake.positions[0],
                color: activeBoss.visual.color,
                count: 30,
              },
            });
          }
          activeBoss = undefined;
          bossSnake = undefined;
          bossAbilityCooldowns.clear();
          forcedFoodType = null;
        }
      }
    }
  }

  // Poison Shots Auto-Fire
  if (gameState.isFiringPoison) {
    const fireInterval = POISON_CONFIG.fireInterval ?? 200;
    if (currentTime - lastPoisonFireTime >= fireInterval) {
      const headPosition = gameState.snake[0];
      if (headPosition) {
        const newShot = createPoisonShot(headPosition, gameState.direction);
        pendingPoisonShots.push(newShot);
        lastPoisonFireTime = currentTime;
      }
    }
  }

  // Merge pending shots
  let currentShots = [...prev.poisonShots, ...pendingPoisonShots];
  pendingPoisonShots = []; // clear buffer

  const poisonUpdate = updatePoisonShots(currentShots, GAME_CONFIG.gridSize, newObstacles);
  let newPoisonShots = poisonUpdate.shots;

  // Limit poison shots
  const maxShots = POISON_CONFIG.maxShotsSimultaneous ?? 50;
  if (newPoisonShots.length > maxShots) {
    newPoisonShots = newPoisonShots.slice(-maxShots);
  }

  // Obstacle destruction by poison
  if (POISON_CONFIG.canDestroyObstacles && poisonUpdate.hitObstacles.length > 0) {
    const destroyRes = destroyObstacles(newObstacles, poisonUpdate.hitObstacles, []);
    newObstacles = destroyRes.remainingObstacles;
    // Emit particles for destruction
    poisonUpdate.hitObstacles.forEach((obs) => {
      self.postMessage({
        type: 'SPAWN_PARTICLES',
        payload: { position: obs.position, color: '#9ca3af', count: 6 },
      });
    });
  }

  // Poison Boss Collision
  const shotsToRemove: string[] = [];
  if (POISON_CONFIG.canDefeatBoss && bossSnake) {
    newPoisonShots.forEach((shot) => {
      if (!bossSnake) return;

      if (hasBossHeadCollision(shot, bossSnake)) {
        shotsToRemove.push(shot.id);
        if (activeBoss && bossSnake) {
          if (canDefeatBoss(bossSnake)) {
            // Defeat
            const reward = handleBossDefeat(activeBoss, prev);
            newScore += reward.scoreIncrease;
            if (GAME_CONFIG.enableParticles && bossSnake.positions[0]) {
              self.postMessage({
                type: 'SPAWN_PARTICLES',
                payload: {
                  position: bossSnake.positions[0],
                  color: activeBoss.visual.color,
                  count: 30,
                },
              });
            }
            activeBoss = undefined;
            bossSnake = undefined;
            bossAbilityCooldowns.clear();
            forcedFoodType = null;
          } else {
            // Weaken
            const weaken = weakenBossSnake(bossSnake, 1);
            bossSnake = weaken.newBossSnake;
            newScore += weaken.pointsEarned;
            if (GAME_CONFIG.enableParticles && shot.position) {
              self.postMessage({
                type: 'SPAWN_PARTICLES',
                payload: { position: shot.position, color: activeBoss.visual.color, count: 10 },
              });
            }
          }
        }
      } else if (hasBossBodyCollision(shot, bossSnake)) {
        shotsToRemove.push(shot.id);
        if (activeBoss && bossSnake) {
          const weaken = weakenBossSnake(bossSnake, 1);
          bossSnake = weaken.newBossSnake;
          newScore += weaken.pointsEarned;
          if (GAME_CONFIG.enableParticles && shot.position) {
            self.postMessage({
              type: 'SPAWN_PARTICLES',
              payload: { position: shot.position, color: activeBoss.visual.color, count: 8 },
            });
          }
          if (bossSnake.positions.length <= 1) {
            // Defeated
            const reward = handleBossDefeat(activeBoss, prev);
            newScore += reward.scoreIncrease;
            if (GAME_CONFIG.enableParticles && bossSnake.positions[0]) {
              self.postMessage({
                type: 'SPAWN_PARTICLES',
                payload: {
                  position: bossSnake.positions[0],
                  color: activeBoss.visual.color,
                  count: 30,
                },
              });
            }
            activeBoss = undefined;
            bossSnake = undefined;
            bossAbilityCooldowns.clear();
            forcedFoodType = null;
          }
        }
      }
    });
  }
  if (shotsToRemove.length > 0) {
    newPoisonShots = newPoisonShots.filter((s) => !shotsToRemove.includes(s.id));
  }

  // Update Active Powerups
  newActivePowerUps = getActivePowerUps(newActivePowerUps);

  // Achievements
  let updatedAchievements = prev.achievements;
  if (GAME_CONFIG.enableAchievements) {
    const achieveRes = checkAchievements(prev.achievements, {
      score: newScore,
      level: newLevel,
      snakeLength: finalSnake.length,
      comboMultiplier: newCombo.multiplier,
      atePowerUp,
    });
    updatedAchievements = achieveRes.achievements;
    // If new achievements, we might want to notify main thread to save them
    if (updatedAchievements !== prev.achievements) {
      self.postMessage({ type: 'SAVE_ACHIEVEMENTS', payload: updatedAchievements });
    }
  }

  // Update State
  gameState = {
    ...prev,
    snake: finalSnake,
    food: newFood,
    direction: currentDirection,
    nextDirection: currentDirection, // Synced
    score: newScore,
    highScore: Math.max(newScore, prev.highScore),
    level: newLevel,
    gameSpeed: baseGameSpeed,
    activePowerUps: newActivePowerUps,
    obstacles: newObstacles,
    portals: newPortals,
    combo: newCombo,
    guardianFlag: newGuardianFlag,
    guardianFlagSide: newGuardianFlagSide,
    poisonShots: newPoisonShots,
    achievements: updatedAchievements,
    lives: newLives,
    statistics,
    currentPhase:
      newScore === 0 && prev.currentPhase
        ? prev.currentPhase
        : (currentPhase?.id ?? prev.currentPhase),
    phaseLevelType:
      newScore === 0 && prev.phaseLevelType
        ? prev.phaseLevelType
        : (currentPhase?.type ?? prev.phaseLevelType),
    activeBoss,
    bossSnake,
  };
}
