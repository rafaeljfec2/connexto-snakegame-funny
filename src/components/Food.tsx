import { Position } from "@/types/game";
import { GAME_CONFIG } from "@/constants/game";
import styles from "./Food.module.css";

interface FoodProps {
  position: Position;
}

export function Food({ position }: FoodProps) {
  // Ensure position is within grid bounds
  const x = Math.max(0, Math.min(position.x ?? 0, GAME_CONFIG.gridSize - 1));
  const y = Math.max(0, Math.min(position.y ?? 0, GAME_CONFIG.gridSize - 1));

  return (
    <div
      className={styles.food}
      style={{
        gridColumn: x + 1,
        gridRow: y + 1,
      }}
      aria-label="Food"
    />
  );
}
