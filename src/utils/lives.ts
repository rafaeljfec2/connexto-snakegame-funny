import { LIVES_CONFIG } from '@/constants/lives';

/**
 * Handle losing a life - apply penalties and return new state values
 */
export function loseLife(
  currentScore: number,
  currentSnake: Array<{ x: number; y: number }>,
): {
  newScore: number;
  newSnake: Array<{ x: number; y: number }>;
} {
  let newScore = currentScore;
  // Keep snake at current length - no size reduction on death
  const newSnake = [...currentSnake];

  // Apply points penalty
  if (LIVES_CONFIG.pointsPenalty > 0) {
    newScore = Math.max(0, currentScore - LIVES_CONFIG.pointsPenalty);
  }

  // No length penalty - snake maintains its size when continuing after death
  // This allows players to keep their progress

  return { newScore, newSnake };
}

/**
 * Check if lives system is enabled
 */
export function isLivesEnabled(): boolean {
  return LIVES_CONFIG.enabled;
}

/**
 * Get initial number of lives
 */
export function getInitialLives(): number {
  return LIVES_CONFIG.initialLives;
}

/**
 * Get maximum number of lives
 */
export function getMaxLives(): number {
  return LIVES_CONFIG.maxLives;
}

/**
 * Add a life (with max limit)
 */
export function addLife(currentLives: number): number {
  const maxLives = getMaxLives();
  return Math.min(maxLives, currentLives + 1);
}
