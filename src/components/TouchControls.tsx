import { useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Direction } from '@/types/game';
import { CONTROL_CONFIG } from '@/constants/game';
import styles from './TouchControls.module.css';

interface TouchControlsProps {
  onDirectionChange: (direction: Direction) => void;
  onSpeedBoost?: (isBoosted: boolean) => void;
  onFirePoison?: () => void;
  onStopFiringPoison?: () => void;
  enabled?: boolean;
}

export function TouchControls({
  onDirectionChange,
  onSpeedBoost,
  onFirePoison,
  onStopFiringPoison,
  enabled = true,
}: TouchControlsProps) {
  const { t } = useTranslation();
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastDirectionRef = useRef<Direction | null>(null);
  const pressedButtonsRef = useRef<Set<Direction>>(new Set());
  const speedBoostActiveRef = useRef(false);
  const speedBoostTimersRef = useRef<Map<Direction, ReturnType<typeof setTimeout>>>(new Map());
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

        // Start timer to activate speed boost after 1 second
        if (onSpeedBoost && !speedBoostActiveRef.current) {
          const timerId = setTimeout(() => {
            // Only activate if button is still pressed
            if (pressedButtonsRef.current.has(direction)) {
              speedBoostActiveRef.current = true;
              onSpeedBoost(true);
            }
            speedBoostTimersRef.current.delete(direction);
          }, CONTROL_CONFIG.speedBoostActivationDelay);

          speedBoostTimersRef.current.set(direction, timerId);
        }
      }

      onDirectionChange(direction);
    },
    [enabled, onDirectionChange, onSpeedBoost],
  );

  const handleButtonTouchEnd = useCallback(
    (direction: Direction) => (e: React.TouchEvent) => {
      if (!enabled) return;
      e.preventDefault();

      // Cancel speed boost timer for this button
      const timerId = speedBoostTimersRef.current.get(direction);
      if (timerId) {
        clearTimeout(timerId);
        speedBoostTimersRef.current.delete(direction);
      }

      // Remove from pressed buttons
      pressedButtonsRef.current.delete(direction);

      // Deactivate speed boost if no buttons are pressed
      if (pressedButtonsRef.current.size === 0) {
        // Cancel all remaining timers
        speedBoostTimersRef.current.forEach((timer) => clearTimeout(timer));
        speedBoostTimersRef.current.clear();

        // Deactivate speed boost
        if (speedBoostActiveRef.current && onSpeedBoost) {
          speedBoostActiveRef.current = false;
          onSpeedBoost(false);
        }
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

  // Cleanup timers when disabled
  useEffect(() => {
    if (!enabled) {
      // Cancel all timers and reset state
      speedBoostTimersRef.current.forEach((timer) => clearTimeout(timer));
      speedBoostTimersRef.current.clear();
      pressedButtonsRef.current.clear();
      if (speedBoostActiveRef.current && onSpeedBoost) {
        speedBoostActiveRef.current = false;
        onSpeedBoost(false);
      }
    }
  }, [enabled, onSpeedBoost]);

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
          aria-label={t('touchControls.moveUp')}
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
          aria-label={t('touchControls.moveLeft')}
          type='button'
        >
          <span className={styles.buttonIcon}>←</span>
        </button>

        <button
          className={`${styles.poisonButton} ${styles.centerSpace}`}
          onTouchStart={(e) => {
            e.preventDefault();
            onFirePoison?.();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onStopFiringPoison?.();
          }}
          onTouchCancel={(e) => {
            e.preventDefault();
            onStopFiringPoison?.();
          }}
          onClick={() => onFirePoison?.()}
          aria-label={t('touchControls.firePoison')}
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
          aria-label={t('touchControls.moveRight')}
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
          aria-label={t('touchControls.moveDown')}
          type='button'
        >
          <span className={styles.buttonIcon}>↓</span>
        </button>
      </div>
    </div>
  );
}
