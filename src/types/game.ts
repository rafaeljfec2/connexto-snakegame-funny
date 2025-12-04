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

export enum FoodType {
  NORMAL = 'NORMAL',
  SPEED_BOOST = 'SPEED_BOOST',
  BONUS_POINTS = 'BONUS_POINTS',
  EXTRA_GROWTH = 'EXTRA_GROWTH',
  PHASE_THROUGH = 'PHASE_THROUGH',
  JOKER = 'JOKER',
  EXTRA_LIFE = 'EXTRA_LIFE',
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
  combo: ComboState;
  particles: Particle[];
  achievements: Achievement[];
  lives: number; // Number of lives remaining
  statistics?: import('./statistics').GameStatisticsTracking;
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
