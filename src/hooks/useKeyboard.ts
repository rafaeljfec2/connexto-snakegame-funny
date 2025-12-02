import { useEffect, useCallback } from 'react'
import { Direction } from '@/types/game'
import { KEYBOARD_MAP } from '@/constants/game'

interface UseKeyboardProps {
  onDirectionChange: (direction: Direction) => void
  onKeyPress?: (key: string) => void
  enabled?: boolean
}

export function useKeyboard({
  onDirectionChange,
  onKeyPress,
  enabled = true,
}: UseKeyboardProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) {
        return
      }

      const direction = KEYBOARD_MAP[event.key]
      if (direction !== undefined) {
        event.preventDefault()
        onDirectionChange(direction)
        return
      }

      if (onKeyPress !== undefined) {
        onKeyPress(event.key)
      }
    },
    [enabled, onDirectionChange, onKeyPress]
  )

  useEffect(() => {
    if (!enabled) {
      return
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleKeyDown])
}
