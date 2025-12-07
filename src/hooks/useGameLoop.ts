import { useEffect, useRef, useCallback, useState } from 'react';
import { GameStatus, GameState, Direction, FoodType } from '@/types/game';
import { INITIAL_SNAKE_POSITION, INITIAL_DIRECTION, GAME_CONFIG } from '@/constants/game';
import { initializeStatistics } from '@/utils/statistics';
import { spawnParticles } from '@/utils/particles';
import { saveHighScore, getHighScore } from '@/utils/gameLogic';
import { saveAchievements } from '@/utils/achievements';
import { Chef } from '@/types/phases';

// Initial state factory
const getInitialState = (): GameState => ({
  snake: [...INITIAL_SNAKE_POSITION],
  food: {
    position: { x: 5, y: 5 }, // Placeholder
    type: FoodType.NORMAL,
    spawnTime: Date.now(),
  },
  direction: INITIAL_DIRECTION,
  nextDirection: INITIAL_DIRECTION,
  status: GameStatus.IDLE,
  score: 0,
  highScore: getHighScore(),
  level: 1,
  gameSpeed: GAME_CONFIG.gameSpeed,
  activePowerUps: [],
  obstacles: [],
  portals: [],
  combo: { count: 0, multiplier: 1, lastFoodTime: 0 },
  particles: [],
  poisonShots: [],
  achievements: [],
  lives: 3,
  statistics: initializeStatistics(),
  isSpeedBoosted: false,
  isFiringPoison: false,
});

export function useGameLoop() {
  // Local state mirror for React rendering
  const [gameState, setGameState] = useState<GameState>(getInitialState());

  // Worker reference
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Initialize Worker
    workerRef.current = new Worker(new URL('../workers/game.worker.ts', import.meta.url), {
      type: 'module',
    });

    const worker = workerRef.current;

    // Handle messages from worker
    worker.onmessage = (e: MessageEvent) => {
      const { type, payload } = e.data;

      switch (type) {
        case 'GAME_STATE_UPDATE':
          setGameState(payload);
          break;

        case 'SPAWN_PARTICLES':
          spawnParticles(
            payload.position,
            payload.color,
            payload.count,
            payload.lifetime,
            payload.size,
          );
          break;

        case 'GAME_OVER_OR_DYING':
          if (payload.status === GameStatus.GAME_OVER) {
            if (payload.score !== undefined) {
              saveHighScore(payload.score);
            }
          }
          // Force status update if needed immediately
          setGameState((prev) => ({ ...prev, status: payload.status }));
          break;

        case 'SAVE_ACHIEVEMENTS':
          saveAchievements(payload);
          break;
      }
    };

    // Initialize worker state
    worker.postMessage({ type: 'INIT', payload: { highScore: getHighScore() } });

    return () => {
      worker.terminate();
    };
  }, []);

  // Actions interface - proxies to worker

  const startGame = useCallback(() => {
    workerRef.current?.postMessage({ type: 'START_GAME', payload: { highScore: getHighScore() } });
  }, []);

  const pauseGame = useCallback(() => {
    workerRef.current?.postMessage({ type: 'PAUSE_GAME' });
  }, []);

  const resetGame = useCallback(() => {
    workerRef.current?.postMessage({ type: 'RESET_GAME', payload: { highScore: getHighScore() } });
  }, []);

  const setDirection = useCallback((direction: Direction) => {
    workerRef.current?.postMessage({ type: 'SET_DIRECTION', payload: { direction } });
  }, []);

  const setSpeedBoost = useCallback((enabled: boolean) => {
    workerRef.current?.postMessage({ type: 'SET_SPEED_BOOST', payload: { enabled } });
  }, []);

  const firePoison = useCallback(() => {
    console.log('[UseGameLoop] firePoison triggered');
    // Send explicit fire command for immediate response
    workerRef.current?.postMessage({ type: 'FIRE_POISON' });
    // Also enable continuous firing state
    workerRef.current?.postMessage({ type: 'SET_FIRING_POISON', payload: { enabled: true } });
  }, []);

  const setFiringPoison = useCallback((enabled: boolean) => {
    workerRef.current?.postMessage({ type: 'SET_FIRING_POISON', payload: { enabled } });
  }, []);

  const stopFiringPoison = useCallback(() => {
    setFiringPoison(false);
  }, [setFiringPoison]);

  const selectPhase = useCallback((phaseId: number) => {
    workerRef.current?.postMessage({ type: 'SELECT_PHASE', payload: { phaseId } });
  }, []);

  const nextPhase = useCallback((phaseNumber: number) => {
    workerRef.current?.postMessage({ type: 'NEXT_PHASE', payload: { phaseNumber } });
  }, []);

  const setPhaseComplete = useCallback((defeatedBossPhaseNumber?: number) => {
    workerRef.current?.postMessage({
      type: 'SET_PHASE_COMPLETE',
      payload: { defeatedBossPhaseNumber },
    });
  }, []);

  const spawnBoss = useCallback((boss: Chef | null) => {
    workerRef.current?.postMessage({ type: 'SPAWN_BOSS', payload: { bossId: boss?.id ?? null } });
  }, []);

  const setGameStatus = useCallback((status: GameStatus) => {
    workerRef.current?.postMessage({ type: 'SET_STATUS', payload: { status } });
  }, []);

  // Keyboard controls
  const handleKeyPress = useCallback(
    (key: string) => {
      if (key === ' ') {
        if (gameState.status === GameStatus.IDLE) {
          startGame();
        } else if (
          gameState.status === GameStatus.PLAYING ||
          gameState.status === GameStatus.PAUSED
        ) {
          pauseGame();
        } else if (gameState.status === GameStatus.GAME_OVER) {
          resetGame();
          startGame();
        }
      } else if (key === 'Enter' || key === 'Escape') {
        if (gameState.status === GameStatus.GAME_OVER) {
          resetGame();
        } else if (
          gameState.status === GameStatus.PLAYING ||
          gameState.status === GameStatus.PAUSED
        ) {
          pauseGame();
        }
      }
    },
    [gameState.status, startGame, pauseGame, resetGame],
  );

  return {
    gameState,
    resetGame,
    startGame,
    pauseGame,
    setDirection,
    setSpeedBoost,
    handleKeyPress,
    spawnBoss,
    firePoison,
    stopFiringPoison,
    selectPhase,
    nextPhase,
    setPhaseComplete,
    setGameStatus,
    updateGameState: (_updater: any) => console.warn('updateGameState is deprecated'),
  };
}
