import { useEffect, useCallback, useRef } from 'react';
import { Direction } from '@/types/game';
import { KEYBOARD_MAP } from '@/constants/game';

interface UseKeyboardProps {
  onDirectionChange: (direction: Direction) => void;
  onSpeedBoost?: (isBoosted: boolean) => void;
  onKeyPress?: (key: string) => void;
  onFirePoison?: () => void;
  enabled?: boolean;
}

export function useKeyboard({
  onDirectionChange,
  onSpeedBoost,
  onKeyPress,
  onFirePoison,
  enabled = true,
}: UseKeyboardProps) {
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const speedBoostActiveRef = useRef(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) {
        return;
      }

      const direction = KEYBOARD_MAP[event.key];
      if (direction !== undefined) {
        event.preventDefault();
        event.stopPropagation();

        // Track pressed keys for speed boost
        if (!pressedKeysRef.current.has(event.key)) {
          pressedKeysRef.current.add(event.key);
        }

        // Activate speed boost if direction key is held
        if (!speedBoostActiveRef.current && onSpeedBoost) {
          speedBoostActiveRef.current = true;
          onSpeedBoost(true);
        }

        // Apply direction change immediately - maximum responsiveness
        onDirectionChange(direction);
        return;
      }

      // Check for poison shot key (X or Space)
      if ((event.key === 'x' || event.key === 'X' || event.key === ' ') && onFirePoison) {
        event.preventDefault();
        event.stopPropagation();
        onFirePoison();
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

        // Remove from pressed keys
        pressedKeysRef.current.delete(event.key);

        // Deactivate speed boost if no direction keys are pressed
        if (pressedKeysRef.current.size === 0 && speedBoostActiveRef.current && onSpeedBoost) {
          speedBoostActiveRef.current = false;
          onSpeedBoost(false);
        }
      }
    },
    [enabled, onSpeedBoost],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Use capture phase for faster event handling
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
      // Reset on cleanup
      pressedKeysRef.current.clear();
      speedBoostActiveRef.current = false;
    };
  }, [enabled, handleKeyDown, handleKeyUp]);
}
