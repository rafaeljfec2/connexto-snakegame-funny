import { useState, useEffect, useRef, useCallback } from "react";
import { useGameLoop } from "@/hooks/useGameLoop";
import { useKeyboard } from "@/hooks/useKeyboard";
import { GameBoard } from "./components/GameBoard";
import { GameInfo } from "./components/GameInfo";
import { GameControls } from "./components/GameControls";
import { LevelUpAnimation } from "./components/LevelUpAnimation";
import { ActivePowerUps } from "./components/ActivePowerUps";
import { GameStatus } from "@/types/game";
import styles from "./App.module.css";

function App() {
  const {
    gameState,
    resetGame,
    startGame,
    pauseGame,
    setDirection,
    handleKeyPress,
  } = useGameLoop();

  const [showLevelUp, setShowLevelUp] = useState(false);
  const previousLevelRef = useRef(gameState.level);
  const previousScoreRef = useRef(gameState.score);

  useKeyboard({
    onDirectionChange: setDirection,
    onKeyPress: handleKeyPress,
    enabled: true,
  });

  // Detect level up
  useEffect(() => {
    if (
      gameState.status === GameStatus.PLAYING &&
      gameState.level > previousLevelRef.current
    ) {
      setShowLevelUp(true);
    }
    previousLevelRef.current = gameState.level;
  }, [gameState.level, gameState.status]);

  // Reset level up animation when game ends, resets, or is paused
  useEffect(() => {
    if (
      gameState.status === GameStatus.GAME_OVER ||
      gameState.status === GameStatus.IDLE ||
      gameState.status === GameStatus.PAUSED
    ) {
      setShowLevelUp(false);
    }
  }, [gameState.status]);

  const handleStart = () => {
    if (gameState.status === GameStatus.IDLE) {
      startGame();
    }
  };

  const handlePause = () => {
    pauseGame();
  };

  const handleReset = () => {
    previousScoreRef.current = 0;
    previousLevelRef.current = 1;
    setShowLevelUp(false);
    resetGame();
  };

  const handleLevelUpAnimationEnd = useCallback(() => {
    setShowLevelUp(false);
  }, []);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Snake Game</h1>
      </header>

      <main className={styles.main}>
        <GameInfo
          score={gameState.score}
          highScore={gameState.highScore}
          level={gameState.level}
          status={gameState.status}
        />

        <div className={styles.gameContainer}>
          <GameBoard
            snake={gameState.snake}
            food={gameState.food}
            status={gameState.status}
            level={gameState.level}
          />
        </div>

        <LevelUpAnimation
          level={gameState.level}
          show={showLevelUp}
          onAnimationEnd={handleLevelUpAnimationEnd}
        />

        <ActivePowerUps powerUps={gameState.activePowerUps} />

        <GameControls
          onStart={handleStart}
          onPause={handlePause}
          onReset={handleReset}
          status={gameState.status}
        />

        <div className={styles.instructions}>
          <p>
            Use <kbd>Arrow Keys</kbd> or <kbd>WASD</kbd> to move
          </p>
          <p>
            Press <kbd>SPACE</kbd> to start/pause
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;
