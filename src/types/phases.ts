/**
 * Types and interfaces for the phase and boss system
 */

export enum PhaseLevelType {
  CLASSIC = 'CLASSIC',
  OBSTACLE_COURSE = 'OBSTACLE_COURSE',
  MOVING_HAZARDS = 'MOVING_HAZARDS',
  PORTAL_MASTERY = 'PORTAL_MASTERY',
  SPEED_CHALLENGE = 'SPEED_CHALLENGE',
  POWER_UP_CHAOS = 'POWER_UP_CHAOS',
  MAZE_MASTER = 'MAZE_MASTER',
  SURVIVAL_MODE = 'SURVIVAL_MODE',
  VORTEX_CHALLENGE = 'VORTEX_CHALLENGE',
  ULTIMATE_CHALLENGE = 'ULTIMATE_CHALLENGE',
}

import { GameState } from './game';

export interface BossAbility {
  id: string;
  name: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  effect: (gameState: GameState) => any; // Will be properly typed when integrated
  cooldown?: number;
}

export type BossBehavior = 'chase' | 'flee' | 'patrol' | 'random' | 'aggressive' | 'defend';

export interface Chef {
  id: string;
  name: string;
  description: string;
  phase: number; // Phase number (1-10)
  abilities: BossAbility[];
  visual: {
    color: string;
    icon?: string;
    size?: number;
  };
  health?: number; // Optional health system for bosses
  behavior?: BossBehavior; // AI behavior for boss snake
  initialLength?: number; // Initial snake length (default: 3)
}

export interface PhaseConfig {
  obstaclesEnabled: boolean;
  obstaclesFrequency: number; // 0-1
  obstaclesType: 'static' | 'moving' | 'both';
  portalsEnabled: boolean;
  portalsFrequency: number; // 0-1
  powerUpsFrequency: number; // 0-1
  speedModifier: number; // Multiplier for base speed (1.0 = normal)
  timedFoodEnabled: boolean;
  timedFoodFrequency: number; // 0-1
  mazePattern?: 'none' | 'simple' | 'complex' | 'dynamic';
}

export interface PhaseType {
  id: number; // Phase number (1-10)
  name: string;
  description: string;
  levelRange: [number, number]; // [start, end] inclusive
  type: PhaseLevelType;
  chefId: string;
  config: PhaseConfig;
}
