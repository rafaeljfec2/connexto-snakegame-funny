import { useTranslation } from 'react-i18next';
import { GameStatus } from '@/types/game';
import { GAME_CONFIG } from '@/constants/game';
import { WeatherCanvas } from './WeatherCanvas';
import { ParticleSystem } from './ParticleSystem';
import { useEffect, useRef, useState, memo } from 'react';
import styles from './GameBoard.module.css';
import { GameBackground } from './GameBackground';
import { perfBus } from '@/utils/perfBus';
import { useGameStateSlice } from '@/state/gameStateStore';
import { useSkin } from '@/contexts/SkinContext';

interface GameBoardProps {
  resetToken?: number;
  gameWorker?: Worker | null;
}

function GameBoardComponent({ resetToken = 0, gameWorker }: Readonly<GameBoardProps>) {
  const { t } = useTranslation();
  const boardRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(GAME_CONFIG.cellSize);
  const [isMobile, setIsMobile] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);

  const status = useGameStateSlice((s) => s.status);
  const level = useGameStateSlice((s) => s.level);
  const activeBossId = useGameStateSlice((s) => s.activeBoss?.id ?? null);
  const foodPosX = useGameStateSlice((s) => s.food.position.x);
  const foodPosY = useGameStateSlice((s) => s.food.position.y);
  const foodType = useGameStateSlice((s) => s.food.type);
  const snakeIsEmpty = useGameStateSlice((s) => s.snake.length === 0);
  const { palette } = useSkin();

  useEffect(() => {
    if (resetToken > 0) {
      setCanvasKey((prev) => prev + 1);
    }
  }, [resetToken]);

  const renderCanvasRef = useRef<HTMLCanvasElement>(null);
  const renderWorkerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const updateCellSize = () => {
      const narrow = window.innerWidth <= 768;
      setIsMobile(narrow);

      if (!boardRef.current) return;
      const container = boardRef.current.parentElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const containerStyle = window.getComputedStyle(container);
      const horizontalPadding =
        parseFloat(containerStyle.paddingLeft) + parseFloat(containerStyle.paddingRight);
      const verticalPadding =
        parseFloat(containerStyle.paddingTop) + parseFloat(containerStyle.paddingBottom);

      const availableWidth = containerRect.width - horizontalPadding;
      const availableHeight = containerRect.height - verticalPadding;
      const availableSide = Math.min(availableWidth, availableHeight);

      if (availableSide <= 0) return;

      const rawCellSize = Math.floor(availableSide / GAME_CONFIG.gridSize);
      const minCellSize = narrow ? 8 : 12;
      const maxCellSize = 32;
      const finalCellSize = Math.max(minCellSize, Math.min(maxCellSize, rawCellSize));
      setCellSize(finalCellSize);
    };

    updateCellSize();

    let resizeObserver: ResizeObserver | null = null;
    if (boardRef.current?.parentElement) {
      resizeObserver = new ResizeObserver(() => {
        setTimeout(updateCellSize, 50);

        if (renderCanvasRef.current && renderWorkerRef.current && boardRef.current) {
          const rect = boardRef.current.getBoundingClientRect();
          renderWorkerRef.current.postMessage({
            type: 'RESIZE',
            payload: {
              width: rect.width,
              height: rect.height,
              dpr: window.devicePixelRatio,
            },
          });
        }
      });
      resizeObserver.observe(boardRef.current.parentElement);
    }

    window.addEventListener('resize', updateCellSize);
    window.addEventListener('orientationchange', () => {
      setTimeout(updateCellSize, 100);
    });

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', updateCellSize);
      window.removeEventListener('orientationchange', updateCellSize);
    };
  }, []);

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
              dpr: window.devicePixelRatio,
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

    return () => {
      detachPerf();
      worker.terminate();
      renderWorkerRef.current = null;
    };
  }, [canvasKey, gameWorker]);

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

  const gridStyle = isMobile
    ? {
        gridTemplateColumns: `repeat(${GAME_CONFIG.gridSize}, 1fr)`,
        gridTemplateRows: `repeat(${GAME_CONFIG.gridSize}, 1fr)`,
        width: '100%',
        height: '100%',
      }
    : {
        gridTemplateColumns: `repeat(${GAME_CONFIG.gridSize}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${GAME_CONFIG.gridSize}, ${cellSize}px)`,
        width: `${GAME_CONFIG.gridSize * cellSize}px`,
        height: `${GAME_CONFIG.gridSize * cellSize}px`,
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
      style={
        isMobile
          ? { width: '100%', height: '100%' }
          : {
              width: `${GAME_CONFIG.gridSize * cellSize}px`,
              height: `${GAME_CONFIG.gridSize * cellSize}px`,
            }
      }
    >
      <GameBackground isMobile={isMobile} cellSize={cellSize} />

      <div className={styles.gameLayer} style={gridStyle}>
        <WeatherCanvas level={level} isMobile={isMobile} />

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
