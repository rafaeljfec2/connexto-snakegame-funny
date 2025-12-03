import { FoodType } from "@/types/game";

export const POWER_UP_CONFIG = {
  // Chance of spawning a power-up instead of normal food (0-1)
  spawnChance: 0.3,
  
  // Power-up durations in milliseconds
  durations: {
    [FoodType.SPEED_BOOST]: 5000, // 5 seconds
    [FoodType.BONUS_POINTS]: 0, // Instant effect
    [FoodType.EXTRA_GROWTH]: 0, // Instant effect
  },
  
  // Power-up effects
  effects: {
    [FoodType.SPEED_BOOST]: {
      speedMultiplier: 0.6, // 60% of current speed (faster)
    },
    [FoodType.BONUS_POINTS]: {
      points: 30, // Extra points
    },
    [FoodType.EXTRA_GROWTH]: {
      growth: 2, // Grow by 2 segments instead of 1
    },
  },
  
  // Visual colors for each power-up type
  colors: {
    [FoodType.NORMAL]: {
      primary: "#ef4444",
      secondary: "#dc2626",
    },
    [FoodType.SPEED_BOOST]: {
      primary: "#3b82f6",
      secondary: "#2563eb",
    },
    [FoodType.BONUS_POINTS]: {
      primary: "#f59e0b",
      secondary: "#d97706",
    },
    [FoodType.EXTRA_GROWTH]: {
      primary: "#8b5cf6",
      secondary: "#7c3aed",
    },
  },
} as const;
