import { Position, Direction, Obstacle } from '@/types/game';
import { Chef, BossBehavior } from '@/types/phases';
import { BossSnake } from '@/types/game';
import { getNextHeadPosition, moveSnake, isValidDirectionChange } from './gameLogic';

/**
 * Initialize boss snake at a valid position
 */
export function initializeBossSnake(
  boss: Chef,
  playerSnake: Position[],
  obstacles: Obstacle[],
  gridSize: number,
): BossSnake | null {
  const initialLength = boss.initialLength ?? 3;
  const bossPositions = findValidBossSpawnPosition(
    boss,
    playerSnake,
    obstacles,
    gridSize,
    initialLength,
  );

  if (!bossPositions) {
    return null;
  }

  // Boss starts moving in a random direction
  const directions = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
  const initialDirection =
    directions[Math.floor(Math.random() * directions.length)] ?? Direction.RIGHT;

  return {
    positions: bossPositions,
    direction: initialDirection,
    nextDirection: initialDirection,
    initialLength,
  };
}

/**
 * Find a valid spawn position for boss snake
 */
function findValidBossSpawnPosition(
  boss: Chef,
  playerSnake: Position[],
  obstacles: Obstacle[],
  gridSize: number,
  length: number,
): Position[] | null {
  const maxAttempts = 100;
  const minDistanceFromPlayer = 8; // Minimum distance from player snake

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Try to spawn in a corner or edge area
    const spawnArea = attempt % 4;
    let startX: number;
    let startY: number;
    let direction: Direction;

    switch (spawnArea) {
      case 0: // Top-left area
        startX = Math.floor(Math.random() * (gridSize / 4));
        startY = Math.floor(Math.random() * (gridSize / 4));
        direction = Direction.RIGHT;
        break;
      case 1: // Top-right area
        startX = Math.floor((gridSize * 3) / 4) + Math.floor(Math.random() * (gridSize / 4));
        startY = Math.floor(Math.random() * (gridSize / 4));
        direction = Direction.LEFT;
        break;
      case 2: // Bottom-left area
        startX = Math.floor(Math.random() * (gridSize / 4));
        startY = Math.floor((gridSize * 3) / 4) + Math.floor(Math.random() * (gridSize / 4));
        direction = Direction.RIGHT;
        break;
      default: // Bottom-right area
        startX = Math.floor((gridSize * 3) / 4) + Math.floor(Math.random() * (gridSize / 4));
        startY = Math.floor((gridSize * 3) / 4) + Math.floor(Math.random() * (gridSize / 4));
        direction = Direction.LEFT;
        break;
    }

    // Generate snake positions
    const positions: Position[] = [];
    for (let i = 0; i < length; i++) {
      let x = startX;
      let y = startY;

      // Adjust based on direction
      if (direction === Direction.RIGHT) {
        x = startX - i;
      } else if (direction === Direction.LEFT) {
        x = startX + i;
      } else if (direction === Direction.DOWN) {
        y = startY - i;
      } else {
        y = startY + i;
      }

      // Ensure within bounds
      x = Math.max(0, Math.min(gridSize - 1, x));
      y = Math.max(0, Math.min(gridSize - 1, y));

      positions.push({ x, y });
    }

    // Check if all positions are valid
    const isValid = positions.every((pos) => {
      // Check bounds
      if (pos.x < 0 || pos.x >= gridSize || pos.y < 0 || pos.y >= gridSize) {
        return false;
      }

      // Check distance from player
      const playerHead = playerSnake[0];
      if (playerHead) {
        const distance = Math.abs(pos.x - playerHead.x) + Math.abs(pos.y - playerHead.y);
        if (distance < minDistanceFromPlayer) {
          return false;
        }
      }

      // Check collision with player snake
      const collidesWithPlayer = playerSnake.some(
        (segment) => segment.x === pos.x && segment.y === pos.y,
      );
      if (collidesWithPlayer) {
        return false;
      }

      // Check collision with obstacles
      const collidesWithObstacle = obstacles.some(
        (obstacle) => obstacle.position.x === pos.x && obstacle.position.y === pos.y,
      );
      if (collidesWithObstacle) {
        return false;
      }

      return true;
    });

    if (isValid) {
      return positions;
    }
  }

  // Fallback: try center area
  const centerX = Math.floor(gridSize / 2);
  const centerY = Math.floor(gridSize / 2);
  const positions: Position[] = [];

  for (let i = 0; i < length; i++) {
    positions.push({
      x: centerX + i,
      y: centerY,
    });
  }

  return positions;
}

/**
 * Calculate next direction for boss snake based on behavior
 */
export function calculateBossNextDirection(
  boss: Chef,
  bossSnake: BossSnake,
  playerSnake: Position[],
  obstacles: Obstacle[],
  food: Position,
  gridSize: number,
): Direction {
  const behavior = boss.behavior ?? 'random';
  const bossHead = bossSnake.positions[0];
  const playerHead = playerSnake[0];

  if (!bossHead || !playerHead) {
    return bossSnake.direction;
  }

  switch (behavior) {
    case 'chase':
      return calculateChaseDirection(bossHead, playerHead, bossSnake.direction, gridSize);
    case 'flee':
      return calculateFleeDirection(bossHead, playerHead, bossSnake.direction, gridSize);
    case 'aggressive':
      return calculateAggressiveDirection(bossHead, playerHead, bossSnake, obstacles, gridSize);
    case 'patrol':
      return calculatePatrolDirection(bossSnake, gridSize);
    case 'random':
    default:
      return calculateRandomDirection(bossSnake.direction, gridSize);
  }
}

/**
 * Chase behavior: Move towards player
 */
function calculateChaseDirection(
  bossHead: Position,
  playerHead: Position,
  currentDirection: Direction,
  gridSize: number,
): Direction {
  const dx = playerHead.x - bossHead.x;
  const dy = playerHead.y - bossHead.y;

  // Handle wrap-around (shortest path)
  let adjustedDx = dx;
  let adjustedDy = dy;

  if (Math.abs(dx) > gridSize / 2) {
    adjustedDx = dx > 0 ? dx - gridSize : dx + gridSize;
  }
  if (Math.abs(dy) > gridSize / 2) {
    adjustedDy = dy > 0 ? dy - gridSize : dy + gridSize;
  }

  // Prefer horizontal or vertical movement
  if (Math.abs(adjustedDx) > Math.abs(adjustedDy)) {
    return adjustedDx > 0 ? Direction.RIGHT : Direction.LEFT;
  } else {
    return adjustedDy > 0 ? Direction.DOWN : Direction.UP;
  }
}

/**
 * Flee behavior: Move away from player
 */
function calculateFleeDirection(
  bossHead: Position,
  playerHead: Position,
  currentDirection: Direction,
  gridSize: number,
): Direction {
  const dx = bossHead.x - playerHead.x;
  const dy = bossHead.y - playerHead.y;

  // Handle wrap-around
  let adjustedDx = dx;
  let adjustedDy = dy;

  if (Math.abs(dx) > gridSize / 2) {
    adjustedDx = dx > 0 ? dx - gridSize : dx + gridSize;
  }
  if (Math.abs(dy) > gridSize / 2) {
    adjustedDy = dy > 0 ? dy - gridSize : dy + gridSize;
  }

  // Move away
  if (Math.abs(adjustedDx) > Math.abs(adjustedDy)) {
    return adjustedDx > 0 ? Direction.RIGHT : Direction.LEFT;
  } else {
    return adjustedDy > 0 ? Direction.DOWN : Direction.UP;
  }
}

/**
 * Aggressive behavior: Try to cut off player
 */
function calculateAggressiveDirection(
  bossHead: Position,
  playerHead: Position,
  bossSnake: BossSnake,
  obstacles: Obstacle[],
  gridSize: number,
): Direction {
  // Try to predict player movement and cut them off
  // For now, just chase but more intelligently
  return calculateChaseDirection(bossHead, playerHead, bossSnake.direction, gridSize);
}

/**
 * Patrol behavior: Move in a pattern
 */
function calculatePatrolDirection(bossSnake: BossSnake, gridSize: number): Direction {
  // Simple patrol: continue in current direction, turn randomly sometimes
  if (Math.random() < 0.1) {
    // 10% chance to change direction
    const directions = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
    const validDirections = directions.filter((dir) =>
      isValidDirectionChange(bossSnake.direction, dir),
    );
    if (validDirections.length > 0) {
      return (
        validDirections[Math.floor(Math.random() * validDirections.length)] ?? bossSnake.direction
      );
    }
  }
  return bossSnake.direction;
}

/**
 * Random behavior: Move randomly
 */
function calculateRandomDirection(currentDirection: Direction, gridSize: number): Direction {
  // 20% chance to change direction
  if (Math.random() < 0.2) {
    const directions = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
    const validDirections = directions.filter((dir) =>
      isValidDirectionChange(currentDirection, dir),
    );
    if (validDirections.length > 0) {
      return (
        validDirections[Math.floor(Math.random() * validDirections.length)] ?? currentDirection
      );
    }
  }
  return currentDirection;
}

/**
 * Move boss snake
 */
export function moveBossSnake(
  bossSnake: BossSnake,
  nextDirection: Direction,
  gridSize: number,
): BossSnake {
  // Update direction
  const newDirection = isValidDirectionChange(bossSnake.direction, nextDirection)
    ? nextDirection
    : bossSnake.direction;

  // Move snake
  const newPositions = moveSnake(bossSnake.positions, newDirection, gridSize, false);

  return {
    ...bossSnake,
    positions: newPositions,
    direction: newDirection,
    nextDirection: newDirection,
  };
}

/**
 * Check collision between boss snake and player snake
 */
export function hasBossSnakeCollision(playerHead: Position, bossSnake: BossSnake): boolean {
  return bossSnake.positions.some(
    (segment) => segment.x === playerHead.x && segment.y === playerHead.y,
  );
}

/**
 * Check which part of boss snake was hit (head or body)
 * Returns 'head' if head was hit, 'body' if body was hit, or null if no collision
 */
export function getBossHitPart(playerHead: Position, bossSnake: BossSnake): 'head' | 'body' | null {
  if (!playerHead || bossSnake.positions.length === 0) {
    return null;
  }

  const bossHead = bossSnake.positions[0];

  // Check if hit head
  if (bossHead && playerHead.x === bossHead.x && playerHead.y === bossHead.y) {
    return 'head';
  }

  // Check if hit body (any segment except head)
  const hitBody = bossSnake.positions
    .slice(1)
    .some((segment) => segment.x === playerHead.x && segment.y === playerHead.y);

  return hitBody ? 'body' : null;
}

/**
 * Check collision between player snake and boss snake head
 */
export function hasPlayerHitBossHead(playerSnake: Position[], bossSnake: BossSnake): boolean {
  const playerHead = playerSnake[0];
  const bossHead = bossSnake.positions[0];

  if (!playerHead || !bossHead) {
    return false;
  }

  return playerHead.x === bossHead.x && playerHead.y === bossHead.y;
}

/**
 * Weaken boss by removing segments from tail
 * Returns new boss snake with reduced segments and points earned
 */
export function weakenBossSnake(
  bossSnake: BossSnake,
  segmentsToRemove: number = 2,
): { newBossSnake: BossSnake; pointsEarned: number } {
  const currentLength = bossSnake.positions.length;
  const newLength = Math.max(1, currentLength - segmentsToRemove);

  // Calculate points based on segments removed (more segments = more points)
  const pointsEarned = segmentsToRemove * 10;

  // Remove segments from tail
  const newPositions = bossSnake.positions.slice(0, newLength);

  return {
    newBossSnake: {
      ...bossSnake,
      positions: newPositions,
    },
    pointsEarned,
  };
}

/**
 * Check if boss can be defeated (must be weakened first)
 */
export function canDefeatBoss(bossSnake: BossSnake): boolean {
  // Boss can only be defeated when it has 3 or fewer segments
  return bossSnake.positions.length <= 3;
}
