import { Food as FoodType, FoodType as FoodTypeEnum } from "@/types/game";
import { GAME_CONFIG } from "@/constants/game";
import { POWER_UP_CONFIG } from "@/constants/powerUps";
import { useEffect, useState } from "react";
import styles from "./Food.module.css";

interface FoodProps {
  food: FoodType;
  wasEaten?: boolean;
}

export function Food({ food, wasEaten }: FoodProps) {
  const [jokerColorIndex, setJokerColorIndex] = useState(0);

  // Ensure position is within grid bounds
  const x = Math.max(
    0,
    Math.min(food.position.x ?? 0, GAME_CONFIG.gridSize - 1)
  );
  const y = Math.max(
    0,
    Math.min(food.position.y ?? 0, GAME_CONFIG.gridSize - 1)
  );

  const isJoker = food.type === FoodTypeEnum.JOKER;
  const isPowerUp = food.type !== "NORMAL" && !isJoker;

  // List of positive power-up types for joker animation
  const jokerTypes = [
    FoodTypeEnum.SPEED_BOOST,
    FoodTypeEnum.BONUS_POINTS,
    FoodTypeEnum.EXTRA_GROWTH,
    FoodTypeEnum.PHASE_THROUGH,
  ];

  // Animate joker colors cycling
  useEffect(() => {
    if (!isJoker || wasEaten) {
      setJokerColorIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setJokerColorIndex((prev) => (prev + 1) % jokerTypes.length);
    }, 300); // Change color every 300ms

    return () => clearInterval(interval);
  }, [isJoker, wasEaten, jokerTypes.length]);

  // Get colors based on type
  let colors;
  if (isJoker && !wasEaten) {
    const currentJokerType = jokerTypes[jokerColorIndex];
    colors =
      POWER_UP_CONFIG.colors[currentJokerType] ||
      POWER_UP_CONFIG.colors[FoodTypeEnum.JOKER];
  } else {
    colors = POWER_UP_CONFIG.colors[food.type];
  }

  // Convert enum to CSS class name (SPEED_BOOST -> speed-boost)
  const foodTypeClass = food.type.toLowerCase().replace(/_/g, "-");

  return (
    <div
      className={`${styles.food} ${wasEaten ? styles.eaten : ""} ${
        isPowerUp ? styles.powerUp : ""
      } ${isJoker ? styles.joker : ""} ${styles[foodTypeClass] ?? ""}`}
      style={
        {
          gridColumn: x + 1,
          gridRow: y + 1,
          "--food-primary": colors.primary,
          "--food-secondary": colors.secondary,
        } as React.CSSProperties
      }
      aria-label={
        isPowerUp ? `Power-up: ${food.type}` : isJoker ? "Joker Food" : "Food"
      }
    />
  );
}
