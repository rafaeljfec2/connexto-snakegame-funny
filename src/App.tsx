import { useState, useEffect, useRef, useCallback } from "react";
import { useGameLoop } from "@/hooks/useGameLoop";
import { useKeyboard } from "@/hooks/useKeyboard";
import { GameBoard } from "./components/GameBoard";
import { GameInfo } from "./components/GameInfo";
import { StatusMessage } from "./components/StatusMessage";
import { GameControls } from "./components/GameControls";
import { LevelUpAnimation } from "./components/LevelUpAnimation";
import { ActivePowerUps } from "./components/ActivePowerUps";
import { ComboDisplay } from "./components/ComboDisplay";
import { AchievementNotification } from "./components/AchievementNotification";
import { DynamicBackground } from "./components/DynamicBackground";
import { LivesDisplay } from "./components/LivesDisplay";
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
      <DynamicBackground level={gameState.level} />
      {/* Header HUD */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>SNAKE GAME</h1>
          <div className={styles.headerStats}>
            <GameInfo
              score={gameState.score}
              highScore={gameState.highScore}
              level={gameState.level}
            />
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className={styles.main}>
        {/* Left Panel */}
        <aside className={styles.leftPanel}>
          <div className={styles.panelContent}>
            <div className={styles.panelSection}>
              <h3 className={styles.panelTitle}>Combo</h3>
              <ComboDisplay combo={gameState.combo} />
            </div>
            <div className={styles.panelSection}>
              <h3 className={styles.panelTitle}>Power-Ups</h3>
              <ActivePowerUps powerUps={gameState.activePowerUps} />
            </div>
          </div>
        </aside>

        {/* Center Game Area */}
        <div className={styles.gameArea}>
          <StatusMessage status={gameState.status} />
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

          <div className={styles.gameControls}>
            <GameControls
              onStart={handleStart}
              onPause={handlePause}
              onReset={handleReset}
              status={gameState.status}
            />
          </div>

          <div className={styles.instructions}>
            <p>
              <kbd>↑↓←→</kbd> or <kbd>WASD</kbd> to move • <kbd>SPACE</kbd> to
              start/pause
            </p>
          </div>
        </div>

        {/* Right Panel - Reserved for future features */}
        <aside className={styles.rightPanel}>
          <div className={styles.panelContent}>
            <div className={styles.panelSection}>
              <h3 className={styles.panelTitle}>Game Stats</h3>
              <div className={styles.gameStats}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Length</span>
                  <span className={styles.statValue}>
                    {gameState.snake.length}
                  </span>
                </div>
                <LivesDisplay lives={gameState.lives} />
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Level Up Animation - Outside main layout */}
      <LevelUpAnimation
        level={gameState.level}
        show={showLevelUp}
        onAnimationEnd={handleLevelUpAnimationEnd}
      />

      {/* Achievement Notifications */}
      <AchievementNotification
        newlyUnlocked={newlyUnlockedAchievements}
        allAchievements={gameState.achievements}
      />
    </div>
  );
}

export default App;
