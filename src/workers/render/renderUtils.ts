import { Position } from '@/types/game';

/**
 * Linear interpolation between two values
 */
export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

/**
 * Adjust color brightness (simplified implementation)
 * TODO: Implement proper hex color adjustment if needed
 */
export const adjustColor = (color: string, _amount: number): string => {
  return color; // Simplification, implementing true hex adjust is overkill here
};

/**
 * Get interpolated position between current and previous position
 * Handles wrapping for grid boundaries
 */
export const getInterpolatedPos = (
  curr: Position,
  prev: Position | undefined,
  cellSize: number,
  t: number,
): { x: number; y: number } => {
  if (!prev) return { x: curr.x * cellSize, y: curr.y * cellSize };

  // Snap if wrapping
  if (Math.abs(curr.x - prev.x) > 1 || Math.abs(curr.y - prev.y) > 1) {
    return { x: curr.x * cellSize, y: curr.y * cellSize };
  }

  const x = lerp(prev.x, curr.x, t);
  const y = lerp(prev.y, curr.y, t);
  return { x: x * cellSize, y: y * cellSize };
};

/**
 * Convert ArrayBuffer (Float32Array) to Position array
 * Used for efficient transfer of position data between workers
 */
export function bufferToPositions(buffer: ArrayBuffer, length: number): Position[] {
  const array = new Float32Array(buffer);
  const positions: Position[] = [];
  for (let i = 0; i < length; i++) {
    positions.push({ x: array[i * 2], y: array[i * 2 + 1] });
  }
  return positions;
}

/**
 * Calculate angle from head to next segment, handling wrapping
 */
export const calculateSnakeAngle = (head: Position, next: Position): number => {
  let dx = head.x - next.x;
  let dy = head.y - next.y;

  // Wrap handling
  if (dx > 1) dx = -1;
  else if (dx < -1) dx = 1;
  if (dy > 1) dy = -1;
  else if (dy < -1) dy = 1;

  return Math.atan2(dy, dx);
};
