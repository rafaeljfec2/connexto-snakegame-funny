import { useTranslation } from 'react-i18next';
import { GameStatus, type ActivePowerUp } from '@/types/game';
import { GAME_CONFIG } from '@/constants/game';
import { POWER_UP_CONFIG } from '@/constants/powerUps';
import { getActivePowerUps } from '@/utils/powerUps';
import { WeatherCanvas } from './WeatherCanvas';
import { ParticleSystem } from './ParticleSystem';
import { useCallback, useEffect, useMemo, useRef, useState, memo, type CSSProperties } from 'react';
import styles from './GameBoard.module.css';
import { GameBackground } from './GameBackground';
import { perfBus } from '@/utils/perfBus';
import { useGameStateSlice } from '@/state/gameStateStore';
import { useSkin } from '@/contexts/SkinContext';

function powerUpsEqual(a: readonly ActivePowerUp[], b: readonly ActivePowerUp[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const aa = a[i];
    const bb = b[i];
    if (!aa || !bb) return false;
    if (aa.type !== bb.type || aa.startTime !== bb.startTime || aa.duration !== bb.duration) {
      return false;
    }
  }
  return true;
}

interface GameBoardProps {
  resetToken?: number;
  gameWorker?: Worker | null;
}

function GameBoardComponent({ resetToken = 0, gameWorker }: Readonly<GameBoardProps>) {
  const { t } = useTranslation();
  const boardRef = useRef<HTMLDivElement>(null);
  const [canvasKey, setCanvasKey] = useState(0);
  const [narrowViewport, setNarrowViewport] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 768,
  );

  const status = useGameStateSlice((s) => s.status);
  const level = useGameStateSlice((s) => s.level);
  const activeBossId = useGameStateSlice((s) => s.activeBoss?.id ?? null);
  const foodPosX = useGameStateSlice((s) => s.food.position.x);
  const foodPosY = useGameStateSlice((s) => s.food.position.y);
  const foodType = useGameStateSlice((s) => s.food.type);
  const snakeIsEmpty = useGameStateSlice((s) => s.snake.length === 0);
  const rawPowerUps = useGameStateSlice((s) => s.activePowerUps, powerUpsEqual);
  const { palette } = useSkin();

  const effectTint = useMemo(() => {
    const active = getActivePowerUps(rawPowerUps ?? []).filter((p) => p.duration > 0);
    if (active.length === 0) return null;
    const top = active[active.length - 1];
    if (!top) return null;
    return POWER_UP_CONFIG.colors[top.type]?.primary ?? null;
  }, [rawPowerUps]);

  useEffect(() => {
    if (resetToken > 0) {
      setCanvasKey((prev) => prev + 1);
    }
  }, [resetToken]);

  const renderCanvasRef = useRef<HTMLCanvasElement>(null);
  const renderWorkerRef = useRef<Worker | null>(null);
  const lastSizeRef = useRef({ width: -1, height: -1, dpr: -1 });

  const publishBoardResize = useCallback(() => {
    const board = boardRef.current;
    const worker = renderWorkerRef.current;
    if (!board || !worker) return;

    const rect = board.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dpr = window.devicePixelRatio > 0 ? window.devicePixelRatio : 1;
    const last = lastSizeRef.current;
    if (last.width === rect.width && last.height === rect.height && last.dpr === dpr) return;

    lastSizeRef.current = { width: rect.width, height: rect.height, dpr };
    worker.postMessage({
      type: 'RESIZE',
      payload: {
        width: rect.width,
        height: rect.height,
        dpr,
      },
    });
  }, []);

  useEffect(() => {
    const onResize = () => {
      setNarrowViewport((prev) => {
        const next = window.innerWidth <= 768;
        return prev === next ? prev : next;
      });
      publishBoardResize();
    };
    const resizeObserver = new ResizeObserver(onResize);
    if (boardRef.current) resizeObserver.observe(boardRef.current);

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [publishBoardResize]);

  useEffect(() => {
    if (!renderCanvasRef.current || renderWorkerRef.current) return;

    const worker = new Worker(new URL('../workers/render.worker.ts', import.meta.url), {
      type: 'module',
    });
    renderWorkerRef.current = worker;
    const detachPerf = perfBus.attachWorker(worker, 'render');

    const canvas = renderCanvasRef.current;

    if (canvas.transferControlToOffscreen) {
      try {
        const offscreen = canvas.transferControlToOffscreen();
        worker.postMessage(
          {
            type: 'INIT',
            payload: {
              canvas: offscreen,
              width: canvas.clientWidth,
              height: canvas.clientHeight,
              dpr: window.devicePixelRatio > 0 ? window.devicePixelRatio : 1,
              isMobile: window.innerWidth <= 768,
            },
          },
          [offscreen],
        );

        if (gameWorker) {
          const channel = new MessageChannel();
          worker.postMessage({ type: 'CONNECT_GAME_WORKER', payload: { port: channel.port1 } }, [
            channel.port1,
          ]);
          gameWorker.postMessage(
            { type: 'CONNECT_RENDER_WORKER', payload: { port: channel.port2 } },
            [channel.port2],
          );
        }
      } catch (err) {
        console.warn(
          'Failed to transfer control to offscreen canvas, retrying with new canvas:',
          err,
        );
        setCanvasKey((prev) => prev + 1);
      }
    } else {
      console.warn('OffscreenCanvas not supported, falling back or failing gracefully.');
    }

    lastSizeRef.current = { width: -1, height: -1, dpr: -1 };
    publishBoardResize();

    return () => {
      detachPerf();
      worker.terminate();
      renderWorkerRef.current = null;
    };
  }, [canvasKey, gameWorker, publishBoardResize]);

  useEffect(() => {
    const worker = renderWorkerRef.current;
    if (!worker) return;
    worker.postMessage({ type: 'UI_SKIN', payload: { skin: palette } });
  }, [palette, canvasKey]);

  const previousFoodKeyRef = useRef(`${foodPosX}-${foodPosY}-${foodType}`);

  useEffect(() => {
    const currentFoodKey = `${foodPosX}-${foodPosY}-${foodType}`;
    const foodChanged = currentFoodKey !== previousFoodKeyRef.current;
    previousFoodKeyRef.current = currentFoodKey;

    if (!foodChanged || status !== GameStatus.PLAYING || snakeIsEmpty) return;

    const worker = renderWorkerRef.current;
    if (!worker) return;

    worker.postMessage({ type: 'UI_HINT', payload: { isEating: true } });
    const timeoutId = setTimeout(() => {
      worker.postMessage({ type: 'UI_HINT', payload: { isEating: false } });
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [foodPosX, foodPosY, foodType, status, snakeIsEmpty]);

  const previousActiveBossIdRef = useRef<string | null>(null);
  useEffect(() => {
    const worker = renderWorkerRef.current;
    if (!worker) return;
    if (activeBossId === previousActiveBossIdRef.current) return;
    previousActiveBossIdRef.current = activeBossId;
    if (!activeBossId) return;
    worker.postMessage({
      type: 'UI_LOCALE',
      payload: { activeBoss: { name: t(`bosses.${activeBossId}.name`) } },
    });
  }, [activeBossId, t]);

  const gridStyle = {
    gridTemplateColumns: `repeat(${GAME_CONFIG.gridSize}, 1fr)`,
    gridTemplateRows: `repeat(${GAME_CONFIG.gridSize}, 1fr)`,
    width: '100%',
    height: '100%',
  };

  const previousLevelRef = useRef(level);
  const [isLevelUp, setIsLevelUp] = useState(false);

  useEffect(() => {
    if (level > previousLevelRef.current) {
      setIsLevelUp(true);
      setTimeout(() => setIsLevelUp(false), 600);
    }
    previousLevelRef.current = level;
  }, [level]);

  const boardClassName = `${styles.gameBoard} ${
    status === GameStatus.GAME_OVER ? styles.gameOver : ''
  } ${isLevelUp ? styles.levelUp : ''}`;

  return (
    <div
      ref={boardRef}
      className={boardClassName}
      data-testid='game-board'
      style={{ width: '100%', height: '100%' }}
    >
      <GameBackground isMobile cellSize={GAME_CONFIG.cellSize} />

      {effectTint && (
        <div
          className={styles.effectTint}
          style={{ '--effect-tint': effectTint } as CSSProperties}
          aria-hidden='true'
          data-testid='effect-tint'
        />
      )}

      <div className={styles.gameLayer} style={gridStyle}>
        <WeatherCanvas level={level} isMobile={narrowViewport} />

        <canvas
          key={canvasKey}
          ref={renderCanvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 20,
          }}
        />

        <ParticleSystem />
      </div>
    </div>
  );
}

export const GameBoard = memo(GameBoardComponent);
GameBoard.displayName = 'GameBoard';
