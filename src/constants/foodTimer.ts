import { FoodType } from "@/types/game";

/**
 * Food timer configuration
 * Determines how long each food type stays on screen before expiring
 */
export const FOOD_TIMER_CONFIG = {
  // Enable food timers
  enabled: true,
  
  // Base duration for normal food (in milliseconds)
  baseDuration: 10000, // 10 seconds
  
  // Duration multipliers for different food types
  durations: {
    [FoodType.NORMAL]: 10000, // 10 seconds
    [FoodType.SPEED_BOOST]: 8000, // 8 seconds (slightly less time)
    [FoodType.BONUS_POINTS]: 8000, // 8 seconds
    [FoodType.EXTRA_GROWTH]: 8000, // 8 seconds
    [FoodType.PHASE_THROUGH]: 7000, // 7 seconds (rare power-up, less time)
    [FoodType.JOKER]: 6000, // 6 seconds (very rare, less time to create urgency)
    [FoodType.POISON]: 12000, // 12 seconds (more time because it's negative)
    [FoodType.REVERSE_CONTROLS]: 12000, // 12 seconds
    [FoodType.SLOW_DOWN]: 12000, // 12 seconds
  },
  
  // Chance that a food will have a timer (0-1)
  // Set to 1.0 for all foods, or lower for some foods to have no timer
  timerChance: 1.0,
  
  // Show timer indicator (progress bar/countdown)
  showIndicator: true,
  
  // Warning thresholds (when to change visual indicator)
  warningThreshold: 0.3, // Show warning when 30% time remaining
  criticalThreshold: 0.1, // Show critical when 10% time remaining
} as const;

