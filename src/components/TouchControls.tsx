import { useCallback, useRef } from 'react';
import { Direction } from '@/types/game';
import styles from './TouchControls.module.css';

interface TouchControlsProps {
  onDirectionChange: (direction: Direction) => void;
  onSpeedBoost?: (isBoosted: boolean) => void;
  onFirePoison?: () => void;
  enabled?: boolean;
}

export function TouchControls({
  onDirectionChange,
  onSpeedBoost,
  onFirePoison,
  enabled = true,
}: TouchControlsProps) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastDirectionRef = useRef<Direction | null>(null);
  const pressedButtonsRef = useRef<Set<Direction>>(new Set());
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
      if (
        deltaTime > MAX_SWIPE_TIME ||
        (absDeltaX < MIN_SWIPE_DISTANCE && absDeltaY < MIN_SWIPE_DISTANCE)
      ) {
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

  const handleButtonTouchStart = useCallback(
    (direction: Direction) => (e: React.TouchEvent) => {
      if (!enabled) return;
      e.preventDefault();

      // Add to pressed buttons
      if (!pressedButtonsRef.current.has(direction)) {
        pressedButtonsRef.current.add(direction);
      }

      // Activate speed boost if button is held
      if (pressedButtonsRef.current.size > 0 && onSpeedBoost) {
        onSpeedBoost(true);
      }

      onDirectionChange(direction);
    },
    [enabled, onDirectionChange, onSpeedBoost],
  );

  const handleButtonTouchEnd = useCallback(
    (direction: Direction) => (e: React.TouchEvent) => {
      if (!enabled) return;
      e.preventDefault();

      // Remove from pressed buttons
      pressedButtonsRef.current.delete(direction);

      // Deactivate speed boost if no buttons are pressed
      if (pressedButtonsRef.current.size === 0 && onSpeedBoost) {
        onSpeedBoost(false);
      }
    },
    [enabled, onSpeedBoost],
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
          onTouchStart={handleButtonTouchStart(Direction.UP)}
          onTouchEnd={handleButtonTouchEnd(Direction.UP)}
          onTouchCancel={handleButtonTouchEnd(Direction.UP)}
          onClick={() => handleButtonClick(Direction.UP)}
          aria-label='Move Up'
          type='button'
        >
          <span className={styles.buttonIcon}>↑</span>
        </button>

        {/* Middle Row - Left, Center, Right */}
        <button
          className={`${styles.directionButton} ${styles.leftButton}`}
          onTouchStart={handleButtonTouchStart(Direction.LEFT)}
          onTouchEnd={handleButtonTouchEnd(Direction.LEFT)}
          onTouchCancel={handleButtonTouchEnd(Direction.LEFT)}
          onClick={() => handleButtonClick(Direction.LEFT)}
          aria-label='Move Left'
          type='button'
        >
          <span className={styles.buttonIcon}>←</span>
        </button>

        <button
          className={`${styles.poisonButton} ${styles.centerSpace}`}
          onClick={() => onFirePoison?.()}
          aria-label='Fire Poison'
          type='button'
        >
          <span className={styles.poisonIcon}>💚</span>
        </button>

        <button
          className={`${styles.directionButton} ${styles.rightButton}`}
          onTouchStart={handleButtonTouchStart(Direction.RIGHT)}
          onTouchEnd={handleButtonTouchEnd(Direction.RIGHT)}
          onTouchCancel={handleButtonTouchEnd(Direction.RIGHT)}
          onClick={() => handleButtonClick(Direction.RIGHT)}
          aria-label='Move Right'
          type='button'
        >
          <span className={styles.buttonIcon}>→</span>
        </button>

        {/* Bottom Row - Down Button */}
        <button
          className={`${styles.directionButton} ${styles.downButton}`}
          onTouchStart={handleButtonTouchStart(Direction.DOWN)}
          onTouchEnd={handleButtonTouchEnd(Direction.DOWN)}
          onTouchCancel={handleButtonTouchEnd(Direction.DOWN)}
          onClick={() => handleButtonClick(Direction.DOWN)}
          aria-label='Move Down'
          type='button'
        >
          <span className={styles.buttonIcon}>↓</span>
        </button>
      </div>
    </div>
  );
}
