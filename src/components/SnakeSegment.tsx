import { memo } from 'react';
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

export const SnakeSegment = memo(
  function SnakeSegment({ position, isHead, isNew, isEating, isDying }: SnakeSegmentProps) {
    // Ensure position is within grid bounds
    // Using bitwise OR 0 for faster integer clamping if needed, but Math.min/max is safer
    const x = Math.max(0, Math.min(position.x, GAME_CONFIG.gridSize - 1));
    const y = Math.max(0, Math.min(position.y, GAME_CONFIG.gridSize - 1));

    // Construct class name conditionally but efficiently
    let className = styles.segment;
    if (isHead) {
      className += ` ${styles.head}`;
      if (isEating) className += ` ${styles.eating}`;
    }
    if (isNew) className += ` ${styles.new}`;
    if (isDying) className += ` ${styles.dying}`;

    // Use inline style for positioning which is performant with grid
    // contain: strict is applied in CSS
    return (
      <div
        className={className}
        style={{
          gridColumn: x + 1,
          gridRow: y + 1,
        }}
      />
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for better performance
    // Only re-render if position changes or visual state flags change
    return (
      prevProps.position.x === nextProps.position.x &&
      prevProps.position.y === nextProps.position.y &&
      prevProps.isHead === nextProps.isHead &&
      prevProps.isNew === nextProps.isNew &&
      prevProps.isEating === nextProps.isEating &&
      prevProps.isDying === nextProps.isDying
    );
  },
);
