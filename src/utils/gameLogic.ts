import { Position, Direction, Food, FoodType, Obstacle } from '@/types/game';
import { POWER_UP_CONFIG } from '@/constants/powerUps';
import { applyFoodTimer } from '@/utils/foodTimer';

export function getOppositeDirection(direction: Direction): Direction {
  const opposites: Record<Direction, Direction> = {
    [Direction.UP]: Direction.DOWN,
    [Direction.DOWN]: Direction.UP,
    [Direction.LEFT]: Direction.RIGHT,
    [Direction.RIGHT]: Direction.LEFT,
  };
  return opposites[direction];
}

export function isValidDirectionChange(
  currentDirection: Direction,
  newDirection: Direction,
): boolean {
  // Cannot move in opposite direction
  if (newDirection === getOppositeDirection(currentDirection)) {
    return false;
  }
  return true;
}

export function getNextHeadPosition(
  head: Position,
  direction: Direction,
  gridSize: number,
): Position {
  const nextPosition = { ...head };

  switch (direction) {
    case Direction.UP:
      nextPosition.y = head.y > 0 ? head.y - 1 : gridSize - 1;
      break;
    case Direction.DOWN:
      nextPosition.y = head.y < gridSize - 1 ? head.y + 1 : 0;
      break;
    case Direction.LEFT:
      nextPosition.x = head.x > 0 ? head.x - 1 : gridSize - 1;
      break;
    case Direction.RIGHT:
      nextPosition.x = head.x < gridSize - 1 ? head.x + 1 : 0;
      break;
  }

  return nextPosition;
}

/**
 * Check if a direction change would cause immediate collision
 * Simulates where each body segment will be after movement to accurately check collisions
 * Allows rapid direction changes while preventing self-collision
 */
export function wouldCauseCollision(
  snake: Position[],
  newDirection: Direction,
  gridSize: number,
): boolean {
  // For very short snakes, always allow direction changes
  if (snake.length < 3) {
    return false;
  }

  const head = snake[0];
  if (!head) {
    return false;
  }

  // Calculate where the head would be after moving in new direction
  const nextHeadPosition = getNextHeadPosition(head, newDirection, gridSize);

  // Simulate where each body segment will be after the snake moves:
  // - newSnake[0] = nextHeadPosition (new head)
  // - newSnake[1] = snake[0] (old head becomes segment 1)
  // - newSnake[2] = snake[1] (segment 1 becomes segment 2)
  // - newSnake[3] = snake[2] (segment 2 becomes segment 3)
  // - etc.
  //
  // We need to check if nextHeadPosition would collide with any future body segment position.
  // Skip the first few segments to allow rapid direction changes:
  // - Skip segment 1 (will be at old head position, safe for 90° turns)
  // - Skip segment 2 (for short snakes) or 2-3 (for long snakes) to allow rapid sequential changes

  const skipSegments = snake.length <= 5 ? 2 : 3;

  // Check if nextHeadPosition would collide with where body segments will be after movement
  // After movement, segment at index i will be at snake[i-1] (segment moves forward)
  // So we check if nextHeadPosition == snake[i-1] for i >= skipSegments
  for (let i = skipSegments; i < snake.length; i++) {
    // After movement, body segment at index i will be at snake[i-1]
    const futureSegmentPosition = snake[i - 1];

    if (
      futureSegmentPosition &&
      futureSegmentPosition.x === nextHeadPosition.x &&
      futureSegmentPosition.y === nextHeadPosition.y
    ) {
      return true; // Collision detected
    }
  }

  return false;
}

/**
 * Check if direction change is safe (won't cause immediate collision)
 */
export function isSafeDirectionChange(
  snake: Position[],
  currentDirection: Direction,
  newDirection: Direction,
  gridSize: number,
): boolean {
  // Basic validation - cannot move opposite
  if (!isValidDirectionChange(currentDirection, newDirection)) {
    return false;
  }

  // If same direction, it's safe
  if (currentDirection === newDirection) {
    return true;
  }

  // For very short snakes, always allow direction changes (except opposite)
  if (snake.length < 3) {
    return true;
  }

  // Check if new direction would cause collision with any body segment
  // wouldCauseCollision skips the first few segments (2-3) behind the head to allow rapid direction changes
  // but checks all other segments to prevent self-collision with distant body parts
  return !wouldCauseCollision(snake, newDirection, gridSize);
}

export function hasSelfCollision(snake: Position[]): boolean {
  // Need at least 4 segments to have self-collision (head + 3 body segments)
  if (snake.length < 4) {
    return false;
  }

  const head = snake[0];

  // Check if head collides with any body segment
  // Skip the first 3 segments (head at index 0, and first 2 body segments at indices 1 and 2)
  // This prevents false positives when snake makes tight turns or quick direction changes
  // In a normal turn, the head and the first 1-2 body segments can temporarily be close
  // without being a real collision
  for (let i = 3; i < snake.length; i++) {
    if (snake[i].x === head.x && snake[i].y === head.y) {
      return true;
    }
  }

  return false;
}

export function hasFoodCollision(head: Position, food: Food): boolean {
  return head.x === food.position.x && head.y === food.position.y;
}

export function isValidPosition(position: Position, gridSize: number): boolean {
  return position.x >= 0 && position.x < gridSize && position.y >= 0 && position.y < gridSize;
}

function generateRandomPosition(
  snake: Position[],
  gridSize: number,
  obstacles: Obstacle[] = [],
): Position {
  // Create Sets for O(1) lookup instead of O(n) some() - major performance improvement
  const snakeSet = new Set<string>();
  const snakeLength = snake.length;
  for (let i = 0; i < snakeLength; i++) {
    const segment = snake[i];
    if (segment) {
      snakeSet.add(`${segment.x},${segment.y}`);
    }
  }

  const obstacleSet = new Set<string>();
  const obstaclesLength = obstacles.length;
  for (let i = 0; i < obstaclesLength; i++) {
    const obstacle = obstacles[i];
    if (obstacle) {
      obstacleSet.add(`${obstacle.position.x},${obstacle.position.y}`);
    }
  }

  const availablePositions: Position[] = [];

  // Generate all valid positions that are not occupied by snake or obstacles
  // Using O(1) Set lookup instead of O(n) array search
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      const key = `${x},${y}`;
      if (!snakeSet.has(key) && !obstacleSet.has(key)) {
        availablePositions.push({ x, y });
      }
    }
  }

  // If there are no available positions (snake fills entire grid),
  // try to find any position not occupied by snake head
  if (availablePositions.length === 0) {
    // Fallback: return a position near the head if possible, ensuring it's within bounds
    const head = snake[0] ?? {
      x: Math.floor(gridSize / 2),
      y: Math.floor(gridSize / 2),
    };
    const fallbackX = Math.max(0, Math.min((head.x + 1) % gridSize, gridSize - 1));
    const fallbackY = Math.max(0, Math.min(head.y, gridSize - 1));
    return {
      x: fallbackX,
      y: fallbackY,
    };
  }

  // Randomly select from available positions
  const randomIndex = Math.floor(Math.random() * availablePositions.length);
  const food = availablePositions[randomIndex] ?? { x: 0, y: 0 };

  // Double-check bounds (ensure it's always within grid limits)
  const finalPosition = {
    x: Math.max(0, Math.min(food.x, gridSize - 1)),
    y: Math.max(0, Math.min(food.y, gridSize - 1)),
  };

  return finalPosition;
}

function getRandomFoodType(powerUpFrequency?: number): FoodType {
  const random = Math.random();
  const jokerChance = POWER_UP_CONFIG.jokerSpawnChance ?? 0.05;
  const negativeChance = POWER_UP_CONFIG.negativeSpawnChance;
  // Use phase-specific frequency if provided, otherwise use default
  const positiveChance = powerUpFrequency ?? POWER_UP_CONFIG.spawnChance;

  // Check for joker first (very rare, special)
  if (random < jokerChance) {
    return FoodType.JOKER;
  }

  // Check for negative power-up
  if (random < jokerChance + negativeChance) {
    const negativeTypes = [FoodType.POISON, FoodType.REVERSE_CONTROLS, FoodType.SLOW_DOWN];
    const randomIndex = Math.floor(Math.random() * negativeTypes.length);
    return negativeTypes[randomIndex] ?? FoodType.NORMAL;
  }

  // Check for positive power-up
  if (random < jokerChance + negativeChance + positiveChance) {
    // Randomly select a positive power-up type
    const powerUpTypes = [
      FoodType.SPEED_BOOST,
      FoodType.BONUS_POINTS,
      FoodType.EXTRA_GROWTH,
      FoodType.PHASE_THROUGH,
      FoodType.EXTRA_LIFE,
      FoodType.PORTAL,
    ];
    const randomIndex = Math.floor(Math.random() * powerUpTypes.length);
    return powerUpTypes[randomIndex] ?? FoodType.NORMAL;
  }

  return FoodType.NORMAL;
}

export function generateRandomFood(
  snake: Position[],
  gridSize: number,
  obstacles: Obstacle[] = [],
  powerUpFrequency?: number,
  timedFoodFrequency?: number,
  forcedType?: FoodType,
): Food {
  const position = generateRandomPosition(snake, gridSize, obstacles);
  const type = forcedType ?? getRandomFoodType(powerUpFrequency);

  const food: Food = {
    position,
    type,
    spawnTime: Date.now(),
    duration: undefined,
  };

  // Apply timer configuration based on phase settings
  if (timedFoodFrequency !== undefined && timedFoodFrequency > 0) {
    // Phase-specific timed food frequency
    const shouldHaveTimer = Math.random() < timedFoodFrequency;
    if (shouldHaveTimer) {
      return applyFoodTimer(food);
    }
    // No timer for this food based on phase config
    return food;
  }

  // Apply default timer configuration
  return applyFoodTimer(food);
}

export function moveSnake(
  snake: Position[],
  direction: Direction,
  gridSize: number,
  grow: boolean = false,
): Position[] {
  const head = snake[0];
  const newHead = getNextHeadPosition(head, direction, gridSize);
  const snakeLength = snake.length;

  // Optimized: Pre-allocate array and use for loop instead of spread operator
  // This maintains immutability (new array) while being much faster
  if (grow) {
    const newSnake: Position[] = new Array(snakeLength + 1);
    newSnake[0] = newHead;
    for (let i = 0; i < snakeLength; i++) {
      newSnake[i + 1] = snake[i]!;
    }
    return newSnake;
  }

  // Pre-allocate array with exact size (no reallocation during loop)
  const newSnake: Position[] = new Array(snakeLength);
  newSnake[0] = newHead;
  // Copy all but last element (snake.length - 1 elements)
  for (let i = 0; i < snakeLength - 1; i++) {
    newSnake[i + 1] = snake[i]!;
  }
  return newSnake;
}

export function getHighScore(): number {
  const stored = localStorage.getItem('snake-game-high-score');
  if (stored === null) {
    return 0;
  }
  const parsed = Number.parseInt(stored, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function saveHighScore(score: number): void {
  const currentHighScore = getHighScore();
  if (score > currentHighScore) {
    localStorage.setItem('snake-game-high-score', score.toString());
  }
}
