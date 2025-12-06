import { PhaseType, PhaseLevelType, Chef } from '@/types/phases';

/**
 * Phase configurations - 10 phases with 5 levels each (50 levels total)
 */
export const PHASES: PhaseType[] = [
  {
    id: 1,
    name: 'Classic Snake',
    description: 'O jogo clássico sem obstáculos. Perfeito para começar!',
    levelRange: [1, 5],
    type: PhaseLevelType.CLASSIC,
    chefId: 'classic',
    config: {
      obstaclesEnabled: false,
      obstaclesFrequency: 0,
      obstaclesType: 'static',
      portalsEnabled: false,
      portalsFrequency: 0,
      powerUpsFrequency: 0.1,
      speedModifier: 1.0,
      timedFoodEnabled: false,
      timedFoodFrequency: 0,
      mazePattern: 'none',
    },
  },
  {
    id: 2,
    name: 'Obstacle Course',
    description: 'Obstáculos estáticos aparecem. Cuidado com as paredes!',
    levelRange: [6, 10],
    type: PhaseLevelType.OBSTACLE_COURSE,
    chefId: 'guardian',
    config: {
      obstaclesEnabled: true,
      obstaclesFrequency: 0.3,
      obstaclesType: 'static',
      portalsEnabled: false,
      portalsFrequency: 0,
      powerUpsFrequency: 0.15,
      speedModifier: 0.95,
      timedFoodEnabled: false,
      timedFoodFrequency: 0,
      mazePattern: 'none',
    },
  },
  {
    id: 3,
    name: 'Moving Hazards',
    description: 'Obstáculos que se movem pelo grid. Fique alerta!',
    levelRange: [11, 15],
    type: PhaseLevelType.MOVING_HAZARDS,
    chefId: 'challenger',
    config: {
      obstaclesEnabled: true,
      obstaclesFrequency: 0.4,
      obstaclesType: 'moving',
      portalsEnabled: false,
      portalsFrequency: 0,
      powerUpsFrequency: 0.2,
      speedModifier: 0.9,
      timedFoodEnabled: true,
      timedFoodFrequency: 0.2,
      mazePattern: 'none',
    },
  },
  {
    id: 4,
    name: 'Portal Mastery',
    description: 'Domine o teletransporte através dos portais!',
    levelRange: [16, 20],
    type: PhaseLevelType.PORTAL_MASTERY,
    chefId: 'portal',
    config: {
      obstaclesEnabled: false,
      obstaclesFrequency: 0,
      obstaclesType: 'static',
      portalsEnabled: true,
      portalsFrequency: 0.4,
      powerUpsFrequency: 0.25,
      speedModifier: 0.85,
      timedFoodEnabled: true,
      timedFoodFrequency: 0.25,
      mazePattern: 'none',
    },
  },
  {
    id: 5,
    name: 'Speed Challenge',
    description: 'Alta velocidade e obstáculos complexos. Reação rápida necessária!',
    levelRange: [21, 25],
    type: PhaseLevelType.SPEED_CHALLENGE,
    chefId: 'speed',
    config: {
      obstaclesEnabled: false,
      obstaclesFrequency: 0,
      obstaclesType: 'both',
      portalsEnabled: true,
      portalsFrequency: 0.2,
      powerUpsFrequency: 0.3,
      speedModifier: 0.7,
      timedFoodEnabled: true,
      timedFoodFrequency: 0.3,
      mazePattern: 'none',
    },
  },
  {
    id: 6,
    name: 'Power-Up Chaos',
    description: 'Caos de power-ups! Use-os com sabedoria.',
    levelRange: [26, 30],
    type: PhaseLevelType.POWER_UP_CHAOS,
    chefId: 'chaos',
    config: {
      obstaclesEnabled: false,
      obstaclesFrequency: 0,
      obstaclesType: 'both',
      portalsEnabled: true,
      portalsFrequency: 0.3,
      powerUpsFrequency: 0.6,
      speedModifier: 0.8,
      timedFoodEnabled: true,
      timedFoodFrequency: 0.4,
      mazePattern: 'none',
    },
  },
  {
    id: 7,
    name: 'Maze Master',
    description: 'Labirintos complexos testarão suas habilidades de navegação.',
    levelRange: [31, 35],
    type: PhaseLevelType.MAZE_MASTER,
    chefId: 'architect',
    config: {
      obstaclesEnabled: false,
      obstaclesFrequency: 0,
      obstaclesType: 'static',
      portalsEnabled: true,
      portalsFrequency: 0.25,
      powerUpsFrequency: 0.35,
      speedModifier: 0.75,
      timedFoodEnabled: true,
      timedFoodFrequency: 0.35,
      mazePattern: 'complex',
    },
  },
  {
    id: 8,
    name: 'Survival Mode',
    description: 'Modo sobrevivência extremo. Cada movimento conta!',
    levelRange: [36, 40],
    type: PhaseLevelType.SURVIVAL_MODE,
    chefId: 'survivor',
    config: {
      obstaclesEnabled: false,
      obstaclesFrequency: 0,
      obstaclesType: 'moving',
      portalsEnabled: true,
      portalsFrequency: 0.2,
      powerUpsFrequency: 0.25,
      speedModifier: 0.65,
      timedFoodEnabled: true,
      timedFoodFrequency: 0.5,
      mazePattern: 'complex',
    },
  },
  {
    id: 9,
    name: 'Vortex Challenge',
    description: 'Múltiplas mecânicas combinadas. O desafio definitivo!',
    levelRange: [41, 45],
    type: PhaseLevelType.VORTEX_CHALLENGE,
    chefId: 'vortex',
    config: {
      obstaclesEnabled: false,
      obstaclesFrequency: 0,
      obstaclesType: 'both',
      portalsEnabled: true,
      portalsFrequency: 0.5,
      powerUpsFrequency: 0.5,
      speedModifier: 0.6,
      timedFoodEnabled: true,
      timedFoodFrequency: 0.5,
      mazePattern: 'dynamic',
    },
  },
  {
    id: 10,
    name: 'Ultimate Challenge',
    description: 'Todas as mecânicas combinadas. A prova final de maestria!',
    levelRange: [46, 50],
    type: PhaseLevelType.ULTIMATE_CHALLENGE,
    chefId: 'supreme',
    config: {
      obstaclesEnabled: true,
      obstaclesFrequency: 1.0,
      obstaclesType: 'both',
      portalsEnabled: true,
      portalsFrequency: 0.6,
      powerUpsFrequency: 0.7,
      speedModifier: 0.5,
      timedFoodEnabled: true,
      timedFoodFrequency: 0.6,
      mazePattern: 'dynamic',
    },
  },
];

/**
 * Bosses/Chefs - One for each phase
 */
export const CHEFS: Chef[] = [
  {
    id: 'classic',
    name: 'O Clássico',
    description: 'O primeiro chefe. Simples e direto.',
    phase: 1,
    abilities: [],
    behavior: 'random',
    initialLength: 3,
    visual: {
      color: '#22c55e',
      icon: '⚡',
      size: 1,
    },
  },
  {
    id: 'guardian',
    name: 'O Guardião',
    description: 'Defende um power-up de vida. Capture-o para derrotá-lo!',
    phase: 2,
    abilities: [
      {
        id: 'defend_flag',
        name: 'Defender Bandeira',
        description: 'Defende um power-up de vida especial que o jogador deve capturar',
        effect: () => {}, // Will be implemented
      },
      {
        id: 'create_temporary_barriers',
        name: 'Barreiras Temporárias',
        description: 'Cria barreiras temporárias que desaparecem com o tempo',
        effect: () => {}, // Will be implemented
        cooldown: 3000, // 3 seconds cooldown
      },
    ],
    behavior: 'flee', // Boss foge quando snake se aproxima
    initialLength: 4,
    visual: {
      color: '#3b82f6',
      icon: '🛡️',
      size: 1.2,
    },
  },
  {
    id: 'challenger',
    name: 'O Desafiador',
    description: 'Move obstáculos em direção à cobra.',
    phase: 3,
    abilities: [
      {
        id: 'move_obstacles',
        name: 'Mover Obstáculos',
        description: 'Move obstáculos em direção à cobra',
        effect: () => {},
      },
    ],
    behavior: 'chase',
    initialLength: 5,
    visual: {
      color: '#f59e0b',
      icon: '⚔️',
      size: 1.3,
    },
  },
  {
    id: 'portal',
    name: 'O Portal',
    description: 'Mestre dos portais e teletransporte.',
    phase: 4,
    abilities: [
      {
        id: 'create_portals',
        name: 'Criar Portais',
        description: 'Cria portais dinâmicos que teletransportam',
        effect: () => {},
      },
    ],
    behavior: 'random',
    initialLength: 5,
    visual: {
      color: '#8b5cf6',
      icon: '🌀',
      size: 1.4,
    },
  },
  {
    id: 'speed',
    name: 'O Veloz',
    description: 'Acelera o jogo drasticamente.',
    phase: 5,
    abilities: [
      {
        id: 'speed_boost',
        name: 'Aceleração',
        description: 'Aumenta drasticamente a velocidade do jogo',
        effect: () => {},
      },
    ],
    behavior: 'aggressive',
    initialLength: 6,
    visual: {
      color: '#ef4444',
      icon: '💨',
      size: 1.5,
    },
  },
  {
    id: 'chaos',
    name: 'O Caos',
    description: 'Altera tipos de power-ups aleatoriamente.',
    phase: 6,
    abilities: [
      {
        id: 'chaos_powerups',
        name: 'Caos de Power-Ups',
        description: 'Altera tipos de power-ups aleatoriamente',
        effect: () => {},
      },
    ],
    behavior: 'random',
    initialLength: 6,
    visual: {
      color: '#ec4899',
      icon: '🎲',
      size: 1.6,
    },
  },
  {
    id: 'architect',
    name: 'O Arquiteto',
    description: 'Cria e remove paredes do labirinto.',
    phase: 7,
    abilities: [
      {
        id: 'maze_control',
        name: 'Controle de Labirinto',
        description: 'Cria e remove paredes do labirinto',
        effect: () => {},
      },
    ],
    behavior: 'patrol',
    initialLength: 7,
    visual: {
      color: '#6366f1',
      icon: '🏗️',
      size: 1.7,
    },
  },
  {
    id: 'survivor',
    name: 'O Sobrevivente',
    description: 'Remove vidas periodicamente.',
    phase: 8,
    abilities: [
      {
        id: 'life_drain',
        name: 'Dreno de Vida',
        description: 'Remove uma vida a cada X segundos',
        effect: () => {},
        cooldown: 5000,
      },
    ],
    behavior: 'flee',
    initialLength: 7,
    visual: {
      color: '#dc2626',
      icon: '💀',
      size: 1.8,
    },
  },
  {
    id: 'vortex',
    name: 'O Vortex',
    description: 'Combina múltiplas habilidades.',
    phase: 9,
    abilities: [
      {
        id: 'multiple_abilities',
        name: 'Múltiplas Habilidades',
        description: 'Combina várias habilidades de bosses anteriores',
        effect: () => {},
      },
    ],
    behavior: 'aggressive',
    initialLength: 8,
    visual: {
      color: '#7c3aed',
      icon: '🌪️',
      size: 2.0,
    },
  },
  {
    id: 'supreme',
    name: 'O Supremo',
    description: 'O chefe final com todas as habilidades.',
    phase: 10,
    abilities: [
      {
        id: 'all_abilities',
        name: 'Todas as Habilidades',
        description: 'Possui todas as habilidades dos bosses anteriores',
        effect: () => {},
      },
    ],
    behavior: 'aggressive',
    initialLength: 10,
    visual: {
      color: '#fbbf24',
      icon: '👑',
      size: 2.5,
    },
  },
];

/**
 * Utility functions for phases
 */
export function getPhaseByLevel(level: number): PhaseType | undefined {
  return PHASES.find((phase) => level >= phase.levelRange[0] && level <= phase.levelRange[1]);
}

export function getChefByPhase(phase: number): Chef | undefined {
  return CHEFS.find((chef) => chef.phase === phase);
}

export function isBossLevel(level: number): boolean {
  // Boss appears at level 5 of each phase (levels 5, 10, 15, etc.)
  return level % 5 === 0 && level <= 50;
}

export function getChefByLevel(level: number): Chef | undefined {
  if (!isBossLevel(level)) {
    return undefined;
  }
  const phase = Math.floor((level - 1) / 5) + 1;
  return getChefByPhase(phase);
}

export function getCurrentPhaseNumber(level: number): number {
  return Math.floor((level - 1) / 5) + 1;
}
