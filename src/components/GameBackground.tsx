import { memo } from 'react';
import styles from './GameBoard.module.css';
import { GAME_CONFIG } from '@/constants/game';

interface GameBackgroundProps {
  isMobile: boolean;
  cellSize: number;
}

export const GameBackground = memo(function GameBackground({ isMobile, cellSize }: GameBackgroundProps) {
  // Grid style calculation
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

  return (
    <div className={styles.gameBoardBackground} style={gridStyle}>
      {/* This component just renders the static grid background */}
    </div>
  );
});

