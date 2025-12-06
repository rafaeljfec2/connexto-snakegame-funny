import {
  GameStatistics,
  GameSession,
  StatisticsHistory,
  GameStatisticsTracking,
} from '@/types/statistics';
import { GameState, FoodType } from '@/types/game';

const STORAGE_KEY = 'snake-game-statistics';

/**
 * Initialize statistics for a new game
 */
export function initializeStatistics(): GameStatisticsTracking {
  const foodsByType: Record<FoodType, number> = {
    [FoodType.NORMAL]: 0,
    [FoodType.SPEED_BOOST]: 0,
    [FoodType.BONUS_POINTS]: 0,
    [FoodType.EXTRA_GROWTH]: 0,
    [FoodType.PHASE_THROUGH]: 0,
    [FoodType.JOKER]: 0,
    [FoodType.EXTRA_LIFE]: 0,
    [FoodType.PORTAL]: 0,
    [FoodType.POISON]: 0,
    [FoodType.REVERSE_CONTROLS]: 0,
    [FoodType.SLOW_DOWN]: 0,
  };

  return {
    startTime: Date.now(),
    pausedTime: 0,
    foodsEaten: 0,
    foodsByType,
    maxSnakeLength: 3, // Initial snake length
    maxCombo: 0,
    obstaclesEncountered: 0,
    livesLost: 0,
  };
}

/**
 * Create final statistics from game state
 */
export function createFinalStatistics(gameState: GameState): GameStatistics {
  const stats = gameState.statistics ?? initializeStatistics();
  const endTime = Date.now();
  const totalPausedTime =
    stats.pausedTime + (stats.lastPauseTime ? endTime - stats.lastPauseTime : 0);
  const playTime = endTime - stats.startTime - totalPausedTime;

  return {
    startTime: stats.startTime,
    endTime,
    playTime: Math.max(0, playTime),
    pausedTime: totalPausedTime,
    score: gameState.score,
    level: gameState.level,
    finalSnakeLength: gameState.snake.length,
    maxSnakeLength: stats.maxSnakeLength,
    foodsEaten: stats.foodsEaten,
    foodsByType: { ...stats.foodsByType },
    powerUpsUsed: gameState.activePowerUps.length,
    maxCombo: stats.maxCombo,
    obstaclesEncountered: stats.obstaclesEncountered,
    livesLost: stats.livesLost,
    achievementsUnlocked: gameState.achievements.filter((a) => a.unlocked).length,
  };
}

/**
 * Save game session to history
 */
export function saveGameSession(statistics: GameStatistics): void {
  const session: GameSession = {
    id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date: statistics.endTime ?? Date.now(),
    statistics,
  };

  const history = getStatisticsHistory();
  history.sessions.push(session);

  // Keep only last 50 sessions
  if (history.sessions.length > 50) {
    history.sessions = history.sessions.slice(-50);
  }

  // Update totals
  history.totalGames = history.sessions.length;
  history.totalPlayTime += statistics.playTime;
  history.bestScore = Math.max(history.bestScore, statistics.score);
  history.bestLevel = Math.max(history.bestLevel, statistics.level);
  history.bestSnakeLength = Math.max(history.bestSnakeLength, statistics.maxSnakeLength);
  history.foodsEatenTotal += statistics.foodsEaten;
  history.achievementsUnlockedTotal = Math.max(
    history.achievementsUnlockedTotal,
    statistics.achievementsUnlocked,
  );

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save statistics:', error);
  }
}

/**
 * Get statistics history from localStorage
 */
export function getStatisticsHistory(): StatisticsHistory {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load statistics:', error);
  }

  return {
    sessions: [],
    totalGames: 0,
    totalPlayTime: 0,
    bestScore: 0,
    bestLevel: 1,
    bestSnakeLength: 3,
    foodsEatenTotal: 0,
    achievementsUnlockedTotal: 0,
  };
}

/**
 * Format time in milliseconds to readable string
 */
export function formatTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Format date to readable string
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Clear statistics history
 */
export function clearStatisticsHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear statistics:', error);
  }
}
