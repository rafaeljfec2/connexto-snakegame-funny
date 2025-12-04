import { Achievement } from "@/types/game";
import {
  ACHIEVEMENT_DEFINITIONS,
  ACHIEVEMENT_STORAGE_KEY,
} from "@/constants/achievements";

export function loadAchievements(): Achievement[] {
  try {
    const stored = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return ACHIEVEMENT_DEFINITIONS.map((def) => {
        const storedAchievement = parsed.find(
          (a: Achievement) => a.id === def.id
        );
        return storedAchievement || { ...def, unlocked: false };
      });
    }
  } catch (error) {
    console.error("Error loading achievements:", error);
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
    console.error("Error saving achievements:", error);
  }
}

export function unlockAchievement(
  achievements: Achievement[],
  achievementId: string
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

export function checkAchievements(
  achievements: Achievement[],
  gameState: {
    score: number;
    level: number;
    snakeLength: number;
    comboMultiplier: number;
    atePowerUp: boolean;
  }
): { achievements: Achievement[]; newlyUnlocked: string[] } {
  const newlyUnlocked: string[] = [];
  let updatedAchievements = [...achievements];

  // Check each achievement condition
  if (gameState.score >= 100) {
    const achievement = updatedAchievements.find((a) => a.id === "score_100");
    if (achievement && !achievement.unlocked) {
      updatedAchievements = unlockAchievement(updatedAchievements, "score_100");
      newlyUnlocked.push("score_100");
    }
  }

  if (gameState.score >= 500) {
    const achievement = updatedAchievements.find((a) => a.id === "score_500");
    if (achievement && !achievement.unlocked) {
      updatedAchievements = unlockAchievement(updatedAchievements, "score_500");
      newlyUnlocked.push("score_500");
    }
  }

  if (gameState.level >= 5) {
    const achievement = updatedAchievements.find((a) => a.id === "level_5");
    if (achievement && !achievement.unlocked) {
      updatedAchievements = unlockAchievement(updatedAchievements, "level_5");
      newlyUnlocked.push("level_5");
    }
  }

  if (gameState.level >= 10) {
    const achievement = updatedAchievements.find((a) => a.id === "level_10");
    if (achievement && !achievement.unlocked) {
      updatedAchievements = unlockAchievement(updatedAchievements, "level_10");
      newlyUnlocked.push("level_10");
    }
  }

  if (gameState.comboMultiplier >= 5) {
    const achievement = updatedAchievements.find((a) => a.id === "combo_5");
    if (achievement && !achievement.unlocked) {
      updatedAchievements = unlockAchievement(updatedAchievements, "combo_5");
      newlyUnlocked.push("combo_5");
    }
  }

  if (gameState.snakeLength >= 20) {
    const achievement = updatedAchievements.find(
      (a) => a.id === "snake_length_20"
    );
    if (achievement && !achievement.unlocked) {
      updatedAchievements = unlockAchievement(
        updatedAchievements,
        "snake_length_20"
      );
      newlyUnlocked.push("snake_length_20");
    }
  }

  if (gameState.atePowerUp) {
    const achievement = updatedAchievements.find((a) => a.id === "eat_powerup");
    if (achievement && !achievement.unlocked) {
      updatedAchievements = unlockAchievement(
        updatedAchievements,
        "eat_powerup"
      );
      newlyUnlocked.push("eat_powerup");
    }
  }

  return { achievements: updatedAchievements, newlyUnlocked };
}
