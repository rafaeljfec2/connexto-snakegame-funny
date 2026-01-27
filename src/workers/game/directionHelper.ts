import { Direction, Position, ActivePowerUp } from '@/types/game';
import {
  isValidDirectionChange,
  getOppositeDirection,
  wouldCauseCollision,
} from '@/utils/gameLogic';
import { hasReverseControls } from '@/utils/powerUps';

/**
 * Resolves the next direction of the snake based on user input and game state.
 */
export function resolveDirection(
  currentDirection: Direction,
  nextDirectionBuffer: Direction | null,
  activePowerUps: ActivePowerUp[],
  snake: Position[],
  gridSize: number,
): Direction {
  if (!nextDirectionBuffer) return currentDirection;

  const reverseControls = hasReverseControls(activePowerUps);
  let nextDir = nextDirectionBuffer;

  if (reverseControls && nextDir !== currentDirection) {
    nextDir = getOppositeDirection(nextDir);
  }

  if (
    isValidDirectionChange(currentDirection, nextDir) &&
    !wouldCauseCollision(snake, nextDir, gridSize)
  ) {
    return nextDir;
  }
  return currentDirection;
}
