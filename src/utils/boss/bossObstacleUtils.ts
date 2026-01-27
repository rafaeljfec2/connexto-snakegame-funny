import { Position, Obstacle } from '@/types/game';
import { OBSTACLE_PATTERNS } from '@/constants/obstacles';

/**
 * Calculate distance from snake for a position
 */
export function calculateDistanceFromSnake(pos: Position, snake: Position[]): number {
  return snake.reduce((minDist, segment) => {
    const distance = Math.abs(pos.x - segment.x) + Math.abs(pos.y - segment.y);
    return Math.min(minDist, distance);
  }, Infinity);
}

/**
 * Check if position is valid and has minimum distance from snake
 */
export function isValidObstaclePosition(
  pos: Position,
  snake: Position[],
  gridSize: number,
  minDistance: number,
): boolean {
  if (pos.x < 0 || pos.x >= gridSize || pos.y < 0 || pos.y >= gridSize) {
    return false;
  }
  return calculateDistanceFromSnake(pos, snake) >= minDistance;
}

/**
 * Generate ahead positions for obstacles
 */
function generateAheadPositions(
  head: Position,
  dx: number,
  dy: number,
  snake: Position[],
  gridSize: number,
  minDistance: number,
): Position[] {
  const aheadPositions: Position[] = [];
  for (let i = 5; i <= 6; i++) {
    const pos: Position = {
      x: head.x + dx * i,
      y: head.y + dy * i,
    };
    if (isValidObstaclePosition(pos, snake, gridSize, minDistance)) {
      aheadPositions.push(pos);
    }
  }
  return aheadPositions;
}

/**
 * Generate side positions for obstacles
 */
function generateSidePositions(head: Position, dx: number, dy: number): Position[] {
  const sidePositions: Position[] = [];
  if (dx === 0) {
    if (Math.random() < 0.5) {
      sidePositions.push({ x: head.x + 1, y: head.y + dy * 5 });
    } else {
      sidePositions.push({ x: head.x - 1, y: head.y + dy * 5 });
    }
  } else if (Math.random() < 0.5) {
    sidePositions.push({ x: head.x + dx * 5, y: head.y + 1 });
  } else {
    sidePositions.push({ x: head.x + dx * 5, y: head.y - 1 });
  }
  return sidePositions;
}

/**
 * Build occupied positions set
 */
export function buildOccupiedSet(
  playerSnake: Position[],
  bossSnake: Position[],
  obstacles: Obstacle[],
): Set<string> {
  const occupied = new Set<string>();
  const playerLen = playerSnake.length;
  for (let i = 0; i < playerLen; i++) {
    const seg = playerSnake[i];
    if (seg) occupied.add(`${seg.x},${seg.y}`);
  }
  const bossLen = bossSnake.length;
  for (let i = 0; i < bossLen; i++) {
    const seg = bossSnake[i];
    if (seg) occupied.add(`${seg.x},${seg.y}`);
  }
  const obsLen = obstacles.length;
  for (let i = 0; i < obsLen; i++) {
    const obs = obstacles[i];
    if (obs) occupied.add(`${obs.position.x},${obs.position.y}`);
  }
  return occupied;
}

/**
 * Create obstacles in the player's path (more strategic)
 */
export function createObstaclesInPath(
  snake: Position[],
  existingObstacles: Obstacle[],
  bossSnake: Position[],
  gridSize: number,
): Obstacle[] {
  const head = snake[0];
  const second = snake[1];
  if (!head || !second) {
    return [];
  }

  const newObstacles: Obstacle[] = [];
  const occupied = buildOccupiedSet(snake, bossSnake, existingObstacles);

  const dx = head.x - second.x;
  const dy = head.y - second.y;
  const minDistanceFromSnake = 6;

  const aheadPositions = generateAheadPositions(
    head,
    dx,
    dy,
    snake,
    gridSize,
    minDistanceFromSnake,
  );
  const sidePositions = generateSidePositions(head, dx, dy);
  const validSidePositions = sidePositions.filter((pos) =>
    isValidObstaclePosition(pos, snake, gridSize, minDistanceFromSnake),
  );

  const allPositions = [...aheadPositions, ...validSidePositions];
  const allLen = allPositions.length;
  for (let i = 0; i < allLen; i++) {
    const pos = allPositions[i];
    if (!pos) continue;
    if (
      pos.x >= 0 &&
      pos.x < gridSize &&
      pos.y >= 0 &&
      pos.y < gridSize &&
      !occupied.has(`${pos.x},${pos.y}`) &&
      newObstacles.length < 2
    ) {
      newObstacles.push({
        id: `boss-obstacle-${Date.now()}-${i}`,
        position: pos,
        type: 'static',
      });
      occupied.add(`${pos.x},${pos.y}`);
    }
  }

  return newObstacles;
}

/**
 * Calculate direction towards target (-1, 0, or 1)
 */
function getDirectionTowards(delta: number): number {
  if (delta > 0) return 1;
  if (delta < 0) return -1;
  return 0;
}

/**
 * Check if position is within grid bounds
 */
function isWithinBounds(x: number, y: number, gridSize: number): boolean {
  return x >= 0 && x < gridSize && y >= 0 && y < gridSize;
}

/**
 * Check if position is blocked by snake or other obstacles
 */
function isPositionBlocked(
  x: number,
  y: number,
  snake: Position[],
  obstacles: Obstacle[],
  excludeId: string,
): boolean {
  const onSnake = snake.some((seg) => seg.x === x && seg.y === y);
  if (onSnake) return true;

  return obstacles.some(
    (obs) => obs.id !== excludeId && obs.position.x === x && obs.position.y === y,
  );
}

/**
 * Try to move a single obstacle towards the snake head
 */
function tryMoveObstacle(
  obs: Obstacle,
  head: Position,
  snake: Position[],
  obstacles: Obstacle[],
  gridSize: number,
  maxDistance: number,
): Obstacle {
  const dx = head.x - obs.position.x;
  const dy = head.y - obs.position.y;
  const distance = Math.abs(dx) + Math.abs(dy);

  if (distance > maxDistance || distance === 0) {
    return obs;
  }

  const newX = obs.position.x + getDirectionTowards(dx);
  const newY = obs.position.y + getDirectionTowards(dy);

  if (!isWithinBounds(newX, newY, gridSize)) {
    return obs;
  }

  if (isPositionBlocked(newX, newY, snake, obstacles, obs.id)) {
    return obs;
  }

  return {
    ...obs,
    position: { x: newX, y: newY },
    type: 'moving' as const,
  };
}

/**
 * Move obstacles towards the snake
 */
export function moveObstaclesTowardsSnake(
  obstacles: Obstacle[],
  snake: Position[],
  gridSize: number,
): Obstacle[] {
  const head = snake[0];
  if (!head || obstacles.length === 0) {
    return obstacles;
  }

  const maxDistance = 15;
  const result: Obstacle[] = [];
  const obsLen = obstacles.length;

  for (let i = 0; i < obsLen; i++) {
    const obs = obstacles[i];
    if (!obs) continue;
    result.push(tryMoveObstacle(obs, head, snake, obstacles, gridSize, maxDistance));
  }

  return result;
}

/**
 * Create strategic walls to trap or block the player
 */
export function createStrategicWalls(
  obstacles: Obstacle[],
  snake: Position[],
  bossSnake: Position[],
  gridSize: number,
): Obstacle[] {
  const head = snake[0];
  if (!head) {
    return obstacles;
  }

  const occupied = buildOccupiedSet(snake, bossSnake, obstacles);
  const newObstacles: Obstacle[] = [...obstacles];

  const wallPatterns = [
    [
      { x: head.x - 2, y: head.y + 3 },
      { x: head.x - 1, y: head.y + 3 },
      { x: head.x, y: head.y + 3 },
      { x: head.x + 1, y: head.y + 3 },
      { x: head.x + 2, y: head.y + 3 },
    ],
    [
      { x: head.x + 3, y: head.y - 2 },
      { x: head.x + 3, y: head.y - 1 },
      { x: head.x + 3, y: head.y },
      { x: head.x + 3, y: head.y + 1 },
      { x: head.x + 3, y: head.y + 2 },
    ],
  ];

  const selectedPattern = wallPatterns[Math.floor(Math.random() * wallPatterns.length)];
  if (!selectedPattern) return newObstacles;

  let added = 0;
  const patternLen = selectedPattern.length;

  for (let i = 0; i < patternLen; i++) {
    const pos = selectedPattern[i];
    if (!pos) continue;
    if (
      pos.x >= 0 &&
      pos.x < gridSize &&
      pos.y >= 0 &&
      pos.y < gridSize &&
      !occupied.has(`${pos.x},${pos.y}`) &&
      added < 3
    ) {
      newObstacles.push({
        id: `maze-wall-${Date.now()}-${i}`,
        position: pos,
        type: 'static',
      });
      occupied.add(`${pos.x},${pos.y}`);
      added++;
    }
  }

  return newObstacles;
}

/**
 * Check if a position is valid for barrier placement
 */
function isValidBarrierPosition(
  pos: Position,
  gridSize: number,
  occupied: Set<string>,
  playerSnake: Position[],
  minDistance: number,
): boolean {
  if (!isWithinBounds(pos.x, pos.y, gridSize)) {
    return false;
  }
  if (occupied.has(`${pos.x},${pos.y}`)) {
    return false;
  }
  return calculateDistanceFromSnake(pos, playerSnake) >= minDistance;
}

/**
 * Check if all pattern positions are valid
 */
function areAllPositionsValid(
  positions: Position[],
  gridSize: number,
  occupied: Set<string>,
  playerSnake: Position[],
  minDistance: number,
): boolean {
  const len = positions.length;
  for (let i = 0; i < len; i++) {
    const pos = positions[i];
    if (!pos || !isValidBarrierPosition(pos, gridSize, occupied, playerSnake, minDistance)) {
      return false;
    }
  }
  return true;
}

/**
 * Create barriers from valid pattern positions
 */
function createBarriersFromPositions(
  positions: Position[],
  occupied: Set<string>,
  timestamp: number,
): Obstacle[] {
  const barriers: Obstacle[] = [];
  const len = positions.length;
  for (let i = 0; i < len; i++) {
    const pos = positions[i];
    if (!pos) continue;
    barriers.push({
      id: `tetris-barrier-${timestamp}-${i}`,
      position: pos,
      type: 'static',
    });
    occupied.add(`${pos.x},${pos.y}`);
  }
  return barriers;
}

/**
 * Generate pattern positions with random offset
 */
function generatePatternPositions(
  pattern: { positions: Position[] },
  playerHead: Position,
): Position[] {
  const offsetX = Math.floor(Math.random() * 10) - 5;
  const offsetY = Math.floor(Math.random() * 10) + 5;

  return pattern.positions.map((pos: Position) => ({
    x: playerHead.x + offsetX + pos.x,
    y: playerHead.y + offsetY + pos.y,
  }));
}

/**
 * Create permanent Tetris-style barriers
 */
export function createTetrisBarriers(
  playerSnake: Position[],
  bossSnake: Position[],
  existingObstacles: Obstacle[],
  gridSize: number,
): Obstacle[] {
  const playerHead = playerSnake[0];
  if (!playerHead) {
    return [];
  }

  const simplePatterns = OBSTACLE_PATTERNS.filter(
    (p: { levelThreshold: number }) => p.levelThreshold <= 5,
  );
  if (simplePatterns.length === 0) {
    return [];
  }

  const selectedPattern = simplePatterns[Math.floor(Math.random() * simplePatterns.length)];
  if (!selectedPattern) return [];

  const occupied = buildOccupiedSet(playerSnake, bossSnake, existingObstacles);
  const minDistanceFromSnake = 6;
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const positions = generatePatternPositions(selectedPattern, playerHead);

    if (areAllPositionsValid(positions, gridSize, occupied, playerSnake, minDistanceFromSnake)) {
      return createBarriersFromPositions(positions, occupied, Date.now());
    }
  }

  return [];
}
