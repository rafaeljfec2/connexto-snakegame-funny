import { Position } from '@/types/game';

/**
 * Utility to spawn particles via the Global Event Bus
 * This decouples the Game Loop from the Particle System (Worker)
 */
export function spawnParticles(
  position: Position,
  color: string,
  count: number = 10,
  lifetime: number = 800,
  size: number = 4,
) {
  const event = new CustomEvent('game-spawn-particles', {
    detail: {
      x: position.x,
      y: position.y,
      color,
      count,
      lifetime,
      size,
    },
  });
  window.dispatchEvent(event);
}

// Re-export for compatibility but implemented as no-op or wrapper
// These were used in the old state-based system
export function createParticles(
  position: Position,
  color: string,
  count: number,
  lifetime: number,
) {
  // In the new system, we fire the event immediately and return empty array
  // This maintains type compatibility with existing code that expects an array return
  // but the actual logic happens in the worker via event
  spawnParticles(position, color, count, lifetime);
  return [];
}

export function updateParticles(_particles: any[], _max: number) {
  // No-op: particles are updated in the worker
  return [];
}
