import { FoodType } from '@/types/game';

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
    [FoodType.EXTRA_LIFE]: 0, // Instant effect
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
    [FoodType.EXTRA_LIFE]: {
      extraLife: true, // Add one life
    },
  },

  // Visual colors for each power-up type
  colors: {
    [FoodType.NORMAL]: {
      primary: '#ef4444',
      secondary: '#dc2626',
    },
    [FoodType.SPEED_BOOST]: {
      primary: '#fb923c', // Laranja/bright orange (lightning bolt)
      secondary: '#f97316',
    },
    [FoodType.BONUS_POINTS]: {
      primary: '#f59e0b', // Dourado/gold (money bag)
      secondary: '#d97706',
    },
    [FoodType.EXTRA_GROWTH]: {
      primary: '#60a5fa', // Azul claro/light blue (graph)
      secondary: '#3b82f6',
    },
    [FoodType.POISON]: {
      primary: '#10b981', // Verde/green (skull)
      secondary: '#059669',
    },
    [FoodType.REVERSE_CONTROLS]: {
      primary: '#60a5fa', // Azul claro com borda rosa/light blue with pink border
      secondary: '#3b82f6',
    },
    [FoodType.SLOW_DOWN]: {
      primary: '#d97706', // Marrom/brown (snail)
      secondary: '#b45309',
    },
    [FoodType.PHASE_THROUGH]: {
      primary: '#a855f7', // Roxo/white-purple (ghost)
      secondary: '#9333ea',
    },
    [FoodType.JOKER]: {
      primary: '#ec4899', // Rosa/pink (card)
      secondary: '#db2777',
    },
    [FoodType.EXTRA_LIFE]: {
      primary: '#f43f5e',
      secondary: '#e11d48',
    },
  },

  // Negative power-up spawn chance (separate from positive)
  negativeSpawnChance: 0.15, // 15% chance of spawning negative power-up

  // Joker spawn chance (very rare, special power-up)
  jokerSpawnChance: 0.05, // 5% chance of spawning joker
} as const;
