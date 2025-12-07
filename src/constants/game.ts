import { GameConfig, Direction, Position } from '@/types/game';

export const GAME_CONFIG: GameConfig = {
  gridSize: 40, // Increased grid size for more gameplay space
  cellSize: 12, // Optimized size for better space utilization
  gameSpeed: 120,
  initialSnakeLength: 3,
  enableObstacles: true,
  enableCombos: true,
  enableParticles: true,
  enableAchievements: true,
  enableLengthMultiplier: true, // Enable length-based score multiplier
};

// Poison shot configuration
export const POISON_CONFIG = {
  speedMultiplier: 5, // Poison shot moves 5x faster than snake (snake moves 1 cell/frame, poison moves 5 cells/frame)
  maxDistance: 60, // Maximum cells the poison can travel - enough to cross entire grid diagonally (gridSize: 40)
  cooldown: 0, // No cooldown - shots fire as fast as button is pressed
  fireInterval: 150, // Interval between shots when button is held (in milliseconds)
  maxShotsSimultaneous: 50, // Maximum number of shots that can exist at once (performance limit)
  canDestroyObstacles: true, // Can destroy obstacles on contact
  canDefeatBoss: true, // Can defeat boss on contact
} as const;

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
  HIGH_SCORE: 'snake-game-high-score',
  ACHIEVEMENTS: 'snake-game-achievements',
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
  baseSpeed: 120, // Initial speed at level 1
  // Minimum speed (fastest the game can get)
  minSpeed: 40, // Minimum speed limit
  // Speed reduction per level (how much faster it gets)
  speedReductionPerLevel: 8,
  // Initial level
  initialLevel: 1,
} as const;

/**
 * Check if device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.innerWidth <= 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
}

// Performance optimization limits
export const PERFORMANCE_CONFIG = {
  // Maximum number of particles allowed at once (performance optimization)
  // Mobile: 30 for better performance, Desktop: 100
  getMaxParticles: () => (isMobileDevice() ? 30 : 100),
  // Maximum number of portals allowed at once (performance optimization)
  maxPortals: 6, // 3 pairs
} as const;

// Control responsiveness configuration
export const CONTROL_CONFIG = {
  // Minimum time between direction changes (in milliseconds) - reduces sensitivity
  directionChangeCooldown: 50, // 50ms cooldown between direction changes - reduces sensitivity slightly
  // Time to hold direction key before activating speed boost (in milliseconds)
  // Mobile gets faster activation (100ms) for better responsiveness
  speedBoostActivationDelay: typeof window !== 'undefined' && window.innerWidth <= 768 ? 100 : 200,
} as const;
