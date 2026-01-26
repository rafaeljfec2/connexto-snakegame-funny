import { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, GameStatus } from '@/types/game';
import { createFinalStatistics, saveGameSession } from '@/utils/statistics';

interface UseGameOverHandlerProps {
  gameState: GameState;
  onStatisticsReady: (statistics: ReturnType<typeof createFinalStatistics>) => void;
}

export function useGameOverHandler({ gameState, onStatisticsReady }: UseGameOverHandlerProps) {
  const [isProcessingGameOver, setIsProcessingGameOver] = useState(false);
  const previousStatusRef = useRef(gameState.status);
  const gameStateRef = useRef(gameState);

  // Keep gameState ref up to date
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Save statistics when game ends
  useEffect(() => {
    const wasNotGameOver = previousStatusRef.current !== GameStatus.GAME_OVER;
    const isNowGameOver = gameState.status === GameStatus.GAME_OVER;

    if (wasNotGameOver && isNowGameOver) {
      setIsProcessingGameOver(true);
      const snakeLength = gameStateRef.current.snake.length;
      const cameFromDying = previousStatusRef.current === GameStatus.DYING;
      const deathAnimationDuration = cameFromDying ? 500 : Math.min(2500, snakeLength * 50 + 300);

      const timer = setTimeout(() => {
        setIsProcessingGameOver(false);
        try {
          const currentGameState = gameStateRef.current;
          const finalStats = createFinalStatistics(currentGameState);
          saveGameSession(finalStats);
          onStatisticsReady(finalStats);
        } catch (error) {
          console.error('Failed to create/save statistics:', error);
        }
      }, deathAnimationDuration);

      return () => clearTimeout(timer);
    }

    previousStatusRef.current = gameState.status;
  }, [gameState.status, onStatisticsReady]);

  const resetProcessingState = useCallback(() => {
    setIsProcessingGameOver(false);
    previousStatusRef.current = GameStatus.IDLE;
  }, []);

  return {
    isProcessingGameOver,
    resetProcessingState,
  };
}
