import { useEffect, useState, useCallback } from 'react';
import { Chef } from '@/types/phases';
import { CHEFS } from '@/constants/phases';

interface UseDebugControlsReturn {
  showBossDebug: boolean;
  showPhaseDebug: boolean;
  setShowBossDebug: (show: boolean) => void;
  setShowPhaseDebug: (show: boolean) => void;
  handleBossSelect: (boss: Chef | null) => void;
  handleTestBossDefeat: () => Chef | null;
}

export function useDebugControls(
  onBossSelect: (boss: Chef | null) => void,
  onBossDefeatTest: (boss: Chef, score: number) => void,
): UseDebugControlsReturn {
  const [showBossDebug, setShowBossDebug] = useState(false);
  const [showPhaseDebug, setShowPhaseDebug] = useState(false);

  const handleBossSelect = useCallback(
    (boss: Chef | null) => {
      onBossSelect(boss);
    },
    [onBossSelect],
  );

  const handleTestBossDefeat = useCallback(() => {
    const testBoss = CHEFS.find((chef) => chef.id === 'guardian') ?? CHEFS[0];
    if (testBoss) {
      onBossDefeatTest(testBoss, 1000);
      return testBoss;
    }
    return null;
  }, [onBossDefeatTest]);

  // Debug mode keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F1' ||
        (e.key === 'd' &&
          e.ctrlKey &&
          e.target === document.body &&
          !(e.target instanceof HTMLInputElement))
      ) {
        e.preventDefault();
        setShowBossDebug((prev) => !prev);
      }

      // F2 key to test boss defeat transition
      if (e.key === 'F2' && e.target === document.body && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        handleTestBossDefeat();
      }

      if (
        e.key === 'F3' ||
        (e.key === 'f' &&
          e.ctrlKey &&
          e.target === document.body &&
          !(e.target instanceof HTMLInputElement))
      ) {
        e.preventDefault();
        setShowPhaseDebug((prev) => !prev);
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [handleTestBossDefeat]);

  return {
    showBossDebug,
    showPhaseDebug,
    setShowBossDebug,
    setShowPhaseDebug,
    handleBossSelect,
    handleTestBossDefeat,
  };
}
