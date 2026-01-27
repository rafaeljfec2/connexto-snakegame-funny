import { FoodType } from '@/types/game';

/**
 * Result of processing boss abilities
 */
export interface BossAbilityResult {
  obstacles?: import('@/types/game').Obstacle[];
  portals?: import('@/types/game').Portal[];
  gameSpeed?: number;
  lives?: number;
  foodType?: FoodType;
  message?: string;
  bossSnakeGrowth?: number;
  forceFoodType?: boolean;
  guardianFlag?: import('@/types/game').Food | null;
  guardianFlagSide?: -1 | 1;
}

/**
 * Context for ability processing
 */
export interface AbilityProcessContext {
  readonly abilityId: string;
  readonly abilityCooldowns: Map<string, number>;
  readonly now: number;
  readonly updatedCooldowns: Map<string, number>;
  readonly abilityCooldown?: number;
}
