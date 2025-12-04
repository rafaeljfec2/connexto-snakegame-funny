import { FoodType } from "@/types/game";

export const POWER_UP_CONFIG = {
  // Chance of spawning a power-up instead of normal food (0-1)
  spawnChance: 0.3,
  
  // Power-up durations in milliseconds
  durations: {
    [FoodType.SPEED_BOOST]: 5000, // 5 seconds
    [FoodType.BONUS_POINTS]: 0, // Instant effect
    [FoodType.EXTRA_GROWTH]: 0, // Instant effect
    [FoodType.PHASE_THROUGH]: 6000, // 6 seconds
    [FoodType.JOKER]: 0, // Instant effect (random)
    [FoodType.POISON]: 0, // Instant effect
    [FoodType.REVERSE_CONTROLS]: 4000, // 4 seconds
    [FoodType.SLOW_DOWN]: 3000, // 3 seconds
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
    [FoodType.POISON]: {
      shrinkAmount: 2, // Lose 2 segments
      points: -5, // Lose 5 points
    },
    [FoodType.REVERSE_CONTROLS]: {
      reverseControls: true,
    },
    [FoodType.SLOW_DOWN]: {
      speedMultiplier: 1.8, // 180% of current speed (slower)
    },
    [FoodType.PHASE_THROUGH]: {
      phaseThrough: true, // Can pass through obstacles
    },
    [FoodType.JOKER]: {
      random: true, // Random effect (will be handled specially)
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
    [FoodType.POISON]: {
      primary: "#10b981",
      secondary: "#059669",
    },
    [FoodType.REVERSE_CONTROLS]: {
      primary: "#ec4899",
      secondary: "#db2777",
    },
    [FoodType.SLOW_DOWN]: {
      primary: "#6366f1",
      secondary: "#4f46e5",
    },
    [FoodType.PHASE_THROUGH]: {
      primary: "#06b6d4",
      secondary: "#0891b2",
    },
    [FoodType.JOKER]: {
      primary: "#fbbf24",
      secondary: "#f59e0b",
    },
  },
  
  // Negative power-up spawn chance (separate from positive)
  negativeSpawnChance: 0.15, // 15% chance of spawning negative power-up
  
  // Joker spawn chance (very rare, special power-up)
  jokerSpawnChance: 0.05, // 5% chance of spawning joker
} as const;
