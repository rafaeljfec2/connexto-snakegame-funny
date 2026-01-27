import { GameState, FoodType } from '@/types/game';
import { Chef, BossAbility } from '@/types/phases';
import { GAME_CONFIG } from '@/constants/game';
import { generatePortalPair } from '../portals';
import type { BossAbilityResult, AbilityProcessContext } from './bossAbilityTypes';
import { getFlagOffsetFromBossHead } from './bossGuardianUtils';
import {
  createObstaclesInPath,
  moveObstaclesTowardsSnake,
  createStrategicWalls,
  createTetrisBarriers,
} from './bossObstacleUtils';

/**
 * Handle defend_flag ability
 */
export function handleDefendFlag(gameState: GameState, result: BossAbilityResult): void {
  if (!gameState.bossSnake || gameState.bossSnake.positions.length === 0) {
    return;
  }

  const bossHead = gameState.bossSnake.positions[0];
  const flagSide = gameState.guardianFlagSide ?? (Math.random() < 0.5 ? -1 : 1);
  const flagOffset = getFlagOffsetFromBossHead(gameState.bossSnake.direction, flagSide);
  const flagPosition = {
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
export function handleCreateTemporaryBarriers(
  gameState: GameState,
  ctx: AbilityProcessContext,
  result: BossAbilityResult,
): void {
  const lastUsed = ctx.abilityCooldowns.get(ctx.abilityId);
  const cooldown = 3000;
  if (lastUsed && ctx.now - lastUsed < cooldown) {
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
      ctx.updatedCooldowns.set(ctx.abilityId, ctx.now);
    }
  }
}

/**
 * Handle create_obstacles ability
 */
export function handleCreateObstacles(
  gameState: GameState,
  ctx: AbilityProcessContext,
  result: BossAbilityResult,
): void {
  const lastUsed = ctx.abilityCooldowns.get(ctx.abilityId);
  const cooldown = 2000;
  if (lastUsed && ctx.now - lastUsed < cooldown) {
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
      ctx.updatedCooldowns.set(ctx.abilityId, ctx.now);
    }
  }
}

/**
 * Handle move_obstacles ability
 */
export function handleMoveObstacles(gameState: GameState, result: BossAbilityResult): void {
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
export function handleCreatePortals(gameState: GameState, result: BossAbilityResult): void {
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
export function handleSpeedBoost(gameState: GameState, result: BossAbilityResult): void {
  const speedMultiplier = 0.4 + Math.random() * 0.2;
  result.gameSpeed = Math.floor(gameState.gameSpeed * speedMultiplier);
}

/**
 * Handle chaos_powerups ability
 */
export function handleChaosPowerups(result: BossAbilityResult): void {
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
export function handleMazeControl(gameState: GameState, result: BossAbilityResult): void {
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
export function handleLifeDrain(
  gameState: GameState,
  ctx: AbilityProcessContext,
  result: BossAbilityResult,
): void {
  const lastUsed = ctx.abilityCooldowns.get(ctx.abilityId);
  const cooldown = ctx.abilityCooldown ?? 5000;
  if (lastUsed && ctx.now - lastUsed < cooldown) {
    return;
  }

  if (gameState.lives > 0) {
    result.lives = Math.max(0, gameState.lives - 1);
    result.message = 'Boss drenou uma vida!';
    ctx.updatedCooldowns.set(ctx.abilityId, ctx.now);
  }
}

/**
 * Merge ability results into main result
 */
export function mergeAbilityResults(source: BossAbilityResult, target: BossAbilityResult): void {
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
export function handleMultipleAbilities(
  boss: Chef,
  gameState: GameState,
  abilityCooldowns: Map<string, number>,
  result: BossAbilityResult,
  processFn: (
    boss: Chef,
    gameState: GameState,
    cooldowns: Map<string, number>,
  ) => { result: BossAbilityResult; updatedCooldowns: Map<string, number> },
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

  const len = selectedAbilities.length;
  for (let i = 0; i < len; i++) {
    const abilityId = selectedAbilities[i];
    if (!abilityId) continue;
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
    const tempResult = processFn(tempBoss, gameState, abilityCooldowns);
    mergeAbilityResults(tempResult.result, result);
  }
}

/**
 * Handle all_abilities ability
 */
export function handleAllAbilities(
  boss: Chef,
  gameState: GameState,
  abilityCooldowns: Map<string, number>,
  result: BossAbilityResult,
  processFn: (
    boss: Chef,
    gameState: GameState,
    cooldowns: Map<string, number>,
  ) => { result: BossAbilityResult; updatedCooldowns: Map<string, number> },
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

  const len = selectedAbilities.length;
  for (let i = 0; i < len; i++) {
    const ab = selectedAbilities[i];
    if (!ab) continue;
    const tempBoss: Chef = { ...boss, abilities: [ab] };
    const tempResult = processFn(tempBoss, gameState, abilityCooldowns);
    mergeAbilityResults(tempResult.result, result);
    if (tempResult.result.gameSpeed !== undefined) {
      if (result.gameSpeed === undefined || tempResult.result.gameSpeed < result.gameSpeed) {
        result.gameSpeed = tempResult.result.gameSpeed;
      }
    }
    if (tempResult.result.lives !== undefined) {
      result.lives = tempResult.result.lives;
    }
  }
}
