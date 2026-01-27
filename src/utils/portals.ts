import { Portal, Position, Obstacle } from '@/types/game';
import { PORTAL_CONFIG } from '@/constants/portals';

/**
 * Check if position is occupied by snake
 */
function isOccupiedBySnake(position: Position, snake: Position[]): boolean {
  return snake.some((segment) => segment.x === position.x && segment.y === position.y);
}

/**
 * Check if position is occupied by obstacle
 */
function isOccupiedByObstacle(position: Position, obstacles: Obstacle[]): boolean {
  return obstacles.some(
    (obstacle) => obstacle.position.x === position.x && obstacle.position.y === position.y,
  );
}

/**
 * Check if position is too close to snake head
 */
function isTooCloseToHead(position: Position, head: Position | undefined): boolean {
  if (!head) return false;
  const distance = Math.abs(position.x - head.x) + Math.abs(position.y - head.y);
  return distance < PORTAL_CONFIG.minDistanceFromSnake;
}

/**
 * Check if a position is valid for portal placement
 */
function isValidPortalPosition(
  position: Position,
  snake: Position[],
  obstacles: Obstacle[],
): boolean {
  if (isOccupiedBySnake(position, snake)) return false;
  if (isOccupiedByObstacle(position, obstacles)) return false;
  if (isTooCloseToHead(position, snake[0])) return false;
  return true;
}

/**
 * Find all available positions for portal placement
 */
function findAvailablePositions(
  snake: Position[],
  obstacles: Obstacle[],
  gridSize: number,
): Position[] {
  const positions: Position[] = [];

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      const position: Position = { x, y };
      if (isValidPortalPosition(position, snake, obstacles)) {
        positions.push(position);
      }
    }
  }

  return positions;
}

/**
 * Get random element from array
 */
function getRandomElement<T>(array: T[]): T | undefined {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Filter positions that are far enough from a reference position
 */
function filterByMinDistance(positions: Position[], reference: Position): Position[] {
  return positions.filter((pos) => {
    const distance = Math.abs(pos.x - reference.x) + Math.abs(pos.y - reference.y);
    return distance >= PORTAL_CONFIG.minDistanceBetweenPortals;
  });
}

/**
 * Create a portal pair from two positions
 */
function createPortalPairFromPositions(pos1: Position, pos2: Position): Portal[] {
  const pairId = `portal-pair-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  const duration =
    PORTAL_CONFIG.durationMin +
    Math.random() * (PORTAL_CONFIG.durationMax - PORTAL_CONFIG.durationMin);
  const spawnTime = Date.now();

  return [
    { id: `portal-1-${pairId}`, position: pos1, pairId, spawnTime, duration },
    { id: `portal-2-${pairId}`, position: pos2, pairId, spawnTime, duration },
  ];
}

/**
 * Generate a pair of connected portals in valid positions
 */
export function generatePortalPair(
  snake: Position[],
  obstacles: Obstacle[],
  gridSize: number,
): Portal[] | null {
  if (!PORTAL_CONFIG.enabled) return null;

  const availablePositions = findAvailablePositions(snake, obstacles, gridSize);
  if (availablePositions.length < 2) return null;

  const maxAttempts = 20;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const portal1Pos = getRandomElement(availablePositions);
    if (!portal1Pos) continue;

    const validSecondPositions = filterByMinDistance(availablePositions, portal1Pos);
    const portal2Pos = getRandomElement(validSecondPositions);
    if (!portal2Pos) continue;

    return createPortalPairFromPositions(portal1Pos, portal2Pos);
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
    const sorted = [...activePortals].sort((a, b) => b.spawnTime - a.spawnTime);
    return sorted.slice(0, maxPortals);
  }

  return activePortals;
}
