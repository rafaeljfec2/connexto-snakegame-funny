import { Obstacle, Position, Direction, Particle } from '@/types/game';
import { getNextHeadPosition } from './gameLogic';

/**
 * Check if a poison shot collides with an obstacle
 */
export function hasObstacleCollision(
  shotPosition: Position,
  obstacles: Obstacle[],
): Obstacle | undefined {
  return obstacles.find(
    (obstacle) => obstacle.position.x === shotPosition.x && obstacle.position.y === shotPosition.y,
  );
}

/**
 * Remove an obstacle from the list
 */
export function removeObstacle(obstacles: Obstacle[], obstacleId: string): Obstacle[] {
  return obstacles.filter((obstacle) => obstacle.id !== obstacleId);
}

/**
 * Check if an obstacle can be destroyed
 */
export function canDestroyObstacle(_obstacle: Obstacle): boolean {
  return true;
}

/**
 * Check if a snake's next head position would collide with an obstacle
 */
export function wouldCollideWithObstacle(
  snakeHead: Position,
  direction: Direction,
  obstacles: Obstacle[],
  gridSize: number,
): boolean {
  const nextHeadPosition = getNextHeadPosition(snakeHead, direction, gridSize);
  return obstacles.some(
    (obstacle) =>
      obstacle.position.x === nextHeadPosition.x && obstacle.position.y === nextHeadPosition.y,
  );
}

/**
 * Handle generic obstacle destruction
 * Pure function: just updates state, effects should be handled by caller
 */
export function destroyObstacles(
  obstacles: Obstacle[],
  obstaclesToDestroy: Obstacle[],
  _particles: Particle[] = [], // Kept for signature compatibility but unused
): { remainingObstacles: Obstacle[]; particles: Particle[] } {
  let remainingObstacles = [...obstacles];

  obstaclesToDestroy.forEach((obstacle) => {
    remainingObstacles = removeObstacle(remainingObstacles, obstacle.id);
  });

  return {
    remainingObstacles,
    particles: [], // Return empty array as particles are handled by worker
  };
}
