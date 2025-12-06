import { Obstacle, Particle, Position } from '@/types/game';
import { createParticles } from './particles';
import { GAME_CONFIG } from '@/constants/game';

/**
 * Configuration for obstacle destruction physics
 * Generic system used throughout the game
 */
export const OBSTACLE_DESTRUCTION_CONFIG = {
  // Particle configuration for destruction
  particles: {
    count: 8, // Number of particles created when obstacle is destroyed
    color: '#ef4444', // Red color for destruction
    lifetime: 400, // Particle lifetime in milliseconds
  },
} as const;

/**
 * Result of destroying obstacles
 */
export interface ObstacleDestructionResult {
  remainingObstacles: Obstacle[];
  destroyedObstacles: Obstacle[];
  particles: Particle[];
}

/**
 * Generic function to destroy obstacles - used throughout the game
 * This ensures consistent physics and particle effects for all destruction
 *
 * @param obstacles - Current list of obstacles
 * @param obstaclesToDestroy - Obstacles to destroy (by ID or reference)
 * @param existingParticles - Current particles to merge with new destruction particles
 * @returns Result with remaining obstacles, destroyed obstacles, and particles
 */
export function destroyObstacles(
  obstacles: Obstacle[],
  obstaclesToDestroy: Obstacle[] | string[], // Can pass obstacles or IDs
  existingParticles: Particle[] = [],
): ObstacleDestructionResult {
  const destroyedObstacles: Obstacle[] = [];
  const obstaclesToRemoveIds = new Set<string>();

  // Convert to IDs if obstacles were passed
  obstaclesToDestroy.forEach((item) => {
    if (typeof item === 'string') {
      obstaclesToRemoveIds.add(item);
    } else {
      obstaclesToRemoveIds.add(item.id);
    }
  });

  // Filter out destroyed obstacles and collect them
  const remainingObstacles = obstacles.filter((obstacle) => {
    if (obstaclesToRemoveIds.has(obstacle.id)) {
      destroyedObstacles.push(obstacle);
      return false; // Remove this obstacle
    }
    return true; // Keep this obstacle
  });

  // Create destruction particles for each destroyed obstacle
  let newParticles = [...existingParticles];
  if (GAME_CONFIG.enableParticles) {
    destroyedObstacles.forEach((destroyedObstacle) => {
      newParticles = [
        ...newParticles,
        ...createParticles(
          destroyedObstacle.position,
          OBSTACLE_DESTRUCTION_CONFIG.particles.color,
          OBSTACLE_DESTRUCTION_CONFIG.particles.count,
          OBSTACLE_DESTRUCTION_CONFIG.particles.lifetime,
        ),
      ];
    });
  }

  return {
    remainingObstacles,
    destroyedObstacles,
    particles: newParticles,
  };
}

/**
 * Destroy obstacles at specific positions
 * Generic function for position-based destruction
 *
 * @param obstacles - Current list of obstacles
 * @param positions - Positions where obstacles should be destroyed
 * @param existingParticles - Current particles to merge with new destruction particles
 * @returns Result with remaining obstacles, destroyed obstacles, and particles
 */
export function destroyObstaclesAtPositions(
  obstacles: Obstacle[],
  positions: Position[],
  existingParticles: Particle[] = [],
): ObstacleDestructionResult {
  // Find obstacles at specified positions
  const obstaclesToDestroy = obstacles.filter((obstacle) =>
    positions.some((pos) => pos.x === obstacle.position.x && pos.y === obstacle.position.y),
  );

  return destroyObstacles(obstacles, obstaclesToDestroy, existingParticles);
}

/**
 * Check if an obstacle can be destroyed
 * Generic validation for destruction eligibility
 *
 * @param obstacle - Obstacle to check
 * @returns True if obstacle can be destroyed
 */
export function canDestroyObstacle(obstacle: Obstacle): boolean {
  // Currently all obstacles can be destroyed
  // Future: could add invincible obstacles, etc.
  return true;
}
