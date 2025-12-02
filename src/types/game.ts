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

export interface GameState {
  snake: Position[];
  food: Position;
  direction: Direction;
  nextDirection: Direction;
  status: GameStatus;
  score: number;
  highScore: number;
  level: number;
  gameSpeed: number;
}

export interface GameConfig {
  gridSize: number;
  cellSize: number;
  gameSpeed: number;
  initialSnakeLength: number;
}
