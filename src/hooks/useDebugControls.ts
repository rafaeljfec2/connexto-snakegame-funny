import { useEffect, useState, useCallback } from 'react';
import { Chef } from '@/types/phases';
import { CHEFS } from '@/constants/phases';
import { buildPerfSnapshot, downloadPerfSnapshot } from '@/utils/perfSnapshot';

interface UseDebugControlsOptions {
  readonly onSnapshotContext?: () => { phaseId: number; bossId?: string };
}

interface UseDebugControlsReturn {
  showBossDebug: boolean;
  showPhaseDebug: boolean;
  showPerfDebug: boolean;
  setShowBossDebug: (show: boolean) => void;
  setShowPhaseDebug: (show: boolean) => void;
  setShowPerfDebug: (show: boolean) => void;
  handleBossSelect: (boss: Chef | null) => void;
  handleTestBossDefeat: () => Chef | null;
  exportPerfSnapshot: () => void;
}

export function useDebugControls(
  onBossSelect: (boss: Chef | null) => void,
  onBossDefeatTest: (boss: Chef, score: number) => void,
  options: UseDebugControlsOptions = {},
): UseDebugControlsReturn {
  const [showBossDebug, setShowBossDebug] = useState(false);
  const [showPhaseDebug, setShowPhaseDebug] = useState(false);
  const [showPerfDebug, setShowPerfDebug] = useState(false);

  const { onSnapshotContext } = options;

  const exportPerfSnapshot = useCallback(() => {
    const context = onSnapshotContext?.() ?? { phaseId: 0 };
    const snapshot = buildPerfSnapshot(context);
    downloadPerfSnapshot(snapshot);
  }, [onSnapshotContext]);

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

      if (e.key === 'F4' && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        if (e.shiftKey) {
          exportPerfSnapshot();
        } else {
          setShowPerfDebug((prev) => !prev);
        }
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [handleTestBossDefeat, exportPerfSnapshot]);

  return {
    showBossDebug,
    showPhaseDebug,
    showPerfDebug,
    setShowBossDebug,
    setShowPhaseDebug,
    setShowPerfDebug,
    handleBossSelect,
    handleTestBossDefeat,
    exportPerfSnapshot,
  };
}
