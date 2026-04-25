import { useTranslation } from 'react-i18next';
import { GameState } from '@/types/game';
import { GameBoard } from './GameBoard';
import { GameControls } from './GameControls';
import { StatusBar } from './StatusBar';
import { MobileFloatingInfo } from './MobileFloatingInfo';
import styles from '../App.module.css';

interface GameAreaProps {
  gameState: GameState;
  gameWorker: Worker | null;
  resetToken: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

export function GameArea({
  gameState,
  gameWorker,
  resetToken,
  onStart,
  onPause,
  onReset,
}: Readonly<GameAreaProps>) {
  const { t } = useTranslation();

  return (
    <div className={styles.gameArea}>
      <MobileFloatingInfo
        activePowerUps={gameState.activePowerUps}
        combo={gameState.combo}
        snakeLength={gameState.snake.length}
        lives={gameState.lives}
        level={gameState.level}
      />
      <div className={styles.gameContainer}>
        <GameBoard
          snake={gameState.snake}
          food={gameState.food}
          status={gameState.status}
          level={gameState.level}
          activeBoss={gameState.activeBoss}
          resetToken={resetToken}
          gameWorker={gameWorker}
        />
        <div className={styles.gameControls} data-status={gameState.status}>
          <GameControls
            onStart={onStart}
            onPause={onPause}
            onReset={onReset}
            status={gameState.status}
          />
        </div>
      </div>

      {/* StatusBar below game on mobile */}
      <div className={styles.mobileStatusBar}>
        <StatusBar
          length={gameState.snake.length}
          lives={gameState.lives}
          level={gameState.level}
        />
      </div>

      <div className={styles.instructions}>
        <p dangerouslySetInnerHTML={{ __html: t('controls.instructions') }} />
      </div>
    </div>
  );
}
