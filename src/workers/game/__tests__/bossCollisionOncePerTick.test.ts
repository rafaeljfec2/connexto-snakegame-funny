import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Direction, FoodType, GameStatus, type GameState, type Position } from '@/types/game';
import { initializeStatistics } from '@/utils/statistics';
import { CHEFS } from '@/constants/phases';
import { LIVES_CONFIG } from '@/constants/lives';
import { handleBossCollisionCheck } from '@/workers/game/bossLogicHelper';
import { handleBossCollision } from '@/workers/game/gameUpdateHelpers';
import type { FoodInteractionResult } from '@/workers/game/foodInteractionHelper';
import type { BossLogicResult } from '@/workers/game/bossLogicHelper';

beforeEach(() => {
  (globalThis as unknown as { self: { postMessage: ReturnType<typeof vi.fn> } }).self = {
    postMessage: vi.fn(),
  };
});

const HEAD: Position = { x: 10, y: 10 };

function buildPrev(lives: number): GameState {
  return {
    snake: [HEAD, { x: 10, y: 11 }, { x: 10, y: 12 }],
    food: { position: { x: 0, y: 0 }, type: FoodType.NORMAL },
    direction: Direction.UP,
    nextDirection: Direction.UP,
    status: GameStatus.PLAYING,
    score: 500,
    highScore: 500,
    level: 10,
    gameSpeed: 120,
    activePowerUps: [],
    obstacles: [],
    portals: [],
    combo: { count: 0, multiplier: 1, lastFoodTime: 0 },
    particles: [],
    poisonShots: [],
    achievements: [],
    lives,
    statistics: initializeStatistics(),
    activeBoss: CHEFS.find((c) => c.id === 'guardian') ?? CHEFS[0],
    bossSnake: {
      // Length > 3 so head hit damages player instead of defeating the boss
      positions: [HEAD, { x: 11, y: 10 }, { x: 12, y: 10 }, { x: 13, y: 10 }, { x: 14, y: 10 }],
      direction: Direction.LEFT,
      nextDirection: Direction.LEFT,
      initialLength: 5,
    },
  };
}

function buildBossLogic(prev: GameState): BossLogicResult {
  return {
    activeBoss: prev.activeBoss,
    bossSnake: prev.bossSnake,
    newObstacles: [],
    newPortals: [],
    baseGameSpeed: prev.gameSpeed,
    newLives: prev.lives,
    forcedFoodType: null,
    bossAbilityCooldowns: new Map(),
    newScore: prev.score,
    particlesToSpawn: [],
  };
}

function buildFoodResult(prev: GameState): FoodInteractionResult {
  return {
    newScore: prev.score,
    newCombo: prev.combo,
    newLives: prev.lives,
    finalSnake: prev.snake,
    newActivePowerUps: [],
    statistics: prev.statistics ?? initializeStatistics(),
    atePowerUp: false,
    particlesToSpawn: [],
    newPortals: [],
    resolvedFoodType: null,
  };
}

describe('boss head collision once per tick (REF-10-AC-11)', () => {
  it('applies a single life loss and iframes via handleBossCollision', () => {
    const prev = buildPrev(3);
    const bossLogicResult = buildBossLogic(prev);
    const foodResult = buildFoodResult(prev);
    const before = Date.now();

    const outcome = handleBossCollision(HEAD, bossLogicResult, prev, foodResult);

    expect(outcome.fatalState).toBeNull();
    expect(foodResult.newLives).toBe(2);
    expect(bossLogicResult.newLives).toBe(2);
    expect(outcome.bossState.newLives).toBe(2);
    expect(foodResult.invulnerableUntil).toBeGreaterThanOrEqual(
      before + LIVES_CONFIG.invulnerabilityDurationMs,
    );
  });

  it('documents that a second check with stale prev would double-drain (must not happen in gameUpdate)', () => {
    const prev = buildPrev(3);
    const bossLogicResult = buildBossLogic(prev);

    const first = handleBossCollisionCheck(HEAD, bossLogicResult, prev);
    expect(first.gameOverOrDying?.lives).toBe(2);
    Object.assign(bossLogicResult, first.collisionResult);

    // Same-tick bug: prev still has no invulnerableUntil, so another head check drains again
    const second = handleBossCollisionCheck(HEAD, bossLogicResult, prev);
    expect(second.gameOverOrDying?.lives).toBe(1);

    // Contract: updateGameLogic must reuse handleBossCollision.bossState instead of calling again
  });
});
