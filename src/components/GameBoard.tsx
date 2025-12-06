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
import { SnakeSegment } from './SnakeSegment';
import { Food } from './Food';
import { ObstacleComponent } from './Obstacle';
import { ParticleSystem } from './ParticleSystem';
import { Portal as PortalComponent } from './Portal';
import { BossSnake as BossSnakeComponent } from './BossSnake';
import { PoisonShot as PoisonShotComponent } from './PoisonShot';
import { StormEffect } from './StormEffect';
import { WeatherEffect } from './WeatherEffect';
import { useEffect, useRef, useState, useMemo, memo } from 'react';
import styles from './GameBoard.module.css';
import { Chef } from '@/types/phases';
import { getCurrentPhase } from '@/utils/phases';

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
}

export const GameBoard = memo(function GameBoard({
  snake,
  food,
  status,
  level,
  obstacles = [],
  portals = [],
  particles = [],
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

  const previousSnakeLengthRef = useRef(snake.length);
  const previousLevelRef = useRef(level);
  const previousFoodKeyRef = useRef(`${food.position.x}-${food.position.y}-${food.type}`);
  const [isLevelUp, setIsLevelUp] = useState(false);
  const [newSegmentIndex, setNewSegmentIndex] = useState<number | null>(null);
  const [isEating, setIsEating] = useState(false);
  const [dyingSegments, setDyingSegments] = useState<Set<number>>(new Set());

  // Detect snake growth
  useEffect(() => {
    if (snake.length > previousSnakeLengthRef.current) {
      setNewSegmentIndex(snake.length - 1);
      setTimeout(() => setNewSegmentIndex(null), 300);
    }
    previousSnakeLengthRef.current = snake.length;
  }, [snake.length]);

  // Detect food eaten (head eating animation)
  useEffect(() => {
    const currentFoodKey = `${food.position.x}-${food.position.y}-${food.type}`;
    const foodChanged = currentFoodKey !== previousFoodKeyRef.current;

    // Food was eaten if position changed OR type changed while playing
    if (foodChanged && status === GameStatus.PLAYING && snake.length > 0) {
      setIsEating(true);
      setTimeout(() => setIsEating(false), 400);
    }

    previousFoodKeyRef.current = currentFoodKey;
  }, [food.position, food.type, status, snake.length]);

  // Animate snake death - segments explode in sequence
  useEffect(() => {
    if (status === GameStatus.GAME_OVER && snake.length > 0) {
      const segmentsToDie = new Set<number>();
      const timeouts: ReturnType<typeof setTimeout>[] = [];

      // Start explosion animation from tail to head
      snake.forEach((_, index) => {
        const timeout = setTimeout(() => {
          segmentsToDie.add(index);
          setDyingSegments(new Set(segmentsToDie));
        }, index * 50); // 50ms delay between each segment
        timeouts.push(timeout);
      });

      // Reset after animation completes
      const totalDuration = snake.length * 50 + 300;
      const resetTimeout = setTimeout(() => {
        setDyingSegments(new Set());
      }, totalDuration);
      timeouts.push(resetTimeout);

      return () => {
        timeouts.forEach(clearTimeout);
      };
    } else {
      setDyingSegments(new Set());
    }
  }, [status, snake.length, snake]);

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

  return (
    <div ref={boardRef} className={boardClassName} style={gridStyle}>
      {/* Weather Effects for all phases */}
      <WeatherEffect level={level} />

      {/* Storm Effect for Phase 9 (Vortex Challenge) - Keep for backward compatibility */}
      {currentPhase === 9 && <StormEffect level={level} />}

      {GAME_CONFIG.enableObstacles &&
        obstacles.map((obstacle) => <ObstacleComponent key={obstacle.id} obstacle={obstacle} />)}
      {portals.map((portal) => {
        const pair = portalPairs.get(portal.pairId) ?? [];
        const isFirst = pair.length > 0 && pair[0]?.id === portal.id;
        return <PortalComponent key={portal.id} portal={portal} isFirst={isFirst} />;
      })}
      {snake.map((segment, index) => (
        <SnakeSegment
          key={`snake-${index}`}
          position={segment}
          isHead={index === 0}
          isNew={newSegmentIndex === index}
          isEating={index === 0 && isEating}
          isDying={dyingSegments.has(index)}
        />
      ))}
      <Food key={foodKey} food={food} />
      {/* Guardian Flag - special power-up for Guardian boss */}
      {guardianFlag && (
        <Food
          key={`guardian-flag-${guardianFlag.position.x}-${guardianFlag.position.y}`}
          food={guardianFlag}
        />
      )}
      {activeBoss && bossSnake && <BossSnakeComponent bossSnake={bossSnake} boss={activeBoss} />}
      {poisonShots.map((shot) => (
        <PoisonShotComponent key={shot.id} shot={shot} />
      ))}
      {GAME_CONFIG.enableParticles && <ParticleSystem particles={particles} />}
    </div>
  );
});
