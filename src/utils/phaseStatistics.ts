import { GameState, FoodType } from '@/types/game';
import { GameStatisticsTracking } from '@/types/statistics';
import { getPhaseNumber } from '@/utils/phases';

export interface PhaseStatistics {
  phaseNumber: number;
  scoreGained: number;
  levelsCompleted: number;
  foodsEaten: number;
  maxCombo: number;
  obstaclesEncountered: number;
  livesLost: number;
  playTime: number;
}

export interface PhaseStartSnapshot {
  startTime: number;
  startScore: number;
  startLevel: number;
  startStatistics: GameStatisticsTracking;
}

/**
 * Create snapshot of phase start
 */
export function createPhaseStartSnapshot(gameState: GameState): PhaseStartSnapshot {
  return {
    startTime: Date.now(),
    startScore: gameState.score,
    startLevel: gameState.level,
    startStatistics: gameState.statistics
      ? { ...gameState.statistics }
      : {
          startTime: Date.now(),
          pausedTime: 0,
          foodsEaten: 0,
          foodsByType: {} as Record<FoodType, number>,
          maxSnakeLength: gameState.snake.length,
          maxCombo: 0,
          obstaclesEncountered: 0,
          livesLost: 0,
        },
  };
}

/**
 * Calculate phase statistics from snapshot
 */
export function calculatePhaseStatistics(
  gameState: GameState,
  phaseSnapshot: PhaseStartSnapshot,
): PhaseStatistics {
  const currentStats = gameState.statistics ?? phaseSnapshot.startStatistics;
  const phaseNumber = getPhaseNumber(gameState.level);

  // Calculate differences
  const scoreGained = gameState.score - phaseSnapshot.startScore;
  const levelsCompleted = gameState.level - phaseSnapshot.startLevel;
  const foodsEaten = currentStats.foodsEaten - (phaseSnapshot.startStatistics.foodsEaten ?? 0);
  const maxCombo = currentStats.maxCombo - (phaseSnapshot.startStatistics.maxCombo ?? 0);
  const obstaclesEncountered =
    currentStats.obstaclesEncountered - (phaseSnapshot.startStatistics.obstaclesEncountered ?? 0);
  const livesLost = currentStats.livesLost - (phaseSnapshot.startStatistics.livesLost ?? 0);

  // Calculate play time (excluding pauses)
  const endTime = Date.now();
  const totalPausedTime =
    currentStats.pausedTime +
    (currentStats.lastPauseTime ? endTime - currentStats.lastPauseTime : 0) -
    (phaseSnapshot.startStatistics.pausedTime ?? 0);
  const playTime = endTime - phaseSnapshot.startTime - totalPausedTime;

  return {
    phaseNumber,
    scoreGained: Math.max(0, scoreGained),
    levelsCompleted: Math.max(0, levelsCompleted),
    foodsEaten: Math.max(0, foodsEaten),
    maxCombo: Math.max(0, maxCombo),
    obstaclesEncountered: Math.max(0, obstaclesEncountered),
    livesLost: Math.max(0, livesLost),
    playTime: Math.max(0, playTime),
  };
}
