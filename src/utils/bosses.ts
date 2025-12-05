import { Chef } from '@/types/phases';
import { GameState, Position } from '@/types/game';
import { getBossForLevel } from './phases';

/**
 * Check if boss should spawn at current level
 */
export function shouldSpawnBoss(level: number): boolean {
  return level % 5 === 0 && level <= 50;
}

/**
 * Get boss position (currently random, can be customized per boss)
 */
export function getBossPosition(
  boss: Chef,
  snake: Position[],
  obstacles: Position[],
  gridSize: number,
): Position | null {
  // Boss appears at a random position, avoiding snake and obstacles
  const maxAttempts = 50;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const position: Position = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize),
    };

    // Check if position is occupied by snake
    const isSnakePosition = snake.some(
      (segment) => segment.x === position.x && segment.y === position.y,
    );

    // Check if position is occupied by obstacles
    const isObstaclePosition = obstacles.some(
      (obs) => obs.x === position.x && obs.y === position.y,
    );

    if (!isSnakePosition && !isObstaclePosition) {
      return position;
    }
  }

  // Fallback: return center if no valid position found
  return { x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) };
}

/**
 * Check collision with boss
 */
export function hasBossCollision(snakeHead: Position, bossPosition: Position | null): boolean {
  if (!bossPosition) {
    return false;
  }
  return snakeHead.x === bossPosition.x && snakeHead.y === bossPosition.y;
}

/**
 * Handle boss defeat (when snake collides with boss)
 */
export function handleBossDefeat(
  boss: Chef,
  gameState: GameState,
): { scoreIncrease: number; message: string } {
  // Different rewards based on boss phase
  const baseScore = 100 * boss.phase;
  const message = `Chef ${boss.name} derrotado! +${baseScore} pontos`;

  return {
    scoreIncrease: baseScore,
    message,
  };
}

/**
 * Get boss for level
 */
export function getBossByLevel(level: number): Chef | undefined {
  return getBossForLevel(level);
}
