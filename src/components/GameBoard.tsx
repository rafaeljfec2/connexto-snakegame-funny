import { Position } from "@/types/game";
import { GAME_CONFIG } from "@/constants/game";
import { SnakeSegment } from "./SnakeSegment";
import { Food } from "./Food";
import styles from "./GameBoard.module.css";

interface GameBoardProps {
  snake: Position[];
  food: Position;
}

export function GameBoard({ snake, food }: GameBoardProps) {
  const gridStyle = {
    gridTemplateColumns: `repeat(${GAME_CONFIG.gridSize}, ${GAME_CONFIG.cellSize}px)`,
    gridTemplateRows: `repeat(${GAME_CONFIG.gridSize}, ${GAME_CONFIG.cellSize}px)`,
    width: GAME_CONFIG.gridSize * GAME_CONFIG.cellSize,
    height: GAME_CONFIG.gridSize * GAME_CONFIG.cellSize,
  };

  // Ensure food always has valid position
  const foodPosition = food ?? { x: 10, y: 10 };

  return (
    <div className={styles.gameBoard} style={gridStyle}>
      {snake.map((segment, index) => (
        <SnakeSegment
          key={`snake-${index}`}
          position={segment}
          isHead={index === 0}
        />
      ))}
      <Food key={`food-${foodPosition.x}-${foodPosition.y}`} position={foodPosition} />
    </div>
  );
}
