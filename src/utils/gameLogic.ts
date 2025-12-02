import { Position, Direction } from "@/types/game";

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
  if (snake.length < 4) {
    return false;
  }

  const head = snake[0];
  return snake
    .slice(1)
    .some((segment) => segment.x === head.x && segment.y === head.y);
}

export function hasFoodCollision(head: Position, food: Position): boolean {
  return head.x === food.x && head.y === food.y;
}

export function isValidPosition(position: Position, gridSize: number): boolean {
  return (
    position.x >= 0 &&
    position.x < gridSize &&
    position.y >= 0 &&
    position.y < gridSize
  );
}

export function generateRandomFood(
  snake: Position[],
  gridSize: number
): Position {
  const availablePositions: Position[] = [];

  // Generate all valid positions that are not occupied by snake
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      const position: Position = { x, y };
      const isOccupied = snake.some(
        (segment) => segment.x === position.x && segment.y === position.y
      );

      if (!isOccupied) {
        availablePositions.push(position);
      }
    }
  }

  // If there are no available positions (snake fills entire grid), return a default position
  if (availablePositions.length === 0) {
    return { x: 0, y: 0 };
  }

  // Randomly select from available positions
  const randomIndex = Math.floor(Math.random() * availablePositions.length);
  const food = availablePositions[randomIndex];

  // Ensure the food is within valid bounds
  return {
    x: Math.max(0, Math.min(food.x, gridSize - 1)),
    y: Math.max(0, Math.min(food.y, gridSize - 1)),
  };
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
