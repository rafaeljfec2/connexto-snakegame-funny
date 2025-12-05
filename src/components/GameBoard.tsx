import {
  Position,
  GameStatus,
  Food as FoodType,
  Obstacle,
  Particle,
  Portal,
  BossSnake,
} from '@/types/game';
import { GAME_CONFIG } from '@/constants/game';
import { SnakeSegment } from './SnakeSegment';
import { Food } from './Food';
import { ObstacleComponent } from './Obstacle';
import { ParticleSystem } from './ParticleSystem';
import { Portal as PortalComponent } from './Portal';
import { BossSnake as BossSnakeComponent } from './BossSnake';
import { useEffect, useRef, useState } from 'react';
import styles from './GameBoard.module.css';
import { Chef } from '@/types/phases';

interface GameBoardProps {
  snake: Position[];
  food: FoodType;
  status: GameStatus;
  level: number;
  obstacles?: Obstacle[];
  portals?: Portal[];
  particles?: Particle[];
  activeBoss?: Chef;
  bossSnake?: BossSnake;
  guardianFlag?: FoodType | null;
}

export function GameBoard({
  snake,
  food,
  status,
  level,
  obstacles = [],
  portals = [],
  particles = [],
  activeBoss,
  bossSnake,
  guardianFlag,
}: GameBoardProps) {
  const gridStyle = {
    gridTemplateColumns: `repeat(${GAME_CONFIG.gridSize}, ${GAME_CONFIG.cellSize}px)`,
    gridTemplateRows: `repeat(${GAME_CONFIG.gridSize}, ${GAME_CONFIG.cellSize}px)`,
    width: GAME_CONFIG.gridSize * GAME_CONFIG.cellSize,
    height: GAME_CONFIG.gridSize * GAME_CONFIG.cellSize,
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

  // Group portals by pairId to determine which is first/second
  const portalPairs = new Map<string, Portal[]>();
  portals.forEach((portal) => {
    const pair = portalPairs.get(portal.pairId) ?? [];
    pair.push(portal);
    portalPairs.set(portal.pairId, pair);
  });

  return (
    <div className={boardClassName} style={gridStyle}>
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
      {GAME_CONFIG.enableParticles && <ParticleSystem particles={particles} />}
    </div>
  );
}
