import { GameState, GameStatus, PoisonShot, Obstacle, Portal, Food } from '@/types/game';
import {
  computeDelta,
  shallowCopyState,
  positionArraysEqual,
  positionsToTypedArray,
} from './gameDelta';
import { updateDeltaSize } from '@/utils/performanceMetrics';

/**
 * Compare poison shots arrays efficiently
 */
function poisonShotsEqual(a: PoisonShot[] | undefined, b: PoisonShot[] | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return a === b;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const shotA = a[i];
    const shotB = b[i];
    if (
      shotA.id !== shotB.id ||
      shotA.position.x !== shotB.position.x ||
      shotA.position.y !== shotB.position.y ||
      shotA.direction !== shotB.direction
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Compare obstacles arrays efficiently
 */
function obstaclesEqual(a: Obstacle[] | undefined, b: Obstacle[] | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return a === b;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const obsA = a[i];
    const obsB = b[i];
    if (
      obsA.id !== obsB.id ||
      obsA.position.x !== obsB.position.x ||
      obsA.position.y !== obsB.position.y ||
      obsA.type !== obsB.type
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Compare portals arrays efficiently
 */
function portalsEqual(a: Portal[] | undefined, b: Portal[] | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return a === b;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const portalA = a[i];
    const portalB = b[i];
    if (
      portalA.id !== portalB.id ||
      portalA.position.x !== portalB.position.x ||
      portalA.position.y !== portalB.position.y ||
      portalA.pairId !== portalB.pairId
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Compare food objects efficiently
 */
function foodEqual(a: Food | null | undefined, b: Food | null | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return a === b;
  return a.position.x === b.position.x && a.position.y === b.position.y && a.type === b.type;
}

/**
 * Compare boss snake efficiently
 */
function bossSnakeEqual(
  a: import('@/types/game').BossSnake | undefined,
  b: import('@/types/game').BossSnake | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return a === b;
  if (a.direction !== b.direction) return false;
  return positionArraysEqual(a.positions, b.positions);
}

/**
 * Compare active boss efficiently
 */
function activeBossEqual(
  a: { color: string; icon?: string; name?: string } | null | undefined,
  b: { color: string; icon?: string; name?: string } | null | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return a === b;
  return a.color === b.color && a.icon === b.icon && a.name === b.name;
}

/**
 * Estimate delta size without full JSON.stringify (much faster)
 */
function estimateDeltaSize(delta: Partial<GameState>): number {
  let size = 2;
  const keys = Object.keys(delta);
  for (const key of keys) {
    const value = delta[key as keyof GameState];
    size += key.length + 2; // "key":
    if (value === null || value === undefined) {
      size += 4; // null
    } else if (typeof value === 'string') {
      size += value.length + 2; // "value"
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      size += String(value).length;
    } else if (Array.isArray(value)) {
      size += value.length * 20; // Approximate per item
    } else if (typeof value === 'object') {
      size += Object.keys(value).length * 30; // Approximate per property
    }
    size += 1; // comma
  }
  return size;
}

export interface RenderState {
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
}

/**
 * Broadcast game state to main thread and render worker
 */
export function broadcastState(
  gameState: GameState,
  previousState: Partial<GameState> | null,
  previousRenderState: RenderState | null,
  renderPort: MessagePort | null,
  isRenderDirty: boolean,
): {
  newPreviousState: Partial<GameState>;
  newPreviousRenderState: RenderState | null;
  newIsRenderDirty: boolean;
} {
  // Compute delta for Main Thread (UI Updates)
  const delta = computeDelta(previousState, gameState);
  const hasChanges = Object.keys(delta).length > 0;

  let newPreviousState = previousState;
  if (hasChanges || !previousState) {
    // Estimate delta size for metrics - approximate without full JSON.stringify
    const deltaSize = estimateDeltaSize(delta);
    updateDeltaSize(deltaSize);

    // Send delta to Main Thread
    self.postMessage({
      type: 'GAME_STATE_DELTA',
      payload: delta,
      isFullUpdate: !previousState, // First update sends everything
    });

    // Update previous state
    newPreviousState = shallowCopyState(gameState);
  }

  // Send to Render Worker (High Frequency) - only if visual state changed
  let newPreviousRenderState = previousRenderState;
  let newIsRenderDirty = isRenderDirty;

  if (renderPort) {
    const currentRenderState: RenderState = {
      snake: gameState.snake,
      bossSnake: gameState.bossSnake,
      shots: gameState.poisonShots,
      food: gameState.food,
      obstacles: gameState.obstacles,
      portals: gameState.portals,
      activeBoss: gameState.activeBoss
        ? {
            color: gameState.activeBoss.visual.color,
            icon: gameState.activeBoss.visual.icon,
            name: gameState.activeBoss.name,
          }
        : null,
      guardianFlag: gameState.guardianFlag ?? null,
      speed: gameState.gameSpeed,
      status: gameState.status,
    };

    // Check if render state changed - optimized comparisons without JSON.stringify
    const renderChanged =
      !previousRenderState ||
      !positionArraysEqual(previousRenderState.snake, currentRenderState.snake) ||
      !bossSnakeEqual(previousRenderState.bossSnake, currentRenderState.bossSnake) ||
      !poisonShotsEqual(previousRenderState.shots, currentRenderState.shots) ||
      !foodEqual(previousRenderState.food, currentRenderState.food) ||
      !obstaclesEqual(previousRenderState.obstacles, currentRenderState.obstacles) ||
      !portalsEqual(previousRenderState.portals, currentRenderState.portals) ||
      !activeBossEqual(previousRenderState.activeBoss, currentRenderState.activeBoss) ||
      !foodEqual(previousRenderState.guardianFlag, currentRenderState.guardianFlag) ||
      previousRenderState.speed !== currentRenderState.speed ||
      previousRenderState.status !== currentRenderState.status;

    if (renderChanged || isRenderDirty) {
      // Convert positions to TypedArrays for efficient transfer
      const snakeArray = positionsToTypedArray(currentRenderState.snake);
      const bossSnakeArray = currentRenderState.bossSnake
        ? positionsToTypedArray(currentRenderState.bossSnake.positions)
        : null;

      // Use transferable objects for zero-copy transfer
      const transferList: ArrayBufferLike[] = [snakeArray.buffer];
      if (bossSnakeArray) transferList.push(bossSnakeArray.buffer);

      renderPort.postMessage(
        {
          type: 'UPDATE',
          payload: {
            snake: snakeArray.buffer,
            snakeLength: currentRenderState.snake.length,
            bossSnake: bossSnakeArray ? bossSnakeArray.buffer : null,
            bossSnakeLength: currentRenderState.bossSnake?.positions.length ?? 0,
            shots: currentRenderState.shots, // Keep as regular array (less frequent)
            food: currentRenderState.food,
            obstacles: currentRenderState.obstacles,
            portals: currentRenderState.portals,
            activeBoss: currentRenderState.activeBoss,
            guardianFlag: currentRenderState.guardianFlag ?? null,
            isEating: false,
            speed: currentRenderState.speed,
            status: currentRenderState.status,
          },
        },
        transferList,
      );
      newPreviousRenderState = currentRenderState;
      newIsRenderDirty = false;
    }
  }

  return {
    newPreviousState: newPreviousState ?? previousState ?? {},
    newPreviousRenderState,
    newIsRenderDirty,
  };
}
