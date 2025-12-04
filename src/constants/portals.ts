/**
 * Portal system configuration
 */
export const PORTAL_CONFIG = {
  // Enable/disable portal system
  enabled: true,

  // Duration range for portals (random between min and max)
  durationMin: 5000, // 5 seconds
  durationMax: 8000, // 8 seconds

  // Minimum distance between portal pairs (in grid cells)
  minDistanceBetweenPortals: 10,

  // Minimum distance from snake head when generating portals
  minDistanceFromSnake: 5,

  // Spawn chance as power-up (0-1)
  spawnChance: 0.08, // 8% chance (rare power-up)

  // Visual settings
  colors: {
    portal1: {
      primary: '#3b82f6', // Blue
      secondary: '#2563eb',
      glow: 'rgba(59, 130, 246, 0.6)',
    },
    portal2: {
      primary: '#8b5cf6', // Purple
      secondary: '#7c3aed',
      glow: 'rgba(139, 92, 246, 0.6)',
    },
  },
} as const;

