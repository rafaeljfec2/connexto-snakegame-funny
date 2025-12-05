import { useState, useCallback } from 'react';
import { GameState, Direction, GameStatus } from '@/types/game';
import { GAME_CONFIG, INITIAL_DIRECTION, INITIAL_SNAKE_POSITION } from '@/constants/game';
import {
  generateRandomFood,
  getHighScore,
  isValidDirectionChange,
  isSafeDirectionChange,
} from '@/utils/gameLogic';
import { calculateLevel, calculateGameSpeed } from '@/utils/difficulty';
import { loadAchievements } from '@/utils/achievements';
import { LIVES_CONFIG } from '@/constants/lives';
import { initializeStatistics } from '@/utils/statistics';
import { getCurrentPhase, getBossForLevel, shouldSpawnBoss } from '@/utils/phases';

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const initialFood = generateRandomFood(
      INITIAL_SNAKE_POSITION,
      GAME_CONFIG.gridSize,
      [], // No obstacles at game start/reset
    );
    const initialLevel = calculateLevel(0);
    const initialSpeed = calculateGameSpeed(initialLevel);
    const initialPhase = getCurrentPhase(initialLevel);

    return {
      snake: INITIAL_SNAKE_POSITION,
      food: initialFood,
      direction: INITIAL_DIRECTION,
      nextDirection: INITIAL_DIRECTION,
      status: GameStatus.IDLE,
      score: 0,
      highScore: getHighScore(),
      level: initialLevel,
      gameSpeed: initialSpeed,
      activePowerUps: [],
      obstacles: [],
      portals: [],
      combo: {
        count: 0,
        multiplier: 1,
        lastFoodTime: 0,
      },
      particles: [],
      poisonShots: [],
      achievements: loadAchievements(),
      lives: LIVES_CONFIG.initialLives,
      statistics: initializeStatistics(),
      isSpeedBoosted: false,
      isFiringPoison: false,
      currentPhase: initialPhase?.id,
      phaseLevelType: initialPhase?.type,
      activeBoss: shouldSpawnBoss(initialLevel) ? getBossForLevel(initialLevel) : undefined,
    };
  });

  const resetGame = useCallback(() => {
    const initialFood = generateRandomFood(
      INITIAL_SNAKE_POSITION,
      GAME_CONFIG.gridSize,
      [], // No obstacles at game start/reset
    );
    const initialLevel = calculateLevel(0);
    const initialSpeed = calculateGameSpeed(initialLevel);
    const initialPhase = getCurrentPhase(initialLevel);

    setGameState({
      snake: INITIAL_SNAKE_POSITION,
      food: initialFood,
      direction: INITIAL_DIRECTION,
      nextDirection: INITIAL_DIRECTION,
      status: GameStatus.IDLE,
      score: 0,
      highScore: getHighScore(),
      level: initialLevel,
      gameSpeed: initialSpeed,
      activePowerUps: [],
      obstacles: [],
      portals: [],
      combo: {
        count: 0,
        multiplier: 1,
        lastFoodTime: 0,
      },
      particles: [],
      poisonShots: [],
      achievements: loadAchievements(),
      lives: LIVES_CONFIG.initialLives,
      statistics: initializeStatistics(),
      isSpeedBoosted: false,
      isFiringPoison: false,
      currentPhase: initialPhase?.id,
      phaseLevelType: initialPhase?.type,
      activeBoss: shouldSpawnBoss(initialLevel) ? getBossForLevel(initialLevel) : undefined,
    });
  }, []);

  const startGame = useCallback(() => {
    setGameState((prev) => {
      // If starting from IDLE, show phase intro first
      if (prev.status === GameStatus.IDLE) {
        return {
          ...prev,
          status: GameStatus.PHASE_INTRO,
        };
      }
      // Otherwise, start playing directly
      return {
        ...prev,
        status: GameStatus.PLAYING,
      };
    });
  }, []);

  const pauseGame = useCallback(() => {
    setGameState((prev) => {
      const statistics = prev.statistics ?? initializeStatistics();
      const now = Date.now();

      if (prev.status === GameStatus.PLAYING) {
        // Pausing - record pause start time and reset speed boost
        return {
          ...prev,
          status: GameStatus.PAUSED,
          isSpeedBoosted: false, // Reset speed boost when pausing
          isFiringPoison: false, // Reset firing when pausing
          statistics: {
            ...statistics,
            lastPauseTime: now,
          },
        };
      } else if (prev.status === GameStatus.PAUSED && statistics.lastPauseTime) {
        // Resuming - add paused time
        const pausedDuration = now - statistics.lastPauseTime;
        return {
          ...prev,
          status: GameStatus.PLAYING,
          statistics: {
            ...statistics,
            pausedTime: statistics.pausedTime + pausedDuration,
            lastPauseTime: undefined,
          },
        };
      }

      return prev;
    });
  }, []);

  const setDirection = useCallback((direction: Direction) => {
    setGameState((prev) => {
      if (prev.status !== GameStatus.PLAYING) {
        return prev;
      }

      // Only allow direction change if it's valid (not opposite direction)
      const isValidChange = isValidDirectionChange(prev.direction, direction);

      if (isValidChange) {
        // Update nextDirection for queued direction changes
        // Only update current direction if safe to prevent collision
        return {
          ...prev,
          nextDirection: direction,
          // Only update current direction if safe to avoid immediate collision
          ...(isSafeDirectionChange(
            prev.snake,
            prev.direction,
            direction,
            GAME_CONFIG.gridSize,
          ) && {
            direction,
          }),
        };
      }

      // Invalid direction (opposite) - ignore
      return prev;
    });
  }, []);

  const updateGameState = useCallback((updater: (prev: GameState) => GameState) => {
    setGameState(updater);
  }, []);

  const setSpeedBoost = useCallback((isBoosted: boolean) => {
    setGameState((prev) => ({
      ...prev,
      isSpeedBoosted: isBoosted,
    }));
  }, []);

  const setFiringPoison = useCallback((isFiring: boolean) => {
    setGameState((prev) => ({
      ...prev,
      isFiringPoison: isFiring,
    }));
  }, []);

  return {
    gameState,
    resetGame,
    startGame,
    pauseGame,
    setDirection,
    updateGameState,
    setSpeedBoost,
    setFiringPoison,
  };
}
