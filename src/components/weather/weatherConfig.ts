/**
 * Weather Effect Configuration
 *
 * Particle counts and settings for each phase.
 */

/**
 * Particle counts per phase
 */
export const WEATHER_CONFIG = {
  /** Phase 1 - Starry Night */
  starryNight: {
    stars: { mobile: 20, desktop: 60 },
  },

  /** Phase 2 - Mystic Fog */
  mysticFog: {
    fog: { mobile: 8, desktop: 30 },
    lights: { mobile: 3, desktop: 6 },
  },

  /** Phase 3 - Desert Storm */
  desertStorm: {
    sand: { mobile: 15, desktop: 40 },
  },

  /** Phase 4 - Cosmic Space */
  cosmicSpace: {
    particles: { mobile: 20, desktop: 50 },
  },

  /** Phase 5 - Fire Speed */
  fireSpeed: {
    fire: { mobile: 10, desktop: 30 },
    trails: { mobile: 5, desktop: 15 },
  },

  /** Phase 6 - Chaos Psychedelic */
  chaosPsychedelic: {
    particles: { mobile: 15, desktop: 40 },
    colors: ['#ff0080', '#00ff80', '#8000ff', '#ff8000', '#0080ff', '#80ff00'] as const,
  },

  /** Phase 7 - Mist Geometric */
  mistGeometric: {
    shapes: { mobile: 4, desktop: 12 },
  },

  /** Phase 8 - Apocalyptic Lava */
  apocalypticLava: {
    ash: { mobile: 12, desktop: 35 },
    lava: { mobile: 3, desktop: 8 },
  },

  /** Phase 10 - Celestial Divine */
  celestialDivine: {
    particles: { mobile: 15, desktop: 45 },
  },
} as const;

type ParticleCountConfig = { readonly mobile: number; readonly desktop: number };

/**
 * Get particle count for mobile devices
 */
export function getMobileParticleCount(config: ParticleCountConfig): number {
  return config.mobile;
}

/**
 * Get particle count for desktop devices
 */
export function getDesktopParticleCount(config: ParticleCountConfig): number {
  return config.desktop;
}
