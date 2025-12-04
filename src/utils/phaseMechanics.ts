import { PhaseConfig, PhaseLevelType } from '@/types/phases';
import { GameState } from '@/types/game';
import { getCurrentPhase } from './phases';

/**
 * Apply phase-specific rules and mechanics to the game state
 */
export function applyPhaseRules(phaseConfig: PhaseConfig, gameState: GameState): Partial<GameState> {
  const updates: Partial<GameState> = {};

  // Speed modifier based on phase
  if (phaseConfig.speedModifier !== 1.0) {
    updates.gameSpeed = Math.floor(gameState.gameSpeed * phaseConfig.speedModifier);
  }

  return updates;
}

/**
 * Check if obstacles should be enabled based on phase config
 */
export function shouldEnableObstacles(level: number): boolean {
  const phase = getCurrentPhase(level);
  return phase?.config.obstaclesEnabled ?? false;
}

/**
 * Get obstacle frequency based on phase config
 */
export function getObstacleFrequency(level: number): number {
  const phase = getCurrentPhase(level);
  return phase?.config.obstaclesFrequency ?? 0;
}

/**
 * Get obstacle type based on phase config
 */
export function getObstacleType(level: number): 'static' | 'moving' | 'both' {
  const phase = getCurrentPhase(level);
  return phase?.config.obstaclesType ?? 'static';
}

/**
 * Check if portals should be enabled based on phase config
 */
export function shouldEnablePortals(level: number): boolean {
  const phase = getCurrentPhase(level);
  return phase?.config.portalsEnabled ?? false;
}

/**
 * Get portal frequency based on phase config
 */
export function getPortalFrequency(level: number): number {
  const phase = getCurrentPhase(level);
  return phase?.config.portalsFrequency ?? 0;
}

/**
 * Get power-up frequency based on phase config
 */
export function getPowerUpFrequency(level: number): number {
  const phase = getCurrentPhase(level);
  return phase?.config.powerUpsFrequency ?? 0.1;
}

/**
 * Check if timed food should be enabled based on phase config
 */
export function shouldEnableTimedFood(level: number): boolean {
  const phase = getCurrentPhase(level);
  return phase?.config.timedFoodEnabled ?? false;
}

/**
 * Get timed food frequency based on phase config
 */
export function getTimedFoodFrequency(level: number): number {
  const phase = getCurrentPhase(level);
  return phase?.config.timedFoodFrequency ?? 0;
}

/**
 * Get speed modifier based on phase config
 */
export function getPhaseSpeedModifier(level: number): number {
  const phase = getCurrentPhase(level);
  return phase?.config.speedModifier ?? 1.0;
}

/**
 * Get maze pattern based on phase config
 */
export function getMazePattern(level: number): 'none' | 'simple' | 'complex' | 'dynamic' {
  const phase = getCurrentPhase(level);
  return phase?.config.mazePattern ?? 'none';
}

/**
 * Apply phase-specific mechanics to game state
 */
export function applyPhaseMechanics(gameState: GameState): Partial<GameState> {
  const phase = getCurrentPhase(gameState.level);
  if (!phase) {
    return {};
  }

  return applyPhaseRules(phase.config, gameState);
}

