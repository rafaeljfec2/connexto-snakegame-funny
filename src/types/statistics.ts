import { FoodType } from './game';

export interface GameStatistics {
  // Time tracking
  startTime: number;
  endTime?: number;
  playTime: number; // Total play time in milliseconds (excluding pauses)
  pausedTime: number; // Total time paused in milliseconds

  // Game data
  score: number;
  level: number;
  finalSnakeLength: number;
  maxSnakeLength: number;

  // Food statistics
  foodsEaten: number;
  foodsByType: Record<FoodType, number>;

  // Power-ups statistics
  powerUpsUsed: number;
  maxCombo: number;

  // Obstacles and collisions
  obstaclesEncountered: number;
  livesLost: number;

  // Achievement data
  achievementsUnlocked: number;
}

export interface GameSession {
  id: string;
  date: number; // Timestamp
  statistics: GameStatistics;
}

export interface StatisticsHistory {
  sessions: GameSession[];
  totalGames: number;
  totalPlayTime: number;
  bestScore: number;
  bestLevel: number;
  bestSnakeLength: number;
  foodsEatenTotal: number;
  achievementsUnlockedTotal: number;
}

// Internal statistics tracking (non-optional)
export interface GameStatisticsTracking {
  startTime: number;
  pausedTime: number;
  lastPauseTime?: number;
  foodsEaten: number;
  foodsByType: Record<FoodType, number>;
  maxSnakeLength: number;
  maxCombo: number;
  obstaclesEncountered: number;
  livesLost: number;
}
