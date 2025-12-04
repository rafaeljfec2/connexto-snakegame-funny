import { Position } from "@/types/game";

export interface ObstaclePattern {
  name: string;
  positions: Position[];
  levelThreshold: number; // Minimum level to spawn
}

export const OBSTACLE_PATTERNS: ObstaclePattern[] = [
  {
    name: "Simple Wall",
    levelThreshold: 3,
    positions: [
      { x: 10, y: 10 },
      { x: 11, y: 10 },
      { x: 12, y: 10 },
    ],
  },
  {
    name: "L Shape",
    levelThreshold: 5,
    positions: [
      { x: 5, y: 5 },
      { x: 6, y: 5 },
      { x: 7, y: 5 },
      { x: 7, y: 6 },
      { x: 7, y: 7 },
    ],
  },
  {
    name: "Box",
    levelThreshold: 7,
    positions: [
      { x: 15, y: 15 },
      { x: 16, y: 15 },
      { x: 17, y: 15 },
      { x: 15, y: 16 },
      { x: 17, y: 16 },
      { x: 15, y: 17 },
      { x: 16, y: 17 },
      { x: 17, y: 17 },
    ],
  },
];

export const OBSTACLE_CONFIG = {
  // Chance to spawn obstacles at level threshold
  spawnChance: 0.7,
  // Maximum number of obstacles per level
  maxObstacles: 3,
  // Minimum spacing from snake start
  minDistanceFromStart: 5,
} as const;


