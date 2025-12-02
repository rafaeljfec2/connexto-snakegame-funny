import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Direction, Position } from '@/types/game'
import {
  getOppositeDirection,
  isValidDirectionChange,
  getNextHeadPosition,
  hasSelfCollision,
  hasFoodCollision,
  isValidPosition,
  generateRandomFood,
  moveSnake,
  getHighScore,
  saveHighScore,
} from '../gameLogic'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('gameLogic', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('getOppositeDirection', () => {
    it('should return opposite direction for UP', () => {
      expect(getOppositeDirection(Direction.UP)).toBe(Direction.DOWN)
    })

    it('should return opposite direction for DOWN', () => {
      expect(getOppositeDirection(Direction.DOWN)).toBe(Direction.UP)
    })

    it('should return opposite direction for LEFT', () => {
      expect(getOppositeDirection(Direction.LEFT)).toBe(Direction.RIGHT)
    })

    it('should return opposite direction for RIGHT', () => {
      expect(getOppositeDirection(Direction.RIGHT)).toBe(Direction.LEFT)
    })
  })

  describe('isValidDirectionChange', () => {
    it('should return false when trying to move to opposite direction', () => {
      expect(isValidDirectionChange(Direction.UP, Direction.DOWN)).toBe(false)
      expect(isValidDirectionChange(Direction.DOWN, Direction.UP)).toBe(false)
      expect(isValidDirectionChange(Direction.LEFT, Direction.RIGHT)).toBe(false)
      expect(isValidDirectionChange(Direction.RIGHT, Direction.LEFT)).toBe(false)
    })

    it('should return true for valid direction changes', () => {
      expect(isValidDirectionChange(Direction.UP, Direction.LEFT)).toBe(true)
      expect(isValidDirectionChange(Direction.UP, Direction.RIGHT)).toBe(true)
      expect(isValidDirectionChange(Direction.DOWN, Direction.LEFT)).toBe(true)
      expect(isValidDirectionChange(Direction.DOWN, Direction.RIGHT)).toBe(true)
    })

    it('should return false when trying to keep same direction', () => {
      expect(isValidDirectionChange(Direction.UP, Direction.UP)).toBe(true)
    })
  })

  describe('getNextHeadPosition', () => {
    const gridSize = 20
    const centerPosition: Position = { x: 10, y: 10 }

    it('should move UP correctly', () => {
      const next = getNextHeadPosition(centerPosition, Direction.UP, gridSize)
      expect(next).toEqual({ x: 10, y: 9 })
    })

    it('should move DOWN correctly', () => {
      const next = getNextHeadPosition(centerPosition, Direction.DOWN, gridSize)
      expect(next).toEqual({ x: 10, y: 11 })
    })

    it('should move LEFT correctly', () => {
      const next = getNextHeadPosition(centerPosition, Direction.LEFT, gridSize)
      expect(next).toEqual({ x: 9, y: 10 })
    })

    it('should move RIGHT correctly', () => {
      const next = getNextHeadPosition(centerPosition, Direction.RIGHT, gridSize)
      expect(next).toEqual({ x: 11, y: 10 })
    })

    it('should wrap around when moving UP from top edge', () => {
      const topPosition: Position = { x: 10, y: 0 }
      const next = getNextHeadPosition(topPosition, Direction.UP, gridSize)
      expect(next).toEqual({ x: 10, y: gridSize - 1 })
    })

    it('should wrap around when moving DOWN from bottom edge', () => {
      const bottomPosition: Position = { x: 10, y: gridSize - 1 }
      const next = getNextHeadPosition(bottomPosition, Direction.DOWN, gridSize)
      expect(next).toEqual({ x: 10, y: 0 })
    })

    it('should wrap around when moving LEFT from left edge', () => {
      const leftPosition: Position = { x: 0, y: 10 }
      const next = getNextHeadPosition(leftPosition, Direction.LEFT, gridSize)
      expect(next).toEqual({ x: gridSize - 1, y: 10 })
    })

    it('should wrap around when moving RIGHT from right edge', () => {
      const rightPosition: Position = { x: gridSize - 1, y: 10 }
      const next = getNextHeadPosition(rightPosition, Direction.RIGHT, gridSize)
      expect(next).toEqual({ x: 0, y: 10 })
    })
  })

  describe('hasSelfCollision', () => {
    it('should return false for snake with less than 4 segments', () => {
      const snake: Position[] = [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 3, y: 5 },
      ]
      expect(hasSelfCollision(snake)).toBe(false)
    })

    it('should return false when head does not collide with body', () => {
      const snake: Position[] = [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 3, y: 5 },
        { x: 3, y: 4 },
        { x: 3, y: 3 },
      ]
      expect(hasSelfCollision(snake)).toBe(false)
    })

    it('should return true when head collides with body', () => {
      const snake: Position[] = [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 3, y: 5 },
        { x: 3, y: 4 },
        { x: 3, y: 3 },
        { x: 4, y: 3 },
        { x: 5, y: 3 },
        { x: 5, y: 4 },
        { x: 5, y: 5 },
      ]
      expect(hasSelfCollision(snake)).toBe(true)
    })
  })

  describe('hasFoodCollision', () => {
    it('should return true when head and food are at same position', () => {
      const head: Position = { x: 5, y: 5 }
      const food: Position = { x: 5, y: 5 }
      expect(hasFoodCollision(head, food)).toBe(true)
    })

    it('should return false when head and food are at different positions', () => {
      const head: Position = { x: 5, y: 5 }
      const food: Position = { x: 5, y: 6 }
      expect(hasFoodCollision(head, food)).toBe(false)
    })
  })

  describe('isValidPosition', () => {
    const gridSize = 20

    it('should return true for valid positions within grid', () => {
      expect(isValidPosition({ x: 0, y: 0 }, gridSize)).toBe(true)
      expect(isValidPosition({ x: 10, y: 10 }, gridSize)).toBe(true)
      expect(isValidPosition({ x: 19, y: 19 }, gridSize)).toBe(true)
    })

    it('should return false for positions outside grid bounds', () => {
      expect(isValidPosition({ x: -1, y: 0 }, gridSize)).toBe(false)
      expect(isValidPosition({ x: 0, y: -1 }, gridSize)).toBe(false)
      expect(isValidPosition({ x: 20, y: 0 }, gridSize)).toBe(false)
      expect(isValidPosition({ x: 0, y: 20 }, gridSize)).toBe(false)
      expect(isValidPosition({ x: 25, y: 25 }, gridSize)).toBe(false)
    })
  })

  describe('generateRandomFood', () => {
    it('should generate food not on snake body', () => {
      const snake: Position[] = [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 3, y: 5 },
      ]
      const gridSize = 20

      // Run multiple times to check randomness
      for (let i = 0; i < 10; i++) {
        const food = generateRandomFood(snake, gridSize)
        const isOnSnake = snake.some(
          (segment) => segment.x === food.x && segment.y === food.y
        )
        expect(isOnSnake).toBe(false)
        expect(food.x).toBeGreaterThanOrEqual(0)
        expect(food.x).toBeLessThan(gridSize)
        expect(food.y).toBeGreaterThanOrEqual(0)
        expect(food.y).toBeLessThan(gridSize)
      }
    })

    it('should return valid position even when snake fills most of the grid', () => {
      const snake: Position[] = []
      for (let i = 0; i < 19; i++) {
        snake.push({ x: i, y: 10 })
      }
      const gridSize = 20

      const food = generateRandomFood(snake, gridSize)
      expect(food.x).toBeGreaterThanOrEqual(0)
      expect(food.x).toBeLessThan(gridSize)
      expect(food.y).toBeGreaterThanOrEqual(0)
      expect(food.y).toBeLessThan(gridSize)
    })
  })

  describe('moveSnake', () => {
    const gridSize = 20
    const initialSnake: Position[] = [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
    ]

    it('should move snake without growing', () => {
      const newSnake = moveSnake(initialSnake, Direction.RIGHT, gridSize, false)
      expect(newSnake).toHaveLength(initialSnake.length)
      expect(newSnake[0]).toEqual({ x: 6, y: 5 })
      expect(newSnake[1]).toEqual({ x: 5, y: 5 })
      expect(newSnake[2]).toEqual({ x: 4, y: 5 })
    })

    it('should move snake and grow when eat food', () => {
      const newSnake = moveSnake(initialSnake, Direction.RIGHT, gridSize, true)
      expect(newSnake).toHaveLength(initialSnake.length + 1)
      expect(newSnake[0]).toEqual({ x: 6, y: 5 })
      expect(newSnake[1]).toEqual({ x: 5, y: 5 })
      expect(newSnake[2]).toEqual({ x: 4, y: 5 })
      expect(newSnake[3]).toEqual({ x: 3, y: 5 })
    })

    it('should handle edge wrapping', () => {
      const edgeSnake: Position[] = [
        { x: gridSize - 1, y: 10 },
        { x: gridSize - 2, y: 10 },
      ]
      const newSnake = moveSnake(edgeSnake, Direction.RIGHT, gridSize, false)
      expect(newSnake[0]).toEqual({ x: 0, y: 10 })
    })
  })

  describe('getHighScore', () => {
    it('should return 0 when no high score is stored', () => {
      expect(getHighScore()).toBe(0)
    })

    it('should return stored high score', () => {
      localStorage.setItem('snake-game-high-score', '100')
      expect(getHighScore()).toBe(100)
    })

    it('should return 0 for invalid stored value', () => {
      localStorage.setItem('snake-game-high-score', 'invalid')
      expect(getHighScore()).toBe(0)
    })
  })

  describe('saveHighScore', () => {
    it('should save high score when it is higher than current', () => {
      saveHighScore(100)
      expect(localStorage.getItem('snake-game-high-score')).toBe('100')
    })

    it('should not save score when it is lower than current high score', () => {
      localStorage.setItem('snake-game-high-score', '150')
      saveHighScore(100)
      expect(localStorage.getItem('snake-game-high-score')).toBe('150')
    })

    it('should update high score when new score is higher', () => {
      localStorage.setItem('snake-game-high-score', '100')
      saveHighScore(200)
      expect(localStorage.getItem('snake-game-high-score')).toBe('200')
    })
  })
})
