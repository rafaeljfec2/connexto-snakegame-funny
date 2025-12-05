import { Obstacle, Position } from '@/types/game';
import { OBSTACLE_PATTERNS, OBSTACLE_CONFIG } from '@/constants/obstacles';
import { GAME_CONFIG } from '@/constants/game';

export function generateObstacles(
  level: number,
  snake: Position[],
  existingObstacles: Obstacle[],
  gridSize: number,
  obstaclesEnabled?: boolean,
  obstaclesFrequency?: number,
): Obstacle[] {
  // Check phase configuration first
  if (obstaclesEnabled === false) {
    return [];
  }

  if (!GAME_CONFIG.enableObstacles || level < 1) {
    return [];
  }

  const availablePatterns = OBSTACLE_PATTERNS.filter((pattern) => level >= pattern.levelThreshold);

  if (availablePatterns.length === 0) {
    return [];
  }

  const obstacles: Obstacle[] = [...existingObstacles];

  // Use phase-specific frequency if provided, otherwise use default
  const spawnChance = obstaclesFrequency ?? OBSTACLE_CONFIG.spawnChance;

  // Check if we should spawn new obstacles
  if (Math.random() > spawnChance) {
    return obstacles;
  }

  // Select a random pattern
  const pattern = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];

  // Try to place the pattern randomly on the grid
  const attempts = 10;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const offsetX = Math.floor(Math.random() * (gridSize - 10));
    const offsetY = Math.floor(Math.random() * (gridSize - 10));

    const newObstaclePositions: Position[] = pattern.positions.map((pos) => ({
      x: pos.x + offsetX,
      y: pos.y + offsetY,
    }));

    // Check if positions are valid (not on snake, not on existing obstacles)
    const isValid = newObstaclePositions.every((pos) => {
      if (pos.x < 0 || pos.x >= gridSize || pos.y < 0 || pos.y >= gridSize) {
        return false;
      }

      // Check minimum distance from ANY snake segment (not just head)
      const minDistanceFromSnake = snake.reduce((minDist, segment) => {
        const distance = Math.abs(pos.x - segment.x) + Math.abs(pos.y - segment.y);
        return Math.min(minDist, distance);
      }, Infinity);
      if (minDistanceFromSnake < OBSTACLE_CONFIG.minDistanceFromSnake) {
        return false;
      }

      // Check if overlaps with existing obstacles
      const overlaps = obstacles.some(
        (obs) => obs.position.x === pos.x && obs.position.y === pos.y,
      );
      if (overlaps) {
        return false;
      }

      // Check if overlaps with snake
      const onSnake = snake.some((segment) => segment.x === pos.x && segment.y === pos.y);
      return !onSnake;
    });

    if (isValid) {
      // Add obstacles for this pattern
      newObstaclePositions.forEach((pos, index) => {
        obstacles.push({
          id: `obstacle-${Date.now()}-${index}`,
          position: pos,
          type: 'static',
        });
      });

      break;
    }
  }

  // Don't limit obstacles - let them accumulate permanently on screen
  return obstacles;
}

export function hasObstacleCollision(head: Position, obstacles: Obstacle[]): boolean {
  return obstacles.some(
    (obstacle) => obstacle.position.x === head.x && obstacle.position.y === head.y,
  );
}

/**
 * Filter out expired temporary obstacles
 */
export function getActiveObstacles(obstacles: Obstacle[]): Obstacle[] {
  const now = Date.now();
  return obstacles.filter((obstacle) => {
    if (obstacle.type === 'temporary' && obstacle.expiresAt) {
      return now < obstacle.expiresAt; // Keep if not expired
    }
    return true; // Keep all non-temporary obstacles
  });
}
