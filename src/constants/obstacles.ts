import { Position } from '@/types/game';

export interface ObstaclePattern {
  name: string;
  positions: Position[];
  levelThreshold: number; // Minimum level to spawn
}

export const OBSTACLE_PATTERNS: ObstaclePattern[] = [
  // Tetris-inspired patterns
  {
    name: 'Dot (I)',
    levelThreshold: 1, // Available from level 1
    positions: [{ x: 0, y: 0 }], // Single block (1x1)
  },
  {
    name: 'Line (3 blocks horizontal)',
    levelThreshold: 1, // Available from level 1
    positions: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ],
  },
  {
    name: 'Line (3 blocks vertical)',
    levelThreshold: 1, // Available from level 1
    positions: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
    ],
  },
  {
    name: 'Square (2x2)',
    levelThreshold: 4,
    positions: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  },
  {
    name: 'L Shape (right)',
    levelThreshold: 5,
    positions: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
  },
  {
    name: 'L Shape (left)',
    levelThreshold: 5,
    positions: [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 0, y: 2 },
    ],
  },
  {
    name: 'T Shape (up)',
    levelThreshold: 6,
    positions: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
    ],
  },
  {
    name: 'T Shape (down)',
    levelThreshold: 6,
    positions: [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
  },
  {
    name: 'Z Shape (horizontal)',
    levelThreshold: 7,
    positions: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
  },
  {
    name: 'S Shape (horizontal)',
    levelThreshold: 7,
    positions: [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  },
];

export const OBSTACLE_CONFIG = {
  // Chance to spawn obstacles (higher = more frequent)
  spawnChance: 1.0, // 100% chance - always spawn when conditions are met
  // Minimum spacing from snake (any segment)
  minDistanceFromSnake: 8,
  // Spawn interval in milliseconds (how often to try spawning obstacles during gameplay)
  spawnInterval: 1500, // Spawn obstacles every 1.5 seconds during gameplay (very fast)
  // Maximum number of obstacles allowed on screen at once (performance optimization)
  maxObstacles: 150, // Limit to prevent memory issues
} as const;
