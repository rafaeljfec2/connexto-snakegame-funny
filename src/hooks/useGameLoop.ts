import { useEffect, useRef, useCallback } from "react";
import { GameStatus, GameState, Direction, FoodType } from "@/types/game";
import { GAME_CONFIG } from "@/constants/game";
import {
  moveSnake,
  hasSelfCollision,
  hasFoodCollision,
  generateRandomFood,
  isValidDirectionChange,
  saveHighScore,
  getOppositeDirection,
} from "@/utils/gameLogic";
import { calculateLevel, calculateGameSpeed } from "@/utils/difficulty";
import {
  applyPowerUpEffect,
  createActivePowerUp,
  getActivePowerUps,
  getEffectiveGameSpeed,
  hasReverseControls,
  hasPhaseThrough,
} from "@/utils/powerUps";
import { updateCombo, calculateComboPoints } from "@/utils/combos";
import { createParticles, updateParticles } from "@/utils/particles";
import { generateObstacles, hasObstacleCollision } from "@/utils/obstacles";
import { checkAchievements, saveAchievements } from "@/utils/achievements";
import { POWER_UP_CONFIG } from "@/constants/powerUps";
import { useGameState } from "./useGameState";

export function useGameLoop() {
  const {
    gameState,
    resetGame,
    startGame,
    pauseGame,
    setDirection,
    updateGameState,
  } = useGameState();

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

      const newSnake = moveSnake(
        prev.snake,
        currentDirection,
        GAME_CONFIG.gridSize,
        false
      );

      // Check obstacle collision (ignore if phase through is active)
      const currentActivePowerUps = getActivePowerUps(prev.activePowerUps);
      const canPhaseThrough = hasPhaseThrough(currentActivePowerUps);
      
      if (
        GAME_CONFIG.enableObstacles &&
        !canPhaseThrough &&
        hasObstacleCollision(newSnake[0], prev.obstacles)
      ) {
        saveHighScore(prev.score);
        saveAchievements(prev.achievements);
        return {
          ...prev,
          status: GameStatus.GAME_OVER,
          highScore: Math.max(prev.score, prev.highScore),
        };
      }
      
      if (hasSelfCollision(newSnake)) {
        saveHighScore(prev.score);
        saveAchievements(prev.achievements);
        return {
          ...prev,
          status: GameStatus.GAME_OVER,
          highScore: Math.max(prev.score, prev.highScore),
        };
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

      if (ateFood) {
        // Update combo when food is eaten
        if (GAME_CONFIG.enableCombos) {
          newCombo = updateCombo(prev.combo, true);
        }
        const powerUpEffect = applyPowerUpEffect(
          prev.food.type,
          prev.score,
          prev.snake.length
        );

        // Track if power-up was eaten
        if (prev.food.type !== FoodType.NORMAL) {
          atePowerUp = true;
        }

        // Create particles
        if (GAME_CONFIG.enableParticles) {
          const foodColor = POWER_UP_CONFIG.colors[prev.food.type]?.primary || "#ef4444";
          newParticles = [
            ...newParticles,
            ...createParticles(newSnake[0], foodColor, 8, 600),
          ];
        }

        // Apply growth (positive or negative)
        if (powerUpEffect.growthAmount > 0) {
          // Grow
          for (let i = 0; i < powerUpEffect.growthAmount; i++) {
            finalSnake = moveSnake(
              i === 0 ? prev.snake : finalSnake,
              currentDirection,
              GAME_CONFIG.gridSize,
              true
            );
          }
        } else if (powerUpEffect.growthAmount < 0) {
          // Shrink (for poison)
          const shrinkAmount = Math.abs(powerUpEffect.growthAmount);
          const minLength = 1;
          const newLength = Math.max(minLength, finalSnake.length - shrinkAmount);
          finalSnake = finalSnake.slice(0, newLength);
        }

        // Calculate base score with combo multiplier
        const baseScoreIncrease = powerUpEffect.scoreIncrease;
        const finalScoreIncrease = GAME_CONFIG.enableCombos
          ? calculateComboPoints(baseScoreIncrease, newCombo)
          : baseScoreIncrease;

        newScore = prev.score + finalScoreIncrease;

        // Activate power-up if needed
        if (powerUpEffect.shouldActivatePowerUp) {
          newActivePowerUps.push(createActivePowerUp(prev.food.type));
        }
      } else {
        // Update combo expiration when no food eaten
        if (GAME_CONFIG.enableCombos) {
          newCombo = updateCombo(prev.combo, false);
        }
      }

      const newFood = ateFood
        ? generateRandomFood(finalSnake, GAME_CONFIG.gridSize)
        : prev.food;

      const newLevel = calculateLevel(newScore);
      const baseGameSpeed = calculateGameSpeed(newLevel);

      // Generate obstacles on level up
      let newObstacles = prev.obstacles;
      if (GAME_CONFIG.enableObstacles && newLevel > prev.level) {
        newObstacles = generateObstacles(
          newLevel,
          finalSnake,
          newObstacles,
          GAME_CONFIG.gridSize
        );
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

      return {
        ...prev,
        snake: finalSnake,
        food: newFood,
        direction: currentDirection,
        nextDirection: currentDirection,
        score: newScore,
        highScore:
          ateFood && newScore > prev.highScore ? newScore : prev.highScore,
        level: newLevel,
        gameSpeed: baseGameSpeed,
        activePowerUps: activePowerUps,
        obstacles: newObstacles,
        combo: newCombo,
        particles: newParticles,
        achievements: updatedAchievements,
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
      const effectiveSpeed = getEffectiveGameSpeed(
        gameState.gameSpeed,
        activePowerUps
      );

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
    updateGame,
  ]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (key === " ") {
        if (gameState.status === GameStatus.IDLE) {
          startGame();
        } else if (
          gameState.status === GameStatus.PLAYING ||
          gameState.status === GameStatus.PAUSED
        ) {
          pauseGame();
        } else if (gameState.status === GameStatus.GAME_OVER) {
          resetGame();
          startGame();
        }
        return;
      }

      if (key === "Enter" || key === "Escape") {
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
    [gameState.status, startGame, pauseGame, resetGame]
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
