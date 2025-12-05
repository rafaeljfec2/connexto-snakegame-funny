import { GameState, Obstacle, Portal, Position, FoodType } from '@/types/game';
import { Chef, BossAbility } from '@/types/phases';
import { GAME_CONFIG } from '@/constants/game';
import { generateObstacles } from './obstacles';
import { generatePortalPair } from './portals';
import { loseLife } from './lives';
import { OBSTACLE_PATTERNS, OBSTACLE_CONFIG } from '@/constants/obstacles';

export interface BossAbilityResult {
  obstacles?: Obstacle[];
  portals?: Portal[];
  gameSpeed?: number;
  lives?: number;
  foodType?: FoodType;
  message?: string;
}

/**
 * Process boss abilities and return their effects
 */
export function processBossAbilities(
  boss: Chef,
  gameState: GameState,
  abilityCooldowns: Map<string, number>,
): { result: BossAbilityResult; updatedCooldowns: Map<string, number> } {
  const result: BossAbilityResult = {};
  const updatedCooldowns = new Map(abilityCooldowns);
  const now = Date.now();

  boss.abilities.forEach((ability) => {
    // Check cooldown
    const lastUsed = abilityCooldowns.get(ability.id);
    if (lastUsed && ability.cooldown) {
      const elapsed = now - lastUsed;
      if (elapsed < ability.cooldown) {
        return; // Still on cooldown
      }
    }

    // Process ability based on ID
    switch (ability.id) {
      case 'create_obstacles': {
        // Create obstacles around the player snake
        if (Math.random() < 0.3) {
          // 30% chance per frame to create obstacles
          const newObstacles = createObstaclesAroundSnake(
            gameState.snake,
            gameState.obstacles,
            gameState.bossSnake?.positions ?? [],
            GAME_CONFIG.gridSize,
          );
          if (newObstacles.length > 0) {
            result.obstacles = [...(result.obstacles ?? []), ...newObstacles];
          }
        }
        break;
      }

      case 'move_obstacles': {
        // Move obstacles towards the player
        if (Math.random() < 0.2) {
          // 20% chance per frame
          result.obstacles = moveObstaclesTowardsSnake(
            gameState.obstacles,
            gameState.snake,
            GAME_CONFIG.gridSize,
          );
        }
        break;
      }

      case 'create_portals': {
        // Create portals dynamically
        if (Math.random() < 0.15) {
          // 15% chance per frame
          const portalPair = generatePortalPair(
            gameState.snake,
            gameState.obstacles,
            GAME_CONFIG.gridSize,
          );
          if (portalPair) {
            result.portals = [...(result.portals ?? []), ...portalPair];
          }
        }
        break;
      }

      case 'speed_boost': {
        // Increase game speed drastically
        result.gameSpeed = Math.floor(gameState.gameSpeed * 0.5); // 2x faster
        break;
      }

      case 'chaos_powerups': {
        // Alter food type randomly (will be applied when food is generated)
        const types = [
          FoodType.NORMAL,
          FoodType.POISON,
          FoodType.SPEED_BOOST,
          FoodType.REVERSE_CONTROLS,
        ];
        result.foodType = types[Math.floor(Math.random() * types.length)] ?? FoodType.NORMAL;
        break;
      }

      case 'maze_control': {
        // Create/remove maze walls
        if (Math.random() < 0.2) {
          result.obstacles = toggleMazeWalls(
            gameState.obstacles,
            gameState.snake,
            GAME_CONFIG.gridSize,
          );
        }
        break;
      }

      case 'life_drain': {
        // Remove life periodically (with cooldown)
        if (!lastUsed || now - lastUsed >= (ability.cooldown ?? 5000)) {
          if (gameState.lives > 0) {
            result.lives = Math.max(0, gameState.lives - 1);
            result.message = 'Boss drenou uma vida!';
            updatedCooldowns.set(ability.id, now);
          }
        }
        break;
      }

      case 'multiple_abilities': {
        // Combine multiple abilities (randomly pick one)
        const abilities = ['create_obstacles', 'create_portals', 'speed_boost'];
        const randomAbility = abilities[Math.floor(Math.random() * abilities.length)];
        // Recursively process one of the abilities
        if (randomAbility) {
          const tempBoss: Chef = {
            ...boss,
            abilities: [
              {
                id: randomAbility,
                name: '',
                description: '',
                effect: () => {},
              },
            ],
          };
          const tempResult = processBossAbilities(tempBoss, gameState, abilityCooldowns);
          Object.assign(result, tempResult.result);
        }
        break;
      }

      case 'all_abilities': {
        // Apply all abilities from previous bosses
        const allAbilities: BossAbility[] = [
          { id: 'create_obstacles', name: '', description: '', effect: () => {} },
          { id: 'move_obstacles', name: '', description: '', effect: () => {} },
          { id: 'create_portals', name: '', description: '', effect: () => {} },
          { id: 'speed_boost', name: '', description: '', effect: () => {} },
          { id: 'life_drain', name: '', description: '', effect: () => {}, cooldown: 8000 },
        ];
        allAbilities.forEach((ab) => {
          const tempBoss: Chef = { ...boss, abilities: [ab] };
          const tempResult = processBossAbilities(tempBoss, gameState, abilityCooldowns);
          Object.assign(result, tempResult.result);
        });
        break;
      }

      default:
        break;
    }

    // Update cooldown if ability was used
    if (ability.cooldown && !lastUsed) {
      updatedCooldowns.set(ability.id, now);
    }
  });

  return { result, updatedCooldowns };
}

/**
 * Create obstacles around the snake
 */
function createObstaclesAroundSnake(
  snake: Position[],
  existingObstacles: Obstacle[],
  bossSnake: Position[],
  gridSize: number,
): Obstacle[] {
  const head = snake[0];
  if (!head) {
    return [];
  }

  const newObstacles: Obstacle[] = [];
  const occupied = new Set<string>();
  existingObstacles.forEach((obs) => {
    occupied.add(`${obs.position.x},${obs.position.y}`);
  });
  snake.forEach((seg) => {
    occupied.add(`${seg.x},${seg.y}`);
  });
  bossSnake.forEach((seg) => {
    occupied.add(`${seg.x},${seg.y}`);
  });

  // Create obstacles in a ring around the snake head
  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: 1, y: 1 },
    { x: -1, y: -1 },
    { x: 1, y: -1 },
    { x: -1, y: 1 },
  ];

  directions.forEach((dir, index) => {
    const pos: Position = {
      x: head.x + dir.x * 2,
      y: head.y + dir.y * 2,
    };

    if (
      pos.x >= 0 &&
      pos.x < gridSize &&
      pos.y >= 0 &&
      pos.y < gridSize &&
      !occupied.has(`${pos.x},${pos.y}`)
    ) {
      newObstacles.push({
        id: `boss-obstacle-${Date.now()}-${index}`,
        position: pos,
        type: 'static',
      });
      occupied.add(`${pos.x},${pos.y}`);
    }
  });

  return newObstacles.slice(0, 4); // Limit to 4 obstacles
}

/**
 * Move obstacles towards the snake
 */
function moveObstaclesTowardsSnake(
  obstacles: Obstacle[],
  snake: Position[],
  gridSize: number,
): Obstacle[] {
  const head = snake[0];
  if (!head) {
    return obstacles;
  }

  return obstacles.map((obs) => {
    const dx = head.x - obs.position.x;
    const dy = head.y - obs.position.y;

    const newX = obs.position.x + (dx > 0 ? 1 : dx < 0 ? -1 : 0);
    const newY = obs.position.y + (dy > 0 ? 1 : dy < 0 ? -1 : 0);

    if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
      // Check if new position is not on snake
      const onSnake = snake.some((seg) => seg.x === newX && seg.y === newY);
      if (!onSnake) {
        return {
          ...obs,
          position: { x: newX, y: newY },
          type: 'moving' as const,
        };
      }
    }

    return obs;
  });
}

/**
 * Toggle maze walls (create/remove)
 */
function toggleMazeWalls(obstacles: Obstacle[], snake: Position[], gridSize: number): Obstacle[] {
  // Simple implementation: randomly add or remove obstacles
  if (Math.random() < 0.5 && obstacles.length < 30) {
    // Add obstacle
    const availablePatterns = OBSTACLE_PATTERNS.filter((p) => p.levelThreshold <= 10);
    if (availablePatterns.length > 0) {
      const pattern = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
      const offsetX = Math.floor(Math.random() * (gridSize - 10));
      const offsetY = Math.floor(Math.random() * (gridSize - 10));

      const newObstacles: Obstacle[] = [];
      pattern.positions.forEach((pos, index) => {
        const finalPos: Position = {
          x: pos.x + offsetX,
          y: pos.y + offsetY,
        };

        if (finalPos.x >= 0 && finalPos.x < gridSize && finalPos.y >= 0 && finalPos.y < gridSize) {
          const onSnake = snake.some((seg) => seg.x === finalPos.x && seg.y === finalPos.y);
          if (!onSnake) {
            newObstacles.push({
              id: `maze-${Date.now()}-${index}`,
              position: finalPos,
              type: 'static',
            });
          }
        }
      });

      return [...obstacles, ...newObstacles].slice(-OBSTACLE_CONFIG.maxObstacles * 10);
    }
  } else if (obstacles.length > 5) {
    // Remove random obstacle
    const indexToRemove = Math.floor(Math.random() * obstacles.length);
    return obstacles.filter((_, index) => index !== indexToRemove);
  }

  return obstacles;
}
