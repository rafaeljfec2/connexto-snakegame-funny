import {
  Position,
  PoisonShot,
  BossSnake,
  Food as FoodType,
  Obstacle,
  Portal,
  Direction,
} from '@/types/game';
import { bufferToPositions } from './renderUtils';
import { AnimationState, createAnimationState } from './renderAnimations';

export interface RenderState {
  // Canvas context
  ctx: OffscreenCanvasRenderingContext2D | null;
  width: number;
  height: number;
  dpr: number;
  gamePort: MessagePort | null;
  isMobile: boolean;

  // Game state
  snake: Position[];
  prevSnake: Position[];
  bossSnake: BossSnake | null;
  prevBossSnake: Position[];
  activeBoss: { color: string; icon?: string; name?: string } | null;
  guardianFlag: { position: Position; type: string } | null;
  shots: PoisonShot[];
  food: FoodType | null;
  obstacles: Obstacle[];
  portals: Portal[];
  isEating: boolean;
  speed: number;
  lastUpdate: number;
  isRenderDirty: boolean;

  // Animation state
  animationState: AnimationState;
  gameStatus: string;
}

/**
 * Create initial render state
 */
export function createRenderState(): RenderState {
  return {
    ctx: null,
    width: 0,
    height: 0,
    dpr: 1,
    gamePort: null,
    isMobile: false,
    snake: [],
    prevSnake: [],
    bossSnake: null,
    prevBossSnake: [],
    activeBoss: null,
    guardianFlag: null,
    shots: [],
    food: null,
    obstacles: [],
    portals: [],
    isEating: false,
    speed: 150,
    lastUpdate: 0,
    isRenderDirty: false,
    animationState: createAnimationState(),
    gameStatus: 'IDLE',
  };
}

/**
 * Update snake positions from payload
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function updateSnake(state: RenderState, payload: any): void {
  if (payload.snake instanceof ArrayBuffer) {
    const newSnake = bufferToPositions(payload.snake, payload.snakeLength ?? 0);
    state.prevSnake = state.snake && state.snake.length > 0 ? state.snake : newSnake;
    state.snake = newSnake;
  } else {
    state.prevSnake = state.snake && state.snake.length > 0 ? state.snake : payload.snake;
    state.snake = payload.snake || [];
  }
}

/**
 * Update boss snake from payload
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function updateBossSnake(state: RenderState, payload: any): void {
  if (!payload.bossSnake) {
    state.bossSnake = null;
    state.prevBossSnake = [];
    return;
  }

  if (payload.bossSnake instanceof ArrayBuffer) {
    const bossPositions = bufferToPositions(payload.bossSnake, payload.bossSnakeLength ?? 0);
    state.prevBossSnake = state.bossSnake ? state.bossSnake.positions : bossPositions;
    state.bossSnake = {
      positions: bossPositions,
      direction: state.bossSnake?.direction ?? Direction.RIGHT,
      nextDirection: state.bossSnake?.nextDirection ?? Direction.RIGHT,
      initialLength: state.bossSnake?.initialLength ?? bossPositions.length,
    };
  } else {
    state.prevBossSnake = state.bossSnake ? state.bossSnake.positions : payload.bossSnake.positions;
    state.bossSnake = payload.bossSnake;
  }
}

/**
 * Update game status and animation state
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function updateGameStatus(state: RenderState, payload: any): void {
  if (!payload.status || payload.status === state.gameStatus) return;

  if (payload.status === 'GAME_OVER' || payload.status === 'DYING') {
    state.animationState.deathStartTime = performance.now();
  } else {
    state.animationState.deathStartTime = 0;
  }
  state.gameStatus = payload.status;
}

/**
 * Update simple game state fields
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function updateGameFields(state: RenderState, payload: any): void {
  if (payload.activeBoss) {
    state.activeBoss = payload.activeBoss;
  }

  if (payload.food) {
    state.food = payload.food;
  }

  if (payload.obstacles) {
    state.obstacles = payload.obstacles;
  }

  if (payload.portals) {
    state.portals = payload.portals;
  }

  if (payload.guardianFlag !== undefined) {
    state.guardianFlag = payload.guardianFlag;
  }

  state.shots = payload.shots || [];
  if (payload.isEating !== undefined) {
    state.isEating = Boolean(payload.isEating);
  }
  state.speed = payload.speed || 150;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleUiHint(state: RenderState, payload: any): void {
  if (payload?.isEating !== undefined) {
    state.isEating = Boolean(payload.isEating);
    state.isRenderDirty = true;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleUiLocale(state: RenderState, payload: any): void {
  if (payload?.activeBoss && state.activeBoss) {
    state.activeBoss = {
      ...state.activeBoss,
      name:
        typeof payload.activeBoss.name === 'string'
          ? payload.activeBoss.name
          : state.activeBoss.name,
    };
    state.isRenderDirty = true;
  }
}

/**
 * Handle update payload from game worker
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleStateUpdate(state: RenderState, payload: any): void {
  if (payload.snake === undefined) return;

  updateSnake(state, payload);
  updateBossSnake(state, payload);
  updateGameFields(state, payload);
  updateGameStatus(state, payload);

  state.lastUpdate = performance.now();
  state.isRenderDirty = true;
}
