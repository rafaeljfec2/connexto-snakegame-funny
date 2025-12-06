import { PhaseLevelType } from '@/types/phases';

/**
 * Map PhaseLevelType to translation key
 */
export function getPhaseTranslationKey(phaseType: PhaseLevelType): string {
  const phaseKeyMap: Record<PhaseLevelType, string> = {
    [PhaseLevelType.CLASSIC]: 'classicSnake',
    [PhaseLevelType.OBSTACLE_COURSE]: 'obstacleCourse',
    [PhaseLevelType.MOVING_HAZARDS]: 'movingHazards',
    [PhaseLevelType.PORTAL_MASTERY]: 'portalMastery',
    [PhaseLevelType.SPEED_CHALLENGE]: 'speedChallenge',
    [PhaseLevelType.POWER_UP_CHAOS]: 'powerUpChaos',
    [PhaseLevelType.MAZE_MASTER]: 'mazeMaster',
    [PhaseLevelType.SURVIVAL_MODE]: 'survivalMode',
    [PhaseLevelType.VORTEX_CHALLENGE]: 'vortexChallenge',
    [PhaseLevelType.ULTIMATE_CHALLENGE]: 'ultimateChallenge',
  };
  return phaseKeyMap[phaseType] ?? 'classicSnake';
}

