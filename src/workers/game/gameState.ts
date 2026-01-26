import { GameState, GameStatus, FoodType } from '@/types/game';
import { GAME_CONFIG, INITIAL_SNAKE_POSITION, INITIAL_DIRECTION } from '@/constants/game';
import { generateRandomFood } from '@/utils/gameLogic';
import { initializeStatistics } from '@/utils/statistics';

/**
 * Worker state interface
 */
export interface WorkerState {
  gameState: GameState | null;
  gameLoopId: number | null;
  lastUpdateTime: number;
  lastObstacleSpawnTime: number;
  forcedFoodType: FoodType | null;
  bossAbilityCooldowns: Map<string, number>;
  pendingPoisonShots: import('@/types/game').PoisonShot[];
  renderPort: MessagePort | null;
  directionQueue: import('@/types/game').Direction[];
  previousState: Partial<GameState> | null;
  previousRenderState: {
    snake: import('@/types/game').Position[];
    bossSnake?: import('@/types/game').BossSnake;
    shots: import('@/types/game').PoisonShot[];
    food: import('@/types/game').Food | null;
    obstacles: import('@/types/game').Obstacle[];
    portals: import('@/types/game').Portal[];
    activeBoss: { color: string; icon?: string; name?: string } | null;
    guardianFlag: import('@/types/game').Food | null;
    speed: number;
    status: GameStatus;
  } | null;
  isRenderDirty: boolean;
}

/**
 * Create initial worker state
 */
export function createWorkerState(): WorkerState {
  return {
    gameState: null,
    gameLoopId: null,
    lastUpdateTime: 0,
    lastObstacleSpawnTime: 0,
    forcedFoodType: null,
    bossAbilityCooldowns: new Map(),
    pendingPoisonShots: [],
    renderPort: null,
    directionQueue: [],
    previousState: null,
    previousRenderState: null,
    isRenderDirty: true,
  };
}

/**
 * Initialize game state
 */
export function initGameState(highScore?: number): GameState {
  const initialStatistics = initializeStatistics();

  return {
    snake: [...INITIAL_SNAKE_POSITION],
    food: generateRandomFood(INITIAL_SNAKE_POSITION, GAME_CONFIG.gridSize),
    direction: INITIAL_DIRECTION,
    nextDirection: INITIAL_DIRECTION,
    status: GameStatus.IDLE,
    score: 0,
    highScore: highScore ?? 0,
    level: 1,
    gameSpeed: GAME_CONFIG.gameSpeed,
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
    achievements: [],
    lives: 3,
    statistics: initialStatistics,
    isSpeedBoosted: false,
    isFiringPoison: false,
  };
}

/**
 * Reset worker state for new game
 */
export function resetWorkerState(state: WorkerState): void {
  state.directionQueue = [];
  state.previousState = null;
  state.previousRenderState = null;
  state.isRenderDirty = true;
  state.lastObstacleSpawnTime = 0;
  state.bossAbilityCooldowns.clear();
}
