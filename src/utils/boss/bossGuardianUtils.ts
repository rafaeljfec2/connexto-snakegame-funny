import { Position, Obstacle, Direction } from '@/types/game';
import { buildOccupiedSet } from './bossObstacleUtils';

/**
 * Check if a position is valid candidate for flag placement
 */
function isValidFlagCandidate(
  x: number,
  y: number,
  gridSize: number,
  occupied: Set<string>,
  playerHead: Position,
  minDistance: number,
): boolean {
  if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) {
    return false;
  }
  if (occupied.has(`${x},${y}`)) {
    return false;
  }
  const distanceFromPlayer = Math.abs(x - playerHead.x) + Math.abs(y - playerHead.y);
  return distanceFromPlayer >= minDistance;
}

/**
 * Generate candidate positions in spiral from center
 */
function generateSpiralCandidates(
  centerX: number,
  centerY: number,
  gridSize: number,
  occupied: Set<string>,
  playerHead: Position,
  minDistance: number,
): Position[] {
  const candidates: Position[] = [];
  const maxRadius = Math.floor(gridSize / 2);

  for (let radius = 0; radius < maxRadius; radius++) {
    for (let x = centerX - radius; x <= centerX + radius; x++) {
      for (let y = centerY - radius; y <= centerY + radius; y++) {
        if (isValidFlagCandidate(x, y, gridSize, occupied, playerHead, minDistance)) {
          candidates.push({ x, y });
        }
      }
    }
    if (candidates.length > 0) {
      break;
    }
  }

  return candidates;
}

/**
 * Generate fallback candidate positions (any available)
 */
function generateFallbackCandidates(gridSize: number, occupied: Set<string>): Position[] {
  const candidates: Position[] = [];
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      if (!occupied.has(`${x},${y}`)) {
        candidates.push({ x, y });
      }
    }
  }
  return candidates;
}

/**
 * Generate a strategic position for the Guardian flag (power-up)
 * Position should be away from player but accessible
 */
export function generateGuardianFlagPosition(
  playerSnake: Position[],
  bossSnake: Position[],
  obstacles: Obstacle[],
  gridSize: number,
): Position | null {
  const playerHead = playerSnake[0];
  if (!playerHead) {
    return null;
  }

  const occupied = buildOccupiedSet(playerSnake, bossSnake, obstacles);
  const centerX = Math.floor(gridSize / 2);
  const centerY = Math.floor(gridSize / 2);
  const minDistance = 5;

  let candidates = generateSpiralCandidates(
    centerX,
    centerY,
    gridSize,
    occupied,
    playerHead,
    minDistance,
  );

  if (candidates.length === 0) {
    candidates = generateFallbackCandidates(gridSize, occupied);
  }

  if (candidates.length > 0) {
    return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
  }

  return null;
}

/**
 * Get flag offset position relative to boss head
 * Flag is positioned to the side of the boss head (perpendicular to movement direction)
 */
export function getFlagOffsetFromBossHead(
  bossDirection: Direction,
  side: -1 | 1 = 1,
): { x: number; y: number } {
  switch (bossDirection) {
    case Direction.UP:
    case Direction.DOWN:
      return { x: side, y: 0 };
    case Direction.LEFT:
    case Direction.RIGHT:
      return { x: 0, y: side };
    default:
      return { x: 1, y: 0 };
  }
}
