import { GameConfig, Direction, Position } from "@/types/game";

export const GAME_CONFIG: GameConfig = {
  gridSize: 40, // Increased grid size for more gameplay space
  cellSize: 12, // Optimized size for better space utilization
  gameSpeed: 120,
  initialSnakeLength: 3,
  enableObstacles: true,
  enableCombos: true,
  enableParticles: true,
  enableAchievements: true,
};

export const INITIAL_DIRECTION = Direction.RIGHT;

export const INITIAL_SNAKE_POSITION: Position[] = [
  { x: 10, y: 20 },
  { x: 9, y: 20 },
  { x: 8, y: 20 },
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
  ACHIEVEMENTS: "snake-game-achievements",
} as const;

// Combo system configuration
export const COMBO_CONFIG = {
  // Time window to maintain combo (in milliseconds)
  comboWindow: 2000, // 2 seconds
  // Minimum combo count to start multiplier
  minCombo: 2,
  // Maximum multiplier
  maxMultiplier: 5,
  // Points per combo level
  basePoints: 10,
} as const;

// Difficulty progression settings
export const DIFFICULTY_CONFIG = {
  // Points needed to advance to next level
  pointsPerLevel: 50,
  // Base speed (in milliseconds) - lower is faster
  baseSpeed: 120,
  // Minimum speed (fastest the game can get)
  minSpeed: 40,
  // Speed reduction per level (how much faster it gets)
  speedReductionPerLevel: 8,
  // Initial level
  initialLevel: 1,
} as const;
