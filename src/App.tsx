import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useKeyboard } from '@/hooks/useKeyboard';
import { GameBoard } from './components/GameBoard';
import { GameInfo } from './components/GameInfo';
import { GameControls } from './components/GameControls';
import { LevelUpAnimation } from './components/LevelUpAnimation';
import { ActivePowerUps } from './components/ActivePowerUps';
import { ComboDisplay } from './components/ComboDisplay';
import { AchievementNotification } from './components/AchievementNotification';
import { DynamicBackground } from './components/DynamicBackground';
import { LivesDisplay } from './components/LivesDisplay';
import { GameStatistics as GameStatisticsComponent } from './components/GameStatistics';
import { DeathTransition } from './components/DeathTransition';
import { TouchControls } from './components/TouchControls';
import { GameStatus } from '@/types/game';
import { createFinalStatistics, saveGameSession } from '@/utils/statistics';
import styles from './App.module.css';
import { StatusMessage } from './components/StatusMessage';
import { PhaseDisplay } from './components/PhaseDisplay';

function App() {
  const {
    gameState,
    resetGame,
    startGame,
    pauseGame,
    setDirection,
    setSpeedBoost,
    handleKeyPress,
  } = useGameLoop();

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [gameStatistics, setGameStatistics] = useState<ReturnType<
    typeof createFinalStatistics
  > | null>(null);
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState<string[]>([]);
  const previousLevelRef = useRef(gameState.level);
  const previousScoreRef = useRef(gameState.score);
  const previousAchievementsRef = useRef(gameState.achievements);
  const previousStatusRef = useRef(gameState.status);
  const gameStateRef = useRef(gameState);

  useKeyboard({
    onDirectionChange: setDirection,
    onSpeedBoost: setSpeedBoost,
    onKeyPress: handleKeyPress,
    enabled: gameState.status === GameStatus.PLAYING,
  });

  // Detect level up
  useEffect(() => {
    if (gameState.status === GameStatus.PLAYING && gameState.level > previousLevelRef.current) {
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
    const currentUnlocked = gameState.achievements.filter((a) => a.unlocked).map((a) => a.id);
    const previousUnlocked = previousAchievementsRef.current
      .filter((a) => a.unlocked)
      .map((a) => a.id);

    const newlyUnlocked = currentUnlocked.filter((id) => !previousUnlocked.includes(id));

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

  // Keep gameState ref up to date
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Save statistics when game ends
  useEffect(() => {
    const wasNotGameOver = previousStatusRef.current !== GameStatus.GAME_OVER;
    const isNowGameOver = gameState.status === GameStatus.GAME_OVER;

    if (wasNotGameOver && isNowGameOver) {
      // Use the ref to ensure we have the latest gameState
      const currentGameState = gameStateRef.current;
      // Always create statistics, even if they don't exist in state
      const finalStats = createFinalStatistics(currentGameState);
      saveGameSession(finalStats);
      setGameStatistics(finalStats);
      setShowStatistics(true);
    }

    previousStatusRef.current = gameState.status;
  }, [gameState.status]);

  const handleCloseStatistics = useCallback(() => {
    setShowStatistics(false);
    setGameStatistics(null);
  }, []);

  const handleReset = () => {
    previousScoreRef.current = 0;
    previousLevelRef.current = 1;
    setShowLevelUp(false);
    setShowStatistics(false);
    setGameStatistics(null);
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
          <div className={styles.gameContainer}>
            <GameBoard
              snake={gameState.snake}
              food={gameState.food}
              status={gameState.status}
              level={gameState.level}
              obstacles={gameState.obstacles}
              portals={gameState.portals}
              particles={gameState.particles}
              activeBoss={gameState.activeBoss}
              bossSnake={gameState.bossSnake}
            />
          </div>
          <StatusMessage status={gameState.status} />
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
              <kbd>↑↓←→</kbd> or <kbd>WASD</kbd> to move • <kbd>SPACE</kbd> to start/pause
            </p>
          </div>
        </div>

        {/* Right Panel - Reserved for future features */}
        <aside className={styles.rightPanel}>
          <div className={styles.panelContent}>
            <PhaseDisplay level={gameState.level} currentPhase={gameState.currentPhase} />
            <div className={styles.panelSection}>
              <h3 className={styles.panelTitle}>Game Stats</h3>
              <div className={styles.gameStats}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Length</span>
                  <span className={styles.statValue}>{gameState.snake.length}</span>
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

      {/* Death Transition Animation */}
      <DeathTransition status={gameState.status} lives={gameState.lives} />

      {/* Touch Controls for Mobile */}
      <TouchControls
        onDirectionChange={setDirection}
        onSpeedBoost={setSpeedBoost}
        enabled={gameState.status === GameStatus.PLAYING}
      />

      {/* Game Statistics Modal */}
      {showStatistics && gameStatistics && (
        <GameStatisticsComponent statistics={gameStatistics} onClose={handleCloseStatistics} />
      )}
    </div>
  );
}

export default App;
