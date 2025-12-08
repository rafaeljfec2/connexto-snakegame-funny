import { useCallback, useRef, useEffect, memo } from 'react';
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

export const TouchControls = memo(function TouchControls({
  onDirectionChange,
  onSpeedBoost,
  onFirePoison,
  onStopFiringPoison,
  enabled = true,
}: TouchControlsProps) {
  const { t } = useTranslation();
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const pressedButtonsRef = useRef<Set<Direction>>(new Set());
  const speedBoostActiveRef = useRef(false);
  const speedBoostTimersRef = useRef<Map<Direction, ReturnType<typeof setTimeout>>>(new Map());
  const MIN_SWIPE_DISTANCE = 10;
  const MAX_SWIPE_TIME = 500;

  // Helper for haptic feedback
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15); // Crisp tick
    }
  };

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

      if (
        deltaTime > MAX_SWIPE_TIME ||
        (absDeltaX < MIN_SWIPE_DISTANCE && absDeltaY < MIN_SWIPE_DISTANCE)
      ) {
        touchStartRef.current = null;
        return;
      }

      let direction: Direction | null = null;

      if (absDeltaX > absDeltaY) {
        direction = deltaX > 0 ? Direction.RIGHT : Direction.LEFT;
      } else {
        direction = deltaY > 0 ? Direction.DOWN : Direction.UP;
      }

      if (direction) {
        triggerHaptic();
        onDirectionChange(direction);
      }

      touchStartRef.current = null;
    },
    [enabled, onDirectionChange],
  );

  const handleButtonTouchStart = useCallback(
    (direction: Direction) => () => {
      if (!enabled) return;
      // e.preventDefault(); // Removed to prevent interfering with scrolling if user misses button, but added back in CSS via touch-action

      triggerHaptic();
      onDirectionChange(direction);

      if (!pressedButtonsRef.current.has(direction)) {
        pressedButtonsRef.current.add(direction);

        if (onSpeedBoost && !speedBoostActiveRef.current) {
          const timerId = setTimeout(() => {
            if (pressedButtonsRef.current.has(direction)) {
              speedBoostActiveRef.current = true;
              triggerHaptic(); // Feedback for boost
              onSpeedBoost(true);
            }
            speedBoostTimersRef.current.delete(direction);
          }, CONTROL_CONFIG.speedBoostActivationDelay);

          speedBoostTimersRef.current.set(direction, timerId);
        }
      }
    },
    [enabled, onDirectionChange, onSpeedBoost],
  );

  const handleButtonTouchEnd = useCallback(
    (direction: Direction) => (e: React.TouchEvent) => {
      if (!enabled) return;
      if (e.cancelable) e.preventDefault();

      const timerId = speedBoostTimersRef.current.get(direction);
      if (timerId) {
        clearTimeout(timerId);
        speedBoostTimersRef.current.delete(direction);
      }

      pressedButtonsRef.current.delete(direction);

      if (pressedButtonsRef.current.size === 0) {
        speedBoostTimersRef.current.forEach((timer) => clearTimeout(timer));
        speedBoostTimersRef.current.clear();

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
      // For mouse clicks
      triggerHaptic();
      onDirectionChange(direction);
    },
    [enabled, onDirectionChange],
  );

  // Cleanup timers when disabled
  useEffect(() => {
    if (!enabled) {
      speedBoostTimersRef.current.forEach((timer) => clearTimeout(timer));
      speedBoostTimersRef.current.clear();
      pressedButtonsRef.current.clear();
      if (speedBoostActiveRef.current && onSpeedBoost) {
        speedBoostActiveRef.current = false;
        onSpeedBoost(false);
      }
    }
  }, [enabled, onSpeedBoost]);

  return (
    <div
      className={`${styles.touchControls} ${!enabled ? styles.disabled : ''}`}
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
          onTouchStart={() => {
            // e.preventDefault();
            triggerHaptic();
            onFirePoison?.();
          }}
          onTouchEnd={(e) => {
            if (e.cancelable) e.preventDefault();
            onStopFiringPoison?.();
          }}
          onTouchCancel={(e) => {
            if (e.cancelable) e.preventDefault();
            onStopFiringPoison?.();
          }}
          onClick={() => {
            triggerHaptic();
            onFirePoison?.();
          }}
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
});
