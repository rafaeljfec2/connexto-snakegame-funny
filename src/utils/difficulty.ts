import { DIFFICULTY_CONFIG } from '@/constants/game';
import { getPhaseSpeedModifier } from './phaseMechanics';

/**
 * Calculate the current level based on score
 */
export function calculateLevel(score: number): number {
  const level =
    Math.floor(score / DIFFICULTY_CONFIG.pointsPerLevel) + DIFFICULTY_CONFIG.initialLevel;
  return level;
}

/**
 * Calculate the current game speed based on level
 * Lower values = faster game
 * Now considers phase-specific speed modifiers
 */
export function calculateGameSpeed(level: number): number {
  const speedReduction =
    (level - DIFFICULTY_CONFIG.initialLevel) * DIFFICULTY_CONFIG.speedReductionPerLevel;
  const calculatedSpeed = DIFFICULTY_CONFIG.baseSpeed - speedReduction;

  // Ensure we never go below minimum speed
  const baseSpeed = Math.max(calculatedSpeed, DIFFICULTY_CONFIG.minSpeed);

  // Apply phase-specific speed modifier
  const phaseModifier = getPhaseSpeedModifier(level);
  const phaseAdjustedSpeed = Math.floor(baseSpeed * phaseModifier);

  // Ensure we still respect minimum speed
  return Math.max(phaseAdjustedSpeed, DIFFICULTY_CONFIG.minSpeed);
}

/**
 * Get points needed for next level
 */
export function getPointsForNextLevel(currentScore: number): number {
  const currentLevel = calculateLevel(currentScore);
  return currentLevel * DIFFICULTY_CONFIG.pointsPerLevel;
}

/**
 * Get points remaining until next level
 */
export function getPointsUntilNextLevel(currentScore: number): number {
  const pointsForNextLevel = getPointsForNextLevel(currentScore);
  return Math.max(0, pointsForNextLevel - currentScore);
}
