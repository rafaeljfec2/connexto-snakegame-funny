import { Position, Direction, Food, FoodType, Obstacle } from "@/types/game";
import { POWER_UP_CONFIG } from "@/constants/powerUps";
import { applyFoodTimer } from "@/utils/foodTimer";

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
  newDirection: Direction
): boolean {
  return newDirection !== getOppositeDirection(currentDirection);
}

export function getNextHeadPosition(
  head: Position,
  direction: Direction,
  gridSize: number
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
  return (
    position.x >= 0 &&
    position.x < gridSize &&
    position.y >= 0 &&
    position.y < gridSize
  );
}

function generateRandomPosition(
  snake: Position[],
  gridSize: number,
  obstacles: Obstacle[] = []
): Position {
  const availablePositions: Position[] = [];

  // Generate all valid positions that are not occupied by snake or obstacles
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      const position: Position = { x, y };
      const isOccupiedBySnake = snake.some(
        (segment) => segment.x === position.x && segment.y === position.y
      );
      
      const isOccupiedByObstacle = obstacles.some(
        (obstacle) => obstacle.position.x === position.x && obstacle.position.y === position.y
      );

      if (!isOccupiedBySnake && !isOccupiedByObstacle) {
        availablePositions.push(position);
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
    const fallbackX = Math.max(
      0,
      Math.min((head.x + 1) % gridSize, gridSize - 1)
    );
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

function getRandomFoodType(): FoodType {
  const random = Math.random();
  const jokerChance = POWER_UP_CONFIG.jokerSpawnChance ?? 0.05;
  const negativeChance = POWER_UP_CONFIG.negativeSpawnChance;
  const positiveChance = POWER_UP_CONFIG.spawnChance;

  // Check for joker first (very rare, special)
  if (random < jokerChance) {
    return FoodType.JOKER;
  }

  // Check for negative power-up
  if (random < jokerChance + negativeChance) {
    const negativeTypes = [
      FoodType.POISON,
      FoodType.REVERSE_CONTROLS,
      FoodType.SLOW_DOWN,
    ];
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
    ];
    const randomIndex = Math.floor(Math.random() * powerUpTypes.length);
    return powerUpTypes[randomIndex] ?? FoodType.NORMAL;
  }

  return FoodType.NORMAL;
}

export function generateRandomFood(
  snake: Position[],
  gridSize: number,
  obstacles: Obstacle[] = []
): Food {
  const position = generateRandomPosition(snake, gridSize, obstacles);
  const type = getRandomFoodType();

  const food: Food = {
    position,
    type,
    spawnTime: Date.now(),
    duration: undefined,
  };

  // Apply timer configuration if enabled
  return applyFoodTimer(food);
}

export function moveSnake(
  snake: Position[],
  direction: Direction,
  gridSize: number,
  grow: boolean = false
): Position[] {
  const head = snake[0];
  const newHead = getNextHeadPosition(head, direction, gridSize);

  if (grow) {
    return [newHead, ...snake];
  }

  const newSnake = [newHead, ...snake.slice(0, -1)];
  return newSnake;
}

export function getHighScore(): number {
  const stored = localStorage.getItem("snake-game-high-score");
  if (stored === null) {
    return 0;
  }
  const parsed = Number.parseInt(stored, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function saveHighScore(score: number): void {
  const currentHighScore = getHighScore();
  if (score > currentHighScore) {
    localStorage.setItem("snake-game-high-score", score.toString());
  }
}
