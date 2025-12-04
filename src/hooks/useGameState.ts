import { useState, useCallback } from 'react';
import { GameState, Direction, GameStatus } from '@/types/game';
import { GAME_CONFIG, INITIAL_DIRECTION, INITIAL_SNAKE_POSITION } from '@/constants/game';
import { generateRandomFood, getHighScore, isValidDirectionChange } from '@/utils/gameLogic';
import { calculateLevel, calculateGameSpeed } from '@/utils/difficulty';
import { loadAchievements } from '@/utils/achievements';
import { LIVES_CONFIG } from '@/constants/lives';
import { initializeStatistics } from '@/utils/statistics';

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const initialFood = generateRandomFood(
      INITIAL_SNAKE_POSITION,
      GAME_CONFIG.gridSize,
      [], // No obstacles at game start/reset
    );
    const initialLevel = calculateLevel(0);
    const initialSpeed = calculateGameSpeed(initialLevel);

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
      achievements: loadAchievements(),
      lives: LIVES_CONFIG.initialLives,
      statistics: initializeStatistics(),
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
      achievements: loadAchievements(),
      lives: LIVES_CONFIG.initialLives,
      statistics: initializeStatistics(),
    });
  }, []);

  const startGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      status: GameStatus.PLAYING,
    }));
  }, []);

  const pauseGame = useCallback(() => {
    setGameState((prev) => {
      const statistics = prev.statistics ?? initializeStatistics();
      const now = Date.now();

      if (prev.status === GameStatus.PLAYING) {
        // Pausing - record pause start time
        return {
          ...prev,
          status: GameStatus.PAUSED,
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

      // Apply direction change immediately if valid (makes controls more responsive)
      const isValidChange = isValidDirectionChange(prev.direction, direction);

      if (isValidChange) {
        return {
          ...prev,
          direction,
          nextDirection: direction,
        };
      }

      // Store for next valid frame if not immediately valid
      return {
        ...prev,
        nextDirection: direction,
      };
    });
  }, []);

  const updateGameState = useCallback((updater: (prev: GameState) => GameState) => {
    setGameState(updater);
  }, []);

  return {
    gameState,
    resetGame,
    startGame,
    pauseGame,
    setDirection,
    updateGameState,
  };
}
