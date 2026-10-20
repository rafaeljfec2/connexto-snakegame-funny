import { memo } from 'react';
import { GameBoard } from './GameBoard';
import { GameControls } from './GameControls';
import { MobileFloatingInfo } from './MobileFloatingInfo';
import { useGameStateSlice } from '@/state/gameStateStore';
import styles from '../App.module.css';

interface GameAreaProps {
  readonly gameWorker: Worker | null;
  readonly resetToken: number;
  readonly onStart: () => void;
  readonly onPause: () => void;
  readonly onReset: () => void;
}

function GameAreaComponent({ gameWorker, resetToken, onStart, onPause, onReset }: GameAreaProps) {
  const status = useGameStateSlice((s) => s.status);

  return (
    <div className={styles.gameArea}>
      <MobileFloatingInfo />
      <div className={styles.gameContainer}>
        <GameBoard resetToken={resetToken} gameWorker={gameWorker} />
        <div className={styles.gameControls} data-status={status}>
          <GameControls onStart={onStart} onPause={onPause} onReset={onReset} status={status} />
        </div>
      </div>
    </div>
  );
}

export const GameArea = memo(GameAreaComponent);
GameArea.displayName = 'GameArea';
