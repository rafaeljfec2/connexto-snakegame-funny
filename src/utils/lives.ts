import { LIVES_CONFIG } from "@/constants/lives";

/**
 * Handle losing a life - apply penalties and return new state values
 */
export function loseLife(
  currentScore: number,
  currentSnake: Array<{ x: number; y: number }>
): {
  newScore: number;
  newSnake: Array<{ x: number; y: number }>;
} {
  let newScore = currentScore;
  let newSnake = [...currentSnake];

  // Apply points penalty
  if (LIVES_CONFIG.pointsPenalty > 0) {
    newScore = Math.max(0, currentScore - LIVES_CONFIG.pointsPenalty);
  }

  // Apply length penalty
  if (LIVES_CONFIG.lengthPenalty > 0) {
    const minLength = LIVES_CONFIG.minLengthAfterPenalty;
    const targetLength = Math.max(minLength, newSnake.length - LIVES_CONFIG.lengthPenalty);
    newSnake = newSnake.slice(0, targetLength);
  }

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


