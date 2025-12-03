import { Food as FoodType } from "@/types/game";
import { GAME_CONFIG } from "@/constants/game";
import { POWER_UP_CONFIG } from "@/constants/powerUps";
import styles from "./Food.module.css";

interface FoodProps {
  food: FoodType;
  wasEaten?: boolean;
}

export function Food({ food, wasEaten }: FoodProps) {
  // Ensure position is within grid bounds
  const x = Math.max(
    0,
    Math.min(food.position.x ?? 0, GAME_CONFIG.gridSize - 1)
  );
  const y = Math.max(
    0,
    Math.min(food.position.y ?? 0, GAME_CONFIG.gridSize - 1)
  );

  const colors = POWER_UP_CONFIG.colors[food.type];
  const isPowerUp = food.type !== "NORMAL";

  // Convert enum to CSS class name (SPEED_BOOST -> speed-boost)
  const foodTypeClass = food.type.toLowerCase().replace(/_/g, "-");

  return (
    <div
      className={`${styles.food} ${wasEaten ? styles.eaten : ""} ${
        isPowerUp ? styles.powerUp : ""
      } ${styles[foodTypeClass] ?? ""}`}
      style={
        {
          gridColumn: x + 1,
          gridRow: y + 1,
          "--food-primary": colors.primary,
          "--food-secondary": colors.secondary,
        } as React.CSSProperties
      }
      aria-label={isPowerUp ? `Power-up: ${food.type}` : "Food"}
    />
  );
}
