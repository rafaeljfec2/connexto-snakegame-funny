import { GameState, GameStatus } from '@/types/game';
import {
  computeDelta,
  shallowCopyState,
  positionArraysEqual,
  positionsToTypedArray,
} from './gameDelta';
import { updateDeltaSize } from '@/utils/performanceMetrics';

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
    // Estimate delta size for metrics
    const deltaSize = JSON.stringify(delta).length;
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

    // Check if render state changed
    const renderChanged =
      !previousRenderState ||
      !positionArraysEqual(previousRenderState.snake, currentRenderState.snake) ||
      JSON.stringify(previousRenderState.bossSnake) !==
        JSON.stringify(currentRenderState.bossSnake) ||
      JSON.stringify(previousRenderState.shots) !== JSON.stringify(currentRenderState.shots) ||
      JSON.stringify(previousRenderState.food) !== JSON.stringify(currentRenderState.food) ||
      JSON.stringify(previousRenderState.obstacles) !==
        JSON.stringify(currentRenderState.obstacles) ||
      JSON.stringify(previousRenderState.portals) !== JSON.stringify(currentRenderState.portals) ||
      JSON.stringify(previousRenderState.activeBoss) !==
        JSON.stringify(currentRenderState.activeBoss) ||
      JSON.stringify(previousRenderState.guardianFlag) !==
        JSON.stringify(currentRenderState.guardianFlag) ||
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
