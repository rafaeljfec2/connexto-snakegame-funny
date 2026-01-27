import { Obstacle, Position } from '@/types/game';
import { OBSTACLE_PATTERNS, OBSTACLE_CONFIG } from '@/constants/obstacles';
import { GAME_CONFIG } from '@/constants/game';

/**
 * Create a Set of position keys from an array of positions
 */
function createPositionSetFromArray(positions: Position[]): Set<string> {
  const posSet = new Set<string>();
  for (const pos of positions) {
    posSet.add(`${pos.x},${pos.y}`);
  }
  return posSet;
}

/**
 * Create a Set of position keys from obstacles
 */
function createObstaclePositionSet(obstacles: Obstacle[]): Set<string> {
  const posSet = new Set<string>();
  for (const obs of obstacles) {
    posSet.add(`${obs.position.x},${obs.position.y}`);
  }
  return posSet;
}

/**
 * Check if position is within grid bounds
 */
function isInBounds(pos: Position, gridSize: number): boolean {
  return pos.x >= 0 && pos.x < gridSize && pos.y >= 0 && pos.y < gridSize;
}

/**
 * Calculate minimum Manhattan distance from position to any snake segment
 */
function getMinDistanceFromSnake(pos: Position, snake: Position[]): number {
  let minDistance = Infinity;
  for (const segment of snake) {
    const distance = Math.abs(pos.x - segment.x) + Math.abs(pos.y - segment.y);
    if (distance < minDistance) {
      minDistance = distance;
    }
  }
  return minDistance;
}

/**
 * Check if a single position is valid for obstacle placement
 */
function isValidPosition(
  pos: Position,
  gridSize: number,
  snake: Position[],
  obstacleSet: Set<string>,
  snakeSet: Set<string>,
): boolean {
  if (!isInBounds(pos, gridSize)) return false;
  if (getMinDistanceFromSnake(pos, snake) < OBSTACLE_CONFIG.minDistanceFromSnake) return false;

  const posKey = `${pos.x},${pos.y}`;
  if (obstacleSet.has(posKey)) return false;
  if (snakeSet.has(posKey)) return false;

  return true;
}

/**
 * Check if all positions are valid for obstacle placement
 */
function areAllPositionsValid(
  positions: Position[],
  gridSize: number,
  snake: Position[],
  obstacleSet: Set<string>,
  snakeSet: Set<string>,
): boolean {
  for (const pos of positions) {
    if (!isValidPosition(pos, gridSize, snake, obstacleSet, snakeSet)) {
      return false;
    }
  }
  return true;
}

/**
 * Create obstacles from positions
 */
function createObstaclesFromPositions(positions: Position[]): Obstacle[] {
  const timestamp = Date.now();
  return positions.map((pos, index) => ({
    id: `obstacle-${timestamp}-${index}`,
    position: pos,
    type: 'static' as const,
  }));
}

/**
 * Apply offset to pattern positions
 */
function applyOffset(positions: Position[], offsetX: number, offsetY: number): Position[] {
  return positions.map((pos) => ({ x: pos.x + offsetX, y: pos.y + offsetY }));
}

/**
 * Try to place a pattern on the grid
 */
function tryPlacePattern(
  pattern: { positions: Position[] },
  obstacles: Obstacle[],
  snake: Position[],
  gridSize: number,
  maxAttempts: number,
): Obstacle[] | null {
  const obstacleSet = createObstaclePositionSet(obstacles);
  const snakeSet = createPositionSetFromArray(snake);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const offsetX = Math.floor(Math.random() * (gridSize - 10));
    const offsetY = Math.floor(Math.random() * (gridSize - 10));
    const positions = applyOffset(pattern.positions, offsetX, offsetY);

    if (areAllPositionsValid(positions, gridSize, snake, obstacleSet, snakeSet)) {
      return createObstaclesFromPositions(positions);
    }
  }

  return null;
}

/**
 * Check if obstacles should be generated based on configuration
 */
function shouldGenerateObstacles(level: number, obstaclesEnabled?: boolean): boolean {
  if (obstaclesEnabled === false) return false;
  if (!GAME_CONFIG.enableObstacles) return false;
  if (level < 1) return false;
  return true;
}

/**
 * Limit obstacles array to max size
 */
function limitObstacles(obstacles: Obstacle[]): Obstacle[] {
  if (obstacles.length > OBSTACLE_CONFIG.maxObstacles) {
    return obstacles.slice(-OBSTACLE_CONFIG.maxObstacles);
  }
  return obstacles;
}

export function generateObstacles(
  level: number,
  snake: Position[],
  existingObstacles: Obstacle[],
  gridSize: number,
  obstaclesEnabled?: boolean,
  obstaclesFrequency?: number,
): Obstacle[] {
  if (!shouldGenerateObstacles(level, obstaclesEnabled)) return [];

  const availablePatterns = OBSTACLE_PATTERNS.filter((pattern) => level >= pattern.levelThreshold);
  if (availablePatterns.length === 0) return [];

  const spawnChance = obstaclesFrequency ?? OBSTACLE_CONFIG.spawnChance;
  if (Math.random() > spawnChance) return [...existingObstacles];

  const pattern = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
  const newObstacles = tryPlacePattern(pattern, existingObstacles, snake, gridSize, 10);

  if (newObstacles) {
    return limitObstacles([...existingObstacles, ...newObstacles]);
  }

  return [...existingObstacles];
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
