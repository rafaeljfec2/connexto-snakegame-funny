import { Portal, Position, Obstacle } from '@/types/game';
import { PORTAL_CONFIG } from '@/constants/portals';

/**
 * Generate a pair of connected portals in valid positions
 */
export function generatePortalPair(
  snake: Position[],
  obstacles: Obstacle[],
  gridSize: number,
): Portal[] | null {
  if (!PORTAL_CONFIG.enabled) {
    return null;
  }

  const availablePositions: Position[] = [];

  // Find all valid positions
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      const position: Position = { x, y };

      // Check if position is valid
      const isOccupiedBySnake = snake.some(
        (segment) => segment.x === position.x && segment.y === position.y,
      );
      const isOccupiedByObstacle = obstacles.some(
        (obstacle) => obstacle.position.x === position.x && obstacle.position.y === position.y,
      );

      // Check distance from snake head
      const head = snake[0];
      if (head) {
        const distance = Math.abs(position.x - head.x) + Math.abs(position.y - head.y);
        if (distance < PORTAL_CONFIG.minDistanceFromSnake) {
          continue;
        }
      }

      if (!isOccupiedBySnake && !isOccupiedByObstacle) {
        availablePositions.push(position);
      }
    }
  }

  if (availablePositions.length < 2) {
    return null;
  }

  // Try to find two positions with minimum distance
  const attempts = 20;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const randomIndex1 = Math.floor(Math.random() * availablePositions.length);
    const portal1Pos = availablePositions[randomIndex1];

    if (!portal1Pos) {
      continue;
    }

    // Find a second position with minimum distance
    const validSecondPositions = availablePositions.filter((pos) => {
      const distance = Math.abs(pos.x - portal1Pos.x) + Math.abs(pos.y - portal1Pos.y);
      return distance >= PORTAL_CONFIG.minDistanceBetweenPortals;
    });

    if (validSecondPositions.length === 0) {
      continue;
    }

    const randomIndex2 = Math.floor(Math.random() * validSecondPositions.length);
    const portal2Pos = validSecondPositions[randomIndex2];

    if (!portal2Pos) {
      continue;
    }

    // Create portal pair
    const pairId = `portal-pair-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const duration =
      PORTAL_CONFIG.durationMin +
      Math.random() * (PORTAL_CONFIG.durationMax - PORTAL_CONFIG.durationMin);
    const spawnTime = Date.now();

    return [
      {
        id: `portal-1-${pairId}`,
        position: portal1Pos,
        pairId,
        spawnTime,
        duration,
      },
      {
        id: `portal-2-${pairId}`,
        position: portal2Pos,
        pairId,
        spawnTime,
        duration,
      },
    ];
  }

  return null;
}

/**
 * Check if a position collides with a portal
 */
export function hasPortalCollision(position: Position, portals: Portal[]): boolean {
  return portals.some(
    (portal) => portal.position.x === position.x && portal.position.y === position.y,
  );
}

/**
 * Get the portal that collides with the given position
 */
export function getPortalAtPosition(position: Position, portals: Portal[]): Portal | null {
  return (
    portals.find(
      (portal) => portal.position.x === position.x && portal.position.y === position.y,
    ) ?? null
  );
}

/**
 * Get the paired portal (the other portal in the pair)
 */
export function getPortalPair(portal: Portal, portals: Portal[]): Portal | null {
  return portals.find((p) => p.pairId === portal.pairId && p.id !== portal.id) ?? null;
}

/**
 * Check if a portal has expired
 */
export function hasExpiredPortal(portal: Portal): boolean {
  const elapsed = Date.now() - portal.spawnTime;
  return elapsed >= portal.duration;
}

/**
 * Get remaining time for a portal in milliseconds
 */
export function getPortalRemainingTime(portal: Portal): number {
  const elapsed = Date.now() - portal.spawnTime;
  return Math.max(0, portal.duration - elapsed);
}

/**
 * Get remaining percentage for a portal (0-1)
 */
export function getPortalRemainingPercentage(portal: Portal): number {
  const elapsed = Date.now() - portal.spawnTime;
  return Math.max(0, Math.min(1, (portal.duration - elapsed) / portal.duration));
}

/**
 * Get only active (non-expired) portals with performance limit
 */
export function getActivePortals(portals: Portal[], maxPortals: number = 6): Portal[] {
  const activePortals = portals.filter((portal) => !hasExpiredPortal(portal));

  // Limit portals to prevent performance issues
  if (activePortals.length > maxPortals) {
    // Keep the most recently created portals (by spawnTime)
    const sorted = activePortals.sort((a, b) => b.spawnTime - a.spawnTime);
    return sorted.slice(0, maxPortals);
  }

  return activePortals;
}
