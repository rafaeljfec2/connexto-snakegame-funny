import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  Direction,
  FoodType,
  GameStatus,
  type ActivePowerUp,
  type GameState,
  type Position,
} from '@/types/game';
import type { GameStatisticsTracking } from '@/types/statistics';
import { initializeStatistics } from '@/utils/statistics';
import { POWER_UP_CONFIG } from '@/constants/powerUps';
import { handleFoodInteraction } from '@/workers/game/foodInteractionHelper';

const GRID = 20;

beforeEach(() => {
  (globalThis as unknown as { self: { postMessage: ReturnType<typeof vi.fn> } }).self = {
    postMessage: vi.fn(),
  };
});

function buildExpiredPowerUp(now: number): ActivePowerUp {
  const duration = POWER_UP_CONFIG.durations[FoodType.SPEED_BOOST];
  return {
    type: FoodType.SPEED_BOOST,
    duration,
    startTime: now - duration - 1000,
  };
}

function buildActivePowerUp(now: number): ActivePowerUp {
  const duration = POWER_UP_CONFIG.durations[FoodType.PHASE_THROUGH];
  return {
    type: FoodType.PHASE_THROUGH,
    duration,
    startTime: now - 100,
  };
}

function buildSnake(): Position[] {
  return [
    { x: 5, y: 5 },
    { x: 4, y: 5 },
    { x: 3, y: 5 },
  ];
}

function buildGameState(overrides: Partial<GameState> = {}): GameState {
  const snake = overrides.snake ?? buildSnake();
  return {
    snake,
    food: { position: { x: 6, y: 5 }, type: FoodType.NORMAL },
    direction: Direction.RIGHT,
    nextDirection: Direction.RIGHT,
    status: GameStatus.PLAYING,
    score: 0,
    highScore: 0,
    level: 1,
    gameSpeed: 150,
    activePowerUps: [],
    obstacles: [],
    portals: [],
    combo: { count: 0, multiplier: 1, lastFoodTime: 0 },
    particles: [],
    poisonShots: [],
    achievements: [],
    lives: 3,
    statistics: initializeStatistics(),
    ...overrides,
  };
}

function buildStats(): GameStatisticsTracking {
  return initializeStatistics();
}

describe('handleFoodInteraction - active power-ups lifecycle', () => {
  it('drops expired power-ups when no food is eaten (regression: powerup.expire SFX spam)', () => {
    const now = Date.now();
    const expired = buildExpiredPowerUp(now);
    const active = buildActivePowerUp(now);
    const prev = buildGameState({ activePowerUps: [expired, active] });

    const result = handleFoodInteraction(false, prev, prev.snake, buildStats(), GRID, true, false);

    expect(result.newActivePowerUps).toHaveLength(1);
    expect(result.newActivePowerUps[0]?.type).toBe(FoodType.PHASE_THROUGH);
    expect(result.newActivePowerUps).not.toContainEqual(expired);
  });

  it('drops expired power-ups when normal food is eaten', () => {
    const now = Date.now();
    const expired = buildExpiredPowerUp(now);
    const prev = buildGameState({
      activePowerUps: [expired],
      food: { position: { x: 5, y: 5 }, type: FoodType.NORMAL },
    });

    const result = handleFoodInteraction(true, prev, prev.snake, buildStats(), GRID, true, false);

    expect(result.newActivePowerUps).toHaveLength(0);
    expect(result.atePowerUp).toBe(false);
  });

  it('replaces an expired power-up with a freshly collected one', () => {
    const now = Date.now();
    const expired = buildExpiredPowerUp(now);
    const prev = buildGameState({
      activePowerUps: [expired],
      food: { position: { x: 5, y: 5 }, type: FoodType.PHASE_THROUGH },
    });

    const result = handleFoodInteraction(true, prev, prev.snake, buildStats(), GRID, true, false);

    expect(result.newActivePowerUps).toHaveLength(1);
    expect(result.newActivePowerUps[0]?.type).toBe(FoodType.PHASE_THROUGH);
    expect(result.atePowerUp).toBe(true);
  });

  it('preserves an unrelated active power-up while removing an expired one', () => {
    const now = Date.now();
    const expired = buildExpiredPowerUp(now);
    const stillActive = buildActivePowerUp(now);
    const prev = buildGameState({
      activePowerUps: [expired, stillActive],
      food: { position: { x: 5, y: 5 }, type: FoodType.NORMAL },
    });

    const result = handleFoodInteraction(true, prev, prev.snake, buildStats(), GRID, true, false);

    expect(result.newActivePowerUps).toHaveLength(1);
    expect(result.newActivePowerUps[0]).toEqual(stillActive);
  });
});
