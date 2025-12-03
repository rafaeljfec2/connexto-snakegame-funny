import { Position, GameStatus } from "@/types/game";
import { GAME_CONFIG } from "@/constants/game";
import { SnakeSegment } from "./SnakeSegment";
import { Food } from "./Food";
import { useEffect, useRef, useState } from "react";
import styles from "./GameBoard.module.css";

interface GameBoardProps {
  snake: Position[];
  food: Position;
  status: GameStatus;
  level: number;
}

export function GameBoard({
  snake,
  food,
  status,
  level,
}: GameBoardProps) {
  const gridStyle = {
    gridTemplateColumns: `repeat(${GAME_CONFIG.gridSize}, ${GAME_CONFIG.cellSize}px)`,
    gridTemplateRows: `repeat(${GAME_CONFIG.gridSize}, ${GAME_CONFIG.cellSize}px)`,
    width: GAME_CONFIG.gridSize * GAME_CONFIG.cellSize,
    height: GAME_CONFIG.gridSize * GAME_CONFIG.cellSize,
  };

  const previousSnakeLengthRef = useRef(snake.length);
  const previousLevelRef = useRef(level);
  const [isLevelUp, setIsLevelUp] = useState(false);
  const [newSegmentIndex, setNewSegmentIndex] = useState<number | null>(null);

  // Ensure food always has valid position
  const foodPosition = food ?? { x: 10, y: 10 };

  // Detect snake growth
  useEffect(() => {
    if (snake.length > previousSnakeLengthRef.current) {
      setNewSegmentIndex(snake.length - 1);
      setTimeout(() => setNewSegmentIndex(null), 300);
    }
    previousSnakeLengthRef.current = snake.length;
  }, [snake.length]);

  // Detect level up for board animation
  useEffect(() => {
    if (level > previousLevelRef.current) {
      setIsLevelUp(true);
      setTimeout(() => setIsLevelUp(false), 600);
    }
    previousLevelRef.current = level;
  }, [level]);

  const boardClassName = `${styles.gameBoard} ${
    status === GameStatus.GAME_OVER ? styles.gameOver : ""
  } ${isLevelUp ? styles.levelUp : ""}`;

  return (
    <div className={boardClassName} style={gridStyle}>
      {snake.map((segment, index) => (
        <SnakeSegment
          key={`snake-${index}`}
          position={segment}
          isHead={index === 0}
          isNew={newSegmentIndex === index}
        />
      ))}
      <Food
        key={`food-${foodPosition.x}-${foodPosition.y}`}
        position={foodPosition}
      />
    </div>
  );
}
