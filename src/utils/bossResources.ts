import { Obstacle, Portal, Position } from '@/types/game';
import { Chef } from '@/types/phases';
import { GAME_CONFIG } from '@/constants/game';
import { generateObstacles } from './obstacles';
import { generatePortalPair } from './portals';
import { getPhaseByBoss } from './phases';

/**
 * Generate initial resources for boss when it spawns
 */
export function generateBossInitialResources(
  boss: Chef,
  playerSnake: Position[],
  existingObstacles: Obstacle[],
  existingPortals: Portal[],
  gridSize: number,
): { obstacles: Obstacle[]; portals: Portal[] } {
  const phase = getPhaseByBoss(boss);
  const phaseConfig = phase?.config;

  let obstacles = [...existingObstacles];
  let portals = [...existingPortals];

  // Generate obstacles if phase allows and boss needs them
  if (phaseConfig?.obstaclesEnabled && GAME_CONFIG.enableObstacles) {
    // Generate multiple obstacle patterns to ensure boss has resources
    const numPatterns = 3 + Math.floor(Math.random() * 3); // 3-5 patterns
    for (let i = 0; i < numPatterns; i++) {
      const newObstacles = generateObstacles(
        boss.phase * 5, // Use boss phase level (5 levels per phase)
        playerSnake,
        obstacles,
        gridSize,
        phaseConfig.obstaclesEnabled,
        phaseConfig.obstaclesFrequency,
      );
      if (newObstacles.length > obstacles.length) {
        obstacles = newObstacles;
      }
    }
  }

  // Generate portals if phase allows and boss needs them
  if (phaseConfig?.portalsEnabled && portals.length < 4) {
    // Generate 1-2 portal pairs for boss to use
    const numPairs = 1 + Math.floor(Math.random() * 2); // 1-2 pairs
    for (let i = 0; i < numPairs; i++) {
      const portalPair = generatePortalPair(playerSnake, obstacles, gridSize);
      if (portalPair) {
        portals = [...portals, ...portalPair];
      }
    }
  }

  return { obstacles, portals };
}
