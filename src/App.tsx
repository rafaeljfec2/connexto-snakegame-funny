import { useState, useEffect, useRef, useCallback } from "react";
import { useGameLoop } from "@/hooks/useGameLoop";
import { useKeyboard } from "@/hooks/useKeyboard";
import { GameBoard } from "./components/GameBoard";
import { GameInfo } from "./components/GameInfo";
import { GameControls } from "./components/GameControls";
import { LevelUpAnimation } from "./components/LevelUpAnimation";
import { ActivePowerUps } from "./components/ActivePowerUps";
import { ComboDisplay } from "./components/ComboDisplay";
import { AchievementNotification } from "./components/AchievementNotification";
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
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState<
    string[]
  >([]);
  const previousLevelRef = useRef(gameState.level);
  const previousScoreRef = useRef(gameState.score);
  const previousAchievementsRef = useRef(gameState.achievements);

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

  // Detect newly unlocked achievements
  useEffect(() => {
    const currentUnlocked = gameState.achievements
      .filter((a) => a.unlocked)
      .map((a) => a.id);
    const previousUnlocked = previousAchievementsRef.current
      .filter((a) => a.unlocked)
      .map((a) => a.id);

    const newlyUnlocked = currentUnlocked.filter(
      (id) => !previousUnlocked.includes(id)
    );

    if (newlyUnlocked.length > 0) {
      setNewlyUnlockedAchievements(newlyUnlocked);
    }

    previousAchievementsRef.current = gameState.achievements;
  }, [gameState.achievements]);

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
            obstacles={gameState.obstacles}
            particles={gameState.particles}
          />
        </div>

        <LevelUpAnimation
          level={gameState.level}
          show={showLevelUp}
          onAnimationEnd={handleLevelUpAnimationEnd}
        />

        <ActivePowerUps powerUps={gameState.activePowerUps} />

        <ComboDisplay combo={gameState.combo} />

        <AchievementNotification
          newlyUnlocked={newlyUnlockedAchievements}
          allAchievements={gameState.achievements}
        />

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
