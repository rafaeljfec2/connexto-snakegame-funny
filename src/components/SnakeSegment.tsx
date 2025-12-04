import { Position } from '@/types/game';
import { GAME_CONFIG } from '@/constants/game';
import styles from './SnakeSegment.module.css';

interface SnakeSegmentProps {
  position: Position;
  isHead: boolean;
  isNew?: boolean;
  isEating?: boolean;
  isDying?: boolean;
}

export function SnakeSegment({ position, isHead, isNew, isEating, isDying }: SnakeSegmentProps) {
  // Ensure position is within grid bounds
  const x = Math.max(0, Math.min(position.x, GAME_CONFIG.gridSize - 1));
  const y = Math.max(0, Math.min(position.y, GAME_CONFIG.gridSize - 1));

  const style = {
    gridColumn: x + 1,
    gridRow: y + 1,
  };

  return (
    <div
      className={`${styles.segment} ${isHead ? styles.head : ''} ${
        isNew ? styles.new : ''
      } ${isEating ? styles.eating : ''} ${isDying ? styles.dying : ''}`}
      style={style}
    ></div>
  );
}
