import { Position } from "@/types/game";
import { GAME_CONFIG } from "@/constants/game";
import styles from "./Food.module.css";
import { isValidPosition } from "@/utils/gameLogic";

interface FoodProps {
  position: Position;
}

export function Food({ position }: FoodProps) {
  // Validate position is within grid bounds and clamp if necessary
  const validPosition = {
    x: Math.max(0, Math.min(position.x, GAME_CONFIG.gridSize - 1)),
    y: Math.max(0, Math.min(position.y, GAME_CONFIG.gridSize - 1)),
  };

  const style = {
    gridColumn: validPosition.x + 1,
    gridRow: validPosition.y + 1,
  };

  return (
    <div
      className={styles.food}
      style={style}
      key={`food-${validPosition.x}-${validPosition.y}`}
      aria-label="Food"
    />
  );
}
