import { Obstacle } from "@/types/game";
import { GAME_CONFIG } from "@/constants/game";
import styles from "./Obstacle.module.css";

interface ObstacleProps {
  obstacle: Obstacle;
}

export function ObstacleComponent({ obstacle }: ObstacleProps) {
  const x = Math.max(
    0,
    Math.min(obstacle.position.x ?? 0, GAME_CONFIG.gridSize - 1)
  );
  const y = Math.max(
    0,
    Math.min(obstacle.position.y ?? 0, GAME_CONFIG.gridSize - 1)
  );

  return (
    <div
      className={`${styles.obstacle} ${styles[obstacle.type]}`}
      style={
        {
          gridColumn: x + 1,
          gridRow: y + 1,
        } as React.CSSProperties
      }
      aria-label={`Obstacle at ${x}, ${y}`}
    />
  );
}


