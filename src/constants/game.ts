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
