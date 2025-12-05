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
  bossSnakeGrowth?: number; // For boss healing/growth abilities
  forceFoodType?: boolean; // Flag to force food type change
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
        // Create obstacles around the player snake (more strategic - in front of player)
        if (Math.random() < 0.25) {
          // 25% chance per frame to create obstacles
          const newObstacles = createObstaclesInPath(
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
        // Move obstacles towards the player (more aggressive)
        if (Math.random() < 0.4) {
          // 40% chance per frame - more frequent and visible
          const movedObstacles = moveObstaclesTowardsSnake(
            gameState.obstacles,
            gameState.snake,
            GAME_CONFIG.gridSize,
          );
          // Mark obstacles as moved by adding a flag in the ID or return full array
          if (movedObstacles.length > 0) {
            result.obstacles = movedObstacles;
          }
        }
        break;
      }

      case 'create_portals': {
        // Create portals dynamically (more strategic placement)
        if (Math.random() < 0.2) {
          // 20% chance per frame - more frequent
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
        // Increase game speed drastically (with variation)
        const speedMultiplier = 0.4 + Math.random() * 0.2; // 0.4-0.6 (2.5x to 1.67x faster)
        result.gameSpeed = Math.floor(gameState.gameSpeed * speedMultiplier);
        break;
      }

      case 'chaos_powerups': {
        // Alter food type randomly - force next food to be chaotic
        const types = [
          FoodType.NORMAL,
          FoodType.POISON,
          FoodType.SPEED_BOOST,
          FoodType.REVERSE_CONTROLS,
          FoodType.SLOW_DOWN,
          FoodType.BONUS_POINTS,
        ];
        result.foodType = types[Math.floor(Math.random() * types.length)] ?? FoodType.NORMAL;
        result.forceFoodType = true; // Flag to force this type
        break;
      }

      case 'maze_control': {
        // Create/remove maze walls (more strategic - create walls to trap player)
        if (Math.random() < 0.25) {
          // 25% chance per frame
          result.obstacles = createStrategicWalls(
            gameState.obstacles,
            gameState.snake,
            gameState.bossSnake?.positions ?? [],
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
        // Combine multiple abilities (use 2-3 abilities per activation)
        const abilities = [
          'create_obstacles',
          'create_portals',
          'speed_boost',
          'move_obstacles',
          'chaos_powerups',
        ];
        const numAbilities = 2 + Math.floor(Math.random() * 2); // 2-3 abilities
        const selectedAbilities = abilities.sort(() => Math.random() - 0.5).slice(0, numAbilities);

        selectedAbilities.forEach((abilityId) => {
          const tempBoss: Chef = {
            ...boss,
            abilities: [
              {
                id: abilityId,
                name: '',
                description: '',
                effect: () => {},
              },
            ],
          };
          const tempResult = processBossAbilities(tempBoss, gameState, abilityCooldowns);
          // Merge results
          if (tempResult.result.obstacles) {
            result.obstacles = [...(result.obstacles ?? []), ...tempResult.result.obstacles];
          }
          if (tempResult.result.portals) {
            result.portals = [...(result.portals ?? []), ...tempResult.result.portals];
          }
          if (tempResult.result.gameSpeed !== undefined) {
            result.gameSpeed = tempResult.result.gameSpeed;
          }
          if (tempResult.result.foodType) {
            result.foodType = tempResult.result.foodType;
            result.forceFoodType = tempResult.result.forceFoodType;
          }
        });
        break;
      }

      case 'all_abilities': {
        // Apply all abilities from previous bosses (but with reduced frequency)
        const allAbilities: BossAbility[] = [
          { id: 'create_obstacles', name: '', description: '', effect: () => {} },
          { id: 'move_obstacles', name: '', description: '', effect: () => {} },
          { id: 'create_portals', name: '', description: '', effect: () => {} },
          { id: 'speed_boost', name: '', description: '', effect: () => {} },
          { id: 'chaos_powerups', name: '', description: '', effect: () => {} },
          { id: 'maze_control', name: '', description: '', effect: () => {} },
          { id: 'life_drain', name: '', description: '', effect: () => {}, cooldown: 6000 },
        ];
        // Process 3-4 random abilities per frame (not all at once)
        const numToProcess = 3 + Math.floor(Math.random() * 2); // 3-4 abilities
        const selectedAbilities = allAbilities
          .sort(() => Math.random() - 0.5)
          .slice(0, numToProcess);

        selectedAbilities.forEach((ab) => {
          const tempBoss: Chef = { ...boss, abilities: [ab] };
          const tempResult = processBossAbilities(tempBoss, gameState, abilityCooldowns);
          // Merge results carefully
          if (tempResult.result.obstacles) {
            result.obstacles = [...(result.obstacles ?? []), ...tempResult.result.obstacles];
          }
          if (tempResult.result.portals) {
            result.portals = [...(result.portals ?? []), ...tempResult.result.portals];
          }
          if (tempResult.result.gameSpeed !== undefined) {
            // Use the most extreme speed modification
            if (result.gameSpeed === undefined || tempResult.result.gameSpeed < result.gameSpeed) {
              result.gameSpeed = tempResult.result.gameSpeed;
            }
          }
          if (tempResult.result.lives !== undefined) {
            result.lives = tempResult.result.lives;
          }
          if (tempResult.result.foodType) {
            result.foodType = tempResult.result.foodType;
            result.forceFoodType = tempResult.result.forceFoodType;
          }
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
 * Create obstacles in the player's path (more strategic)
 */
function createObstaclesInPath(
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

  // Calculate direction the snake is moving
  const dx = head.x - second.x;
  const dy = head.y - second.y;

  // Create obstacles 2-3 steps ahead in the direction of movement
  const aheadPositions: Position[] = [];
  for (let i = 2; i <= 4; i++) {
    const pos: Position = {
      x: head.x + dx * i,
      y: head.y + dy * i,
    };
    if (pos.x >= 0 && pos.x < gridSize && pos.y >= 0 && pos.y < gridSize) {
      aheadPositions.push(pos);
    }
  }

  // Also create obstacles to the sides of the path
  const sidePositions: Position[] = [];
  if (dx === 0) {
    // Moving vertically, block sides
    sidePositions.push({ x: head.x + 1, y: head.y + dy * 2 });
    sidePositions.push({ x: head.x - 1, y: head.y + dy * 2 });
  } else {
    // Moving horizontally, block sides
    sidePositions.push({ x: head.x + dx * 2, y: head.y + 1 });
    sidePositions.push({ x: head.x + dx * 2, y: head.y - 1 });
  }

  [...aheadPositions, ...sidePositions].forEach((pos, index) => {
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

  return newObstacles.slice(0, 3); // Limit to 3 obstacles
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
  if (!head || obstacles.length === 0) {
    return obstacles;
  }

  // Only move obstacles that are within a certain distance (more strategic)
  const maxDistance = 15; // Only move obstacles within 15 cells

  return obstacles.map((obs) => {
    const dx = head.x - obs.position.x;
    const dy = head.y - obs.position.y;
    const distance = Math.abs(dx) + Math.abs(dy);

    // Only move obstacles that are reasonably close
    if (distance > maxDistance || distance === 0) {
      return obs;
    }

    // Calculate movement direction (1 step towards player)
    const newX = obs.position.x + (dx > 0 ? 1 : dx < 0 ? -1 : 0);
    const newY = obs.position.y + (dy > 0 ? 1 : dy < 0 ? -1 : 0);

    if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
      // Check if new position is not on snake or another obstacle
      const onSnake = snake.some((seg) => seg.x === newX && seg.y === newY);
      const onOtherObstacle = obstacles.some(
        (otherObs) =>
          otherObs.id !== obs.id && otherObs.position.x === newX && otherObs.position.y === newY,
      );

      if (!onSnake && !onOtherObstacle) {
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
 * Create strategic walls to trap or block the player
 */
function createStrategicWalls(
  obstacles: Obstacle[],
  snake: Position[],
  bossSnake: Position[],
  gridSize: number,
): Obstacle[] {
  const head = snake[0];
  if (!head) {
    return obstacles;
  }

  const occupied = new Set<string>();
  obstacles.forEach((obs) => {
    occupied.add(`${obs.position.x},${obs.position.y}`);
  });
  snake.forEach((seg) => {
    occupied.add(`${seg.x},${seg.y}`);
  });
  bossSnake.forEach((seg) => {
    occupied.add(`${seg.x},${seg.y}`);
  });

  const newObstacles: Obstacle[] = [...obstacles];

  // Create a wall pattern around the player (but not too close)
  // Create a partial wall to limit movement options
  const wallPatterns = [
    // Horizontal wall
    [
      { x: head.x - 2, y: head.y + 3 },
      { x: head.x - 1, y: head.y + 3 },
      { x: head.x, y: head.y + 3 },
      { x: head.x + 1, y: head.y + 3 },
      { x: head.x + 2, y: head.y + 3 },
    ],
    // Vertical wall
    [
      { x: head.x + 3, y: head.y - 2 },
      { x: head.x + 3, y: head.y - 1 },
      { x: head.x + 3, y: head.y },
      { x: head.x + 3, y: head.y + 1 },
      { x: head.x + 3, y: head.y + 2 },
    ],
  ];

  const selectedPattern = wallPatterns[Math.floor(Math.random() * wallPatterns.length)];
  let added = 0;

  selectedPattern.forEach((pos, index) => {
    if (
      pos.x >= 0 &&
      pos.x < gridSize &&
      pos.y >= 0 &&
      pos.y < gridSize &&
      !occupied.has(`${pos.x},${pos.y}`) &&
      added < 3
    ) {
      newObstacles.push({
        id: `maze-wall-${Date.now()}-${index}`,
        position: pos,
        type: 'static',
      });
      occupied.add(`${pos.x},${pos.y}`);
      added++;
    }
  });

  // Limit total obstacles
  return newObstacles.slice(-OBSTACLE_CONFIG.maxObstacles * 10);
}
