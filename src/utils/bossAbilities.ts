/**
 * Boss Abilities - Main processor and barrel export
 *
 * This file contains the main boss ability processor and re-exports
 * all boss-related utilities from their respective modules.
 */

import { GameState } from '@/types/game';
import { Chef } from '@/types/phases';

// Re-export types
export type { BossAbilityResult, AbilityProcessContext } from './boss/bossAbilityTypes';

// Re-export guardian utilities
export { generateGuardianFlagPosition, getFlagOffsetFromBossHead } from './boss/bossGuardianUtils';

// Re-export obstacle utilities (for external use if needed)
export {
  createObstaclesInPath,
  moveObstaclesTowardsSnake,
  createStrategicWalls,
  createTetrisBarriers,
  buildOccupiedSet,
} from './boss/bossObstacleUtils';

// Import handlers for internal use
import type { BossAbilityResult } from './boss/bossAbilityTypes';
import {
  handleDefendFlag,
  handleCreateTemporaryBarriers,
  handleCreateObstacles,
  handleMoveObstacles,
  handleCreatePortals,
  handleSpeedBoost,
  handleChaosPowerups,
  handleMazeControl,
  handleLifeDrain,
  handleMultipleAbilities,
  handleAllAbilities,
} from './boss/bossAbilityHandlers';

/**
 * Process boss abilities and return their effects
 */
export function processBossAbilities(
  boss: Chef,
  gameState: GameState,
  abilityCooldowns: Map<string, number>,
): { result: BossAbilityResult; updatedCooldowns: Map<string, number> } {
  const result: BossAbilityResult = {};
  const updatedCooldowns = new Map(abilityCooldowns);
  const now = Date.now();

  const abilitiesLen = boss.abilities.length;
  for (let i = 0; i < abilitiesLen; i++) {
    const ability = boss.abilities[i];
    if (!ability) continue;

    // Check cooldown
    const lastUsed = abilityCooldowns.get(ability.id);
    if (lastUsed && ability.cooldown) {
      const elapsed = now - lastUsed;
      if (elapsed < ability.cooldown) {
        continue; // Still on cooldown
      }
    }

    // Create context for handlers that need it
    const ctx = {
      abilityId: ability.id,
      abilityCooldowns,
      now,
      updatedCooldowns,
      abilityCooldown: ability.cooldown,
    };

    // Process ability based on ID
    switch (ability.id) {
      case 'defend_flag':
        handleDefendFlag(gameState, result);
        break;

      case 'create_temporary_barriers':
        handleCreateTemporaryBarriers(gameState, ctx, result);
        break;

      case 'create_obstacles':
        handleCreateObstacles(gameState, ctx, result);
        break;

      case 'move_obstacles':
        handleMoveObstacles(gameState, result);
        break;

      case 'create_portals':
        handleCreatePortals(gameState, result);
        break;

      case 'speed_boost':
        handleSpeedBoost(gameState, result);
        break;

      case 'chaos_powerups':
        handleChaosPowerups(result);
        break;

      case 'maze_control':
        handleMazeControl(gameState, result);
        break;

      case 'life_drain':
        handleLifeDrain(gameState, ctx, result);
        break;

      case 'multiple_abilities':
        handleMultipleAbilities(boss, gameState, abilityCooldowns, result, processBossAbilities);
        break;

      case 'all_abilities':
        handleAllAbilities(boss, gameState, abilityCooldowns, result, processBossAbilities);
        break;

      default:
        break;
    }

    // Update cooldown if ability was used
    if (ability.cooldown && !lastUsed) {
      updatedCooldowns.set(ability.id, now);
    }
  }

  return { result, updatedCooldowns };
}
