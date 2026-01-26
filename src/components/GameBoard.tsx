import { useTranslation } from 'react-i18next';
import {
  Position,
  GameStatus,
  Food as FoodType,
  Obstacle,
  Particle,
  Portal,
  BossSnake,
  PoisonShot,
} from '@/types/game';
import { GAME_CONFIG } from '@/constants/game';
import { calculateGameSpeed } from '@/utils/difficulty';
import { WeatherCanvas } from './WeatherCanvas';
import { ParticleSystem } from './ParticleSystem';
import { useEffect, useRef, useState, useMemo, memo } from 'react';
import styles from './GameBoard.module.css';
import { Chef } from '@/types/phases';
import { GameBackground } from './GameBackground';

interface GameBoardProps {
  snake: Position[];
  food: FoodType;
  status: GameStatus;
  level: number;
  obstacles?: Obstacle[];
  portals?: Portal[];
  particles?: Particle[];
  poisonShots?: PoisonShot[];
  activeBoss?: Chef;
  bossSnake?: BossSnake;
  guardianFlag?: FoodType | null;
  resetToken?: number;
  gameWorker?: Worker | null;
}

export const GameBoard = memo(function GameBoard({
  snake,
  food,
  status,
  level,
  obstacles = [],
  portals = [],
  poisonShots = [],
  activeBoss,
  bossSnake,
  guardianFlag,
  resetToken = 0,
  gameWorker,
}: GameBoardProps) {
  const { t } = useTranslation();
  const boardRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(GAME_CONFIG.cellSize);
  const [isMobile, setIsMobile] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);

  // Reset worker when resetToken changes
  useEffect(() => {
    if (resetToken > 0) {
      setCanvasKey((prev) => prev + 1);
    }
  }, [resetToken]);

  // Worker for rendering Snake, Boss, Shots (High Frequency Updates)
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);
  const renderWorkerRef = useRef<Worker | null>(null);

  // Calculate responsive cell size based on container
  useEffect(() => {
    const updateCellSize = () => {
      // Consider "mobile/responsive" if screen is narrow OR if it's landscape with limited height
      // This ensures the game scales down on landscape tablets/phones instead of using fixed desktop size
      const isNarrow = window.innerWidth <= 1024;
      const isLandscapeShort = window.innerHeight <= 800 && window.innerWidth > window.innerHeight;
      const responsiveMode = isNarrow || isLandscapeShort;

      setIsMobile(responsiveMode);

      if (boardRef.current) {
        const container = boardRef.current.parentElement;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const padding = responsiveMode ? 4 : 24; // Less padding in responsive mode
          const availableWidth = containerRect.width - padding * 2;
          const availableHeight = containerRect.height - padding * 2;

          const calculatedCellSize = Math.floor(
            Math.min(availableWidth, availableHeight) / GAME_CONFIG.gridSize,
          );

          if (responsiveMode) {
            // In responsive mode, use calculated size but ensure min 8px
            const finalCellSize = Math.max(calculatedCellSize, 8);
            setCellSize(finalCellSize);
          } else {
            // Desktop mode - fixed size
            setCellSize(GAME_CONFIG.cellSize);
          }
        }
      }
    };

    updateCellSize();

    let resizeObserver: ResizeObserver | null = null;
    if (boardRef.current?.parentElement) {
      resizeObserver = new ResizeObserver(() => {
        setTimeout(updateCellSize, 50);

        // Notify worker of resize
        if (renderCanvasRef.current && renderWorkerRef.current && boardRef.current) {
          // Need accurate dimensions of the CANVAS/Grid, not just container
          // The canvas fills the grid defined by CSS
          // We can read boardRef dimensions
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

  // Initialize Render Worker
  useEffect(() => {
    if (!renderCanvasRef.current || renderWorkerRef.current) return;

    const worker = new Worker(new URL('../workers/render.worker.ts', import.meta.url), {
      type: 'module',
    });
    renderWorkerRef.current = worker;

    const canvas = renderCanvasRef.current;

    // Check if OffscreenCanvas is supported
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

        // Connect to Game Worker if available for direct rendering
        if (gameWorker) {
          const channel = new MessageChannel();
          worker.postMessage({ type: 'CONNECT_GAME_WORKER', port: channel.port1 }, [channel.port1]);
          gameWorker.postMessage({ type: 'CONNECT_RENDER_WORKER', port: channel.port2 }, [
            channel.port2,
          ]);
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
      // Fallback implementation logic would go here if needed
    }

    return () => {
      worker.terminate();
      renderWorkerRef.current = null;
    };
  }, [canvasKey, gameWorker]);

  // Sync State to Worker (Fallback / Metadata updates)
  const speed = useMemo(() => calculateGameSpeed(level), [level]);

  // IsEating Logic (kept for local prop calculation if needed, or pass directly)
  // Logic: detect change in food
  const previousFoodKeyRef = useRef(`${food.position.x}-${food.position.y}-${food.type}`);
  const [isEating, setIsEating] = useState(false);

  useEffect(() => {
    const currentFoodKey = `${food.position.x}-${food.position.y}-${food.type}`;
    const foodChanged = currentFoodKey !== previousFoodKeyRef.current;
    if (foodChanged && status === GameStatus.PLAYING && snake.length > 0) {
      setIsEating(true);
      setTimeout(() => setIsEating(false), 200);
    }
    previousFoodKeyRef.current = currentFoodKey;
  }, [food.position, food.type, status, snake.length]);

  useEffect(() => {
    // We still send updates from main thread as a fallback or for things not in game state directly (like "isEating" derived UI state)
    // But render worker should prioritize direct updates if available
    renderWorkerRef.current?.postMessage({
      type: 'UPDATE',
      payload: {
        snake,
        bossSnake,
        shots: poisonShots,
        food,
        obstacles: GAME_CONFIG.enableObstacles ? obstacles : [],
        portals,
        activeBoss: activeBoss
          ? {
              color: activeBoss.visual.color,
              icon: activeBoss.visual.icon,
              name: t(`bosses.${activeBoss.id}.name`),
            }
          : null,
        guardianFlag,
        isEating,
        speed,
        status,
      },
    });
  }, [
    snake,
    bossSnake,
    poisonShots,
    food,
    obstacles,
    portals,
    activeBoss,
    guardianFlag,
    isEating,
    speed,
    t,
    status,
  ]);

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

        {/* WORKER RENDER LAYER: Snake, Boss, Shots, Food, Obstacles, Portals */}
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

        {/* Particle System (Separate Worker) */}
        <ParticleSystem />
      </div>
    </div>
  );
});
