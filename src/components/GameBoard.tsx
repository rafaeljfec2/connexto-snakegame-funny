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
// import { SnakeSegment } from './SnakeSegment'; // Removed in favor of SnakeRenderer
import { SnakeRenderer } from './SnakeRenderer';
import { Food } from './Food';
import { ObstacleComponent } from './Obstacle';
import { ParticleSystem } from './ParticleSystem';
import { Portal as PortalComponent } from './Portal';
import { BossSnake as BossSnakeComponent } from './BossSnake';
import { StormEffect } from './StormEffect';
import { WeatherEffect } from './WeatherEffect';
import { useEffect, useRef, useState, useMemo, memo } from 'react';
import styles from './GameBoard.module.css';
import { Chef } from '@/types/phases';
import { getCurrentPhase } from '@/utils/phases';
import { GameBackground } from './GameBackground';

interface GameBoardProps {
  snake: Position[];
  food: FoodType;
  status: GameStatus;
  level: number;
  obstacles?: Obstacle[];
  portals?: Portal[];
  particles?: Particle[]; // Kept in interface for compatibility but unused
  poisonShots?: PoisonShot[];
  activeBoss?: Chef;
  bossSnake?: BossSnake;
  guardianFlag?: FoodType | null;
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
}: GameBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(GAME_CONFIG.cellSize);
  const [isMobile, setIsMobile] = useState(false);

  // Calculate responsive cell size based on container
  // This ensures cellSize controls only the visual size, not the grid dimensions
  useEffect(() => {
    const updateCellSize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      if (boardRef.current) {
        const container = boardRef.current.parentElement;
        if (container) {
          // Get available space (accounting for padding)
          const containerRect = container.getBoundingClientRect();
          const padding = mobile ? 8 : 24; // Account for container padding
          const availableWidth = containerRect.width - padding * 2;
          const availableHeight = containerRect.height - padding * 2;

          // Calculate cell size to fit the grid (use the smaller dimension to maintain square)
          const calculatedCellSize = Math.floor(
            Math.min(availableWidth, availableHeight) / GAME_CONFIG.gridSize,
          );

          if (mobile) {
            // Mobile: calculate based on available space, ensure minimum cell size (at least 8px)
            const finalCellSize = Math.max(calculatedCellSize, 8);
            setCellSize(finalCellSize);
          } else {
            // Desktop: use configured cellSize directly (it controls both cell and grid size)
            setCellSize(GAME_CONFIG.cellSize);
          }
        }
      }
    };

    // Initial check
    updateCellSize();

    // Use ResizeObserver for more accurate size tracking
    let resizeObserver: ResizeObserver | null = null;
    if (boardRef.current?.parentElement) {
      resizeObserver = new ResizeObserver(() => {
        // Debounce to avoid too many recalculations
        setTimeout(updateCellSize, 50);
      });
      resizeObserver.observe(boardRef.current.parentElement);
    }

    // Also listen to window events as fallback
    window.addEventListener('resize', updateCellSize);
    window.addEventListener('orientationchange', () => {
      setTimeout(updateCellSize, 100);
    });

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', updateCellSize);
      window.removeEventListener('orientationchange', updateCellSize);
    };
  }, []);

  // Desktop: Use fixed cellSize pixels for grid definition (changes grid size)
  // Mobile: Use 'fr' units to always fit container (cellSize calculated dynamically)
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
  const previousFoodKeyRef = useRef(`${food.position.x}-${food.position.y}-${food.type}`);
  const [isLevelUp, setIsLevelUp] = useState(false);
  const [isEating, setIsEating] = useState(false);

  // Detect food eaten (head eating animation)
  useEffect(() => {
    const currentFoodKey = `${food.position.x}-${food.position.y}-${food.type}`;
    const foodChanged = currentFoodKey !== previousFoodKeyRef.current;

    // Food was eaten if position changed OR type changed while playing
    if (foodChanged && status === GameStatus.PLAYING && snake.length > 0) {
      setIsEating(true);
      setTimeout(() => setIsEating(false), 200); // Shorter duration for snappy feel
    }

    previousFoodKeyRef.current = currentFoodKey;
  }, [food.position, food.type, status, snake.length]);

  // Detect level up for board animation
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

  // Group portals by pairId to determine which is first/second (memoized)
  const portalPairs = useMemo(() => {
    const pairs = new Map<string, Portal[]>();
    portals.forEach((portal) => {
      const pair = pairs.get(portal.pairId) ?? [];
      pair.push(portal);
      pairs.set(portal.pairId, pair);
    });
    return pairs;
  }, [portals]);

  // Get current phase for weather effects
  const currentPhase = useMemo(() => {
    const phase = getCurrentPhase(level);
    return phase?.id ?? 0;
  }, [level]);

  // Detect mobile for conditional rendering of heavy effects
  // Disable weather effects on mobile for better performance
  const shouldShowWeatherEffects = !isMobile;

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
      {/* Static Background Layer */}
      <GameBackground isMobile={isMobile} cellSize={cellSize} />

      {/* Game Elements Layer */}
      <div className={styles.gameLayer} style={gridStyle}>
        {/* Weather Effects for all phases - Disabled on mobile for performance */}
        {shouldShowWeatherEffects && <WeatherEffect level={level} />}

        {/* Storm Effect for Phase 9 (Vortex Challenge) - Disabled on mobile for performance */}
        {shouldShowWeatherEffects && currentPhase === 9 && <StormEffect level={level} />}

        {/* Obstacles */}
        {GAME_CONFIG.enableObstacles &&
          obstacles.map((obstacle) => <ObstacleComponent key={obstacle.id} obstacle={obstacle} />)}

        {/* Portals */}
        {portals.map((portal) => {
          const pair = portalPairs.get(portal.pairId) ?? [];
          const isFirst = pair.length > 0 && pair[0]?.id === portal.id;
          return <PortalComponent key={portal.id} portal={portal} isFirst={isFirst} />;
        })}

        {/* SNAKE - Rendered via Canvas for Performance */}
        <SnakeRenderer
          snake={snake}
          cellSize={cellSize}
          isMobile={isMobile}
          gridSize={GAME_CONFIG.gridSize}
          isEating={isEating}
        />

        <Food key={foodKey} food={food} />

        {/* Guardian Flag - special power-up for Guardian boss */}
        {guardianFlag && (
          <Food
            key={`guardian-flag-${guardianFlag.position.x}-${guardianFlag.position.y}`}
            food={guardianFlag}
          />
        )}

        {activeBoss && bossSnake && <BossSnakeComponent bossSnake={bossSnake} boss={activeBoss} />}

        {/* Particles Effect System */}
        <ParticleSystem />

        {/* Poison Shots - Rendered in DOM for compatibility */}
        {poisonShots.map((shot) => (
          <div
            key={`shot-${shot.id}`}
            className='poison-shot' // Use class if possible, but inline is fine for dynamic pos
            style={{
              position: 'absolute',
              left: isMobile
                ? `calc(${shot.position.x} * (100% / ${GAME_CONFIG.gridSize}))`
                : `${shot.position.x * cellSize}px`,
              top: isMobile
                ? `calc(${shot.position.y} * (100% / ${GAME_CONFIG.gridSize}))`
                : `${shot.position.y * cellSize}px`,
              width: isMobile
                ? `calc(100% / ${GAME_CONFIG.gridSize} * 0.6)`
                : `${cellSize * 0.6}px`,
              height: isMobile
                ? `calc(100% / ${GAME_CONFIG.gridSize} * 0.6)`
                : `${cellSize * 0.6}px`,
              backgroundColor: '#10b981',
              borderRadius: '50%',
              zIndex: 100,
              pointerEvents: 'none',
              transform: 'translate(30%, 30%)',
              boxShadow: '0 0 5px #10b981',
              willChange: 'left, top', // Optimization hint
            }}
          />
        ))}
      </div>
    </div>
  );
});
