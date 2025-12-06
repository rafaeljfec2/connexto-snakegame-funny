import { Position, Direction, Obstacle } from '@/types/game';
import { Chef } from '@/types/phases';
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
  _boss: Chef,
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
  _obstacles: Obstacle[],
  _food: Position,
  gridSize: number,
  guardianFlag?: Position | null,
): Direction {
  const behavior = boss.behavior ?? 'random';
  const bossHead = bossSnake.positions[0];
  const playerHead = playerSnake[0];

  if (!bossHead || !playerHead) {
    return bossSnake.direction;
  }

  // Mix independent movement with player-dependent behavior
  // Boss should have autonomous movement most of the time
  const independentChance = 0.4; // 40% chance to move independently

  switch (behavior) {
    case 'defend':
      // Defend the flag: position between player and flag
      if (guardianFlag) {
        return calculateDefendDirection(
          bossHead,
          playerHead,
          guardianFlag,
          bossSnake.direction,
          gridSize,
        );
      }
      // No flag yet, patrol
      return calculatePatrolDirection(bossSnake, gridSize);
    case 'chase':
      // Mix chase with independent patrol movement
      if (Math.random() < independentChance) {
        return calculatePatrolDirection(bossSnake, gridSize);
      }
      return calculateChaseDirection(bossHead, playerHead, bossSnake.direction, gridSize);
    case 'flee':
      // Mix flee with independent random movement
      if (Math.random() < independentChance) {
        return calculateRandomDirection(bossSnake.direction, gridSize);
      }
      return calculateFleeDirection(bossHead, playerHead, bossSnake.direction, gridSize);
    case 'aggressive':
      // Mix aggressive with independent movement
      if (Math.random() < independentChance) {
        return calculatePatrolDirection(bossSnake, gridSize);
      }
      return calculateAggressiveDirection(bossHead, playerHead, bossSnake, _obstacles, gridSize);
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
  _currentDirection: Direction,
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
  _currentDirection: Direction,
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
  _obstacles: Obstacle[],
  gridSize: number,
): Direction {
  // Try to predict player movement and cut them off
  // For now, just chase but more intelligently
  return calculateChaseDirection(bossHead, playerHead, bossSnake.direction, gridSize);
}

/**
 * Patrol behavior: Move in a pattern (more independent)
 */
function calculatePatrolDirection(bossSnake: BossSnake, _gridSize: number): Direction {
  // More active patrol: 25% chance to change direction, prefers continuing current direction
  if (Math.random() < 0.25) {
    // 25% chance to change direction
    const directions = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
    const validDirections = directions.filter((dir) =>
      isValidDirectionChange(bossSnake.direction, dir),
    );
    if (validDirections.length > 0) {
      // Prefer perpendicular turns for more interesting movement
      const perpendicularDirections = validDirections.filter(
        (dir) =>
          ((bossSnake.direction === Direction.UP || bossSnake.direction === Direction.DOWN) &&
            (dir === Direction.LEFT || dir === Direction.RIGHT)) ||
          ((bossSnake.direction === Direction.LEFT || bossSnake.direction === Direction.RIGHT) &&
            (dir === Direction.UP || dir === Direction.DOWN)),
      );
      const directionsToChoose =
        perpendicularDirections.length > 0 ? perpendicularDirections : validDirections;
      return (
        directionsToChoose[Math.floor(Math.random() * directionsToChoose.length)] ??
        bossSnake.direction
      );
    }
  }
  return bossSnake.direction;
}

/**
 * Random behavior: Move randomly (more independent)
 */
function calculateRandomDirection(currentDirection: Direction, _gridSize: number): Direction {
  // 30% chance to change direction - more active movement
  if (Math.random() < 0.3) {
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

/**
 * Defend behavior: Position between player and flag to protect it
 */
function calculateDefendDirection(
  bossHead: Position,
  playerHead: Position,
  flagPosition: Position,
  currentDirection: Direction,
  gridSize: number,
): Direction {
  // Calculate the midpoint between player and flag
  const midX = Math.floor((playerHead.x + flagPosition.x) / 2);
  const midY = Math.floor((playerHead.y + flagPosition.y) / 2);

  // Clamp to grid bounds
  const targetX = Math.max(0, Math.min(midX, gridSize - 1));
  const targetY = Math.max(0, Math.min(midY, gridSize - 1));

  // If boss is already close to the midpoint, patrol around the flag
  const distanceToMid = Math.abs(bossHead.x - targetX) + Math.abs(bossHead.y - targetY);
  if (distanceToMid <= 2) {
    // Close enough, circle around the flag
    return calculatePatrolAroundFlag(bossHead, flagPosition, currentDirection, gridSize);
  }

  // Move towards the midpoint (between player and flag)
  const dx = targetX - bossHead.x;
  const dy = targetY - bossHead.y;

  // Prefer horizontal movement if horizontal distance is greater
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0 && isValidDirectionChange(currentDirection, Direction.RIGHT)) {
      return Direction.RIGHT;
    }
    if (dx < 0 && isValidDirectionChange(currentDirection, Direction.LEFT)) {
      return Direction.LEFT;
    }
  }

  // Prefer vertical movement
  if (dy > 0 && isValidDirectionChange(currentDirection, Direction.DOWN)) {
    return Direction.DOWN;
  }
  if (dy < 0 && isValidDirectionChange(currentDirection, Direction.UP)) {
    return Direction.UP;
  }

  // Fallback: try any valid direction towards target
  const directions = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
  const validDirections = directions.filter((dir) => isValidDirectionChange(currentDirection, dir));
  if (validDirections.length > 0) {
    // Choose direction that gets closer to target
    let bestDir = validDirections[0];
    let bestDistance = Infinity;
    for (const dir of validDirections) {
      const nextPos = getNextHeadPosition(bossHead, dir, gridSize);
      const dist = Math.abs(nextPos.x - targetX) + Math.abs(nextPos.y - targetY);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestDir = dir;
      }
    }
    return bestDir ?? currentDirection;
  }

  return currentDirection;
}

/**
 * Patrol around the flag in a circular pattern
 */
function calculatePatrolAroundFlag(
  bossHead: Position,
  flagPosition: Position,
  currentDirection: Direction,
  _gridSize: number,
): Direction {
  // Calculate relative position to flag
  const dx = bossHead.x - flagPosition.x;
  const dy = bossHead.y - flagPosition.y;

  // Try to move in a circle around the flag
  // Priority: move perpendicular to the line from flag to boss
  if (Math.abs(dx) > Math.abs(dy)) {
    // More horizontal offset, try to move vertically
    if (dy >= 0 && isValidDirectionChange(currentDirection, Direction.UP)) {
      return Direction.UP;
    }
    if (dy < 0 && isValidDirectionChange(currentDirection, Direction.DOWN)) {
      return Direction.DOWN;
    }
  } else {
    // More vertical offset, try to move horizontally
    if (dx >= 0 && isValidDirectionChange(currentDirection, Direction.LEFT)) {
      return Direction.LEFT;
    }
    if (dx < 0 && isValidDirectionChange(currentDirection, Direction.RIGHT)) {
      return Direction.RIGHT;
    }
  }

  // Fallback: random valid direction
  const directions = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
  const validDirections = directions.filter((dir) => isValidDirectionChange(currentDirection, dir));
  if (validDirections.length > 0) {
    return validDirections[Math.floor(Math.random() * validDirections.length)] ?? currentDirection;
  }

  return currentDirection;
}
