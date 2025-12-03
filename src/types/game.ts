export enum GameStatus {
  IDLE = "IDLE",
  PLAYING = "PLAYING",
  PAUSED = "PAUSED",
  GAME_OVER = "GAME_OVER",
}

export enum Direction {
  UP = "UP",
  DOWN = "DOWN",
  LEFT = "LEFT",
  RIGHT = "RIGHT",
}

export interface Position {
  x: number;
  y: number;
}

export enum FoodType {
  NORMAL = "NORMAL",
  SPEED_BOOST = "SPEED_BOOST",
  BONUS_POINTS = "BONUS_POINTS",
  EXTRA_GROWTH = "EXTRA_GROWTH",
}

export interface Food {
  position: Position;
  type: FoodType;
}

export interface ActivePowerUp {
  type: FoodType;
  duration: number; // in milliseconds
  startTime: number;
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
}

export interface GameConfig {
  gridSize: number;
  cellSize: number;
  gameSpeed: number;
  initialSnakeLength: number;
}
