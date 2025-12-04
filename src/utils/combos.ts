import { ComboState } from "@/types/game";
import { COMBO_CONFIG } from "@/constants/game";

export function updateCombo(
  currentCombo: ComboState,
  ateFood: boolean
): ComboState {
  const now = Date.now();

  if (!ateFood) {
    // Check if combo expired
    if (now - currentCombo.lastFoodTime > COMBO_CONFIG.comboWindow) {
      return {
        count: 0,
        multiplier: 1,
        lastFoodTime: 0,
      };
    }
    return currentCombo;
  }

  // Ate food - check if within combo window
  if (now - currentCombo.lastFoodTime <= COMBO_CONFIG.comboWindow) {
    // Continue combo
    const newCount = currentCombo.count + 1;
    const multiplier = Math.min(
      Math.floor(newCount / COMBO_CONFIG.minCombo) + 1,
      COMBO_CONFIG.maxMultiplier
    );

    return {
      count: newCount,
      multiplier,
      lastFoodTime: now,
    };
  } else {
    // Start new combo
    return {
      count: 1,
      multiplier: 1,
      lastFoodTime: now,
    };
  }
}

export function calculateComboPoints(
  basePoints: number,
  combo: ComboState
): number {
  return basePoints * combo.multiplier;
}
