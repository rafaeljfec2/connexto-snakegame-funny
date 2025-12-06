import { useEffect, useCallback, useRef } from 'react';
import { Direction } from '@/types/game';
import { KEYBOARD_MAP, CONTROL_CONFIG } from '@/constants/game';

interface UseKeyboardProps {
  onDirectionChange: (direction: Direction) => void;
  onSpeedBoost?: (isBoosted: boolean) => void;
  onKeyPress?: (key: string) => void;
  onFirePoison?: () => void;
  onStopFiringPoison?: () => void;
  enabled?: boolean;
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

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) {
        return;
      }

      const direction = KEYBOARD_MAP[event.key];
      if (direction !== undefined) {
        event.preventDefault();
        event.stopPropagation();

        // Apply direction change immediately for rapid changes
        onDirectionChange(direction);

        // Track pressed keys
        if (!pressedKeysRef.current.has(event.key)) {
          pressedKeysRef.current.add(event.key);

          // Start timer to activate speed boost after delay
          if (onSpeedBoost && !speedBoostActiveRef.current) {
            const timerId = setTimeout(() => {
              // Only activate if key is still pressed
              if (pressedKeysRef.current.has(event.key)) {
                speedBoostActiveRef.current = true;
                onSpeedBoost(true);
              }
              speedBoostTimersRef.current.delete(event.key);
            }, CONTROL_CONFIG.speedBoostActivationDelay);

            speedBoostTimersRef.current.set(event.key, timerId);
          }
        }

        return;
      }

      // Check for poison shot key (X or Space when playing)
      if (event.key === 'x' || event.key === 'X') {
        event.preventDefault();
        event.stopPropagation();
        if (onFirePoison && !poisonFireActiveRef.current) {
          poisonFireActiveRef.current = true;
          onFirePoison();
        }
        return;
      }

      // Spacebar: fire poison when playing (pause is handled by global listener when not playing)
      if (event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        if (onFirePoison && !poisonFireActiveRef.current) {
          poisonFireActiveRef.current = true;
          onFirePoison();
        }
        return;
      }

      if (onKeyPress !== undefined) {
        onKeyPress(event.key);
      }
    },
    [enabled, onDirectionChange, onSpeedBoost, onKeyPress, onFirePoison],
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
      if (
        (event.key === 'x' || event.key === 'X' || event.key === ' ') &&
        onStopFiringPoison &&
        poisonFireActiveRef.current
      ) {
        event.preventDefault();
        event.stopPropagation();
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
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
      // Reset on cleanup - cancel all timers and deactivate speed boost
      speedBoostTimersRef.current.forEach((timer) => clearTimeout(timer));
      speedBoostTimersRef.current.clear();
      pressedKeysRef.current.clear();
      if (speedBoostActiveRef.current && onSpeedBoost) {
        speedBoostActiveRef.current = false;
        onSpeedBoost(false);
      }
      // Stop firing on cleanup
      if (poisonFireActiveRef.current && onStopFiringPoison) {
        poisonFireActiveRef.current = false;
        onStopFiringPoison();
      }
    };
  }, [enabled, handleKeyDown, handleKeyUp, onSpeedBoost, onStopFiringPoison]);
}
