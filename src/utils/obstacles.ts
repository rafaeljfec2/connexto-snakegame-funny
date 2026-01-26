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
    // Optimized with early returns and Set for O(1) lookups
    const obstaclePositionsSet = new Set<string>();
    const obstaclesLength = obstacles.length;
    for (let i = 0; i < obstaclesLength; i++) {
      const obs = obstacles[i];
      if (obs) {
        obstaclePositionsSet.add(`${obs.position.x},${obs.position.y}`);
      }
    }

    const snakePositionsSet = new Set<string>();
    const snakeLength = snake.length;
    for (let i = 0; i < snakeLength; i++) {
      const segment = snake[i];
      if (segment) {
        snakePositionsSet.add(`${segment.x},${segment.y}`);
      }
    }

    let isValid = true;
    const positionsLength = newObstaclePositions.length;
    for (let i = 0; i < positionsLength; i++) {
      const pos = newObstaclePositions[i];
      if (!pos) {
        isValid = false;
        break;
      }

      // Check bounds
      if (pos.x < 0 || pos.x >= gridSize || pos.y < 0 || pos.y >= gridSize) {
        isValid = false;
        break;
      }

      // Check minimum distance from ANY snake segment (not just head) - optimized loop
      let minDistanceFromSnake = Infinity;
      for (let j = 0; j < snakeLength; j++) {
        const segment = snake[j];
        if (segment) {
          const distance = Math.abs(pos.x - segment.x) + Math.abs(pos.y - segment.y);
          if (distance < minDistanceFromSnake) {
            minDistanceFromSnake = distance;
          }
        }
      }
      if (minDistanceFromSnake < OBSTACLE_CONFIG.minDistanceFromSnake) {
        isValid = false;
        break;
      }

      // Check if overlaps with existing obstacles - O(1) lookup
      const posKey = `${pos.x},${pos.y}`;
      if (obstaclePositionsSet.has(posKey)) {
        isValid = false;
        break;
      }

      // Check if overlaps with snake - O(1) lookup
      if (snakePositionsSet.has(posKey)) {
        isValid = false;
        break;
      }
    }

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

  // Limit obstacles to prevent memory issues and maintain performance
  // Keep only the most recent obstacles if we exceed the limit
  if (obstacles.length > OBSTACLE_CONFIG.maxObstacles) {
    // Keep the most recently added obstacles (slice from the end)
    return obstacles.slice(-OBSTACLE_CONFIG.maxObstacles);
  }

  return obstacles;
}

/**
 * Create a Set of obstacle positions for O(1) lookup
 * Key format: "x,y"
 */
export function createObstacleSet(obstacles: Obstacle[]): Set<string> {
  const obstacleSet = new Set<string>();
  const obstaclesLength = obstacles.length;
  for (let i = 0; i < obstaclesLength; i++) {
    const obstacle = obstacles[i];
    if (obstacle) {
      obstacleSet.add(`${obstacle.position.x},${obstacle.position.y}`);
    }
  }
  return obstacleSet;
}

/**
 * Check if head position collides with obstacles
 * Optimized to accept Set for O(1) lookup when available
 */
export function hasObstacleCollision(head: Position, obstacles: Obstacle[] | Set<string>): boolean {
  // If Set is provided, use O(1) lookup
  if (obstacles instanceof Set) {
    return obstacles.has(`${head.x},${head.y}`);
  }

  // Fallback to array search (O(n)) for backward compatibility
  const obstaclesLength = obstacles.length;
  for (let i = 0; i < obstaclesLength; i++) {
    const obstacle = obstacles[i];
    if (obstacle && obstacle.position.x === head.x && obstacle.position.y === head.y) {
      return true;
    }
  }
  return false;
}

/**
 * Filter out expired temporary obstacles - optimized with early return
 */
export function getActiveObstacles(obstacles: Obstacle[]): Obstacle[] {
  // Early return if no obstacles
  if (obstacles.length === 0) {
    return obstacles;
  }

  // Check if there are any temporary obstacles before filtering
  const hasTemporaryObstacles = obstacles.some(
    (obstacle) => obstacle.type === 'temporary' && obstacle.expiresAt !== undefined,
  );

  // If no temporary obstacles, return original array (no filtering needed)
  if (!hasTemporaryObstacles) {
    return obstacles;
  }

  // Only filter if there are temporary obstacles
  const now = Date.now();
  return obstacles.filter((obstacle) => {
    if (obstacle.type === 'temporary' && obstacle.expiresAt) {
      return now < obstacle.expiresAt; // Keep if not expired
    }
    return true; // Keep all non-temporary obstacles
  });
}
