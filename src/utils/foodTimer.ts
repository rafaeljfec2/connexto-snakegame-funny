import { Food } from "@/types/game";
import { FOOD_TIMER_CONFIG } from "@/constants/foodTimer";

/**
 * Check if food has expired based on its timer
 */
export function hasFoodExpired(food: Food): boolean {
  if (!FOOD_TIMER_CONFIG.enabled) {
    return false;
  }
  
  if (food.duration === undefined || food.spawnTime === undefined) {
    return false; // No timer set, food doesn't expire
  }
  
  const now = Date.now();
  const elapsed = now - food.spawnTime;
  
  return elapsed >= food.duration;
}

/**
 * Get remaining time for food in milliseconds
 * Returns 0 if expired or no timer
 */
export function getFoodRemainingTime(food: Food): number {
  if (!FOOD_TIMER_CONFIG.enabled) {
    return 0;
  }
  
  if (food.duration === undefined || food.spawnTime === undefined) {
    return 0; // No timer
  }
  
  const now = Date.now();
  const elapsed = now - food.spawnTime;
  const remaining = food.duration - elapsed;
  
  return Math.max(0, remaining);
}

/**
 * Get remaining time as a percentage (0-1)
 */
export function getFoodRemainingPercentage(food: Food): number {
  if (!FOOD_TIMER_CONFIG.enabled) {
    return 1;
  }
  
  if (food.duration === undefined || food.spawnTime === undefined) {
    return 1; // No timer, always 100%
  }
  
  const remaining = getFoodRemainingTime(food);
  return remaining / food.duration;
}

/**
 * Apply timer to food based on configuration
 */
export function applyFoodTimer(food: Food): Food {
  if (!FOOD_TIMER_CONFIG.enabled) {
    return food;
  }
  
  // Check if this food type should have a timer
  const shouldHaveTimer = Math.random() < FOOD_TIMER_CONFIG.timerChance;
  
  if (!shouldHaveTimer) {
    return {
      ...food,
      spawnTime: undefined,
      duration: undefined,
    };
  }
  
  // Get duration for this food type
  const duration = FOOD_TIMER_CONFIG.durations[food.type] ?? FOOD_TIMER_CONFIG.baseDuration;
  
  return {
    ...food,
    spawnTime: food.spawnTime ?? Date.now(),
    duration,
  };
}

