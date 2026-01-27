import { useEffect, useCallback, useRef } from 'react';
import { Direction } from '@/types/game';
import { KEYBOARD_MAP, CONTROL_CONFIG } from '@/constants/game';

interface UseKeyboardProps {
  readonly onDirectionChange: (direction: Direction) => void;
  readonly onSpeedBoost?: (isBoosted: boolean) => void;
  readonly onKeyPress?: (key: string) => void;
  readonly onFirePoison?: () => void;
  readonly onStopFiringPoison?: () => void;
  readonly enabled?: boolean;
}

/**
 * Check if key is a poison fire key (X or Space)
 */
function isPoisonFireKey(key: string): boolean {
  return key === 'x' || key === 'X' || key === ' ';
}

/**
 * Prevent default event behavior
 */
function preventEventDefault(event: KeyboardEvent): void {
  event.preventDefault();
  event.stopPropagation();
}

export function useKeyboard({
  onDirectionChange,
  onSpeedBoost,
  onKeyPress,
  onFirePoison,
  onStopFiringPoison,
  enabled = true,
}: UseKeyboardProps) {
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const speedBoostActiveRef = useRef(false);
  const poisonFireActiveRef = useRef(false);
  const speedBoostTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  /**
   * Start speed boost timer for a key
   */
  const startSpeedBoostTimer = useCallback(
    (key: string) => {
      if (!onSpeedBoost || speedBoostActiveRef.current) return;

      const timerId = setTimeout(() => {
        if (pressedKeysRef.current.has(key)) {
          speedBoostActiveRef.current = true;
          onSpeedBoost(true);
        }
        speedBoostTimersRef.current.delete(key);
      }, CONTROL_CONFIG.speedBoostActivationDelay);

      speedBoostTimersRef.current.set(key, timerId);
    },
    [onSpeedBoost],
  );

  /**
   * Handle direction key press
   */
  const handleDirectionKey = useCallback(
    (event: KeyboardEvent, direction: Direction): void => {
      preventEventDefault(event);
      onDirectionChange(direction);

      if (!pressedKeysRef.current.has(event.key)) {
        pressedKeysRef.current.add(event.key);
        startSpeedBoostTimer(event.key);
      }
    },
    [onDirectionChange, startSpeedBoostTimer],
  );

  /**
   * Handle poison fire key press
   */
  const handlePoisonFireKey = useCallback(
    (event: KeyboardEvent): void => {
      if (!onFirePoison || poisonFireActiveRef.current) return;

      preventEventDefault(event);
      poisonFireActiveRef.current = true;
      onFirePoison();
    },
    [onFirePoison],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const direction = KEYBOARD_MAP[event.key];
      if (direction !== undefined) {
        handleDirectionKey(event, direction);
        return;
      }

      if (isPoisonFireKey(event.key)) {
        handlePoisonFireKey(event);
        return;
      }

      onKeyPress?.(event.key);
    },
    [enabled, handleDirectionKey, handlePoisonFireKey, onKeyPress],
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) {
        return;
      }

      const direction = KEYBOARD_MAP[event.key];
      if (direction !== undefined) {
        event.preventDefault();
        event.stopPropagation();

        // Cancel speed boost timer for this key
        const timerId = speedBoostTimersRef.current.get(event.key);
        if (timerId) {
          clearTimeout(timerId);
          speedBoostTimersRef.current.delete(event.key);
        }

        // Remove from pressed keys
        pressedKeysRef.current.delete(event.key);

        // Deactivate speed boost if no direction keys are pressed
        if (pressedKeysRef.current.size === 0) {
          // Cancel all remaining timers
          speedBoostTimersRef.current.forEach((timer) => clearTimeout(timer));
          speedBoostTimersRef.current.clear();

          // Deactivate speed boost
          if (speedBoostActiveRef.current && onSpeedBoost) {
            speedBoostActiveRef.current = false;
            onSpeedBoost(false);
          }
        }
      }

      // Check for poison shot key release (X or Space)
      if (isPoisonFireKey(event.key) && onStopFiringPoison && poisonFireActiveRef.current) {
        preventEventDefault(event);
        poisonFireActiveRef.current = false;
        onStopFiringPoison();
      }
    },
    [enabled, onSpeedBoost, onStopFiringPoison],
  );

  useEffect(() => {
    if (!enabled) {
      // When disabled (game paused/ended), reset speed boost and clear pressed keys
      // Cancel all timers
      speedBoostTimersRef.current.forEach((timer) => clearTimeout(timer));
      speedBoostTimersRef.current.clear();
      pressedKeysRef.current.clear();
      if (speedBoostActiveRef.current && onSpeedBoost) {
        speedBoostActiveRef.current = false;
        onSpeedBoost(false);
      }
      // Stop firing when disabled
      if (poisonFireActiveRef.current && onStopFiringPoison) {
        poisonFireActiveRef.current = false;
        onStopFiringPoison();
      }
      return;
    }

    // Use capture phase for faster event handling
    globalThis.window?.addEventListener('keydown', handleKeyDown, { capture: true });
    globalThis.window?.addEventListener('keyup', handleKeyUp, { capture: true });

    // Copy refs to variables for cleanup function (before return)
    const speedBoostTimers = speedBoostTimersRef.current;
    const pressedKeys = pressedKeysRef.current;
    const onSpeedBoostCallback = onSpeedBoost;
    const onStopFiringPoisonCallback = onStopFiringPoison;

    return () => {
      globalThis.window?.removeEventListener('keydown', handleKeyDown, { capture: true });
      globalThis.window?.removeEventListener('keyup', handleKeyUp, { capture: true });
      // Reset on cleanup - cancel all timers and deactivate speed boost
      speedBoostTimers.forEach((timer) => clearTimeout(timer));
      speedBoostTimers.clear();
      pressedKeys.clear();
      if (speedBoostActiveRef.current && onSpeedBoostCallback) {
        speedBoostActiveRef.current = false;
        onSpeedBoostCallback(false);
      }
      // Stop firing on cleanup
      if (poisonFireActiveRef.current && onStopFiringPoisonCallback) {
        poisonFireActiveRef.current = false;
        onStopFiringPoisonCallback();
      }
    };
  }, [enabled, handleKeyDown, handleKeyUp, onSpeedBoost, onStopFiringPoison]);
}
