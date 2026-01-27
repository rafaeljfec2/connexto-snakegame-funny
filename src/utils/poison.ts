import { PoisonShot, Position, Direction, Obstacle, BossSnake } from '@/types/game';
import { POISON_CONFIG } from '@/constants/game';

// Counter to ensure unique poison shot IDs
let poisonCounter = 0;

/**
 * Create a new poison shot from the snake's head position
 */
export function createPoisonShot(headPosition: Position, direction: Direction): PoisonShot {
  poisonCounter += 1;
  const now = Date.now();

  return {
    id: `poison-${now}-${poisonCounter}`,
    position: { ...headPosition },
    direction,
    spawnTime: now,
    maxDistance: POISON_CONFIG.maxDistance,
    startPosition: { ...headPosition },
    distanceTraveled: 0,
  };
}

/**
 * Get all positions between start and end position (all cells the shot will travel through)
 * Used to check for collisions in all cells the poison shot travels through
 * Since poison moves in cardinal directions only, we check each cell step by step
 */
function getPositionsBetween(start: Position, end: Position): Position[] {
  const positions: Position[] = [];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));

  if (steps === 0) {
    return [start];
  }

  // Since movement is cardinal (horizontal or vertical), check each step
  for (let i = 1; i <= steps; i++) {
    let x = start.x;
    let y = start.y;

    if (dx !== 0) {
      // Horizontal movement
      x = start.x + (dx > 0 ? i : -i);
    } else if (dy !== 0) {
      // Vertical movement
      y = start.y + (dy > 0 ? i : -i);
    }

    positions.push({ x, y });
  }

  return positions;
}

/**
 * Move a poison shot in its direction, checking for obstacles in all cells it travels through
 * Poison shot moves 5x faster than snake (snake moves 1 cell/frame, poison moves 5 cells/frame)
 * Returns the new shot position and information about any obstacle hit
 */
export function movePoisonShot(
  shot: PoisonShot,
  gridSize: number,
  obstacles: Obstacle[] = [],
): { shot: PoisonShot | null; hitObstacle: Obstacle | null } {
  // Poison moves 5 cells per frame (5x faster than snake which moves 1 cell per frame)
  const poisonSpeed = POISON_CONFIG.speedMultiplier;
  const currentPosition = shot.position;
  const targetPosition = { ...currentPosition };

  switch (shot.direction) {
    case Direction.UP:
      targetPosition.y -= poisonSpeed;
      break;
    case Direction.DOWN:
      targetPosition.y += poisonSpeed;
      break;
    case Direction.LEFT:
      targetPosition.x -= poisonSpeed;
      break;
    case Direction.RIGHT:
      targetPosition.x += poisonSpeed;
      break;
  }

  // Check if target is out of bounds
  if (
    targetPosition.x < 0 ||
    targetPosition.x >= gridSize ||
    targetPosition.y < 0 ||
    targetPosition.y >= gridSize
  ) {
    return { shot: null, hitObstacle: null }; // Remove shot if out of bounds
  }

  // Check all cells between current position and target position for obstacles
  // This ensures no obstacle is skipped when poison moves multiple cells per frame
  // The function returns all intermediate positions including the target position
  const cellsToCheck = getPositionsBetween(currentPosition, targetPosition);

  // Check each cell in the path for obstacles (in order)
  for (const cell of cellsToCheck) {
    // Check bounds for each cell
    if (cell.x < 0 || cell.x >= gridSize || cell.y < 0 || cell.y >= gridSize) {
      return { shot: null, hitObstacle: null };
    }

    // Check for obstacle collision at this cell
    const hitObstacle = obstacles.find(
      (obstacle) => obstacle.position.x === cell.x && obstacle.position.y === cell.y,
    );

    if (hitObstacle) {
      // Obstacle hit - remove the shot (return null) and return the hit obstacle
      return {
        shot: null,
        hitObstacle,
      };
    }
  }

  // No obstacle found in path - move to target position
  const distanceTraveled =
    Math.abs(targetPosition.x - shot.startPosition.x) +
    Math.abs(targetPosition.y - shot.startPosition.y);

  return {
    shot: {
      ...shot,
      position: targetPosition,
      distanceTraveled,
    },
    hitObstacle: null,
  };
}

/**
 * Update all poison shots, removing ones that are out of bounds
 * Poison travels across entire field until it hits the edge
 * Returns updated shots and information about any obstacles hit
 * Optimized to limit processing when there are many shots
 */
export function updatePoisonShots(
  shots: PoisonShot[],
  gridSize: number,
  obstacles: Obstacle[] = [],
): { shots: PoisonShot[]; hitObstacles: Obstacle[] } {
  // Early return if no shots
  if (shots.length === 0) {
    return { shots: [], hitObstacles: [] };
  }

  const hitObstacles: Obstacle[] = [];
  const updatedShots: PoisonShot[] = [];

  // Process shots - limit to first 100 for performance (shouldn't normally have this many)
  const shotsToProcess = shots.slice(0, 100);

  // Use for-of loop for iteration
  for (const shot of shotsToProcess) {
    const result = movePoisonShot(shot, gridSize, obstacles);
    if (result.hitObstacle) {
      // Shot hit an obstacle - remove it (don't add to updatedShots) and track the hit obstacle
      hitObstacles.push(result.hitObstacle);
    } else if (result.shot) {
      // Shot didn't hit obstacle and is still valid - keep it
      updatedShots.push(result.shot);
    }
  }

  return { shots: updatedShots, hitObstacles };
}

/**
 * Check if a poison shot collides with an obstacle
 */
export function hasObstacleCollision(shot: PoisonShot, obstacles: Obstacle[]): boolean {
  return obstacles.some(
    (obstacle) =>
      obstacle.position.x === shot.position.x && obstacle.position.y === shot.position.y,
  );
}

/**
 * Check if a poison shot collides with the boss snake head
 */
export function hasBossHeadCollision(shot: PoisonShot, bossSnake: BossSnake): boolean {
  if (!bossSnake || bossSnake.positions.length === 0) {
    return false;
  }

  const bossHead = bossSnake.positions[0];
  return bossHead && bossHead.x === shot.position.x && bossHead.y === shot.position.y;
}

/**
 * Check if a poison shot collides with the boss snake body
 */
export function hasBossBodyCollision(shot: PoisonShot, bossSnake: BossSnake): boolean {
  if (!bossSnake || bossSnake.positions.length <= 1) {
    return false;
  }

  return bossSnake.positions
    .slice(1)
    .some((segment) => segment.x === shot.position.x && segment.y === shot.position.y);
}

/**
 * Get the obstacle that was hit by a poison shot (if any)
 */
export function getHitObstacle(shot: PoisonShot, obstacles: Obstacle[]): Obstacle | null {
  return (
    obstacles.find(
      (obstacle) =>
        obstacle.position.x === shot.position.x && obstacle.position.y === shot.position.y,
    ) ?? null
  );
}
