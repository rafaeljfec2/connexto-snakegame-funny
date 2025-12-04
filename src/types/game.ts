export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  DYING = 'DYING', // Snake is dying, waiting to consume life
  GAME_OVER = 'GAME_OVER',
}

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export interface Position {
  x: number;
  y: number;
}

export interface BossSnake {
  positions: Position[];
  direction: Direction;
  nextDirection: Direction;
  initialLength: number;
}

export enum FoodType {
  NORMAL = 'NORMAL',
  SPEED_BOOST = 'SPEED_BOOST',
  BONUS_POINTS = 'BONUS_POINTS',
  EXTRA_GROWTH = 'EXTRA_GROWTH',
  PHASE_THROUGH = 'PHASE_THROUGH',
  JOKER = 'JOKER',
  EXTRA_LIFE = 'EXTRA_LIFE',
  PORTAL = 'PORTAL',
  // Negative power-ups (debuffs)
  POISON = 'POISON',
  REVERSE_CONTROLS = 'REVERSE_CONTROLS',
  SLOW_DOWN = 'SLOW_DOWN',
}

export interface Food {
  position: Position;
  type: FoodType;
  spawnTime?: number; // Timestamp when food was spawned
  duration?: number; // Duration in milliseconds before food expires (undefined = no timer)
}

export interface ActivePowerUp {
  type: FoodType;
  duration: number; // in milliseconds
  startTime: number;
}

export interface Obstacle {
  position: Position;
  type: 'static' | 'moving' | 'portal';
  id: string;
}

export interface Portal {
  id: string;
  position: Position;
  pairId: string; // ID to connect portals in pairs
  spawnTime: number; // Timestamp when portal was created
  duration: number; // Duration in milliseconds before portal expires
}

export interface ComboState {
  count: number;
  multiplier: number;
  lastFoodTime: number;
}

export interface Particle {
  id: string;
  position: Position;
  color: string;
  lifetime: number;
  startTime: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface GameState {
  snake: Position[];
  food: Food;
  direction: Direction;
  nextDirection: Direction;
  status: GameStatus;
  score: number;
  highScore: number;
  level: number;
  gameSpeed: number;
  activePowerUps: ActivePowerUp[];
  obstacles: Obstacle[];
  portals: Portal[]; // Active portals
  combo: ComboState;
  particles: Particle[];
  achievements: Achievement[];
  lives: number; // Number of lives remaining
  statistics?: import('./statistics').GameStatisticsTracking;
  isSpeedBoosted?: boolean; // Speed boost when direction key is held
  currentPhase?: number; // Current phase number (1-10)
  phaseLevelType?: import('./phases').PhaseLevelType; // Type of level in current phase
  activeBoss?: import('./phases').Chef; // Active boss (if in boss level)
  bossSnake?: BossSnake; // Boss snake (positions, direction, etc.)
}

export interface GameConfig {
  gridSize: number;
  cellSize: number;
  gameSpeed: number;
  initialSnakeLength: number;
  enableObstacles: boolean;
  enableCombos: boolean;
  enableParticles: boolean;
  enableAchievements: boolean;
  enableLengthMultiplier?: boolean;
}
