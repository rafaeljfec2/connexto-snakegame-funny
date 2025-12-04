import { useEffect, useRef, useCallback } from 'react';
import { GameStatus, GameState, FoodType } from '@/types/game';
import { GAME_CONFIG, INITIAL_SNAKE_POSITION } from '@/constants/game';
import {
  moveSnake,
  hasSelfCollision,
  hasFoodCollision,
  generateRandomFood,
  isValidDirectionChange,
  isSafeDirectionChange,
  saveHighScore,
  getOppositeDirection,
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
import { generateObstacles, hasObstacleCollision } from '@/utils/obstacles';
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
import { getCurrentPhase, getBossForLevel, shouldSpawnBoss } from '@/utils/phases';
import { handleBossDefeat } from '@/utils/bosses';
import {
  initializeBossSnake,
  moveBossSnake,
  calculateBossNextDirection,
  hasBossSnakeCollision,
  hasPlayerHitBossHead,
} from '@/utils/bossSnake';

export function useGameLoop() {
  const {
    gameState,
    resetGame,
    startGame,
    pauseGame,
    setDirection,
    updateGameState,
    setSpeedBoost,
  } = useGameState();

  const gameLoopRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(0);
  const deathTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateGame = useCallback(() => {
    updateGameState((prev: GameState) => {
      if (prev.status !== GameStatus.PLAYING) {
        return prev;
      }

      // Handle reverse controls
      const reverseControls = hasReverseControls(prev.activePowerUps);
      let currentDirection = prev.direction;
      let nextDirectionInput = prev.nextDirection;

      // Reverse the input direction if reverse controls are active
      if (reverseControls && prev.nextDirection !== prev.direction) {
        nextDirectionInput = getOppositeDirection(prev.nextDirection);
      }

      // Apply direction change immediately if valid and safe
      // This provides maximum responsiveness for rapid key presses
      if (
        nextDirectionInput !== prev.direction &&
        isValidDirectionChange(prev.direction, nextDirectionInput)
      ) {
        // Check if direction change is safe (won't cause collision)
        const isSafe = isSafeDirectionChange(
          prev.snake,
          prev.direction,
          nextDirectionInput,
          GAME_CONFIG.gridSize,
        );

        if (isSafe) {
          // Apply immediately for instant response to rapid key presses
          currentDirection = nextDirectionInput;
        } else {
          // Not safe yet - keep current direction but queue for next check
          // This allows rapid changes to be applied as soon as they become safe
          currentDirection = prev.direction;
        }
      } else {
        // Use the current direction
        currentDirection = prev.direction;
      }

      let newSnake = moveSnake(prev.snake, currentDirection, GAME_CONFIG.gridSize, false);

      // Initialize particles early for portal teleportation
      let newParticles = GAME_CONFIG.enableParticles
        ? updateParticles(prev.particles)
        : prev.particles;

      // Check for portal teleportation BEFORE collision checks
      const activePortals = getActivePortals(prev.portals);
      const headPosition = newSnake[0];
      if (headPosition) {
        const portalAtHead = getPortalAtPosition(headPosition, activePortals);
        if (portalAtHead) {
          const pairedPortal = getPortalPair(portalAtHead, activePortals);
          if (pairedPortal) {
            // Teleport to paired portal, maintaining direction
            newSnake = [{ ...pairedPortal.position }, ...newSnake.slice(1)];

            // Create teleportation particles
            if (GAME_CONFIG.enableParticles) {
              const portalColor = PORTAL_CONFIG.colors.portal1.primary;
              newParticles = [
                ...newParticles,
                ...createParticles(headPosition, portalColor, 12, 800),
                ...createParticles(pairedPortal.position, portalColor, 12, 800),
              ];
            }
          }
        }
      }

      // Check obstacle collision (ignore if phase through is active)
      const currentActivePowerUps = getActivePowerUps(prev.activePowerUps);
      const canPhaseThrough = hasPhaseThrough(currentActivePowerUps);

      // Check for collisions
      const hasCollision =
        (GAME_CONFIG.enableObstacles &&
          !canPhaseThrough &&
          hasObstacleCollision(newSnake[0], prev.obstacles)) ||
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

      const ateFood = hasFoodCollision(newSnake[0], prev.food);

      let finalSnake = newSnake;
      let newScore = prev.score;
      const newActivePowerUps = [...getActivePowerUps(prev.activePowerUps)];
      let newCombo = prev.combo;
      let atePowerUp = false;
      let newLives = prev.lives;

      if (ateFood) {
        // Update statistics - food eaten
        const currentFoodCount = statistics.foodsByType[prev.food.type] ?? 0;
        statistics = {
          ...statistics,
          foodsEaten: statistics.foodsEaten + 1,
          foodsByType: {
            ...statistics.foodsByType,
            [prev.food.type]: currentFoodCount + 1,
          },
        };

        // Handle JOKER - randomly choose a positive power-up before applying effects
        let actualFoodType = prev.food.type;
        if (prev.food.type === FoodType.JOKER) {
          const positiveTypes = [
            FoodType.SPEED_BOOST,
            FoodType.BONUS_POINTS,
            FoodType.EXTRA_GROWTH,
            FoodType.PHASE_THROUGH,
          ];
          actualFoodType =
            positiveTypes[Math.floor(Math.random() * positiveTypes.length)] ??
            FoodType.BONUS_POINTS;
        }

        const powerUpEffect = applyPowerUpEffect(actualFoodType, prev.score, prev.snake.length);

        // Add bonus points if JOKER was eaten
        if (prev.food.type === FoodType.JOKER) {
          powerUpEffect.scoreIncrease += 15; // Bonus for eating joker
        }

        // Track if power-up was eaten
        if (prev.food.type !== FoodType.NORMAL) {
          atePowerUp = true;
        }

        // Calculate score: base points only (no multipliers for now)
        // First food should give exactly 10 points
        const baseScoreIncrease = powerUpEffect.scoreIncrease;
        newScore = prev.score + baseScoreIncrease;

        // Update combo AFTER calculating score (for next food)
        if (GAME_CONFIG.enableCombos) {
          newCombo = updateCombo(prev.combo, true);
        }

        // Create particles
        if (GAME_CONFIG.enableParticles) {
          const foodColor = POWER_UP_CONFIG.colors[prev.food.type]?.primary || '#ef4444';
          newParticles = [...newParticles, ...createParticles(newSnake[0], foodColor, 8, 600)];
        }

        // Apply growth (positive or negative)
        if (powerUpEffect.growthAmount > 0) {
          // Grow: When snake eats, it should grow from the tail
          // The head has already moved, so we just need to add segments at the end
          const growthAmount = powerUpEffect.growthAmount;
          const currentTail = finalSnake[finalSnake.length - 1];

          // Add new segments at the tail position (they will move next frame)
          for (let i = 0; i < growthAmount; i++) {
            finalSnake = [...finalSnake, { ...currentTail }];
          }
        } else if (powerUpEffect.growthAmount < 0) {
          // Shrink (for poison)
          const shrinkAmount = Math.abs(powerUpEffect.growthAmount);
          const minLength = 1;
          const newLength = Math.max(minLength, finalSnake.length - shrinkAmount);
          finalSnake = finalSnake.slice(0, newLength);
        }

        // Update statistics - max combo
        if (newCombo.multiplier > statistics.maxCombo) {
          statistics = {
            ...statistics,
            maxCombo: newCombo.multiplier,
          };
        }

        // Handle EXTRA_LIFE power-up
        if (prev.food.type === FoodType.EXTRA_LIFE) {
          newLives = addLife(prev.lives);
        }

        // Activate power-up if needed
        if (powerUpEffect.shouldActivatePowerUp) {
          newActivePowerUps.push(createActivePowerUp(actualFoodType));
        }
      } else {
        // Update combo expiration when no food eaten
        if (GAME_CONFIG.enableCombos) {
          newCombo = updateCombo(prev.combo, false);
        }
      }

      const newLevel = calculateLevel(newScore);
      const baseGameSpeed = calculateGameSpeed(newLevel);

      // Phase system: Detect phase changes and update phase state (before obstacles and food generation)
      const currentPhase = getCurrentPhase(newLevel);
      const phaseConfig = currentPhase?.config;

      // Generate obstacles on level up (respecting phase configuration)
      let newObstacles = prev.obstacles;
      if (
        GAME_CONFIG.enableObstacles &&
        newLevel > prev.level &&
        phaseConfig?.obstaclesEnabled !== false
      ) {
        const previousObstaclesCount = newObstacles.length;
        newObstacles = generateObstacles(
          newLevel,
          finalSnake,
          newObstacles,
          GAME_CONFIG.gridSize,
          phaseConfig?.obstaclesEnabled,
          phaseConfig?.obstaclesFrequency,
        );
        // Update statistics - obstacles encountered
        const newObstaclesCount = newObstacles.length - previousObstaclesCount;
        if (newObstaclesCount > 0) {
          statistics = {
            ...statistics,
            obstaclesEncountered: statistics.obstaclesEncountered + newObstaclesCount,
          };
        }
      } else if (phaseConfig?.obstaclesEnabled === false) {
        // Clear obstacles if phase doesn't allow them
        newObstacles = [];
      }

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
      const newFood =
        ateFood || foodExpired
          ? generateRandomFood(
              finalSnake,
              GAME_CONFIG.gridSize,
              newObstacles,
              phaseConfig?.powerUpsFrequency,
              phaseConfig?.timedFoodFrequency,
            )
          : prev.food;

      // Handle PORTAL power-up - create portal pair when food is eaten
      // Only if portals are enabled in current phase
      let newPortals = getActivePortals(prev.portals);
      if (ateFood && prev.food.type === FoodType.PORTAL && phaseConfig?.portalsEnabled) {
        const portalPair = generatePortalPair(finalSnake, newObstacles, GAME_CONFIG.gridSize);
        if (portalPair) {
          newPortals = [...newPortals, ...portalPair];
        }
      }
      // Update boss for boss levels (levels 10, 20, 30, etc.)
      let activeBoss = shouldSpawnBoss(newLevel) ? getBossForLevel(newLevel) : prev.activeBoss;
      // Clear boss when leaving boss level
      const shouldClearBoss = prev.activeBoss && !shouldSpawnBoss(newLevel);
      if (shouldClearBoss) {
        activeBoss = undefined;
      }

      // Initialize or update boss snake
      let bossSnake = prev.bossSnake;
      if (activeBoss && (!prev.activeBoss || prev.activeBoss.id !== activeBoss.id)) {
        // New boss spawned - initialize boss snake
        bossSnake =
          initializeBossSnake(activeBoss, finalSnake, newObstacles, GAME_CONFIG.gridSize) ??
          undefined;
      } else if (shouldClearBoss) {
        bossSnake = undefined;
      } else if (bossSnake && activeBoss) {
        // Move boss snake based on AI behavior
        const nextBossDirection = calculateBossNextDirection(
          activeBoss,
          bossSnake,
          finalSnake,
          newObstacles,
          prev.food.position,
          GAME_CONFIG.gridSize,
        );
        bossSnake = moveBossSnake(bossSnake, nextBossDirection, GAME_CONFIG.gridSize);
      }

      // Check for boss collision - player hits boss snake
      if (bossSnake && headPosition) {
        if (hasPlayerHitBossHead(finalSnake, bossSnake)) {
          // Boss defeated! Give points and clear boss
          if (activeBoss) {
            const bossReward = handleBossDefeat(activeBoss, prev);
            newScore += bossReward.scoreIncrease;

            // Create particles for boss defeat
            if (GAME_CONFIG.enableParticles && bossSnake.positions[0]) {
              const bossColor = activeBoss.visual.color;
              newParticles = [
                ...newParticles,
                ...createParticles(bossSnake.positions[0], bossColor, 20, 1000),
              ];
            }

            // Clear boss after defeat
            activeBoss = undefined;
            bossSnake = undefined;
          }
        }
      }

      // Check for collision - player snake hits boss snake body
      if (bossSnake && headPosition) {
        if (hasBossSnakeCollision(headPosition, bossSnake)) {
          // Player hit boss snake body - game over (or lose life)
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
        particles: newParticles,
        achievements: updatedAchievements,
        lives: newLives,
        statistics,
        currentPhase: currentPhase?.id ?? prev.currentPhase,
        phaseLevelType: currentPhase?.type ?? prev.phaseLevelType,
        activeBoss: activeBoss,
        bossSnake: bossSnake,
      };
    });
  }, [updateGameState]);

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

      // Update active power-ups and get effective speed
      const activePowerUps = getActivePowerUps(gameState.activePowerUps);
      let effectiveSpeed = getEffectiveGameSpeed(gameState.gameSpeed, activePowerUps);

      // Apply phase speed modifier (already included in calculateGameSpeed, but keep for clarity)

      // Apply 3x speed boost if direction key is held
      if (gameState.isSpeedBoosted) {
        effectiveSpeed = Math.floor(effectiveSpeed / 3);
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

  return {
    gameState,
    resetGame,
    startGame,
    pauseGame,
    setDirection,
    setSpeedBoost,
    handleKeyPress,
  };
}
