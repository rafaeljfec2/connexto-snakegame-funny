import { PoisonShot, Position, Direction, Obstacle, BossSnake } from '@/types/game';
import { GAME_CONFIG, POISON_CONFIG } from '@/constants/game';

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
 * Move a poison shot in its direction
 * Poison shot moves 5x faster than snake (snake moves 1 cell/frame, poison moves 5 cells/frame)
 */
export function movePoisonShot(shot: PoisonShot, gridSize: number): PoisonShot | null {
  // Poison moves 5 cells per frame (5x faster than snake which moves 1 cell per frame)
  const poisonSpeed = POISON_CONFIG.speedMultiplier;
  const newPosition = { ...shot.position };

  switch (shot.direction) {
    case Direction.UP:
      newPosition.y -= poisonSpeed;
      break;
    case Direction.DOWN:
      newPosition.y += poisonSpeed;
      break;
    case Direction.LEFT:
      newPosition.x -= poisonSpeed;
      break;
    case Direction.RIGHT:
      newPosition.x += poisonSpeed;
      break;
  }

  // Check if out of bounds - poison travels until it hits the edge of the field
  if (
    newPosition.x < 0 ||
    newPosition.x >= gridSize ||
    newPosition.y < 0 ||
    newPosition.y >= gridSize
  ) {
    return null; // Remove shot if out of bounds
  }

  // Poison travels across entire field - no distance limit, only stops at boundaries
  // Calculate distance traveled for tracking (but no limit is enforced)
  const distanceTraveled =
    Math.abs(newPosition.x - shot.startPosition.x) + Math.abs(newPosition.y - shot.startPosition.y);

  return {
    ...shot,
    position: newPosition,
    distanceTraveled,
  };
}

/**
 * Update all poison shots, removing ones that are out of bounds
 * Poison travels across entire field until it hits the edge
 */
export function updatePoisonShots(shots: PoisonShot[], gridSize: number): PoisonShot[] {
  return shots
    .map((shot) => movePoisonShot(shot, gridSize))
    .filter((shot): shot is PoisonShot => shot !== null);
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
