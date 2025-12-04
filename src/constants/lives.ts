/**
 * Lives system configuration
 */
export const LIVES_CONFIG = {
  // Initial number of lives
  initialLives: 3,

  // Maximum lives (can't exceed this)
  maxLives: 5,

  // Points penalty when losing a life
  pointsPenalty: 0, // Set to 0 to not lose points, or a number to lose points

  // Snake length penalty when losing a life (reduce snake by this amount)
  lengthPenalty: 2, // Lose 2 segments when continuing

  // Minimum snake length after penalty (can't go below this)
  minLengthAfterPenalty: 3,

  // Duration of death animation before consuming life (in milliseconds)
  deathAnimationDuration: 1500,

  // Enable lives system
  enabled: true,
} as const;
