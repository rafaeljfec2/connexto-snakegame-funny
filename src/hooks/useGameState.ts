import { useState, useCallback } from 'react'
import {
  GameState,
  Direction,
  GameStatus,
  Position,
} from '@/types/game'
import {
  GAME_CONFIG,
  INITIAL_DIRECTION,
  INITIAL_SNAKE_POSITION,
} from '@/constants/game'
import {
  generateRandomFood,
  getHighScore,
} from '@/utils/gameLogic'

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const initialFood = generateRandomFood(
      INITIAL_SNAKE_POSITION,
      GAME_CONFIG.gridSize
    )

    return {
      snake: INITIAL_SNAKE_POSITION,
      food: initialFood,
      direction: INITIAL_DIRECTION,
      nextDirection: INITIAL_DIRECTION,
      status: GameStatus.IDLE,
      score: 0,
      highScore: getHighScore(),
    }
  })

  const resetGame = useCallback(() => {
    const initialFood = generateRandomFood(
      INITIAL_SNAKE_POSITION,
      GAME_CONFIG.gridSize
    )

    setGameState({
      snake: INITIAL_SNAKE_POSITION,
      food: initialFood,
      direction: INITIAL_DIRECTION,
      nextDirection: INITIAL_DIRECTION,
      status: GameStatus.IDLE,
      score: 0,
      highScore: getHighScore(),
    })
  }, [])

  const startGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      status: GameStatus.PLAYING,
    }))
  }, [])

  const pauseGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      status: prev.status === GameStatus.PLAYING 
        ? GameStatus.PAUSED 
        : GameStatus.PLAYING,
    }))
  }, [])

  const setDirection = useCallback((direction: Direction) => {
    setGameState((prev) => {
      if (prev.status !== GameStatus.PLAYING) {
        return prev
      }
      return {
        ...prev,
        nextDirection: direction,
      }
    })
  }, [])

  const updateGameState = useCallback((updater: (prev: GameState) => GameState) => {
    setGameState(updater)
  }, [])

  return {
    gameState,
    resetGame,
    startGame,
    pauseGame,
    setDirection,
    updateGameState,
  }
}
