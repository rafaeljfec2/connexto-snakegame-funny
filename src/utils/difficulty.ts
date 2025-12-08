import { DIFFICULTY_CONFIG } from '@/constants/game';
import { getPhaseSpeedModifier } from './phaseMechanics';

/**
 * Check if device is mobile
 */
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.innerWidth <= 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
}

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
 * Applies mobile speed boost for better responsiveness
 *
 * MODIFIED: Resets speed curve at the start of each phase (every 5 levels)
 */
export function calculateGameSpeed(level: number): number {
  const isMobile = isMobileDevice();

  // Mobile gets faster base speed (multiply by 0.7 = ~30% faster)
  const mobileSpeedMultiplier = isMobile ? 0.7 : 1.0;
  const adjustedBaseSpeed = Math.floor(DIFFICULTY_CONFIG.baseSpeed * mobileSpeedMultiplier);

  // Calculate level within the current phase (1-5)
  // We assume phases switch every 5 levels as per game logic
  const LEVELS_PER_PHASE = 5;
  const relativeLevelIndex = (level - DIFFICULTY_CONFIG.initialLevel) % LEVELS_PER_PHASE;

  // Speed reduces (gets faster) as we progress WITHIN the phase
  const speedReduction = relativeLevelIndex * DIFFICULTY_CONFIG.speedReductionPerLevel;

  const calculatedSpeed = adjustedBaseSpeed - speedReduction;

  // Ensure we never go below minimum speed
  // Mobile gets even lower minimum speed for faster gameplay
  const mobileMinSpeed = isMobile
    ? Math.floor(DIFFICULTY_CONFIG.minSpeed * 0.8)
    : DIFFICULTY_CONFIG.minSpeed;
  const baseSpeed = Math.max(calculatedSpeed, mobileMinSpeed);

  // Apply phase-specific speed modifier (e.g., Phase 5 is naturally faster)
  const phaseModifier = getPhaseSpeedModifier(level);
  const phaseAdjustedSpeed = Math.floor(baseSpeed * phaseModifier);

  // Ensure we still respect minimum speed limit
  return Math.max(phaseAdjustedSpeed, mobileMinSpeed);
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
