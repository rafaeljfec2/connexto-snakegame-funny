import { useEffect, useRef, useCallback } from 'react';
import { GameStatus, GameState, FoodType } from '@/types/game';
import { GAME_CONFIG, INITIAL_SNAKE_POSITION } from '@/constants/game';
import {
  moveSnake,
  hasSelfCollision,
  hasFoodCollision,
  generateRandomFood,
  isValidDirectionChange,
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
import { updateCombo, calculateComboPoints } from '@/utils/combos';
import { createParticles, updateParticles } from '@/utils/particles';
import { generateObstacles, hasObstacleCollision } from '@/utils/obstacles';
import { checkAchievements, saveAchievements } from '@/utils/achievements';
import { hasFoodExpired } from '@/utils/foodTimer';
import { loseLife, isLivesEnabled, addLife } from '@/utils/lives';
import { LIVES_CONFIG } from '@/constants/lives';
import { POWER_UP_CONFIG } from '@/constants/powerUps';
import { INITIAL_DIRECTION } from '@/constants/game';
import { useGameState } from './useGameState';

export function useGameLoop() {
  const { gameState, resetGame, startGame, pauseGame, setDirection, updateGameState } =
    useGameState();

  const gameLoopRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(0);

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

      // Direction is already applied immediately in setDirection, but double-check here
      // This ensures smooth transitions even if setDirection didn't catch it
      if (
        nextDirectionInput !== prev.direction &&
        isValidDirectionChange(prev.direction, nextDirectionInput)
      ) {
        currentDirection = nextDirectionInput;
      } else {
        // Use the current direction (already set immediately if valid)
        currentDirection = prev.direction;
      }

      const newSnake = moveSnake(prev.snake, currentDirection, GAME_CONFIG.gridSize, false);

      // Check obstacle collision (ignore if phase through is active)
      const currentActivePowerUps = getActivePowerUps(prev.activePowerUps);
      const canPhaseThrough = hasPhaseThrough(currentActivePowerUps);

      // Check for collisions
      const hasCollision =
        (GAME_CONFIG.enableObstacles &&
          !canPhaseThrough &&
          hasObstacleCollision(newSnake[0], prev.obstacles)) ||
        (newSnake.length >= 4 && hasSelfCollision(newSnake));

      if (hasCollision) {
        // Use lives system if enabled
        if (isLivesEnabled() && prev.lives > 0) {
          // Enter dying state to show death animation
          return {
            ...prev,
            status: GameStatus.DYING,
          };
        } else {
          // No lives left, game over
          saveHighScore(prev.score);
          saveAchievements(prev.achievements);
          return {
            ...prev,
            status: GameStatus.GAME_OVER,
            highScore: Math.max(prev.score, prev.highScore),
          };
        }
      }

      const ateFood = hasFoodCollision(newSnake[0], prev.food);

      // Update particles every frame
      let newParticles = GAME_CONFIG.enableParticles
        ? updateParticles(prev.particles)
        : prev.particles;

      let finalSnake = newSnake;
      let newScore = prev.score;
      const newActivePowerUps = [...getActivePowerUps(prev.activePowerUps)];
      let newCombo = prev.combo;
      let atePowerUp = false;
      let newLives = prev.lives;

      if (ateFood) {
        // Update combo when food is eaten
        if (GAME_CONFIG.enableCombos) {
          newCombo = updateCombo(prev.combo, true);
        }
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

        // Calculate base score with length and combo multipliers
        const baseScoreIncrease = powerUpEffect.scoreIncrease;

        // Apply length-based multiplier (points × (1 + length/10))
        const lengthMultiplier = 1 + finalSnake.length / 10;
        const scoreWithLength = baseScoreIncrease * lengthMultiplier;

        // Apply combo multiplier if enabled
        const finalScoreIncrease = GAME_CONFIG.enableCombos
          ? calculateComboPoints(scoreWithLength, newCombo)
          : scoreWithLength;

        newScore = prev.score + Math.floor(finalScoreIncrease);

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

      // Generate obstacles on level up
      let newObstacles = prev.obstacles;
      if (GAME_CONFIG.enableObstacles && newLevel > prev.level) {
        newObstacles = generateObstacles(newLevel, finalSnake, newObstacles, GAME_CONFIG.gridSize);
      }

      // Check if current food has expired
      const foodExpired = hasFoodExpired(prev.food);

      const newFood =
        ateFood || foodExpired
          ? generateRandomFood(finalSnake, GAME_CONFIG.gridSize, newObstacles)
          : prev.food;

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
            highScore: Math.max(newScore, prev.highScore),
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
        combo: newCombo,
        particles: newParticles,
        achievements: updatedAchievements,
        lives: newLives,
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
      const effectiveSpeed = getEffectiveGameSpeed(gameState.gameSpeed, activePowerUps);

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
  }, [gameState.status, gameState.gameSpeed, gameState.activePowerUps, updateGame]);

  const continueAfterDeath = useCallback(() => {
    updateGameState((prev) => {
      if (prev.status !== GameStatus.DYING || prev.lives <= 0) {
        return prev;
      }

      // Apply penalties
      const { newScore, newSnake } = loseLife(prev.score, prev.snake);
      const newLives = prev.lives - 1;

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
        };
      }

      // Continue with reduced snake and score
      // Always reset snake to initial safe position to avoid collision
      // Don't use the snake that just collided, always use safe initial position
      const targetLength = Math.max(
        LIVES_CONFIG.minLengthAfterPenalty,
        Math.min(prev.snake.length - LIVES_CONFIG.lengthPenalty, 10),
      );

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
      };
    });
  }, [updateGameState]);

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
    handleKeyPress,
  };
}
