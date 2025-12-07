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
import { Food } from './Food';
import { ObstacleComponent } from './Obstacle';
import { ParticleSystem } from './ParticleSystem';
import { Portal as PortalComponent } from './Portal';
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
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      if (boardRef.current) {
        const container = boardRef.current.parentElement;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const padding = mobile ? 8 : 24;
          const availableWidth = containerRect.width - padding * 2;
          const availableHeight = containerRect.height - padding * 2;

          const calculatedCellSize = Math.floor(
            Math.min(availableWidth, availableHeight) / GAME_CONFIG.gridSize,
          );

          if (mobile) {
            const finalCellSize = Math.max(calculatedCellSize, 8);
            setCellSize(finalCellSize);
          } else {
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
  }, [canvasKey]);

  // Sync State to Worker
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
    renderWorkerRef.current?.postMessage({
      type: 'UPDATE',
      payload: {
        snake,
        bossSnake,
        shots: poisonShots,
        activeBoss: activeBoss
          ? {
              color: activeBoss.visual.color,
              icon: activeBoss.visual.icon,
              name: t(`bosses.${activeBoss.id}.name`),
            }
          : null,
        isEating,
        speed,
        status,
      },
    });
  }, [snake, bossSnake, poisonShots, activeBoss, isEating, speed, t, status]);

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

  const foodKey = `food-${food.position.x}-${food.position.y}-${food.type}`;

  const portalPairs = useMemo(() => {
    const pairs = new Map<string, Portal[]>();
    portals.forEach((portal) => {
      const pair = pairs.get(portal.pairId) ?? [];
      pair.push(portal);
      pairs.set(portal.pairId, pair);
    });
    return pairs;
  }, [portals]);

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

        {/* DOM Elements for Static/Interactables */}
        {GAME_CONFIG.enableObstacles &&
          obstacles.map((obstacle) => <ObstacleComponent key={obstacle.id} obstacle={obstacle} />)}

        {portals.map((portal) => {
          const pair = portalPairs.get(portal.pairId) ?? [];
          const isFirst = pair.length > 0 && pair[0]?.id === portal.id;
          return <PortalComponent key={portal.id} portal={portal} isFirst={isFirst} />;
        })}

        {/* WORKER RENDER LAYER: Snake, Boss, Shots */}
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
            zIndex: 20, // Ensure above obstacles/floor but below HUD/particles?
            // Particles are zIndex 5 in CSS usually or handled via layer order.
          }}
        />

        <Food key={foodKey} food={food} />

        {guardianFlag && (
          <Food
            key={`guardian-flag-${guardianFlag.position.x}-${guardianFlag.position.y}`}
            food={guardianFlag}
          />
        )}

        {/* Particle System (Separate Worker) */}
        <ParticleSystem />
      </div>
    </div>
  );
});
