import { Position } from "@/types/game";
import styles from "./SnakeSegment.module.css";

interface SnakeSegmentProps {
  position: Position;
  isHead: boolean;
  isNew?: boolean;
}

export function SnakeSegment({ position, isHead, isNew }: SnakeSegmentProps) {
  const style = {
    gridColumn: position.x + 1,
    gridRow: position.y + 1,
  };

  return (
    <div
      className={`${styles.segment} ${isHead ? styles.head : ""} ${
        isNew ? styles.new : ""
      }`}
      style={style}
    />
  );
}
