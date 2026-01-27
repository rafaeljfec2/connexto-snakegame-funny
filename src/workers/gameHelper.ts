/**
 * Game Helper - Barrel export for game logic helpers
 *
 * This file re-exports all game helper functions from their respective modules.
 * Each module handles a specific responsibility:
 * - directionHelper: Snake direction resolution
 * - bossLogicHelper: Boss movement, abilities, and collisions
 * - poisonLogicHelper: Poison shots and their interactions
 * - foodInteractionHelper: Food consumption and effects
 */

// Direction Helper
export { resolveDirection } from './game/directionHelper';

// Boss Logic Helper
export {
  handleBossLogic,
  handleBossCollisionCheck,
  type BossLogicContext,
  type BossLogicResult,
} from './game/bossLogicHelper';

// Poison Logic Helper
export {
  handlePoisonShotsUpdate,
  type PoisonLogicResult,
  type PoisonShotsUpdateContext,
} from './game/poisonLogicHelper';

// Food Interaction Helper
export { handleFoodInteraction, type FoodInteractionResult } from './game/foodInteractionHelper';

// Game State Updates (already in game folder)
export { handleGameStateUpdates } from './game/gameStateUpdates';
export type { GameStateUpdateResult } from './game/gameStateUpdates';
