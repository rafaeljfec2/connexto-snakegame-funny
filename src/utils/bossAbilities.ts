import { GameState, Obstacle, Portal, Position, FoodType, Direction } from '@/types/game';
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
  guardianFlag?: Food | null; // Special flag food for Guardian boss
  guardianFlagSide?: -1 | 1; // Which side the flag is on (-1 = left, 1 = right)
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
      case 'defend_flag': {
        // Guardian boss: Flag is attached to the boss (follows boss position)
        // The flag should be positioned relative to the boss head (to the side)
        if (gameState.bossSnake && gameState.bossSnake.positions.length > 0) {
          const bossHead = gameState.bossSnake.positions[0];
          // Use existing flag side or randomly choose one
          const flagSide = gameState.guardianFlagSide ?? (Math.random() < 0.5 ? -1 : 1);
          // Flag is positioned to the side of the boss head (perpendicular to movement)
          const flagOffset = getFlagOffsetFromBossHead(gameState.bossSnake.direction, flagSide);
          const flagPosition: Position = {
            x: Math.max(0, Math.min(bossHead.x + flagOffset.x, GAME_CONFIG.gridSize - 1)),
            y: Math.max(0, Math.min(bossHead.y + flagOffset.y, GAME_CONFIG.gridSize - 1)),
          };

          // Only create flag if position is valid and not occupied by boss body
          const isOnBossBody = gameState.bossSnake.positions.some(
            (pos) => pos.x === flagPosition.x && pos.y === flagPosition.y,
          );
          if (!isOnBossBody) {
            result.guardianFlag = {
              position: flagPosition,
              type: FoodType.EXTRA_LIFE,
              spawnTime: Date.now(),
              duration: undefined, // Flag doesn't expire
            };
            // Store the side so it stays consistent
            result.guardianFlagSide = flagSide;
          }
        }
        break;
      }

      case 'create_temporary_barriers': {
        // Create temporary barriers that disappear after a few seconds
        const lastUsed = abilityCooldowns.get(ability.id);
        const cooldown = ability.cooldown ?? 3000;
        if (!lastUsed || now - lastUsed >= cooldown) {
          // 30% chance per frame to create barriers
          if (Math.random() < 0.3) {
            const newBarriers = createTemporaryBarriers(
              gameState.snake,
              gameState.bossSnake?.positions ?? [],
              gameState.obstacles,
              GAME_CONFIG.gridSize,
            );
            if (newBarriers.length > 0) {
              result.obstacles = [...(result.obstacles ?? []), ...newBarriers];
              updatedCooldowns.set(ability.id, now);
            }
          }
        }
        break;
      }

      case 'create_obstacles': {
        // Create obstacles around the player snake (mid level - less aggressive)
        // Check cooldown first
        const lastUsed = abilityCooldowns.get(ability.id);
        const cooldown = ability.cooldown ?? 2000;
        if (!lastUsed || now - lastUsed >= cooldown) {
          // Lower frequency - 12% chance per frame (mid level difficulty)
          if (Math.random() < 0.12) {
            const newObstacles = createObstaclesInPath(
              gameState.snake,
              gameState.obstacles,
              gameState.bossSnake?.positions ?? [],
              GAME_CONFIG.gridSize,
            );
            if (newObstacles.length > 0) {
              result.obstacles = [...(result.obstacles ?? []), ...newObstacles];
              updatedCooldowns.set(ability.id, now);
            }
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

  // Create obstacles 3-4 steps ahead (further away - gives player time to react)
  const aheadPositions: Position[] = [];
  for (let i = 3; i <= 4; i++) {
    const pos: Position = {
      x: head.x + dx * i,
      y: head.y + dy * i,
    };
    if (pos.x >= 0 && pos.x < gridSize && pos.y >= 0 && pos.y < gridSize) {
      aheadPositions.push(pos);
    }
  }

  // Create only ONE obstacle to the side (not both) - leaves escape route
  const sidePositions: Position[] = [];
  if (dx === 0) {
    // Moving vertically, block one side only
    if (Math.random() < 0.5) {
      sidePositions.push({ x: head.x + 1, y: head.y + dy * 3 });
    } else {
      sidePositions.push({ x: head.x - 1, y: head.y + dy * 3 });
    }
  } else {
    // Moving horizontally, block one side only
    if (Math.random() < 0.5) {
      sidePositions.push({ x: head.x + dx * 3, y: head.y + 1 });
    } else {
      sidePositions.push({ x: head.x + dx * 3, y: head.y - 1 });
    }
  }

  // Combine and limit to 1-2 obstacles max (mid level - not too aggressive)
  [...aheadPositions, ...sidePositions].forEach((pos, index) => {
    if (
      pos.x >= 0 &&
      pos.x < gridSize &&
      pos.y >= 0 &&
      pos.y < gridSize &&
      !occupied.has(`${pos.x},${pos.y}`) &&
      newObstacles.length < 2 // Limit to 2 obstacles max
    ) {
      newObstacles.push({
        id: `boss-obstacle-${Date.now()}-${index}`,
        position: pos,
        type: 'static',
      });
      occupied.add(`${pos.x},${pos.y}`);
    }
  });

  return newObstacles; // Return 1-2 obstacles max
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

  const occupied = new Set<string>();
  playerSnake.forEach((seg) => {
    occupied.add(`${seg.x},${seg.y}`);
  });
  bossSnake.forEach((seg) => {
    occupied.add(`${seg.x},${seg.y}`);
  });
  obstacles.forEach((obs) => {
    occupied.add(`${obs.position.x},${obs.position.y}`);
  });

  // Try to place flag in center area, but away from player
  const centerX = Math.floor(gridSize / 2);
  const centerY = Math.floor(gridSize / 2);

  // Generate positions in a spiral from center, avoiding player
  const candidates: Position[] = [];
  for (let radius = 0; radius < Math.floor(gridSize / 2); radius++) {
    for (let x = centerX - radius; x <= centerX + radius; x++) {
      for (let y = centerY - radius; y <= centerY + radius; y++) {
        if (x >= 0 && x < gridSize && y >= 0 && y < gridSize && !occupied.has(`${x},${y}`)) {
          // Prefer positions that are at least 5 cells away from player
          const distanceFromPlayer = Math.abs(x - playerHead.x) + Math.abs(y - playerHead.y);
          if (distanceFromPlayer >= 5) {
            candidates.push({ x, y });
          }
        }
      }
    }
    if (candidates.length > 0) {
      break; // Found some candidates
    }
  }

  if (candidates.length === 0) {
    // Fallback: any available position
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        if (!occupied.has(`${x},${y}`)) {
          candidates.push({ x, y });
        }
      }
    }
  }

  if (candidates.length > 0) {
    // Pick a random candidate
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
  // Position flag to the side (perpendicular to movement)
  // side: -1 = left, 1 = right

  switch (bossDirection) {
    case Direction.UP:
    case Direction.DOWN:
      // Moving vertically, place flag to the side (horizontal)
      return { x: side, y: 0 };
    case Direction.LEFT:
    case Direction.RIGHT:
      // Moving horizontally, place flag to the side (vertical)
      return { x: 0, y: side };
    default:
      return { x: 1, y: 0 }; // Default to right side
  }
}

/**
 * Create temporary barriers that disappear after a few seconds
 */
function createTemporaryBarriers(
  playerSnake: Position[],
  bossSnake: Position[],
  existingObstacles: Obstacle[],
  gridSize: number,
): Obstacle[] {
  const playerHead = playerSnake[0];
  if (!playerHead) {
    return [];
  }

  const occupied = new Set<string>();
  playerSnake.forEach((seg) => {
    occupied.add(`${seg.x},${seg.y}`);
  });
  bossSnake.forEach((seg) => {
    occupied.add(`${seg.x},${seg.y}`);
  });
  existingObstacles.forEach((obs) => {
    occupied.add(`${obs.position.x},${obs.position.y}`);
  });

  const barriers: Obstacle[] = [];
  const now = Date.now();
  const barrierDuration = 3000; // 3 seconds

  // Create 2-3 barriers in the path between player and boss
  const barrierCount = 2 + Math.floor(Math.random() * 2); // 2-3 barriers

  for (let i = 0; i < barrierCount; i++) {
    // Create barriers 2-4 cells ahead of player
    const offsetX = Math.floor(Math.random() * 5) - 2; // -2 to 2
    const offsetY = Math.floor(Math.random() * 5) - 2; // -2 to 2

    const barrierX = Math.max(0, Math.min(playerHead.x + offsetX, gridSize - 1));
    const barrierY = Math.max(0, Math.min(playerHead.y + offsetY, gridSize - 1));

    if (!occupied.has(`${barrierX},${barrierY}`)) {
      barriers.push({
        id: `temp-barrier-${now}-${i}`,
        position: { x: barrierX, y: barrierY },
        type: 'temporary',
        expiresAt: now + barrierDuration,
      });
      occupied.add(`${barrierX},${barrierY}`);
    }
  }

  return barriers;
}
