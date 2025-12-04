import { useCallback, useRef } from 'react';
import { Direction } from '@/types/game';
import styles from './TouchControls.module.css';

interface TouchControlsProps {
  onDirectionChange: (direction: Direction) => void;
  enabled?: boolean;
}

export function TouchControls({ onDirectionChange, enabled = true }: TouchControlsProps) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastDirectionRef = useRef<Direction | null>(null);
  const MIN_SWIPE_DISTANCE = 30; // Minimum distance in pixels for a swipe
  const MAX_SWIPE_TIME = 300; // Maximum time in ms for a swipe

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;

      const touch = e.touches[0];
      if (touch) {
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
        };
        lastDirectionRef.current = null;
      }
    },
    [enabled],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !touchStartRef.current) return;

      const touch = e.changedTouches[0];
      if (!touch) return;

      const endX = touch.clientX;
      const endY = touch.clientY;
      const endTime = Date.now();

      const deltaX = endX - touchStartRef.current.x;
      const deltaY = endY - touchStartRef.current.y;
      const deltaTime = endTime - touchStartRef.current.time;

      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Only process if swipe is fast enough and long enough
      if (deltaTime > MAX_SWIPE_TIME || (absDeltaX < MIN_SWIPE_DISTANCE && absDeltaY < MIN_SWIPE_DISTANCE)) {
        touchStartRef.current = null;
        return;
      }

      let direction: Direction | null = null;

      // Determine direction based on which axis has greater movement
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        direction = deltaX > 0 ? Direction.RIGHT : Direction.LEFT;
      } else {
        // Vertical swipe
        direction = deltaY > 0 ? Direction.DOWN : Direction.UP;
      }

      // Only change direction if it's different from last one (prevent same direction spam)
      if (direction && direction !== lastDirectionRef.current) {
        lastDirectionRef.current = direction;
        onDirectionChange(direction);
      }

      touchStartRef.current = null;
    },
    [enabled, onDirectionChange],
  );

  const handleButtonClick = useCallback(
    (direction: Direction) => {
      if (!enabled) return;
      onDirectionChange(direction);
    },
    [enabled, onDirectionChange],
  );

  if (!enabled) return null;

  return (
    <div
      className={styles.touchControls}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div className={styles.controlGrid}>
        {/* Top Row - Up Button */}
        <button
          className={`${styles.directionButton} ${styles.upButton}`}
          onClick={() => handleButtonClick(Direction.UP)}
          aria-label="Move Up"
          type="button"
        >
          <span className={styles.buttonIcon}>↑</span>
        </button>

        {/* Middle Row - Left, Center, Right */}
        <button
          className={`${styles.directionButton} ${styles.leftButton}`}
          onClick={() => handleButtonClick(Direction.LEFT)}
          aria-label="Move Left"
          type="button"
        >
          <span className={styles.buttonIcon}>←</span>
        </button>

        <div className={styles.centerSpace} />

        <button
          className={`${styles.directionButton} ${styles.rightButton}`}
          onClick={() => handleButtonClick(Direction.RIGHT)}
          aria-label="Move Right"
          type="button"
        >
          <span className={styles.buttonIcon}>→</span>
        </button>

        {/* Bottom Row - Down Button */}
        <button
          className={`${styles.directionButton} ${styles.downButton}`}
          onClick={() => handleButtonClick(Direction.DOWN)}
          aria-label="Move Down"
          type="button"
        >
          <span className={styles.buttonIcon}>↓</span>
        </button>
      </div>
    </div>
  );
}
