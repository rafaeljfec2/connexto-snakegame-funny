import { useEffect, useRef } from 'react';
import { GameState, GameStatus } from '@/types/game';
import { logger, LogContext } from '@/utils/logger';
import { didPhaseChange, getPhaseNumber } from '@/utils/phases';
import { Chef } from '@/types/phases';

interface UseGameStateTrackingProps {
  gameState: GameState;
  onLevelUp: () => void;
  onPhaseTransition: (phaseNumber: number) => void;
  onBossDefeat: (boss: Chef, scoreIncrease: number, phaseNumber: number) => void;
  onAchievementsUnlocked: (achievementIds: string[]) => void;
}

export function useGameStateTracking({
  gameState,
  onLevelUp,
  onPhaseTransition,
  onBossDefeat,
  onAchievementsUnlocked,
}: UseGameStateTrackingProps) {
  const previousLevelRef = useRef(gameState.level);
  const previousScoreRef = useRef(gameState.score);
  const previousAchievementsRef = useRef(gameState.achievements);
  const previousPhaseRef = useRef<number | undefined>(gameState.currentPhase);
  const previousActiveBossRef = useRef<Chef | undefined>(gameState.activeBoss);

  // Detect level up
  useEffect(() => {
    if (gameState.status === GameStatus.PLAYING && gameState.level > previousLevelRef.current) {
      onLevelUp();
      logger.info({ context: LogContext.GAME_STATE, level: gameState.level }, 'Level up detected');
    }
    previousLevelRef.current = gameState.level;
  }, [gameState.level, gameState.status, onLevelUp]);

  // Detect phase change
  useEffect(() => {
    if (
      gameState.status === GameStatus.PLAYING &&
      previousLevelRef.current > 0 &&
      didPhaseChange(previousLevelRef.current, gameState.level)
    ) {
      const newPhaseNumber = getPhaseNumber(gameState.level);
      onPhaseTransition(newPhaseNumber);
      logger.info({ context: LogContext.PHASE, phase: newPhaseNumber }, 'Phase transition started');
    }
    previousPhaseRef.current = gameState.currentPhase;
  }, [gameState.level, gameState.status, gameState.currentPhase, onPhaseTransition]);

  // Detect boss defeat
  useEffect(() => {
    if (
      gameState.status === GameStatus.PLAYING &&
      previousActiveBossRef.current &&
      !gameState.activeBoss
    ) {
      const bossLevel = previousLevelRef.current;
      const phaseNumber = getPhaseNumber(bossLevel);
      const scoreIncrease = gameState.score - previousScoreRef.current;

      onBossDefeat(previousActiveBossRef.current, scoreIncrease, phaseNumber);
      logger.info(
        { context: LogContext.BOSS, boss: previousActiveBossRef.current.id },
        'Boss defeat transition started',
      );
    }
    previousActiveBossRef.current = gameState.activeBoss;
    previousScoreRef.current = gameState.score;
  }, [gameState.activeBoss, gameState.score, gameState.status, gameState.level, onBossDefeat]);

  // Detect newly unlocked achievements
  useEffect(() => {
    const currentUnlocked = gameState.achievements.filter((a) => a.unlocked).map((a) => a.id);
    const previousUnlocked = new Set(
      previousAchievementsRef.current.filter((a) => a.unlocked).map((a) => a.id),
    );

    const newlyUnlocked = currentUnlocked.filter((id) => !previousUnlocked.has(id));

    if (newlyUnlocked.length > 0) {
      onAchievementsUnlocked(newlyUnlocked);
    }

    previousAchievementsRef.current = gameState.achievements;
  }, [gameState.achievements, onAchievementsUnlocked]);

  return {
    previousLevelRef,
    previousScoreRef,
    previousPhaseRef,
    previousActiveBossRef,
  };
}
