import { GameState, Position } from '@/types/game';

/**
 * Check if two positions are equal
 */
export function positionsEqual(a: Position | undefined, b: Position | undefined): boolean {
  if (!a || !b) return a === b;
  return a.x === b.x && a.y === b.y;
}

/**
 * Check if arrays of positions are equal
 */
export function positionArraysEqual(a: Position[], b: Position[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!positionsEqual(a[i], b[i])) return false;
  }
  return true;
}

/**
 * Convert Position[] to Float32Array for efficient transfer
 */
export function positionsToTypedArray(positions: Position[]): Float32Array {
  const array = new Float32Array(positions.length * 2);
  for (let i = 0; i < positions.length; i++) {
    array[i * 2] = positions[i].x;
    array[i * 2 + 1] = positions[i].y;
  }
  return array;
}

/**
 * Check if food has changed
 */
function hasFoodChanged(
  prevFood: GameState['food'] | undefined,
  currentFood: GameState['food'],
): boolean {
  if (prevFood === currentFood) {
    return false;
  }

  if (!prevFood || !currentFood) {
    return true;
  }

  return (
    prevFood.position.x !== currentFood.position.x ||
    prevFood.position.y !== currentFood.position.y ||
    prevFood.type !== currentFood.type
  );
}

/**
 * Check if combo has changed
 */
function hasComboChanged(
  prevCombo: GameState['combo'] | undefined,
  currentCombo: GameState['combo'],
): boolean {
  if (prevCombo === currentCombo) {
    return false;
  }

  return (
    prevCombo?.count !== currentCombo.count || prevCombo?.multiplier !== currentCombo.multiplier
  );
}

/**
 * Check if array/object has changed using JSON comparison
 */
function hasComplexValueChanged<T>(prev: T | undefined, current: T | undefined): boolean {
  if (prev === current) {
    return false;
  }

  return JSON.stringify(prev) !== JSON.stringify(current);
}

/**
 * Check if simple primitive value has changed
 */
function hasSimpleValueChanged<T>(prev: T | undefined, current: T): boolean {
  return prev !== current;
}

/**
 * Process simple primitive value changes
 */
function processSimpleValueChanges(
  prev: Partial<GameState>,
  current: GameState,
  delta: Partial<GameState>,
): void {
  if (hasSimpleValueChanged(prev.direction, current.direction)) {
    delta.direction = current.direction;
  }
  if (hasSimpleValueChanged(prev.nextDirection, current.nextDirection)) {
    delta.nextDirection = current.nextDirection;
  }
  if (hasSimpleValueChanged(prev.status, current.status)) {
    delta.status = current.status;
  }
  if (hasSimpleValueChanged(prev.score, current.score)) {
    delta.score = current.score;
  }
  if (hasSimpleValueChanged(prev.highScore, current.highScore)) {
    delta.highScore = current.highScore;
  }
  if (hasSimpleValueChanged(prev.level, current.level)) {
    delta.level = current.level;
  }
  if (hasSimpleValueChanged(prev.gameSpeed, current.gameSpeed)) {
    delta.gameSpeed = current.gameSpeed;
  }
  if (hasSimpleValueChanged(prev.lives, current.lives)) {
    delta.lives = current.lives;
  }
  if (hasSimpleValueChanged(prev.isSpeedBoosted, current.isSpeedBoosted)) {
    delta.isSpeedBoosted = current.isSpeedBoosted;
  }
  if (hasSimpleValueChanged(prev.isFiringPoison, current.isFiringPoison)) {
    delta.isFiringPoison = current.isFiringPoison;
  }
  if (hasSimpleValueChanged(prev.currentPhase, current.currentPhase)) {
    delta.currentPhase = current.currentPhase;
  }
  if (hasSimpleValueChanged(prev.phaseLevelType, current.phaseLevelType)) {
    delta.phaseLevelType = current.phaseLevelType;
  }
}

/**
 * Process complex array/object value changes
 */
function processComplexValueChanges(
  prev: Partial<GameState>,
  current: GameState,
  delta: Partial<GameState>,
): void {
  if (hasComplexValueChanged(prev.obstacles, current.obstacles)) {
    delta.obstacles = current.obstacles;
  }
  if (hasComplexValueChanged(prev.portals, current.portals)) {
    delta.portals = current.portals;
  }
  if (hasComplexValueChanged(prev.poisonShots, current.poisonShots)) {
    delta.poisonShots = current.poisonShots;
  }
  if (hasComplexValueChanged(prev.activePowerUps, current.activePowerUps)) {
    delta.activePowerUps = current.activePowerUps;
  }
  if (hasComplexValueChanged(prev.bossSnake, current.bossSnake)) {
    delta.bossSnake = current.bossSnake;
  }
  if (hasComplexValueChanged(prev.guardianFlag, current.guardianFlag)) {
    delta.guardianFlag = current.guardianFlag;
  }
  if (hasComplexValueChanged(prev.achievements, current.achievements)) {
    delta.achievements = current.achievements;
  }
}

/**
 * Process special value changes (snake, food, combo, activeBoss)
 */
function processSpecialValueChanges(
  prev: Partial<GameState>,
  current: GameState,
  delta: Partial<GameState>,
): void {
  if (prev.snake !== current.snake && !positionArraysEqual(prev.snake ?? [], current.snake)) {
    delta.snake = current.snake;
  }

  if (hasFoodChanged(prev.food, current.food)) {
    delta.food = current.food;
  }

  if (hasComboChanged(prev.combo, current.combo)) {
    delta.combo = current.combo;
  }

  if (prev.activeBoss?.id !== current.activeBoss?.id) {
    delta.activeBoss = current.activeBoss;
  }
}

/**
 * Compute delta between previous and current state
 */
export function computeDelta(
  prev: Partial<GameState> | null,
  current: GameState,
): Partial<GameState> {
  if (!prev) {
    return current;
  }

  const delta: Partial<GameState> = {};

  processSpecialValueChanges(prev, current, delta);
  processSimpleValueChanges(prev, current, delta);
  processComplexValueChanges(prev, current, delta);

  return delta;
}

/**
 * Shallow copy helper for state tracking
 */
export function shallowCopyState(state: GameState): Partial<GameState> {
  return {
    snake: state.snake,
    food: state.food,
    direction: state.direction,
    nextDirection: state.nextDirection,
    status: state.status,
    score: state.score,
    highScore: state.highScore,
    level: state.level,
    gameSpeed: state.gameSpeed,
    lives: state.lives,
    obstacles: state.obstacles,
    portals: state.portals,
    poisonShots: state.poisonShots,
    activePowerUps: state.activePowerUps,
    combo: state.combo,
    currentPhase: state.currentPhase,
    phaseLevelType: state.phaseLevelType,
    activeBoss: state.activeBoss,
    bossSnake: state.bossSnake,
    guardianFlag: state.guardianFlag,
    isSpeedBoosted: state.isSpeedBoosted,
    isFiringPoison: state.isFiringPoison,
    achievements: state.achievements,
  };
}
