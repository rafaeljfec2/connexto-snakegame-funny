import { useEffect, useState } from "react";
import { Achievement } from "@/types/game";
import styles from "./AchievementNotification.module.css";

interface AchievementNotificationProps {
  newlyUnlocked: string[];
  allAchievements: Achievement[];
}

export function AchievementNotification({
  newlyUnlocked,
  allAchievements,
}: AchievementNotificationProps) {
  const [visibleAchievement, setVisibleAchievement] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (newlyUnlocked.length > 0) {
      const firstUnlocked = newlyUnlocked[0];
      setVisibleAchievement(firstUnlocked);
      
      const timer = setTimeout(() => {
        setVisibleAchievement(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [newlyUnlocked]);

  if (!visibleAchievement) return null;

  const achievement = allAchievements.find((a) => a.id === visibleAchievement);
  if (!achievement) return null;

  return (
    <div className={styles.notification}>
      <div className={styles.icon}>🏆</div>
      <div className={styles.content}>
        <div className={styles.title}>Achievement Unlocked!</div>
        <div className={styles.name}>{achievement.name}</div>
        <div className={styles.description}>{achievement.description}</div>
      </div>
    </div>
  );
}

