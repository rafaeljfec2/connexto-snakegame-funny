import { useEffect, useState } from "react";
import styles from "./LevelUpAnimation.module.css";

interface LevelUpAnimationProps {
  level: number;
  show: boolean;
  onAnimationEnd: () => void;
}

export function LevelUpAnimation({
  level,
  show,
  onAnimationEnd,
}: LevelUpAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setIsExiting(false);
      
      // Start exit animation after showing for 800ms
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, 800);
      
      // Remove completely after 1s total
      const removeTimer = setTimeout(() => {
        setIsVisible(false);
        setIsExiting(false);
        onAnimationEnd();
      }, 1000);
      
      return () => {
        clearTimeout(exitTimer);
        clearTimeout(removeTimer);
      };
    } else {
      // Immediately hide if show is false
      setIsVisible(false);
      setIsExiting(false);
    }
  }, [show, onAnimationEnd]);

  if (!isVisible) return null;

  return (
    <div className={styles.overlay}>
      <div className={`${styles.levelUp} ${isExiting ? styles.exiting : ""}`}>
        <div className={styles.levelUpTitle}>Level Up!</div>
        <div className={styles.levelUpNumber}>Level {level}</div>
      </div>
    </div>
  );
}
