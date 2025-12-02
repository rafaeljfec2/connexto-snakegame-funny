import { GameConfig, Direction, Position } from "@/types/game";

export const GAME_CONFIG: GameConfig = {
  gridSize: 20,
  cellSize: 20,
  gameSpeed: 150,
  initialSnakeLength: 3,
};

export const INITIAL_DIRECTION = Direction.RIGHT;

export const INITIAL_SNAKE_POSITION: Position[] = [
  { x: 5, y: 10 },
  { x: 4, y: 10 },
  { x: 3, y: 10 },
];

export const KEYBOARD_MAP: Record<string, Direction> = {
  ArrowUp: Direction.UP,
  ArrowDown: Direction.DOWN,
  ArrowLeft: Direction.LEFT,
  ArrowRight: Direction.RIGHT,
  w: Direction.UP,
  W: Direction.UP,
  s: Direction.DOWN,
  S: Direction.DOWN,
  a: Direction.LEFT,
  A: Direction.LEFT,
  d: Direction.RIGHT,
  D: Direction.RIGHT,
};

export const STORAGE_KEYS = {
  HIGH_SCORE: "snake-game-high-score",
} as const;

// Difficulty progression settings
export const DIFFICULTY_CONFIG = {
  // Points needed to advance to next level
  pointsPerLevel: 50,
  // Base speed (in milliseconds)
  baseSpeed: 150,
  // Minimum speed (fastest the game can get)
  minSpeed: 50,
  // Speed reduction per level (how much faster it gets)
  speedReductionPerLevel: 10,
  // Initial level
  initialLevel: 1,
} as const;
