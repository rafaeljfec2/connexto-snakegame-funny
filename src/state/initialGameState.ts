import { GAME_CONFIG, INITIAL_DIRECTION, INITIAL_SNAKE_POSITION } from '@/constants/game';
import { FoodType, GameStatus, type GameState } from '@/types/game';
import { initializeStatistics } from '@/utils/statistics';

export function getInitialGameState(highScore = 0): GameState {
  return {
    snake: [...INITIAL_SNAKE_POSITION],
    food: {
      position: { x: 5, y: 5 },
      type: FoodType.NORMAL,
      spawnTime: Date.now(),
    },
    direction: INITIAL_DIRECTION,
    nextDirection: INITIAL_DIRECTION,
    status: GameStatus.IDLE,
    score: 0,
    highScore,
    level: 1,
    gameSpeed: GAME_CONFIG.gameSpeed,
    activePowerUps: [],
    obstacles: [],
    portals: [],
    combo: { count: 0, multiplier: 1, lastFoodTime: 0 },
    particles: [],
    poisonShots: [],
    achievements: [],
    lives: 3,
    statistics: initializeStatistics(),
    isSpeedBoosted: false,
    isFiringPoison: false,
  };
}
