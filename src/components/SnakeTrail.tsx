import { Position } from "@/types/game";
import { GAME_CONFIG } from "@/constants/game";
import { useEffect, useRef, useState } from "react";
import styles from "./SnakeTrail.module.css";

interface SnakeTrailProps {
  snake: Position[];
  enabled: boolean;
}

interface TrailPoint {
  position: Position;
  timestamp: number;
  opacity: number;
}

export function SnakeTrail({ snake, enabled }: SnakeTrailProps) {
  const [trailPoints, setTrailPoints] = useState<TrailPoint[]>([]);
  const previousSnakeRef = useRef<Position[]>([]);
  const trailLifetime = 500; // milliseconds

  useEffect(() => {
    if (!enabled || snake.length === 0) {
      setTrailPoints([]);
      previousSnakeRef.current = snake;
      return;
    }

    const head = snake[0];
    const previousHead = previousSnakeRef.current[0];

    // Add new trail point if head moved
    if (
      !previousHead ||
      head.x !== previousHead.x ||
      head.y !== previousHead.y
    ) {
      setTrailPoints((prev) => [
        ...prev,
        {
          position: head,
          timestamp: Date.now(),
          opacity: 1,
        },
      ]);
    }

    previousSnakeRef.current = snake;
  }, [snake, enabled]);

  useEffect(() => {
    if (!enabled || trailPoints.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setTrailPoints((prev) => {
        return prev
          .map((point) => {
            const age = now - point.timestamp;
            const opacity = Math.max(0, 1 - age / trailLifetime);
            return { ...point, opacity };
          })
          .filter((point) => point.opacity > 0);
      });
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [trailPoints.length, enabled]);

  if (!enabled || trailPoints.length === 0) {
    return null;
  }

  return (
    <>
      {trailPoints.map((point, index) => (
        <div
          key={`trail-${point.timestamp}-${index}`}
          className={styles.trailPoint}
          style={
            {
              gridColumn: point.position.x + 1,
              gridRow: point.position.y + 1,
              opacity: point.opacity * 0.4,
            } as React.CSSProperties
          }
        />
      ))}
    </>
  );
}


