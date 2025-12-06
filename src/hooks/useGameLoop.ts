import { useEffect, useRef, useCallback } from 'react';
import {
  GameStatus,
  GameState,
  FoodType,
  Obstacle,
  Direction,
  Position,
  ActivePowerUp,
  Particle,
  Portal,
} from '@/types/game';
import { GAME_CONFIG, INITIAL_SNAKE_POSITION, PERFORMANCE_CONFIG } from '@/constants/game';
import {
  moveSnake,
  hasSelfCollision,
  hasFoodCollision,
  generateRandomFood,
  isValidDirectionChange,
  isSafeDirectionChange,
  saveHighScore,
  getOppositeDirection,
  getNextHeadPosition,
} from '@/utils/gameLogic';
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
import { createParticles, updateParticles } from '@/utils/particles';
import { generateObstacles, hasObstacleCollision, getActiveObstacles } from '@/utils/obstacles';
import { destroyObstacles } from '@/utils/obstacleDestruction';
import { OBSTACLE_CONFIG } from '@/constants/obstacles';
import { checkAchievements, saveAchievements } from '@/utils/achievements';
import { hasFoodExpired } from '@/utils/foodTimer';
import { loseLife, isLivesEnabled, addLife } from '@/utils/lives';
import { POWER_UP_CONFIG } from '@/constants/powerUps';
import { INITIAL_DIRECTION } from '@/constants/game';
import { useGameState } from './useGameState';
import { initializeStatistics } from '@/utils/statistics';
import { GameStatisticsTracking } from '@/types/statistics';
import {
  generatePortalPair,
  getPortalAtPosition,
  getPortalPair,
  getActivePortals,
} from '@/utils/portals';
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
import { Chef } from '@/types/phases';
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
import { POISON_CONFIG } from '@/constants/game';
import { createLogger, LogContext, logGameEvent } from '@/utils/logger';

// ============================================================================
// Helper Functions - Direction and Movement
// ============================================================================

/**
 * Handle direction changes with reverse controls support and safety checks
 */
function handleDirection(
  currentDirection: Direction,
  nextDirection: Direction,
  snake: Position[],
  activePowerUps: ActivePowerUp[],
): Direction {
  // Handle reverse controls
  const reverseControls = hasReverseControls(activePowerUps);
  let nextDirectionInput = nextDirection;

  // Reverse the input direction if reverse controls are active
  if (reverseControls && nextDirection !== currentDirection) {
    nextDirectionInput = getOppositeDirection(nextDirection);
  }

  // Apply direction change immediately if valid and safe
  if (
    nextDirectionInput !== currentDirection &&
    isValidDirectionChange(currentDirection, nextDirectionInput)
  ) {
    // Always apply direction change if valid (not opposite)
    // The collision detection will prevent actual self-collision during movement
    // This allows rapid direction changes without blocking
    return nextDirectionInput;
  }

  // Use the current direction
  return currentDirection;
}

// ============================================================================
// Helper Functions - Portal Teleportation
// ============================================================================

interface PortalTeleportResult {
  snake: Position[];
  headPosition: Position | undefined;
  particles: Particle[];
}

/**
 * Handle portal teleportation if snake head is on a portal
 */
function handlePortalTeleport(
  snake: Position[],
  portals: Portal[],
  particles: Particle[],
): PortalTeleportResult {
  const activePortals = getActivePortals(portals, PERFORMANCE_CONFIG.maxPortals);
  let newSnake = snake;
  let headPosition = snake[0];

  if (headPosition) {
    const portalAtHead = getPortalAtPosition(headPosition, activePortals);
    if (portalAtHead) {
      const pairedPortal = getPortalPair(portalAtHead, activePortals);
      if (pairedPortal) {
        // Teleport to paired portal, maintaining direction
        newSnake = [{ ...pairedPortal.position }, ...newSnake.slice(1)];
        headPosition = newSnake[0]; // Update head position after teleportation

        // Create teleportation particles
        if (GAME_CONFIG.enableParticles) {
          const portalColor = PORTAL_CONFIG.colors.portal1.primary;
          return {
            snake: newSnake,
            headPosition,
            particles: [
              ...particles,
              ...createParticles(headPosition, portalColor, 12, 800),
              ...createParticles(pairedPortal.position, portalColor, 12, 800),
            ],
          };
        }
      }
    }
  }

  return { snake: newSnake, headPosition, particles };
}

// ============================================================================
// Helper Functions - Food and Power-ups
// ============================================================================

interface FoodProcessingResult {
  snake: Position[];
  score: number;
  activePowerUps: ActivePowerUp[];
  combo: import('@/types/game').ComboState;
  particles: Particle[];
  lives: number;
  statistics: GameStatisticsTracking;
  atePowerUp: boolean;
}

/**
 * Process food consumption with power-up effects, growth, and scoring
 */
function handleFoodAndPowerUps(
  ateFood: boolean,
  food: import('@/types/game').Food,
  snake: Position[],
  score: number,
  combo: import('@/types/game').ComboState,
  activePowerUps: ActivePowerUp[],
  lives: number,
  particles: Particle[],
  statistics: GameStatisticsTracking,
): FoodProcessingResult {
  const newActivePowerUps = [...activePowerUps];
  let newSnake = snake;
  let newScore = score;
  let newCombo = combo;
  let newLives = lives;
  let atePowerUp = false;

  if (ateFood) {
    // Update statistics - food eaten
    const currentFoodCount = statistics.foodsByType[food.type] ?? 0;
    statistics = {
      ...statistics,
      foodsEaten: statistics.foodsEaten + 1,
      foodsByType: {
        ...statistics.foodsByType,
        [food.type]: currentFoodCount + 1,
      },
    };

    // Handle JOKER - randomly choose a positive power-up before applying effects
    let actualFoodType = food.type;
    if (food.type === FoodType.JOKER) {
      const positiveTypes = [
        FoodType.SPEED_BOOST,
        FoodType.BONUS_POINTS,
        FoodType.EXTRA_GROWTH,
        FoodType.PHASE_THROUGH,
      ];
      actualFoodType =
        positiveTypes[Math.floor(Math.random() * positiveTypes.length)] ?? FoodType.BONUS_POINTS;
    }

    const powerUpEffect = applyPowerUpEffect(actualFoodType, score, snake.length);

    // Add bonus points if JOKER was eaten
    if (food.type === FoodType.JOKER) {
      powerUpEffect.scoreIncrease += 15; // Bonus for eating joker
    }

    // Track if power-up was eaten
    if (food.type !== FoodType.NORMAL) {
      atePowerUp = true;
    }

    // Calculate score: base points only (no multipliers for now)
    const baseScoreIncrease = powerUpEffect.scoreIncrease;
    newScore = score + baseScoreIncrease;

    // Update combo AFTER calculating score (for next food)
    if (GAME_CONFIG.enableCombos) {
      newCombo = updateCombo(combo, true);
    }

    // Create particles
    if (GAME_CONFIG.enableParticles) {
      const foodColor = POWER_UP_CONFIG.colors[food.type]?.primary || '#ef4444';
      particles = [...particles, ...createParticles(snake[0], foodColor, 8, 600)];
    }

    // Apply growth (positive or negative)
    if (powerUpEffect.growthAmount > 0) {
      // Grow: When snake eats, it should grow from the tail
      const growthAmount = powerUpEffect.growthAmount;
      const currentTail = newSnake[newSnake.length - 1];

      // Add new segments at the tail position (they will move next frame)
      for (let i = 0; i < growthAmount; i++) {
        newSnake = [...newSnake, { ...currentTail }];
      }
    } else if (powerUpEffect.growthAmount < 0) {
      // Shrink (for poison)
      const shrinkAmount = Math.abs(powerUpEffect.growthAmount);
      const minLength = 1;
      const newLength = Math.max(minLength, newSnake.length - shrinkAmount);
      newSnake = newSnake.slice(0, newLength);
    }

    // Update statistics - max combo
    if (newCombo.multiplier > statistics.maxCombo) {
      statistics = {
        ...statistics,
        maxCombo: newCombo.multiplier,
      };
    }

    // Handle EXTRA_LIFE power-up
    if (food.type === FoodType.EXTRA_LIFE) {
      newLives = addLife(lives);
    }

    // Activate power-up if needed
    if (powerUpEffect.shouldActivatePowerUp) {
      newActivePowerUps.push(createActivePowerUp(actualFoodType));
    }
  } else {
    // Update combo expiration when no food eaten
    if (GAME_CONFIG.enableCombos) {
      newCombo = updateCombo(combo, false);
    }
  }

  return {
    snake: newSnake,
    score: newScore,
    activePowerUps: newActivePowerUps,
    combo: newCombo,
    particles,
    lives: newLives,
    statistics,
    atePowerUp,
  };
}

// ============================================================================
// Helper Functions - Obstacles
// ============================================================================

interface ObstacleUpdateResult {
  obstacles: Obstacle[];
  statistics: GameStatisticsTracking;
  lastSpawnTime: number;
}

/**
 * Handle obstacle generation and spawning based on phase configuration
 */
function handleObstacles(
  obstacles: Obstacle[],
  level: number,
  previousLevel: number,
  snake: Position[],
  statistics: GameStatisticsTracking,
  phaseConfig: { obstaclesEnabled?: boolean; obstaclesFrequency?: number } | undefined,
  lastSpawnTime: number,
  currentTime: number,
): ObstacleUpdateResult {
  // Filter out expired temporary obstacles first
  let newObstacles = getActiveObstacles(obstacles);

  // Initialize spawn timer on first game start
  let updatedSpawnTime = lastSpawnTime;
  if (lastSpawnTime === 0) {
    updatedSpawnTime = currentTime;
  }

  const timeSinceLastSpawn = currentTime - updatedSpawnTime;

  // Spawn obstacles on level up OR periodically during gameplay (every 1.5 seconds)
  const shouldSpawnObstacle =
    GAME_CONFIG.enableObstacles &&
    phaseConfig?.obstaclesEnabled !== false &&
    (level > previousLevel || // Spawn on level up
      (updatedSpawnTime > 0 && timeSinceLastSpawn >= OBSTACLE_CONFIG.spawnInterval)); // Spawn periodically

  if (shouldSpawnObstacle) {
    const previousObstaclesCount = newObstacles.length;
    newObstacles = generateObstacles(
      level,
      snake,
      newObstacles,
      GAME_CONFIG.gridSize,
      phaseConfig?.obstaclesEnabled,
      phaseConfig?.obstaclesFrequency ?? OBSTACLE_CONFIG.spawnChance,
    );
    // Update spawn time whenever we attempt to spawn (even if no obstacles were created)
    updatedSpawnTime = currentTime;
    // Update statistics - obstacles encountered
    if (newObstacles.length > previousObstaclesCount) {
      statistics = {
        ...statistics,
        obstaclesEncountered:
          statistics.obstaclesEncountered + (newObstacles.length - previousObstaclesCount),
      };
    }
  } else if (phaseConfig?.obstaclesEnabled === false) {
    // Clear obstacles if phase doesn't allow them
    newObstacles = [];
  }

  return {
    obstacles: newObstacles,
    statistics,
    lastSpawnTime: updatedSpawnTime,
  };
}

// ============================================================================
// Helper Functions - Poison Shots
// ============================================================================

interface PoisonShotsObstaclesResult {
  poisonShots: import('@/types/game').PoisonShot[];
  obstacles: Obstacle[];
  particles: Particle[];
}

/**
 * Handle poison shots movement and obstacle destruction
 * Returns updated shots, obstacles (with destroyed ones removed), and particles
 */
function handlePoisonShotsObstacles(
  poisonShots: import('@/types/game').PoisonShot[],
  obstacles: Obstacle[],
  particles: Particle[],
): PoisonShotsObstaclesResult {
  // Update poison shots: move them and check collisions with obstacles
  const poisonUpdateResult = updatePoisonShots(poisonShots, GAME_CONFIG.gridSize, obstacles);

  const newPoisonShots = poisonUpdateResult.shots;
  let newObstacles = obstacles;
  let newParticles = particles;

  // Process obstacles hit by poison shots (destroy obstacles)
  // Use generic destruction system for consistent physics
  if (POISON_CONFIG.canDestroyObstacles && poisonUpdateResult.hitObstacles.length > 0) {
    const destructionResult = destroyObstacles(
      newObstacles,
      poisonUpdateResult.hitObstacles,
      newParticles,
    );
    newObstacles = destructionResult.remainingObstacles;
    newParticles = destructionResult.particles;
  }

  return {
    poisonShots: newPoisonShots,
    obstacles: newObstacles,
    particles: newParticles,
  };
}

// ============================================================================
// Helper Functions - Boss Combat
// ============================================================================

interface BossCombatResult {
  bossDefeated: boolean;
  bossSnake: import('@/types/game').BossSnake | undefined;
  score: number;
  particles: Particle[];
  shouldEndGame: boolean;
  gameStatus?: GameStatus;
}

/**
 * Handle boss combat collision - unified system for ALL bosses
 * Strategic battle system:
 * - Hit body: weaken boss (remove 2 segments)
 * - Hit head when weak (≤3 segments): defeat boss
 * - Hit head when strong (>3 segments): player loses life/game over
 */
function handleBossCombat(
  headPosition: Position | undefined,
  bossSnake: import('@/types/game').BossSnake | undefined,
  activeBoss: Chef | undefined,
  score: number,
  particles: Particle[],
  lives: number,
): BossCombatResult {
  if (!bossSnake || !headPosition) {
    return {
      bossDefeated: false,
      bossSnake,
      score,
      particles,
      shouldEndGame: false,
    };
  }

  const hitPart = getBossHitPart(headPosition, bossSnake);

  if (hitPart === 'head') {
    // Player hit boss head
    if (canDefeatBoss(bossSnake)) {
      // Boss is weakened enough - can be defeated!
      let newScore = score;
      let newParticles = particles;

      if (activeBoss) {
        const bossReward = handleBossDefeat(activeBoss, {
          score,
          lives,
        } as GameState);
        newScore += bossReward.scoreIncrease;

        // Create particles for boss defeat
        if (GAME_CONFIG.enableParticles && bossSnake.positions[0]) {
          const bossColor = activeBoss.visual.color;
          newParticles = [
            ...newParticles,
            ...createParticles(bossSnake.positions[0], bossColor, 30, 1500),
          ];
        }
      }

      return {
        bossDefeated: true,
        bossSnake: undefined,
        score: newScore,
        particles: newParticles,
        shouldEndGame: false,
      };
    } else {
      // Boss is still too strong - player loses life/game over
      return {
        bossDefeated: false,
        bossSnake,
        score,
        particles,
        shouldEndGame: true,
        gameStatus: isLivesEnabled() && lives > 0 ? GameStatus.DYING : GameStatus.GAME_OVER,
      };
    }
  } else if (hitPart === 'body') {
    // Player hit boss body - weaken the boss!
    const weakenResult = weakenBossSnake(bossSnake, 2);
    const newBossSnake = weakenResult.newBossSnake;
    let newScore = score + weakenResult.pointsEarned;
    let newParticles = particles;

    // Create particles for weakening
    if (GAME_CONFIG.enableParticles && headPosition) {
      const bossColor = activeBoss?.visual.color ?? '#3b82f6';
      newParticles = [...newParticles, ...createParticles(headPosition, bossColor, 10, 600)];
    }

    // If boss was weakened to death (1 segment left)
    if (newBossSnake.positions.length <= 1) {
      // Boss automatically defeated
      if (activeBoss) {
        const bossReward = handleBossDefeat(activeBoss, {
          score: newScore,
          lives,
        } as GameState);
        newScore += bossReward.scoreIncrease;

        if (GAME_CONFIG.enableParticles && newBossSnake.positions[0]) {
          const bossColor = activeBoss.visual.color;
          newParticles = [
            ...newParticles,
            ...createParticles(newBossSnake.positions[0], bossColor, 30, 1500),
          ];
        }
      }

      return {
        bossDefeated: true,
        bossSnake: undefined,
        score: newScore,
        particles: newParticles,
        shouldEndGame: false,
      };
    }

    return {
      bossDefeated: false,
      bossSnake: newBossSnake,
      score: newScore,
      particles: newParticles,
      shouldEndGame: false,
    };
  }

  return {
    bossDefeated: false,
    bossSnake,
    score,
    particles,
    shouldEndGame: false,
  };
}

export function useGameLoop() {
  const gameLoopLogger = createLogger(LogContext.GAME_LOOP);

  const {
    gameState,
    resetGame,
    startGame,
    pauseGame,
    setDirection,
    updateGameState,
    setSpeedBoost,
    setFiringPoison,
  } = useGameState();

  const gameLoopRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(0);
  const deathTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bossAbilityCooldownsRef = useRef<Map<string, number>>(new Map());
  const lastObstacleSpawnRef = useRef<number>(0); // Track last obstacle spawn time
  const forcedFoodTypeRef = useRef<FoodType | null>(null);
  const gameStateRef = useRef<GameState>(gameState);
  const poisonFireIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPoisonFireTimeRef = useRef<number>(0);
  const previousDirectionRef = useRef<Direction | null>(null);
  const lastMoveLogTimeRef = useRef<number>(0);
  const pendingPoisonShotsRef = useRef<import('@/types/game').PoisonShot[]>([]);
  const poisonShotBatchTimeoutRef = useRef<number | null>(null); // requestAnimationFrame ID

  // Frame buffer: Separate internal state from React state
  // This allows game logic to run independently of render cycles
  const internalGameStateRef = useRef<GameState>(gameState);
  const renderUpdateFrameCounterRef = useRef<number>(0);
  const RENDER_UPDATE_INTERVAL = 1; // Update React state every frame (60fps render, 60fps logic)
  // Set to 1 to maintain smooth visual updates while still benefiting from batching
  const renderUpdateScheduledRef = useRef<boolean>(false);

  // Keep gameStateRef updated with latest state
  useEffect(() => {
    gameStateRef.current = gameState;
    internalGameStateRef.current = gameState;
  }, [gameState]);

  // Function to schedule React state update (throttled)
  // With INTERVAL=1, this still provides batching benefits by using requestAnimationFrame
  const scheduleRenderUpdate = useCallback(() => {
    if (renderUpdateScheduledRef.current) return;

    renderUpdateScheduledRef.current = true;
    requestAnimationFrame(() => {
      // Update React state with latest internal state
      updateGameState(() => internalGameStateRef.current);
      renderUpdateScheduledRef.current = false;
    });
  }, [updateGameState]);

  const updateGame = useCallback(() => {
    // Work with internal state (doesn't trigger React re-render)
    const prev = internalGameStateRef.current;

    const newState: GameState = (() => {
      if (prev.status !== GameStatus.PLAYING) {
        return prev;
      }

      // Handle direction changes with reverse controls and safety checks
      // Cache active power ups to avoid recalculating if array hasn't changed
      const currentActivePowerUps =
        prev.activePowerUps.length > 0 ? getActivePowerUps(prev.activePowerUps) : [];
      let currentDirection = handleDirection(
        prev.direction,
        prev.nextDirection,
        prev.snake,
        currentActivePowerUps,
      );

      // Verify that the direction change won't cause immediate collision
      // Check if moving in the new direction would cause collision BEFORE moving
      const nextHeadPos = getNextHeadPosition(
        prev.snake[0] ?? { x: 0, y: 0 },
        currentDirection,
        GAME_CONFIG.gridSize,
      );

      // Check if next position would collide with body (skip first 2 segments for quick turns)
      let wouldCollide = false;
      if (prev.snake.length >= 3) {
        for (let i = 2; i < prev.snake.length; i++) {
          if (prev.snake[i]?.x === nextHeadPos.x && prev.snake[i]?.y === nextHeadPos.y) {
            wouldCollide = true;
            break;
          }
        }
      }

      // If would collide, keep current direction instead of new one
      if (wouldCollide && currentDirection !== prev.direction) {
        currentDirection = prev.direction;
      }

      // Move snake with validated direction
      const previousHeadPosition = prev.snake[0];
      let newSnake = moveSnake(prev.snake, currentDirection, GAME_CONFIG.gridSize, false);
      const newHeadPosition = newSnake[0];

      // Log snake movement (throttled to avoid spam - every 1000ms or on direction change only)
      // Reduced frequency to minimize logging overhead
      const moveLogTime = Date.now();
      const directionChanged =
        previousDirectionRef.current !== null && previousDirectionRef.current !== currentDirection;
      const shouldLogMove = directionChanged && moveLogTime - lastMoveLogTimeRef.current > 500;

      if (shouldLogMove && newHeadPosition) {
        logGameEvent('snake-moved', {
          previousPosition: previousHeadPosition,
          newPosition: newHeadPosition,
          direction: currentDirection,
          snakeLength: newSnake.length,
          directionChanged: true,
          wouldHaveCollided: wouldCollide && currentDirection !== prev.direction,
        });
        lastMoveLogTimeRef.current = moveLogTime;
      }

      previousDirectionRef.current = currentDirection;

      // Initialize particles early for portal teleportation
      // Update particles and apply performance limits
      let newParticles = GAME_CONFIG.enableParticles
        ? updateParticles(prev.particles, PERFORMANCE_CONFIG.maxParticles)
        : prev.particles;

      // Handle portal teleportation BEFORE collision checks
      const portalResult = handlePortalTeleport(newSnake, prev.portals, newParticles);
      newSnake = portalResult.snake;
      const headPosition = portalResult.headPosition;
      newParticles = portalResult.particles;

      // Filter out expired temporary obstacles
      // Only filter if obstacles array has items (optimization)
      const activeObstacles =
        prev.obstacles.length > 0 ? getActiveObstacles(prev.obstacles) : prev.obstacles;

      // Check obstacle collision (ignore if phase through is active)
      const canPhaseThrough = hasPhaseThrough(currentActivePowerUps);

      // Check for collisions
      const hasCollision =
        (GAME_CONFIG.enableObstacles &&
          !canPhaseThrough &&
          hasObstacleCollision(headPosition ?? newSnake[0], activeObstacles)) ||
        (newSnake.length >= 4 && hasSelfCollision(newSnake));

      // Initialize statistics if not present (at start of update)
      let statistics: GameStatisticsTracking = prev.statistics ?? initializeStatistics();

      if (hasCollision) {
        // Use lives system if enabled
        if (isLivesEnabled() && prev.lives > 0) {
          // Enter dying state to show death animation
          return {
            ...prev,
            status: GameStatus.DYING,
            statistics,
          };
        } else {
          // No lives left, game over
          saveHighScore(prev.score);
          saveAchievements(prev.achievements);
          return {
            ...prev,
            status: GameStatus.GAME_OVER,
            highScore: Math.max(prev.score, prev.highScore),
            statistics,
          };
        }
      }

      // Use the head position after portal teleportation (if any)
      const ateFood = headPosition ? hasFoodCollision(headPosition, prev.food) : false;

      // Check flag capture - must check AFTER portal teleportation
      const capturedFlag =
        prev.guardianFlag &&
        headPosition &&
        headPosition.x === prev.guardianFlag.position.x &&
        headPosition.y === prev.guardianFlag.position.y;

      // Initialize boss variables early (needed for flag capture check)
      let activeBoss = prev.activeBoss;
      let bossSnake = prev.bossSnake;
      let newGuardianFlag = prev.guardianFlag;
      let newGuardianFlagSide = prev.guardianFlagSide;

      // Process food and power-ups
      const foodResult = handleFoodAndPowerUps(
        ateFood,
        prev.food,
        newSnake,
        prev.score,
        prev.combo,
        getActivePowerUps(prev.activePowerUps),
        prev.lives,
        newParticles,
        statistics,
      );

      const finalSnake = foodResult.snake;
      let newScore = foodResult.score;
      const newActivePowerUps = foodResult.activePowerUps;
      const newCombo = foodResult.combo;
      const atePowerUp = foodResult.atePowerUp;
      let newLives = foodResult.lives;
      newParticles = foodResult.particles;
      statistics = foodResult.statistics;

      // Log food eaten event
      if (ateFood) {
        logGameEvent('food-eaten', {
          foodType: prev.food.type,
          foodPosition: prev.food.position,
          score: newScore,
          scoreIncrease: newScore - prev.score,
          level: prev.level,
          combo: newCombo.multiplier,
          snakeLength: finalSnake.length,
          snakeLengthIncrease: finalSnake.length - newSnake.length,
        });

        if (atePowerUp) {
          logGameEvent('power-up-activated', {
            foodType: prev.food.type,
            activePowerUpsCount: newActivePowerUps.length,
            newPowerUpType: prev.food.type,
          });
        }
      }

      // Handle Guardian flag capture - instant boss defeat!
      // Check this OUTSIDE the ateFood block so it works independently
      if (capturedFlag && activeBoss && activeBoss.id === 'guardian') {
        // Player captured the flag - boss is defeated!
        const bossReward = handleBossDefeat(activeBoss, prev);
        newScore += bossReward.scoreIncrease;
        newLives = addLife(prev.lives); // Flag gives extra life
        newGuardianFlag = null; // Clear flag
        activeBoss = undefined; // Remove boss
        bossSnake = undefined; // Remove boss snake

        // Create particles for flag capture
        if (GAME_CONFIG.enableParticles && prev.guardianFlag) {
          const flagColor = '#10b981'; // Green for success
          newParticles = [
            ...newParticles,
            ...createParticles(prev.guardianFlag.position, flagColor, 30, 1500),
          ];
        }

        // Clear boss ability cooldowns
        bossAbilityCooldownsRef.current = new Map();
        forcedFoodTypeRef.current = null;
      }

      // Calculate level from score, but preserve explicit level if score is 0 and we have a currentPhase set
      // This handles the debug case where we set a specific phase but score is reset to 0
      // Only recalculate if score changed (optimization)
      let newLevel = prev.level;
      if (newScore !== prev.score) {
        newLevel = calculateLevel(newScore);
        if (newLevel === 1 && newScore === 0 && prev.currentPhase && prev.level > 1) {
          // If score is 0, level calculated would be 1, but we want to preserve the debug-selected level
          // Only do this if we have an explicit currentPhase set and the level was explicitly set
          newLevel = prev.level;
        }
      }

      // Only recalculate speed if level changed
      let baseGameSpeed = prev.gameSpeed;
      if (newLevel !== prev.level) {
        baseGameSpeed = calculateGameSpeed(newLevel);
      }

      // Phase system: Detect phase changes and update phase state (before obstacles and food generation)
      // Only recalculate phase if level changed (optimization)
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
          // Boss is from debug mode - use boss phase
          currentPhase = bossPhase;
        }
      }
      const phaseConfig = currentPhase?.config;

      // Generate obstacles continuously during gameplay (respecting phase configuration)
      const currentTime = Date.now();
      const obstacleResult = handleObstacles(
        prev.obstacles,
        newLevel,
        prev.level,
        finalSnake,
        statistics,
        phaseConfig,
        lastObstacleSpawnRef.current,
        currentTime,
      );
      let newObstacles = obstacleResult.obstacles;
      statistics = obstacleResult.statistics;
      lastObstacleSpawnRef.current = obstacleResult.lastSpawnTime;

      // Update statistics - max snake length
      if (finalSnake.length > statistics.maxSnakeLength) {
        statistics = {
          ...statistics,
          maxSnakeLength: finalSnake.length,
        };
      }

      // Check if current food has expired
      const foodExpired = hasFoodExpired(prev.food);

      // Generate food with phase-specific configurations
      // Use forced food type if chaos_powerups is active
      const forcedFoodType = forcedFoodTypeRef.current;
      const newFood =
        ateFood || foodExpired
          ? generateRandomFood(
              finalSnake,
              GAME_CONFIG.gridSize,
              newObstacles,
              phaseConfig?.powerUpsFrequency,
              phaseConfig?.timedFoodFrequency,
              forcedFoodType ?? undefined,
            )
          : prev.food;

      // Clear forced food type after using it (only applies to next food)
      if (forcedFoodType && (ateFood || foodExpired)) {
        forcedFoodTypeRef.current = null;
      }

      // Handle PORTAL power-up - create portal pair when food is eaten
      // Only if portals are enabled in current phase
      let newPortals = getActivePortals(prev.portals, PERFORMANCE_CONFIG.maxPortals);
      if (ateFood && prev.food.type === FoodType.PORTAL && phaseConfig?.portalsEnabled) {
        const portalPair = generatePortalPair(finalSnake, newObstacles, GAME_CONFIG.gridSize);
        if (portalPair && newPortals.length + portalPair.length <= PERFORMANCE_CONFIG.maxPortals) {
          newPortals = [...newPortals, ...portalPair];
        }
      }

      // Ensure portals don't exceed limit (only sort if needed - optimization)
      if (newPortals.length > PERFORMANCE_CONFIG.maxPortals) {
        // Use slice to create new array before sorting to avoid mutating original
        const sorted = [...newPortals].sort((a, b) => b.spawnTime - a.spawnTime);
        newPortals = sorted.slice(0, PERFORMANCE_CONFIG.maxPortals);
      }
      // Update boss for boss levels (levels 10, 20, 30, etc.)
      // But preserve debug boss if it doesn't match the level
      // activeBoss already declared above
      if (shouldSpawnBoss(newLevel)) {
        const levelBoss = getBossForLevel(newLevel);
        // Only override if boss matches level (not a debug boss)
        if (levelBoss && levelBoss.id === prev.activeBoss?.id) {
          activeBoss = levelBoss;
        } else if (!prev.activeBoss) {
          // No debug boss, use level boss
          activeBoss = levelBoss;
        }
        // Otherwise keep debug boss
      }
      // Don't clear boss if it's a debug boss that doesn't match level

      // Initialize or update boss snake
      // bossSnake already declared above
      if (activeBoss && (!prev.activeBoss || prev.activeBoss.id !== activeBoss.id)) {
        // New boss spawned - generate initial resources first
        const bossResources = generateBossInitialResources(
          activeBoss,
          finalSnake,
          newObstacles,
          newPortals,
          GAME_CONFIG.gridSize,
        );
        newObstacles = bossResources.obstacles;
        newPortals = bossResources.portals;

        // Initialize boss snake with resources available
        bossSnake =
          initializeBossSnake(activeBoss, finalSnake, newObstacles, GAME_CONFIG.gridSize) ??
          undefined;
        // Clear cooldowns for new boss
        bossAbilityCooldownsRef.current = new Map();
        forcedFoodTypeRef.current = null;

        // For Guardian boss, create the flag immediately when boss spawns
        if (activeBoss.id === 'guardian' && !prev.guardianFlag) {
          const flagPosition = generateGuardianFlagPosition(
            finalSnake,
            bossSnake?.positions ?? [],
            newObstacles,
            GAME_CONFIG.gridSize,
          );
          if (flagPosition) {
            newGuardianFlag = {
              position: flagPosition,
              type: FoodType.EXTRA_LIFE,
              spawnTime: Date.now(),
              duration: undefined,
            };
          }
        }
      } else if (!activeBoss) {
        // Boss was removed or not active - clear boss snake
        bossSnake = undefined;
        // Clear cooldowns when boss is removed
        bossAbilityCooldownsRef.current = new Map();
        forcedFoodTypeRef.current = null;
      } else if (bossSnake && activeBoss) {
        // Process boss abilities FIRST (to create flag if needed)
        const currentGameState: GameState = {
          ...prev,
          snake: finalSnake,
          obstacles: newObstacles,
          portals: newPortals,
          bossSnake,
          guardianFlag: newGuardianFlag, // Include current flag state
          guardianFlagSide: newGuardianFlagSide, // Include current flag side
        };
        const abilityResult = processBossAbilities(
          activeBoss,
          currentGameState,
          bossAbilityCooldownsRef.current,
        );
        bossAbilityCooldownsRef.current = abilityResult.updatedCooldowns;

        // Handle guardian flag spawn BEFORE boss movement
        if (abilityResult.result.guardianFlag !== undefined) {
          newGuardianFlag = abilityResult.result.guardianFlag;
        }
        if (abilityResult.result.guardianFlagSide !== undefined) {
          newGuardianFlagSide = abilityResult.result.guardianFlagSide;
        }

        // Move boss snake based on AI behavior (now with updated flag position)
        const nextBossDirection = calculateBossNextDirection(
          activeBoss,
          bossSnake,
          finalSnake,
          newObstacles,
          prev.food.position,
          GAME_CONFIG.gridSize,
          newGuardianFlag?.position ?? null, // Use updated flag position
        );
        bossSnake = moveBossSnake(bossSnake, nextBossDirection, GAME_CONFIG.gridSize);

        // Update flag position after boss moves (flag follows boss to the side)
        if (newGuardianFlag && bossSnake && bossSnake.positions.length > 0) {
          const bossHead = bossSnake.positions[0];
          // Use the stored side or default to right (1)
          const flagSide = newGuardianFlagSide ?? 1;
          const flagOffset = getFlagOffsetFromBossHead(bossSnake.direction, flagSide);
          const newFlagPosition = {
            x: Math.max(0, Math.min(bossHead.x + flagOffset.x, GAME_CONFIG.gridSize - 1)),
            y: Math.max(0, Math.min(bossHead.y + flagOffset.y, GAME_CONFIG.gridSize - 1)),
          };

          // Only update if position is valid and not occupied by boss body
          const isOnBossBody = bossSnake.positions.some(
            (pos) => pos.x === newFlagPosition.x && pos.y === newFlagPosition.y,
          );
          if (!isOnBossBody) {
            newGuardianFlag = {
              ...newGuardianFlag,
              position: newFlagPosition,
            };
          }
        }

        // Apply ability effects
        if (abilityResult.result.obstacles) {
          // Always merge new obstacles with existing ones to prevent losing any
          const resultObstacles = abilityResult.result.obstacles;
          if (resultObstacles.length > 0) {
            // Create a map of existing obstacles by position for quick lookup
            const existingObstaclesMap = new Map<string, Obstacle>();
            newObstacles.forEach((obs) => {
              const key = `${obs.position.x},${obs.position.y}`;
              existingObstaclesMap.set(key, obs);
            });

            // Add new obstacles, avoiding duplicates by position
            resultObstacles.forEach((obs) => {
              const key = `${obs.position.x},${obs.position.y}`;
              if (!existingObstaclesMap.has(key)) {
                newObstacles.push(obs);
                existingObstaclesMap.set(key, obs);
              } else {
                // Update existing obstacle if it's a moved one (different ID)
                const existing = existingObstaclesMap.get(key);
                if (existing && existing.id !== obs.id) {
                  // Replace the old obstacle with the new one (moved)
                  const index = newObstacles.findIndex((o) => o.id === existing.id);
                  if (index !== -1) {
                    newObstacles[index] = obs;
                  }
                }
              }
            });
          }
        }

        if (abilityResult.result.portals) {
          newPortals = [...newPortals, ...abilityResult.result.portals];
        }

        if (abilityResult.result.gameSpeed !== undefined) {
          baseGameSpeed = abilityResult.result.gameSpeed;
        }

        if (abilityResult.result.lives !== undefined) {
          newLives = abilityResult.result.lives;
        }

        // Handle chaos_powerups - force food type
        if (abilityResult.result.forceFoodType && abilityResult.result.foodType) {
          forcedFoodTypeRef.current = abilityResult.result.foodType;
        }

        // Handle guardian flag spawn
        if (abilityResult.result.guardianFlag !== undefined) {
          newGuardianFlag = abilityResult.result.guardianFlag;
        }
      }

      // Check for boss collision - new strategic battle system
      if (bossSnake && headPosition) {
        const hitPart = getBossHitPart(headPosition, bossSnake);

        if (hitPart === 'head') {
          // Player hit boss head
          if (canDefeatBoss(bossSnake)) {
            // Boss is weakened enough - can be defeated!
            if (activeBoss) {
              const bossReward = handleBossDefeat(activeBoss, prev);
              newScore += bossReward.scoreIncrease;

              // Create particles for boss defeat
              if (GAME_CONFIG.enableParticles && bossSnake.positions[0]) {
                const bossColor = activeBoss.visual.color;
                newParticles = [
                  ...newParticles,
                  ...createParticles(bossSnake.positions[0], bossColor, 30, 1500),
                ];
              }

              // Clear boss after defeat
              activeBoss = undefined;
              bossSnake = undefined;
              // Clear ability cooldowns
              bossAbilityCooldownsRef.current = new Map();
              forcedFoodTypeRef.current = null;
            }
          } else {
            // Boss is still too strong - player loses life/game over
            if (isLivesEnabled() && prev.lives > 0) {
              // Enter dying state
              return {
                ...prev,
                snake: finalSnake,
                score: newScore,
                status: GameStatus.DYING,
                lives: prev.lives,
                portals: newPortals,
                statistics,
                bossSnake,
              };
            } else {
              // No lives left, game over
              saveHighScore(newScore);
              saveAchievements(prev.achievements);
              return {
                ...prev,
                snake: finalSnake,
                score: newScore,
                status: GameStatus.GAME_OVER,
                portals: newPortals,
                highScore: Math.max(newScore, prev.highScore),
                statistics,
                bossSnake,
              };
            }
          }
        } else if (hitPart === 'body') {
          // Player hit boss body - weaken the boss!
          const weakenResult = weakenBossSnake(bossSnake, 2);
          bossSnake = weakenResult.newBossSnake;
          newScore += weakenResult.pointsEarned;

          // Create particles for weakening
          if (GAME_CONFIG.enableParticles && headPosition) {
            const bossColor = activeBoss?.visual.color ?? '#3b82f6';
            newParticles = [...newParticles, ...createParticles(headPosition, bossColor, 10, 600)];
          }

          // If boss was weakened to death (1 segment left)
          if (bossSnake.positions.length <= 1) {
            // Boss automatically defeated
            if (activeBoss) {
              const bossReward = handleBossDefeat(activeBoss, prev);
              newScore += bossReward.scoreIncrease;

              // Create particles for boss defeat
              if (GAME_CONFIG.enableParticles && bossSnake.positions[0]) {
                const bossColor = activeBoss.visual.color;
                newParticles = [
                  ...newParticles,
                  ...createParticles(bossSnake.positions[0], bossColor, 30, 1500),
                ];
              }

              // Clear boss after defeat
              activeBoss = undefined;
              bossSnake = undefined;
              // Clear ability cooldowns
              bossAbilityCooldownsRef.current = new Map();
              forcedFoodTypeRef.current = null;
            }
          }
        }
      }

      // Update poison shots: move them and check collisions with obstacles
      const previousPoisonShotsCount = prev.poisonShots?.length ?? 0;
      const poisonObstaclesResult = handlePoisonShotsObstacles(
        prev.poisonShots ?? [],
        newObstacles,
        newParticles,
      );
      let newPoisonShots = poisonObstaclesResult.poisonShots;
      newObstacles = poisonObstaclesResult.obstacles;
      newParticles = poisonObstaclesResult.particles;

      // Log poison shots update (throttled - only when count changes significantly)
      // Removed detailed shot mapping to reduce memory allocation
      const poisonShotsCountChanged = previousPoisonShotsCount !== newPoisonShots.length;
      if (
        poisonShotsCountChanged &&
        Math.abs(previousPoisonShotsCount - newPoisonShots.length) > 2
      ) {
        logGameEvent('poison-shots-updated', {
          previousCount: previousPoisonShotsCount,
          currentCount: newPoisonShots.length,
          shotsRemoved: previousPoisonShotsCount - newPoisonShots.length,
          obstaclesHit: 0, // hitObstacles removed from result type
        });
      }

      // Track shots to remove after boss collisions
      const shotsToRemove: string[] = [];

      // Check poison collisions with boss (defeat or weaken)
      if (POISON_CONFIG.canDefeatBoss && bossSnake) {
        newPoisonShots.forEach((shot) => {
          if (!bossSnake) return; // Safety check

          if (hasBossHeadCollision(shot, bossSnake)) {
            // Poison hit boss head - defeat or weaken!
            shotsToRemove.push(shot.id);
            if (activeBoss && bossSnake) {
              if (canDefeatBoss(bossSnake)) {
                // Boss is weakened - defeat!
                const bossReward = handleBossDefeat(activeBoss, prev);
                newScore += bossReward.scoreIncrease;

                // Create particles for boss defeat
                if (GAME_CONFIG.enableParticles && bossSnake.positions[0]) {
                  const bossColor = activeBoss.visual.color;
                  newParticles = [
                    ...newParticles,
                    ...createParticles(bossSnake.positions[0], bossColor, 30, 1500),
                  ];
                }

                // Clear boss after defeat
                activeBoss = undefined;
                bossSnake = undefined;
                bossAbilityCooldownsRef.current = new Map();
                forcedFoodTypeRef.current = null;
              } else {
                // Weaken the boss
                const weakenResult = weakenBossSnake(bossSnake, 1);
                bossSnake = weakenResult.newBossSnake;
                newScore += weakenResult.pointsEarned;

                // Create particles for weakening
                if (GAME_CONFIG.enableParticles && shot.position) {
                  const bossColor = activeBoss.visual.color;
                  newParticles = [
                    ...newParticles,
                    ...createParticles(shot.position, bossColor, 10, 600),
                  ];
                }
              }
            }
          } else if (hasBossBodyCollision(shot, bossSnake)) {
            // Poison hit boss body - weaken!
            shotsToRemove.push(shot.id);
            if (activeBoss && bossSnake) {
              const weakenResult = weakenBossSnake(bossSnake, 1);
              bossSnake = weakenResult.newBossSnake;
              newScore += weakenResult.pointsEarned;

              // Create particles for weakening
              if (GAME_CONFIG.enableParticles && shot.position) {
                const bossColor = activeBoss.visual.color;
                newParticles = [
                  ...newParticles,
                  ...createParticles(shot.position, bossColor, 8, 500),
                ];
              }

              // If boss was weakened to death (1 segment left)
              if (bossSnake && bossSnake.positions.length <= 1) {
                const bossReward = handleBossDefeat(activeBoss, prev);
                newScore += bossReward.scoreIncrease;

                if (GAME_CONFIG.enableParticles && bossSnake.positions[0]) {
                  const bossColor = activeBoss.visual.color;
                  newParticles = [
                    ...newParticles,
                    ...createParticles(bossSnake.positions[0], bossColor, 30, 1500),
                  ];
                }

                activeBoss = undefined;
                bossSnake = undefined;
                bossAbilityCooldownsRef.current = new Map();
                forcedFoodTypeRef.current = null;
              }
            }
          }
        });
      }

      // Remove shots that hit something (optimized - only filter if shots to remove)
      if (shotsToRemove.length > 0) {
        newPoisonShots = newPoisonShots.filter((shot) => !shotsToRemove.includes(shot.id));
      }

      // Clean expired power-ups
      const activePowerUps = getActivePowerUps(newActivePowerUps);

      // Check achievements
      let updatedAchievements = prev.achievements;
      if (GAME_CONFIG.enableAchievements) {
        const achievementResult = checkAchievements(prev.achievements, {
          score: newScore,
          level: newLevel,
          snakeLength: finalSnake.length,
          comboMultiplier: newCombo.multiplier,
          atePowerUp,
        });
        updatedAchievements = achievementResult.achievements;
      }

      // Final collision check after all modifications (growth, achievements, etc.)
      // This ensures no false positives from temporary states during updates
      const finalHasCollision = finalSnake.length >= 4 && hasSelfCollision(finalSnake);
      if (finalHasCollision) {
        // Use lives system if enabled
        if (isLivesEnabled() && prev.lives > 0) {
          // Enter dying state to show death animation
          return {
            ...prev,
            snake: finalSnake,
            score: newScore,
            status: GameStatus.DYING,
            lives: prev.lives,
            portals: newPortals,
            statistics,
          };
        } else {
          // No lives left, game over
          saveHighScore(newScore);
          saveAchievements(updatedAchievements);
          return {
            ...prev,
            snake: finalSnake,
            score: newScore,
            status: GameStatus.GAME_OVER,
            portals: newPortals,
            highScore: Math.max(newScore, prev.highScore),
            statistics,
          };
        }
      }

      return {
        ...prev,
        snake: finalSnake,
        food: newFood,
        direction: currentDirection,
        nextDirection: currentDirection,
        score: newScore,
        highScore: ateFood && newScore > prev.highScore ? newScore : prev.highScore,
        level: newLevel,
        gameSpeed: baseGameSpeed,
        activePowerUps: activePowerUps,
        obstacles: newObstacles,
        portals: newPortals,
        combo: newCombo,
        guardianFlag: newGuardianFlag,
        guardianFlagSide: newGuardianFlagSide,
        particles: newParticles,
        poisonShots: newPoisonShots,
        achievements: updatedAchievements,
        lives: newLives,
        statistics,
        // Preserve currentPhase and phaseLevelType if score is 0 (debug mode), otherwise use calculated
        currentPhase:
          newScore === 0 && prev.currentPhase
            ? prev.currentPhase
            : (currentPhase?.id ?? prev.currentPhase),
        phaseLevelType:
          newScore === 0 && prev.phaseLevelType
            ? prev.phaseLevelType
            : (currentPhase?.type ?? prev.phaseLevelType),
        activeBoss: activeBoss,
        bossSnake: bossSnake,
      };
    })();

    // Update internal state immediately (no re-render)
    internalGameStateRef.current = newState;

    // Update gameStateRef for immediate access in game loop
    gameStateRef.current = newState;

    // Schedule React state update every N frames to sync with render
    renderUpdateFrameCounterRef.current += 1;
    if (
      renderUpdateFrameCounterRef.current >= RENDER_UPDATE_INTERVAL ||
      newState.status !== GameStatus.PLAYING
    ) {
      renderUpdateFrameCounterRef.current = 0;
      scheduleRenderUpdate();
    }
  }, [scheduleRenderUpdate]);

  useEffect(() => {
    if (gameState.status !== GameStatus.PLAYING) {
      if (gameLoopRef.current !== undefined) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = undefined;
      }
      return;
    }

    const loop = (currentTime: number) => {
      if (lastUpdateTimeRef.current === 0) {
        lastUpdateTimeRef.current = currentTime;
      }

      const elapsed = currentTime - lastUpdateTimeRef.current;

      // Get latest game state from internal ref (always up to date)
      // Use internal state for game logic to avoid dependency on React render cycle
      const currentGameState = internalGameStateRef.current;

      // Update active power-ups and get effective speed
      const activePowerUps = getActivePowerUps(currentGameState.activePowerUps);
      let effectiveSpeed = getEffectiveGameSpeed(currentGameState.gameSpeed, activePowerUps);

      // Process direction changes at normal game speed to avoid snake advancing too much

      // Apply speed boost if direction key is held
      if (currentGameState.isSpeedBoosted) {
        // Increase speed boost multiplier for more responsive and fluid movement
        const speedMultiplier = 4; // Consistent 4x speed boost
        effectiveSpeed = Math.floor(effectiveSpeed / speedMultiplier);

        // Allow faster updates during speed boost for smoother movement
        const minWaitTime = Math.max(1, effectiveSpeed / 2);
        if (elapsed >= minWaitTime) {
          updateGame();
          lastUpdateTimeRef.current = currentTime;
          gameLoopRef.current = requestAnimationFrame(loop);
          return;
        }
      }

      if (elapsed >= effectiveSpeed) {
        updateGame();
        lastUpdateTimeRef.current = currentTime;
      }

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      if (gameLoopRef.current !== undefined) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = undefined;
      }
      lastUpdateTimeRef.current = 0;
    };
  }, [
    gameState.status,
    gameState.gameSpeed,
    gameState.activePowerUps,
    gameState.isSpeedBoosted,
    updateGame,
  ]);

  const continueAfterDeath = useCallback(() => {
    updateGameState((prev) => {
      if (prev.status !== GameStatus.DYING || prev.lives <= 0) {
        return prev;
      }

      // Apply penalties
      const { newScore, newSnake } = loseLife(prev.score, prev.snake);
      const newLives = prev.lives - 1;

      // Update statistics - life lost
      let statistics = prev.statistics ?? initializeStatistics();
      statistics = {
        ...statistics,
        livesLost: statistics.livesLost + 1,
      };

      // Check if game should end or continue
      if (newLives <= 0) {
        // No more lives, game over
        saveHighScore(newScore);
        saveAchievements(prev.achievements);
        return {
          ...prev,
          snake: newSnake,
          score: newScore,
          lives: 0,
          status: GameStatus.GAME_OVER,
          highScore: Math.max(newScore, prev.highScore),
          statistics,
        };
      }

      // Continue with same snake size - no reduction on death
      // Always reset snake to initial safe position to avoid collision
      // Don't use the snake that just collided, always use safe initial position
      // Maintain current snake length - don't reduce size
      const targetLength = prev.snake.length;

      // Always create fresh snake from initial position to avoid any collision
      const safeSnake = INITIAL_SNAKE_POSITION.slice(
        0,
        Math.min(targetLength, INITIAL_SNAKE_POSITION.length),
      );

      // If we need longer snake, extend from initial position
      if (targetLength > INITIAL_SNAKE_POSITION.length) {
        const lastPos = INITIAL_SNAKE_POSITION[INITIAL_SNAKE_POSITION.length - 1];
        for (let i = INITIAL_SNAKE_POSITION.length; i < targetLength; i++) {
          safeSnake.push({
            x: Math.max(0, lastPos.x - (i - INITIAL_SNAKE_POSITION.length + 1)),
            y: lastPos.y,
          });
        }
      }

      // Generate new food (no obstacles at this point since we reset)
      const newFood = generateRandomFood(safeSnake, GAME_CONFIG.gridSize, []);

      // Reset combo and active power-ups
      const newLevel = calculateLevel(newScore);
      const baseGameSpeed = calculateGameSpeed(newLevel);

      return {
        ...prev,
        snake: safeSnake,
        food: newFood,
        score: newScore,
        lives: newLives,
        level: newLevel,
        gameSpeed: baseGameSpeed,
        direction: INITIAL_DIRECTION,
        nextDirection: INITIAL_DIRECTION,
        status: GameStatus.PLAYING,
        activePowerUps: [], // Clear all power-ups on death
        combo: {
          count: 0,
          multiplier: 1,
          lastFoodTime: 0,
        },
        particles: [],
        poisonShots: [],
        isSpeedBoosted: false, // Reset speed boost when continuing after death
        isFiringPoison: false, // Reset firing when continuing after death
        statistics, // Keep statistics when continuing
      };
    });
  }, [updateGameState]);

  // Auto-continue after death with 3 second delay
  useEffect(() => {
    if (gameState.status === GameStatus.DYING && gameState.lives > 0) {
      // Clear any existing timer
      if (deathTimerRef.current) {
        clearTimeout(deathTimerRef.current);
      }

      // Start 3 second countdown
      deathTimerRef.current = setTimeout(() => {
        continueAfterDeath();
        deathTimerRef.current = null;
      }, 3000);

      return () => {
        if (deathTimerRef.current) {
          clearTimeout(deathTimerRef.current);
          deathTimerRef.current = null;
        }
      };
    } else {
      // Clear timer if not in DYING state
      if (deathTimerRef.current) {
        clearTimeout(deathTimerRef.current);
        deathTimerRef.current = null;
      }
    }
  }, [gameState.status, gameState.lives, continueAfterDeath]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (key === ' ') {
        if (gameState.status === GameStatus.IDLE) {
          startGame();
        } else if (
          gameState.status === GameStatus.PLAYING ||
          gameState.status === GameStatus.PAUSED
        ) {
          pauseGame();
        } else if (gameState.status === GameStatus.DYING) {
          // Allow manual continue (skip the timer)
          if (deathTimerRef.current) {
            clearTimeout(deathTimerRef.current);
            deathTimerRef.current = null;
          }
          continueAfterDeath();
        } else if (gameState.status === GameStatus.GAME_OVER) {
          resetGame();
          startGame();
        }
        return;
      }

      if (key === 'Enter' || key === 'Escape') {
        if (gameState.status === GameStatus.GAME_OVER) {
          resetGame();
        } else if (
          gameState.status === GameStatus.PLAYING ||
          gameState.status === GameStatus.PAUSED
        ) {
          pauseGame();
        }
        return;
      }
    },
    [gameState.status, startGame, pauseGame, resetGame, continueAfterDeath],
  );

  const spawnBoss = useCallback(
    (boss: Chef | null) => {
      updateGameState((prev) => {
        if (!boss) {
          // Remove boss and reset phase to level-based phase
          const levelPhase = getCurrentPhase(prev.level);
          return {
            ...prev,
            activeBoss: undefined,
            bossSnake: undefined,
            currentPhase: levelPhase?.id,
            phaseLevelType: levelPhase?.type,
          };
        }

        // Force spawn boss and update phase to match boss
        const bossSnake = initializeBossSnake(
          boss,
          prev.snake,
          prev.obstacles,
          GAME_CONFIG.gridSize,
        );

        // Get phase configuration for the boss
        const bossPhase = getPhaseByBoss(boss);

        return {
          ...prev,
          activeBoss: boss,
          bossSnake: bossSnake ?? undefined,
          currentPhase: bossPhase?.id,
          phaseLevelType: bossPhase?.type,
        };
      });
    },
    [updateGameState],
  );

  // Reset obstacle spawn timer when game starts
  useEffect(() => {
    if (gameState.status === GameStatus.PLAYING && lastObstacleSpawnRef.current === 0) {
      lastObstacleSpawnRef.current = Date.now();
    } else if (gameState.status === GameStatus.IDLE || gameState.status === GameStatus.GAME_OVER) {
      lastObstacleSpawnRef.current = 0;
    }
  }, [gameState.status]);

  // Function to fire a single poison shot using current direction from gameStateRef
  // Batched to prevent multiple state updates when firing rapidly
  const firePoisonShot = useCallback(() => {
    const currentState = gameStateRef.current;
    if (currentState.status !== GameStatus.PLAYING) {
      return; // Can only fire when playing
    }

    const headPosition = currentState.snake[0];
    if (!headPosition) {
      return; // No head position available
    }

    // Create shot and add to pending batch
    const newPoisonShot = createPoisonShot(headPosition, currentState.direction);
    pendingPoisonShotsRef.current.push(newPoisonShot);

    // Log poison shot creation (throttled to reduce overhead)
    // Only log every 5th shot to reduce logging overhead during rapid firing
    if (pendingPoisonShotsRef.current.length % 5 === 0) {
      logGameEvent('poison-shot-created', {
        shotsInBatch: pendingPoisonShotsRef.current.length,
        activeShotsCount: currentState.poisonShots?.length ?? 0,
      });
    }

    // Only schedule a flush if one isn't already scheduled
    // This ensures all rapid taps in the same frame are batched together
    if (poisonShotBatchTimeoutRef.current === null) {
      // Schedule flush on next animation frame
      // This batches all shots created before the next frame into a single state update
      poisonShotBatchTimeoutRef.current = requestAnimationFrame(() => {
        const shotsToAdd = [...pendingPoisonShotsRef.current];
        pendingPoisonShotsRef.current = [];

        if (shotsToAdd.length > 0) {
          updateGameState((prev) => {
            const currentShots = prev.poisonShots ?? [];
            // Limit total shots for performance (remove oldest if limit exceeded)
            const maxShots = POISON_CONFIG.maxShotsSimultaneous ?? 50;
            const allShots = [...currentShots, ...shotsToAdd];
            const limitedShots = allShots.length > maxShots ? allShots.slice(-maxShots) : allShots;

            // Log batch flush (only if significant batch size)
            if (shotsToAdd.length > 3 || allShots.length > maxShots) {
              logGameEvent('poison-shots-batch-flushed', {
                shotsAdded: shotsToAdd.length,
                previousActiveCount: currentShots.length,
                newActiveCount: limitedShots.length,
                shotsLimited: allShots.length > maxShots,
              });
            }

            return {
              ...prev,
              poisonShots: limitedShots,
            };
          });
        }

        poisonShotBatchTimeoutRef.current = null;
      });
    }
    // If a flush is already scheduled, just add to the batch - it will be flushed together
  }, [updateGameState]);

  // Function to start continuous firing - activates firing state
  const firePoison = useCallback(() => {
    setFiringPoison(true);
    firePoisonShot(); // Fire immediately
  }, [setFiringPoison, firePoisonShot]);

  // Function to stop continuous firing
  const stopFiringPoison = useCallback(() => {
    setFiringPoison(false);
  }, [setFiringPoison]);

  // Continuous firing when button is held - fires shots at interval using current direction
  useEffect(() => {
    if (gameState.isFiringPoison && gameState.status === GameStatus.PLAYING) {
      // Clear any existing interval
      if (poisonFireIntervalRef.current) {
        clearInterval(poisonFireIntervalRef.current);
      }

      // Fire immediately when button is pressed
      firePoisonShot();
      lastPoisonFireTimeRef.current = Date.now();

      // Set up interval for continuous firing
      poisonFireIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const timeSinceLastFire = now - lastPoisonFireTimeRef.current;

        // Only fire if enough time has passed (respect fire interval)
        if (timeSinceLastFire >= POISON_CONFIG.fireInterval) {
          firePoisonShot();
          lastPoisonFireTimeRef.current = now;
        }
      }, POISON_CONFIG.fireInterval);
    } else {
      // Stop firing when button is released or game is not playing
      if (poisonFireIntervalRef.current) {
        clearInterval(poisonFireIntervalRef.current);
        poisonFireIntervalRef.current = null;
      }

      // Flush any pending shots when stopping (immediate flush)
      if (pendingPoisonShotsRef.current.length > 0) {
        const shotsToAdd = [...pendingPoisonShotsRef.current];
        pendingPoisonShotsRef.current = [];
        if (shotsToAdd.length > 0) {
          updateGameState((prev) => {
            const currentShots = prev.poisonShots ?? [];
            const maxShots = POISON_CONFIG.maxShotsSimultaneous ?? 50;
            const allShots = [...currentShots, ...shotsToAdd];
            const limitedShots = allShots.length > maxShots ? allShots.slice(-maxShots) : allShots;
            return {
              ...prev,
              poisonShots: limitedShots,
            };
          });
        }
      }

      // Clear pending batch timeout (requestAnimationFrame)
      if (poisonShotBatchTimeoutRef.current !== null) {
        cancelAnimationFrame(poisonShotBatchTimeoutRef.current);
        poisonShotBatchTimeoutRef.current = null;
      }
    }

    return () => {
      if (poisonFireIntervalRef.current) {
        clearInterval(poisonFireIntervalRef.current);
        poisonFireIntervalRef.current = null;
      }
      if (poisonShotBatchTimeoutRef.current !== null) {
        cancelAnimationFrame(poisonShotBatchTimeoutRef.current);
        poisonShotBatchTimeoutRef.current = null;
      }
      // Flush any pending shots on cleanup
      if (pendingPoisonShotsRef.current.length > 0) {
        const shotsToAdd = [...pendingPoisonShotsRef.current];
        pendingPoisonShotsRef.current = [];
        if (shotsToAdd.length > 0) {
          updateGameState((prev) => {
            const currentShots = prev.poisonShots ?? [];
            const maxShots = POISON_CONFIG.maxShotsSimultaneous ?? 50;
            const allShots = [...currentShots, ...shotsToAdd];
            const limitedShots = allShots.length > maxShots ? allShots.slice(-maxShots) : allShots;
            return {
              ...prev,
              poisonShots: limitedShots,
            };
          });
        }
      }
    };
  }, [gameState.isFiringPoison, gameState.status, firePoisonShot, updateGameState]);

  return {
    gameState,
    resetGame,
    startGame,
    pauseGame,
    setDirection,
    setSpeedBoost,
    handleKeyPress,
    spawnBoss,
    firePoison,
    stopFiringPoison,
    updateGameState,
  };
}
