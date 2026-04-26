import { useEffect, useRef, useCallback, useState } from 'react';
import { GameStatus, GameState, Direction } from '@/types/game';
import { spawnParticles } from '@/utils/particles';
import { saveHighScore, getHighScore } from '@/utils/gameLogic';
import { saveAchievements } from '@/utils/achievements';
import { Chef } from '@/types/phases';
import { perfBus } from '@/utils/perfBus';
import { sfxEngine } from '@/utils/sfxEngine';
import type { SfxWorkerMessage } from '@/types/sfx';
import { setGameStateUpdater, useGameStateSlice } from '@/state/gameStateStore';

export function useGameLoop() {
  const gameState = useGameStateSlice<GameState>((state) => state);

  const workerRef = useRef<Worker | null>(null);
  const [workerInstance, setWorkerInstance] = useState<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/game.worker.ts', import.meta.url), {
      type: 'module',
    });
    setWorkerInstance(workerRef.current);

    const worker = workerRef.current;
    const detachPerf = perfBus.attachWorker(worker, 'game');

    worker.onmessage = (e: MessageEvent) => {
      const { type, payload } = e.data;

      if (type === 'SFX') {
        const sfxMessage = e.data as SfxWorkerMessage;
        sfxEngine.play(sfxMessage.id);
        return;
      }

      switch (type) {
        case 'GAME_STATE_UPDATE':
          setGameStateUpdater(() => payload);
          break;

        case 'GAME_STATE_DELTA':
          setGameStateUpdater((prev) => ({ ...prev, ...payload }));
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
          if (payload.status === GameStatus.GAME_OVER && payload.score !== undefined) {
            saveHighScore(payload.score);
          }
          setGameStateUpdater((prev) => ({ ...prev, status: payload.status }));
          break;

        case 'SAVE_ACHIEVEMENTS':
          saveAchievements(payload);
          break;
      }
    };

    worker.postMessage({ type: 'INIT', payload: { highScore: getHighScore() } });

    return () => {
      detachPerf();
      worker.terminate();
    };
  }, []);

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
    workerRef.current?.postMessage({ type: 'FIRE_POISON' });
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

  const resumeAfterDeath = useCallback(() => {
    workerRef.current?.postMessage({ type: 'RESUME_AFTER_DEATH' });
  }, []);

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
    resumeAfterDeath,
    updateGameState: (_updater: (prev: GameState) => GameState) =>
      console.warn('updateGameState is deprecated'),
    gameWorker: workerInstance,
  };
}
