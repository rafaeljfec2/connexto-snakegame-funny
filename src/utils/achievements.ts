import { Achievement } from '@/types/game';
import { ACHIEVEMENT_DEFINITIONS, ACHIEVEMENT_STORAGE_KEY } from '@/constants/achievements';

export function loadAchievements(): Achievement[] {
  try {
    const stored = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return ACHIEVEMENT_DEFINITIONS.map((def) => {
        const storedAchievement = parsed.find((a: Achievement) => a.id === def.id);
        return storedAchievement || { ...def, unlocked: false };
      });
    }
  } catch (error) {
    console.error('Error loading achievements:', error);
  }

  return ACHIEVEMENT_DEFINITIONS.map((def) => ({
    ...def,
    unlocked: false,
  }));
}

export function saveAchievements(achievements: Achievement[]): void {
  try {
    localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(achievements));
  } catch (error) {
    console.error('Error saving achievements:', error);
  }
}

export function unlockAchievement(
  achievements: Achievement[],
  achievementId: string,
): Achievement[] {
  return achievements.map((achievement) => {
    if (achievement.id === achievementId && !achievement.unlocked) {
      return {
        ...achievement,
        unlocked: true,
        unlockedAt: Date.now(),
      };
    }
    return achievement;
  });
}

/**
 * Check and unlock a single achievement if condition is met
 */
function checkAndUnlockAchievement(
  achievements: Achievement[],
  achievementId: string,
  condition: boolean,
): { achievements: Achievement[]; unlocked: boolean } {
  if (!condition) {
    return { achievements, unlocked: false };
  }

  const achievement = achievements.find((a) => a.id === achievementId);
  if (achievement && !achievement.unlocked) {
    return {
      achievements: unlockAchievement(achievements, achievementId),
      unlocked: true,
    };
  }

  return { achievements, unlocked: false };
}

export function checkAchievements(
  achievements: Achievement[],
  gameState: {
    score: number;
    level: number;
    snakeLength: number;
    comboMultiplier: number;
    atePowerUp: boolean;
  },
): { achievements: Achievement[]; newlyUnlocked: string[] } {
  const newlyUnlocked: string[] = [];
  let updatedAchievements = [...achievements];

  const checks = [
    { id: 'score_100', condition: gameState.score >= 100 },
    { id: 'score_500', condition: gameState.score >= 500 },
    { id: 'level_5', condition: gameState.level >= 5 },
    { id: 'level_10', condition: gameState.level >= 10 },
    { id: 'combo_5', condition: gameState.comboMultiplier >= 5 },
    { id: 'snake_length_20', condition: gameState.snakeLength >= 20 },
    { id: 'eat_powerup', condition: gameState.atePowerUp },
  ];

  checks.forEach((check) => {
    const result = checkAndUnlockAchievement(updatedAchievements, check.id, check.condition);
    updatedAchievements = result.achievements;
    if (result.unlocked) {
      newlyUnlocked.push(check.id);
    }
  });

  return { achievements: updatedAchievements, newlyUnlocked };
}
