import { useEffect, useCallback } from "react";
import { Direction } from "@/types/game";
import { KEYBOARD_MAP } from "@/constants/game";

interface UseKeyboardProps {
  onDirectionChange: (direction: Direction) => void;
  onKeyPress?: (key: string) => void;
  enabled?: boolean;
}

export function useKeyboard({
  onDirectionChange,
  onKeyPress,
  enabled = true,
}: UseKeyboardProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) {
        return;
      }

      const direction = KEYBOARD_MAP[event.key];
      if (direction !== undefined) {
        event.preventDefault();
        event.stopPropagation();
        // Apply direction change immediately for better responsiveness
        onDirectionChange(direction);
        return;
      }

      if (onKeyPress !== undefined) {
        onKeyPress(event.key);
      }
    },
    [enabled, onDirectionChange, onKeyPress]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Use capture phase for faster event handling
    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [enabled, handleKeyDown]);
}
