import { PhaseType, Chef } from '@/types/phases';
import {
  getPhaseByLevel,
  getChefByLevel,
  getCurrentPhaseNumber,
  isBossLevel,
  CHEFS,
  PHASES,
} from '@/constants/phases';

/**
 * Get the current phase based on level
 */
export function getCurrentPhase(level: number): PhaseType | undefined {
  return getPhaseByLevel(level);
}

/**
 * Get phase configuration
 */
export function getPhaseConfig(phase: number): PhaseType | undefined {
  return getPhaseByLevel((phase - 1) * 5 + 1); // Get first level of phase
}

/**
 * Check if current level is a boss level
 */
export function shouldSpawnBoss(level: number): boolean {
  return isBossLevel(level);
}

/**
 * Get boss for current level
 */
export function getBossForLevel(level: number): Chef | undefined {
  return getChefByLevel(level);
}

/**
 * Check if phase changed
 */
export function didPhaseChange(oldLevel: number, newLevel: number): boolean {
  const oldPhase = getCurrentPhaseNumber(oldLevel);
  const newPhase = getCurrentPhaseNumber(newLevel);
  return oldPhase !== newPhase;
}

/**
 * Get phase number for a given level
 */
export function getPhaseNumber(level: number): number {
  return getCurrentPhaseNumber(level);
}

/**
 * Get progress within current phase (0-1)
 */
export function getPhaseProgress(level: number): number {
  const phase = getCurrentPhase(level);
  if (!phase) {
    return 0;
  }

  const [start, end] = phase.levelRange;
  const progress = (level - start) / (end - start);
  return Math.max(0, Math.min(1, progress));
}

/**
 * Get level within phase (1-5)
 */
export function getLevelInPhase(level: number): number {
  const phaseNumber = getPhaseNumber(level);
  return ((level - 1) % 5) + 1;
}

/**
 * Get chef by ID (for debug mode)
 */
export function getChefById(id: string): Chef | undefined {
  return CHEFS.find((chef) => chef.id === id);
}

/**
 * Get phase configuration from a boss/chef (for debug mode)
 */
export function getPhaseByBoss(boss: Chef): PhaseType | undefined {
  return PHASES.find((phase) => phase.id === boss.phase);
}
