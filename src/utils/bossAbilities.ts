import { GameState, Obstacle, Portal, Position, FoodType, Direction } from '@/types/game';
import { Chef, BossAbility } from '@/types/phases';
import { GAME_CONFIG } from '@/constants/game';
import { generatePortalPair } from './portals';
import { OBSTACLE_PATTERNS } from '@/constants/obstacles';

export interface BossAbilityResult {
  obstacles?: Obstacle[];
  portals?: Portal[];
  gameSpeed?: number;
  lives?: number;
  foodType?: FoodType;
  message?: string;
  bossSnakeGrowth?: number; // For boss healing/growth abilities
  forceFoodType?: boolean; // Flag to force food type change
  guardianFlag?: import('@/types/game').Food | null; // Special flag food for Guardian boss
  guardianFlagSide?: -1 | 1; // Which side the flag is on (-1 = left, 1 = right)
}

/**
 * Handle defend_flag ability
 */
function handleDefendFlag(gameState: GameState, result: BossAbilityResult): void {
  if (!gameState.bossSnake || gameState.bossSnake.positions.length === 0) {
    return;
  }

  const bossHead = gameState.bossSnake.positions[0];
  const flagSide = gameState.guardianFlagSide ?? (Math.random() < 0.5 ? -1 : 1);
  const flagOffset = getFlagOffsetFromBossHead(gameState.bossSnake.direction, flagSide);
  const flagPosition: Position = {
    x: Math.max(0, Math.min(bossHead.x + flagOffset.x, GAME_CONFIG.gridSize - 1)),
    y: Math.max(0, Math.min(bossHead.y + flagOffset.y, GAME_CONFIG.gridSize - 1)),
  };

  const isOnBossBody = gameState.bossSnake.positions.some(
    (pos) => pos.x === flagPosition.x && pos.y === flagPosition.y,
  );
  if (!isOnBossBody) {
    result.guardianFlag = {
      position: flagPosition,
      type: FoodType.EXTRA_LIFE,
      spawnTime: Date.now(),
      duration: undefined,
    };
    result.guardianFlagSide = flagSide;
  }
}

/**
 * Handle create_temporary_barriers ability
 */
function handleCreateTemporaryBarriers(
  gameState: GameState,
  abilityId: string,
  abilityCooldowns: Map<string, number>,
  now: number,
  result: BossAbilityResult,
  updatedCooldowns: Map<string, number>,
): void {
  const lastUsed = abilityCooldowns.get(abilityId);
  const cooldown = 3000;
  if (lastUsed && now - lastUsed < cooldown) {
    return;
  }

  if (Math.random() < 0.3) {
    const newBarriers = createTetrisBarriers(
      gameState.snake,
      gameState.bossSnake?.positions ?? [],
      gameState.obstacles,
      GAME_CONFIG.gridSize,
    );
    if (newBarriers.length > 0) {
      result.obstacles = [...(result.obstacles ?? []), ...newBarriers];
      updatedCooldowns.set(abilityId, now);
    }
  }
}

/**
 * Handle create_obstacles ability
 */
function handleCreateObstacles(
  gameState: GameState,
  abilityId: string,
  abilityCooldowns: Map<string, number>,
  now: number,
  result: BossAbilityResult,
  updatedCooldowns: Map<string, number>,
): void {
  const lastUsed = abilityCooldowns.get(abilityId);
  const cooldown = 2000;
  if (lastUsed && now - lastUsed < cooldown) {
    return;
  }

  if (Math.random() < 0.12) {
    const newObstacles = createObstaclesInPath(
      gameState.snake,
      gameState.obstacles,
      gameState.bossSnake?.positions ?? [],
      GAME_CONFIG.gridSize,
    );
    if (newObstacles.length > 0) {
      result.obstacles = [...(result.obstacles ?? []), ...newObstacles];
      updatedCooldowns.set(abilityId, now);
    }
  }
}

/**
 * Handle move_obstacles ability
 */
function handleMoveObstacles(gameState: GameState, result: BossAbilityResult): void {
  if (Math.random() >= 0.4) {
    return;
  }

  const movedObstacles = moveObstaclesTowardsSnake(
    gameState.obstacles,
    gameState.snake,
    GAME_CONFIG.gridSize,
  );
  if (movedObstacles.length > 0) {
    result.obstacles = movedObstacles;
  }
}

/**
 * Handle create_portals ability
 */
function handleCreatePortals(gameState: GameState, result: BossAbilityResult): void {
  if (Math.random() >= 0.2) {
    return;
  }

  const portalPair = generatePortalPair(gameState.snake, gameState.obstacles, GAME_CONFIG.gridSize);
  if (portalPair) {
    result.portals = [...(result.portals ?? []), ...portalPair];
  }
}

/**
 * Handle speed_boost ability
 */
function handleSpeedBoost(gameState: GameState, result: BossAbilityResult): void {
  const speedMultiplier = 0.4 + Math.random() * 0.2;
  result.gameSpeed = Math.floor(gameState.gameSpeed * speedMultiplier);
}

/**
 * Handle chaos_powerups ability
 */
function handleChaosPowerups(result: BossAbilityResult): void {
  const types = [
    FoodType.NORMAL,
    FoodType.POISON,
    FoodType.SPEED_BOOST,
    FoodType.REVERSE_CONTROLS,
    FoodType.SLOW_DOWN,
    FoodType.BONUS_POINTS,
  ];
  result.foodType = types[Math.floor(Math.random() * types.length)] ?? FoodType.NORMAL;
  result.forceFoodType = true;
}

/**
 * Handle maze_control ability
 */
function handleMazeControl(gameState: GameState, result: BossAbilityResult): void {
  if (Math.random() < 0.25) {
    result.obstacles = createStrategicWalls(
      gameState.obstacles,
      gameState.snake,
      gameState.bossSnake?.positions ?? [],
      GAME_CONFIG.gridSize,
    );
  }
}

/**
 * Handle life_drain ability
 */
function handleLifeDrain(
  gameState: GameState,
  abilityId: string,
  abilityCooldowns: Map<string, number>,
  abilityCooldown: number | undefined,
  now: number,
  result: BossAbilityResult,
  updatedCooldowns: Map<string, number>,
): void {
  const lastUsed = abilityCooldowns.get(abilityId);
  const cooldown = abilityCooldown ?? 5000;
  if (lastUsed && now - lastUsed < cooldown) {
    return;
  }

  if (gameState.lives > 0) {
    result.lives = Math.max(0, gameState.lives - 1);
    result.message = 'Boss drenou uma vida!';
    updatedCooldowns.set(abilityId, now);
  }
}

/**
 * Merge ability results into main result
 */
function mergeAbilityResults(source: BossAbilityResult, target: BossAbilityResult): void {
  if (source.obstacles) {
    target.obstacles = [...(target.obstacles ?? []), ...source.obstacles];
  }
  if (source.portals) {
    target.portals = [...(target.portals ?? []), ...source.portals];
  }
  if (source.gameSpeed !== undefined) {
    target.gameSpeed = source.gameSpeed;
  }
  if (source.foodType) {
    target.foodType = source.foodType;
    target.forceFoodType = source.forceFoodType;
  }
}

/**
 * Handle multiple_abilities ability
 */
function handleMultipleAbilities(
  boss: Chef,
  gameState: GameState,
  abilityCooldowns: Map<string, number>,
  result: BossAbilityResult,
): void {
  const abilities = [
    'create_obstacles',
    'create_portals',
    'speed_boost',
    'move_obstacles',
    'chaos_powerups',
  ];
  const numAbilities = 2 + Math.floor(Math.random() * 2);
  const shuffled = [...abilities].sort(() => Math.random() - 0.5);
  const selectedAbilities = shuffled.slice(0, numAbilities);

  selectedAbilities.forEach((abilityId: string) => {
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
    mergeAbilityResults(tempResult.result, result);
  });
}

/**
 * Handle all_abilities ability
 */
function handleAllAbilities(
  boss: Chef,
  gameState: GameState,
  abilityCooldowns: Map<string, number>,
  result: BossAbilityResult,
): void {
  const allAbilities: BossAbility[] = [
    { id: 'create_obstacles', name: '', description: '', effect: () => {} },
    { id: 'move_obstacles', name: '', description: '', effect: () => {} },
    { id: 'create_portals', name: '', description: '', effect: () => {} },
    { id: 'speed_boost', name: '', description: '', effect: () => {} },
    { id: 'chaos_powerups', name: '', description: '', effect: () => {} },
    { id: 'maze_control', name: '', description: '', effect: () => {} },
    { id: 'life_drain', name: '', description: '', effect: () => {}, cooldown: 6000 },
  ];
  const numToProcess = 3 + Math.floor(Math.random() * 2);
  const shuffled = [...allAbilities].sort(() => Math.random() - 0.5);
  const selectedAbilities = shuffled.slice(0, numToProcess);

  selectedAbilities.forEach((ab: BossAbility) => {
    const tempBoss: Chef = { ...boss, abilities: [ab] };
    const tempResult = processBossAbilities(tempBoss, gameState, abilityCooldowns);
    mergeAbilityResults(tempResult.result, result);
    if (tempResult.result.gameSpeed !== undefined) {
      if (result.gameSpeed === undefined || tempResult.result.gameSpeed < result.gameSpeed) {
        result.gameSpeed = tempResult.result.gameSpeed;
      }
    }
    if (tempResult.result.lives !== undefined) {
      result.lives = tempResult.result.lives;
    }
  });
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
      case 'defend_flag':
        handleDefendFlag(gameState, result);
        break;

      case 'create_temporary_barriers':
        handleCreateTemporaryBarriers(
          gameState,
          ability.id,
          abilityCooldowns,
          now,
          result,
          updatedCooldowns,
        );
        break;

      case 'create_obstacles':
        handleCreateObstacles(
          gameState,
          ability.id,
          abilityCooldowns,
          now,
          result,
          updatedCooldowns,
        );
        break;

      case 'move_obstacles':
        handleMoveObstacles(gameState, result);
        break;

      case 'create_portals':
        handleCreatePortals(gameState, result);
        break;

      case 'speed_boost':
        handleSpeedBoost(gameState, result);
        break;

      case 'chaos_powerups':
        handleChaosPowerups(result);
        break;

      case 'maze_control':
        handleMazeControl(gameState, result);
        break;

      case 'life_drain':
        handleLifeDrain(
          gameState,
          ability.id,
          abilityCooldowns,
          ability.cooldown,
          now,
          result,
          updatedCooldowns,
        );
        break;

      case 'multiple_abilities':
        handleMultipleAbilities(boss, gameState, abilityCooldowns, result);
        break;

      case 'all_abilities':
        handleAllAbilities(boss, gameState, abilityCooldowns, result);
        break;

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
 * Calculate distance from snake for a position
 */
function calculateDistanceFromSnake(pos: Position, snake: Position[]): number {
  return snake.reduce((minDist, segment) => {
    const distance = Math.abs(pos.x - segment.x) + Math.abs(pos.y - segment.y);
    return Math.min(minDist, distance);
  }, Infinity);
}

/**
 * Check if position is valid and has minimum distance from snake
 */
function isValidObstaclePosition(
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
    // Moving vertically, block one side only
    if (Math.random() < 0.5) {
      sidePositions.push({ x: head.x + 1, y: head.y + dy * 5 });
    } else {
      sidePositions.push({ x: head.x - 1, y: head.y + dy * 5 });
    }
  } else if (Math.random() < 0.5) {
    // Moving horizontally, block one side only
    sidePositions.push({ x: head.x + dx * 5, y: head.y + 1 });
  } else {
    sidePositions.push({ x: head.x + dx * 5, y: head.y - 1 });
  }
  return sidePositions;
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

  [...aheadPositions, ...validSidePositions].forEach((pos, index) => {
    if (
      pos.x >= 0 &&
      pos.x < gridSize &&
      pos.y >= 0 &&
      pos.y < gridSize &&
      !occupied.has(`${pos.x},${pos.y}`) &&
      newObstacles.length < 2
    ) {
      newObstacles.push({
        id: `boss-obstacle-${Date.now()}-${index}`,
        position: pos,
        type: 'static',
      });
      occupied.add(`${pos.x},${pos.y}`);
    }
  });

  return newObstacles;
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
    const xDirection = dx > 0 ? 1 : dx < 0 ? -1 : 0;
    const yDirection = dy > 0 ? 1 : dy < 0 ? -1 : 0;
    const newX = obs.position.x + xDirection;
    const newY = obs.position.y + yDirection;

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

  // Don't limit obstacles - let them accumulate permanently on screen
  return newObstacles;
}

/**
 * Build occupied positions set
 */
function buildOccupiedSet(
  playerSnake: Position[],
  bossSnake: Position[],
  obstacles: Obstacle[],
): Set<string> {
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
  return occupied;
}

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
 * Create permanent Tetris-style barriers (no longer temporary)
 */
function createTetrisBarriers(
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

  // Check minimum distance from any snake segment
  const minDistanceFromSnake = 6; // Minimum distance for barriers

  // Select a random Tetris pattern (simple patterns only for barriers)
  const simplePatterns = OBSTACLE_PATTERNS.filter(
    (p: { levelThreshold: number }) => p.levelThreshold <= 5,
  );
  if (simplePatterns.length === 0) {
    return [];
  }

  const selectedPattern = simplePatterns[Math.floor(Math.random() * simplePatterns.length)];

  // Try to place the pattern at a safe distance from player
  const attempts = 10;
  for (let attempt = 0; attempt < attempts; attempt++) {
    // Calculate offset to place pattern ahead of player
    const offsetX = Math.floor(Math.random() * 10) - 5; // -5 to 5
    const offsetY = Math.floor(Math.random() * 10) + 5; // 5 to 15 (ahead)

    const patternPositions: Position[] = selectedPattern.positions.map((pos: Position) => ({
      x: playerHead.x + offsetX + pos.x,
      y: playerHead.y + offsetY + pos.y,
    }));

    // Check if all positions are valid
    let isValid = true;
    for (const pos of patternPositions) {
      if (pos.x < 0 || pos.x >= gridSize || pos.y < 0 || pos.y >= gridSize) {
        isValid = false;
        break;
      }

      // Check minimum distance from any snake segment
      const distanceFromSnake = playerSnake.reduce((minDist, segment) => {
        const distance = Math.abs(pos.x - segment.x) + Math.abs(pos.y - segment.y);
        return Math.min(minDist, distance);
      }, Infinity);

      if (distanceFromSnake < minDistanceFromSnake || occupied.has(`${pos.x},${pos.y}`)) {
        isValid = false;
        break;
      }
    }

    if (isValid) {
      // Add all positions from the pattern
      patternPositions.forEach((pos, index) => {
        barriers.push({
          id: `tetris-barrier-${now}-${index}`,
          position: pos,
          type: 'static', // Permanent, not temporary
        });
        occupied.add(`${pos.x},${pos.y}`);
      });
      break; // Successfully placed pattern
    }
  }

  return barriers;
}
