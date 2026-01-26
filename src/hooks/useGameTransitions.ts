import { useState, useCallback } from 'react';
import { Chef } from '@/types/phases';

interface UseGameTransitionsReturn {
  showLevelUp: boolean;
  showPhaseTransition: boolean;
  phaseTransitionNumber: number | null;
  showBossDefeatTransition: boolean;
  defeatedBoss: Chef | null;
  bossDefeatScore: number;
  defeatedBossPhaseNumber: number | null;
  setShowLevelUp: (show: boolean) => void;
  handleLevelUp: () => void;
  handlePhaseTransition: (phaseNumber: number) => void;
  handleBossDefeat: (boss: Chef, scoreIncrease: number, phaseNumber: number) => void;
  handleBossDefeatTransitionComplete: () => void;
  resetTransitions: () => void;
}

export function useGameTransitions(onBossDefeatPause: () => void): UseGameTransitionsReturn {
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showPhaseTransition, setShowPhaseTransition] = useState(false);
  const [phaseTransitionNumber, setPhaseTransitionNumber] = useState<number | null>(null);
  const [showBossDefeatTransition, setShowBossDefeatTransition] = useState(false);
  const [defeatedBoss, setDefeatedBoss] = useState<Chef | null>(null);
  const [bossDefeatScore, setBossDefeatScore] = useState(0);
  const [defeatedBossPhaseNumber, setDefeatedBossPhaseNumber] = useState<number | null>(null);

  const handleLevelUp = useCallback(() => {
    setShowLevelUp(true);
  }, []);

  const handlePhaseTransition = useCallback((phaseNumber: number) => {
    setPhaseTransitionNumber(phaseNumber);
    setShowPhaseTransition(true);
  }, []);

  const handleBossDefeat = useCallback(
    (boss: Chef, scoreIncrease: number, phaseNumber: number) => {
      onBossDefeatPause();
      setDefeatedBoss(boss);
      setBossDefeatScore(scoreIncrease);
      setDefeatedBossPhaseNumber(phaseNumber);
      setShowBossDefeatTransition(true);
    },
    [onBossDefeatPause],
  );

  const handleBossDefeatTransitionComplete = useCallback(() => {
    setShowBossDefeatTransition(false);
  }, []);

  const resetTransitions = useCallback(() => {
    setShowLevelUp(false);
    setShowPhaseTransition(false);
    setPhaseTransitionNumber(null);
    setShowBossDefeatTransition(false);
    setDefeatedBoss(null);
    setBossDefeatScore(0);
    setDefeatedBossPhaseNumber(null);
  }, []);

  return {
    showLevelUp,
    showPhaseTransition,
    phaseTransitionNumber,
    showBossDefeatTransition,
    defeatedBoss,
    bossDefeatScore,
    defeatedBossPhaseNumber,
    setShowLevelUp,
    handleLevelUp,
    handlePhaseTransition,
    handleBossDefeat,
    handleBossDefeatTransitionComplete,
    resetTransitions,
  };
}
