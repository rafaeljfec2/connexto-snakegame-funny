import { useEffect, useRef, useCallback } from "react";
import { GameStatus, GameState } from "@/types/game";
import { GAME_CONFIG } from "@/constants/game";
import {
  moveSnake,
  hasSelfCollision,
  hasFoodCollision,
  generateRandomFood,
  isValidDirectionChange,
  saveHighScore,
} from "@/utils/gameLogic";
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

      let currentDirection = prev.direction;
      if (
        prev.nextDirection !== prev.direction &&
        isValidDirectionChange(prev.direction, prev.nextDirection)
      ) {
        currentDirection = prev.nextDirection;
      }

      const newSnake = moveSnake(
        prev.snake,
        currentDirection,
        GAME_CONFIG.gridSize,
        false
      );

      if (hasSelfCollision(newSnake)) {
        saveHighScore(prev.score);
        return {
          ...prev,
          status: GameStatus.GAME_OVER,
          highScore: Math.max(prev.score, prev.highScore),
        };
      }

      const ateFood = hasFoodCollision(newSnake[0], prev.food);

      const finalSnake = ateFood
        ? moveSnake(prev.snake, currentDirection, GAME_CONFIG.gridSize, true)
        : newSnake;

      const newFood = ateFood
        ? generateRandomFood(finalSnake, GAME_CONFIG.gridSize)
        : prev.food;

      const newScore = ateFood ? prev.score + 10 : prev.score;

      return {
        ...prev,
        snake: finalSnake,
        food: newFood,
        direction: currentDirection,
        nextDirection: currentDirection,
        score: newScore,
        highScore:
          ateFood && newScore > prev.highScore ? newScore : prev.highScore,
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

      if (elapsed >= GAME_CONFIG.gameSpeed) {
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
  }, [gameState.status, updateGame]);

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
