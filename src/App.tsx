import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
import { GameStatistics as GameStatisticsComponent } from './components/GameStatistics';
import { DeathTransition } from './components/DeathTransition';
// import { TouchControls } from './components/TouchControls'; // Old controls - replaced by MobileGamepad
import { MobileGamepad } from './components/MobileGamepad';
import { PhaseTransition } from './components/PhaseTransition';
import { BossDefeatTransition } from './components/BossDefeatTransition';
import { PhaseIntroScreen } from './components/PhaseIntroScreen';
import { PhaseCompleteScreen } from './components/PhaseCompleteScreen';
import { GameStatus } from '@/types/game';
import { createFinalStatistics, saveGameSession } from '@/utils/statistics';
import { didPhaseChange, getPhaseNumber, getCurrentPhase, getPhaseConfig } from '@/utils/phases';
import { getPhaseTranslationKey } from '@/utils/phaseTranslations';
import { calculatePhaseStatistics, createPhaseStartSnapshot } from '@/utils/phaseStatistics';
import { calculateGameSpeed } from '@/utils/difficulty';
import { INITIAL_SNAKE_POSITION, INITIAL_DIRECTION, GAME_CONFIG } from '@/constants/game';
import { generateRandomFood } from '@/utils/gameLogic';
import styles from './App.module.css';
import { PhaseDisplay } from './components/PhaseDisplay';
import { MobileFloatingInfo } from './components/MobileFloatingInfo';
import { StatusBar } from './components/StatusBar';
import { BossDebugPanel } from './components/BossDebugPanel';
import { PhaseDebugPanel } from './components/PhaseDebugPanel';
import { LanguageSelector } from './components/LanguageSelector';
import { Chef, PhaseType } from '@/types/phases';
import { CHEFS } from '@/constants/phases';

function App() {
  const { t } = useTranslation();
  const {
    gameState,
    resetGame,
    startGame,
    pauseGame,
    setDirection,
    setSpeedBoost,
    handleKeyPress,
    spawnBoss,
    firePoison,
    stopFiringPoison,
    updateGameState,
  } = useGameLoop();

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [gameStatistics, setGameStatistics] = useState<ReturnType<
    typeof createFinalStatistics
  > | null>(null);
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState<string[]>([]);
  const [showBossDebug, setShowBossDebug] = useState(false);
  const [showPhaseDebug, setShowPhaseDebug] = useState(false);
  const [showPhaseTransition, setShowPhaseTransition] = useState(false);
  const [phaseTransitionNumber, setPhaseTransitionNumber] = useState<number | null>(null);
  const [showBossDefeatTransition, setShowBossDefeatTransition] = useState(false);
  const [defeatedBoss, setDefeatedBoss] = useState<Chef | null>(null);
  const [bossDefeatScore, setBossDefeatScore] = useState(0);
  const [defeatedBossPhaseNumber, setDefeatedBossPhaseNumber] = useState<number | null>(null);
  const previousLevelRef = useRef(gameState.level);
  const previousScoreRef = useRef(gameState.score);
  const previousAchievementsRef = useRef(gameState.achievements);
  const previousStatusRef = useRef(gameState.status);
  const previousPhaseRef = useRef<number | undefined>(gameState.currentPhase);
  const previousActiveBossRef = useRef<Chef | undefined>(gameState.activeBoss);
  const gameStateRef = useRef(gameState);

  useKeyboard({
    onDirectionChange: setDirection,
    onSpeedBoost: setSpeedBoost,
    onKeyPress: handleKeyPress,
    onFirePoison: firePoison,
    onStopFiringPoison: stopFiringPoison,
    enabled: gameState.status === GameStatus.PLAYING,
  });

  // Detect level up
  useEffect(() => {
    if (gameState.status === GameStatus.PLAYING && gameState.level > previousLevelRef.current) {
      setShowLevelUp(true);
    }
    previousLevelRef.current = gameState.level;
  }, [gameState.level, gameState.status]);

  // Detect phase change - show transition when phase changes
  useEffect(() => {
    if (
      gameState.status === GameStatus.PLAYING &&
      previousLevelRef.current > 0 &&
      didPhaseChange(previousLevelRef.current, gameState.level)
    ) {
      const newPhaseNumber = getPhaseNumber(gameState.level);
      setPhaseTransitionNumber(newPhaseNumber);
      setShowPhaseTransition(true);
    }
    previousPhaseRef.current = gameState.currentPhase;
  }, [gameState.level, gameState.status, gameState.currentPhase]);

  // Detect boss defeat - show transition when boss is defeated
  useEffect(() => {
    if (
      gameState.status === GameStatus.PLAYING &&
      previousActiveBossRef.current &&
      !gameState.activeBoss
    ) {
      // Boss was defeated (went from having a boss to no boss)
      // IMPORTANT: Use previousLevelRef to get the level BEFORE any level up happened
      // The boss is always defeated on a boss level (5, 10, 15, etc.)
      const bossLevel = previousLevelRef.current;
      const phaseNumber = getPhaseNumber(bossLevel);

      console.log('🎯 Boss defeated detected!', {
        previousBoss: previousActiveBossRef.current?.name,
        bossLevel,
        phaseNumber,
        currentLevel: gameState.level,
        currentBoss: gameState.activeBoss,
        status: gameState.status,
      });

      const scoreIncrease = gameState.score - previousScoreRef.current;

      // Pause the game immediately when boss is defeated - change status directly to ensure game loop stops
      updateGameState((prev) => {
        if (prev.status === GameStatus.PLAYING) {
          return {
            ...prev,
            status: GameStatus.PAUSED, // Pause immediately to stop game loop
            isSpeedBoosted: false,
            isFiringPoison: false,
          };
        }
        return prev;
      });

      console.log('📊 Setting boss defeat state', {
        boss: previousActiveBossRef.current?.name,
        phaseNumber,
        bossLevel,
        scoreIncrease,
      });
      setDefeatedBoss(previousActiveBossRef.current);
      setBossDefeatScore(scoreIncrease);
      setDefeatedBossPhaseNumber(phaseNumber); // Save the phase number when boss was defeated
      setShowBossDefeatTransition(true);
      console.log('✅ showBossDefeatTransition set to true');
    }
    previousActiveBossRef.current = gameState.activeBoss;
    previousScoreRef.current = gameState.score;
  }, [gameState.activeBoss, gameState.score, gameState.status, gameState.level, updateGameState]);

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

  // Global spacebar handler for pause/start (works even when useKeyboard is disabled)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only handle spacebar when not typing in input and game is not playing
      // (when playing, spacebar is handled by useKeyboard for firing)
      if (e.key === ' ' && e.target === document.body && gameState.status !== GameStatus.PLAYING) {
        e.preventDefault();
        handleKeyPress(' ');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [gameState.status, handleKeyPress]);

  // Global spacebar handler for pause/start (works even when useKeyboard is disabled)
  useEffect(() => {
    const handleGlobalSpacebar = (e: KeyboardEvent) => {
      // Only handle spacebar when not typing in input and game is not playing
      if (e.key === ' ' && e.target === document.body && gameState.status !== GameStatus.PLAYING) {
        e.preventDefault();
        handleKeyPress(' ');
      }
    };

    window.addEventListener('keydown', handleGlobalSpacebar);
    return () => window.removeEventListener('keydown', handleGlobalSpacebar);
  }, [gameState.status, handleKeyPress]);

  // Debug mode keyboard shortcut (F1 or Ctrl+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1 key or Ctrl+D (when not typing in input)
      if (
        e.key === 'F1' ||
        (e.key === 'd' &&
          e.ctrlKey &&
          e.target === document.body &&
          !(e.target instanceof HTMLInputElement))
      ) {
        e.preventDefault();
        setShowBossDebug((prev) => !prev);
      }

      // F2 key to test boss defeat transition
      if (e.key === 'F2' && e.target === document.body && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        // Get first boss for testing (O Clássico or O Guardião)
        const testBoss = CHEFS.find((chef) => chef.id === 'guardian') ?? CHEFS[0];
        if (testBoss) {
          setDefeatedBoss(testBoss);
          setBossDefeatScore(1000); // Test score
          setShowBossDefeatTransition(true);
        }
      }

      // F3 key or Ctrl+F for phase debug mode
      if (
        e.key === 'F3' ||
        (e.key === 'f' &&
          e.ctrlKey &&
          e.target === document.body &&
          !(e.target instanceof HTMLInputElement))
      ) {
        e.preventDefault();
        setShowPhaseDebug((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBossSelect = useCallback(
    (boss: Chef | null) => {
      spawnBoss(boss);
    },
    [spawnBoss],
  );

  const handlePhaseSelect = useCallback(
    (phase: PhaseType | null) => {
      if (!phase) {
        return;
      }

      // Get first level of the selected phase
      const phaseStartLevel = phase.levelRange[0];
      const nextSpeed = calculateGameSpeed(phaseStartLevel);

      // Reset game state and advance to selected phase
      updateGameState((prev) => {
        // Initialize snake with default position
        const initialSnake = INITIAL_SNAKE_POSITION;
        // Generate food not on snake
        const initialFood = generateRandomFood(
          initialSnake,
          GAME_CONFIG.gridSize,
          [], // No obstacles at phase start
        );

        // Create snapshot for the new phase
        const phaseSnapshot = createPhaseStartSnapshot({
          ...prev,
          level: phaseStartLevel,
          snake: initialSnake,
        });

        return {
          ...prev,
          snake: initialSnake,
          food: initialFood,
          direction: INITIAL_DIRECTION,
          nextDirection: INITIAL_DIRECTION,
          level: phaseStartLevel,
          score: 0, // Reset score when selecting a phase for testing
          gameSpeed: nextSpeed,
          status: GameStatus.PHASE_INTRO,
          currentPhase: phase.id,
          phaseLevelType: phase.type,
          phaseStartSnapshot: phaseSnapshot,
          // Reset game elements for fresh start
          obstacles: [],
          portals: [],
          activeBoss: undefined,
          bossSnake: undefined,
          activePowerUps: [],
          poisonShots: [],
          particles: [],
          guardianFlag: null,
          guardianFlagSide: undefined,
          combo: {
            count: 0,
            multiplier: 1,
            lastFoodTime: 0,
          },
          isSpeedBoosted: false,
          isFiringPoison: false,
        };
      });

      // Close the debug panel
      setShowPhaseDebug(false);
    },
    [updateGameState],
  );

  // Save statistics when game ends - wait for snake death animation to complete
  useEffect(() => {
    const wasNotGameOver = previousStatusRef.current !== GameStatus.GAME_OVER;
    const isNowGameOver = gameState.status === GameStatus.GAME_OVER;

    if (wasNotGameOver && isNowGameOver) {
      // Calculate snake death animation duration
      // Animation: 50ms per segment + 300ms final delay
      const snakeLength = gameStateRef.current.snake.length;
      const deathAnimationDuration = snakeLength * 50 + 300;

      // Wait for death animation to complete before showing statistics
      const timer = setTimeout(() => {
        // Use the ref to ensure we have the latest gameState
        const currentGameState = gameStateRef.current;
        // Always create statistics, even if they don't exist in state
        const finalStats = createFinalStatistics(currentGameState);
        saveGameSession(finalStats);
        setGameStatistics(finalStats);
        setShowStatistics(true);
      }, deathAnimationDuration);

      return () => clearTimeout(timer);
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
    previousPhaseRef.current = undefined;
    previousActiveBossRef.current = undefined;
    setShowLevelUp(false);
    setShowStatistics(false);
    setGameStatistics(null);
    setShowPhaseTransition(false);
    setPhaseTransitionNumber(null);
    setShowBossDefeatTransition(false);
    setDefeatedBoss(null);
    setBossDefeatScore(0);
    setDefeatedBossPhaseNumber(null);
    resetGame();
  };

  const handleLevelUpAnimationEnd = useCallback(() => {
    setShowLevelUp(false);
  }, []);

  const handleBossDefeatTransitionComplete = useCallback(() => {
    console.log('🎬 BossDefeatTransition completed, changing to PHASE_COMPLETE');
    setShowBossDefeatTransition(false);
    // Change status to PHASE_COMPLETE after animation (game is already paused)
    // Create snapshot retroactively if it doesn't exist
    updateGameState((prev) => {
      // Ensure game is still paused/stopped before changing to PHASE_COMPLETE
      if (prev.status === GameStatus.PLAYING) {
        // If somehow still playing, pause first
        return {
          ...prev,
          status: GameStatus.PAUSED,
        };
      }

      // Use the phase number saved when boss was defeated
      // If defeatedBossPhaseNumber is not available yet (shouldn't happen), calculate from level
      const currentPhaseNumber = defeatedBossPhaseNumber ?? getPhaseNumber(prev.level);
      const phaseStartLevel = (currentPhaseNumber - 1) * 5 + 1;

      console.log('📸 Creating snapshot for phase complete', {
        hasSnapshot: !!prev.phaseStartSnapshot,
        level: prev.level,
        phaseNumber: currentPhaseNumber,
        phaseStartLevel,
        defeatedBossPhaseNumber,
      });

      // Create snapshot if it doesn't exist, using phase start level as reference
      // Use existing snapshot if available, otherwise create a fallback
      let snapshot = prev.phaseStartSnapshot;

      if (!snapshot) {
        console.log('⚠️ No snapshot found, creating fallback snapshot');
        // Create a fallback snapshot for this phase
        // Estimate phase start based on current phase number
        snapshot = {
          startTime: prev.statistics?.startTime ?? Date.now() - 60000, // Default to 1 minute ago
          startScore: Math.max(0, prev.score - 500), // Estimate starting score
          startLevel: phaseStartLevel,
          startStatistics: prev.statistics
            ? {
                ...prev.statistics,
                foodsEaten: Math.max(0, (prev.statistics.foodsEaten ?? 0) - 10),
                maxCombo: 0,
                obstaclesEncountered: Math.max(0, (prev.statistics.obstaclesEncountered ?? 0) - 5),
                livesLost: prev.statistics.livesLost ?? 0,
              }
            : {
                startTime: Date.now() - 60000,
                pausedTime: 0,
                foodsEaten: 0,
                foodsByType: {} as Record<import('@/types/game').FoodType, number>,
                maxSnakeLength: 3,
                maxCombo: 0,
                obstaclesEncountered: 0,
                livesLost: 0,
              },
        };
      }

      const newState = {
        ...prev,
        status: GameStatus.PHASE_COMPLETE,
        phaseStartSnapshot: snapshot,
      };

      console.log('✅ Status changed to PHASE_COMPLETE', {
        status: newState.status,
        hasSnapshot: !!newState.phaseStartSnapshot,
      });

      return newState;
    });
  }, [updateGameState, defeatedBossPhaseNumber]);

  return (
    <div className={styles.app}>
      <DynamicBackground level={gameState.level} />
      {/* Header HUD */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{t('common.snakeGame')}</h1>
          <div className={styles.headerStats}>
            <GameInfo
              score={gameState.score}
              highScore={gameState.highScore}
              level={gameState.level}
            />
          </div>
          <div className={styles.headerActions}>
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className={styles.main}>
        {/* Left Panel */}
        <aside className={styles.leftPanel}>
          <div className={styles.panelContent}>
            <div className={styles.panelSection}>
              <h3 className={styles.panelTitle}>{t('panels.powerUps')}</h3>
              <ActivePowerUps powerUps={gameState.activePowerUps} />
            </div>
          </div>
        </aside>

        {/* Center Game Area */}
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
              obstacles={gameState.obstacles}
              portals={gameState.portals}
              particles={gameState.particles}
              poisonShots={gameState.poisonShots}
              activeBoss={gameState.activeBoss}
              bossSnake={gameState.bossSnake}
              guardianFlag={gameState.guardianFlag}
            />
          </div>
          <StatusBar
            length={gameState.snake.length}
            lives={gameState.lives}
            level={gameState.level}
          />

          <div className={styles.gameControls}>
            <GameControls
              onStart={handleStart}
              onPause={handlePause}
              onReset={handleReset}
              status={gameState.status}
            />
          </div>

          <div className={styles.instructions}>
            <p dangerouslySetInnerHTML={{ __html: t('controls.instructions') }} />
          </div>
        </div>

        {/* Right Panel - Reserved for future features */}
        <aside className={styles.rightPanel}>
          <div className={styles.panelContent}>
            <PhaseDisplay level={gameState.level} currentPhase={gameState.currentPhase} />
            <div className={styles.panelSection}>
              <h3 className={styles.panelTitle}>{t('panels.combo')}</h3>
              <ComboDisplay combo={gameState.combo} />
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

      {/* Phase Transition Animation - Sonic Style */}
      {showPhaseTransition && phaseTransitionNumber && (
        <PhaseTransition
          phaseNumber={phaseTransitionNumber}
          level={gameState.level}
          onComplete={() => {
            setShowPhaseTransition(false);
            setPhaseTransitionNumber(null);
          }}
        />
      )}

      {/* Boss Defeat Transition Animation - Sonic Style */}
      {showBossDefeatTransition && defeatedBoss && (
        <BossDefeatTransition
          key={`boss-defeat-${defeatedBoss.id}`}
          boss={defeatedBoss}
          score={bossDefeatScore}
          onComplete={handleBossDefeatTransitionComplete}
        />
      )}

      {/* Phase Complete Screen - Shows after boss is defeated */}
      {gameState.status === GameStatus.PHASE_COMPLETE && defeatedBossPhaseNumber && (
        <PhaseCompleteScreen
          phaseNumber={defeatedBossPhaseNumber}
          phaseName={(() => {
            // Use the phase number saved when boss was defeated to get correct phase
            const phase = getPhaseConfig(defeatedBossPhaseNumber);
            if (!phase) return t('phase.complete');
            return t(`phases.${getPhaseTranslationKey(phase.type)}.name`);
          })()}
          statistics={calculatePhaseStatistics(
            gameState,
            gameState.phaseStartSnapshot ?? createPhaseStartSnapshot(gameState),
          )}
          onNextPhase={() => {
            // Advance to next phase - use the saved phase number
            const nextPhaseNumber = defeatedBossPhaseNumber + 1;

            // Check if there's a next phase (max 10 phases)
            if (nextPhaseNumber <= 10) {
              // Move to next phase - calculate first level of next phase
              const nextPhaseStartLevel = (nextPhaseNumber - 1) * 5 + 1;
              const nextPhase = getCurrentPhase(nextPhaseStartLevel);

              // Move to next phase - set status to PHASE_INTRO
              updateGameState((prev) => {
                // Set level to first level of next phase
                const nextSpeed = calculateGameSpeed(nextPhaseStartLevel);

                // Reset snake and food for new phase
                const initialSnake = INITIAL_SNAKE_POSITION;
                const initialFood = generateRandomFood(
                  initialSnake,
                  GAME_CONFIG.gridSize,
                  [], // No obstacles at phase start
                );

                // Create snapshot BEFORE updating level (for next phase tracking)
                const nextPhaseSnapshot = createPhaseStartSnapshot({
                  ...prev,
                  level: nextPhaseStartLevel,
                  snake: initialSnake,
                });

                return {
                  ...prev,
                  snake: initialSnake,
                  food: initialFood,
                  direction: INITIAL_DIRECTION,
                  nextDirection: INITIAL_DIRECTION,
                  level: nextPhaseStartLevel, // Reset to first level of new phase (level 1 of phase)
                  score: 0, // Reset score when changing phase
                  gameSpeed: nextSpeed,
                  status: GameStatus.PHASE_INTRO,
                  currentPhase: nextPhase?.id,
                  phaseLevelType: nextPhase?.type,
                  phaseStartSnapshot: nextPhaseSnapshot,
                  // Reset game elements for fresh phase start
                  obstacles: [],
                  portals: [],
                  activeBoss: undefined,
                  bossSnake: undefined,
                  activePowerUps: [],
                  poisonShots: [],
                  particles: [],
                  guardianFlag: null,
                  guardianFlagSide: undefined,
                  combo: {
                    count: 0,
                    multiplier: 1,
                    lastFoodTime: 0,
                  },
                  isSpeedBoosted: false,
                  isFiringPoison: false,
                };
              });
            } else {
              // Game complete - go to game over or show completion screen
              updateGameState((prev) => ({
                ...prev,
                status: GameStatus.GAME_OVER,
              }));
            }
          }}
        />
      )}

      {/* Phase Intro Screen - Shows when starting game or new phase */}
      {gameState.status === GameStatus.PHASE_INTRO && (
        <PhaseIntroScreen
          phaseNumber={gameState.currentPhase ?? getPhaseNumber(gameState.level)}
          level={gameState.level}
          onComplete={() => {
            startGame(); // Start game after intro countdown
          }}
        />
      )}

      {/* Touch Controls for Mobile - Replaced by MobileGamepad */}
      {/* <TouchControls
        onDirectionChange={setDirection}
        onSpeedBoost={setSpeedBoost}
        onFirePoison={firePoison}
        onStopFiringPoison={stopFiringPoison}
        enabled={gameState.status === GameStatus.PLAYING}
      /> */}

      {/* Mobile Gamepad with Joystick and Fire Button */}
      <MobileGamepad
        onDirectionChange={setDirection}
        onSpeedBoost={setSpeedBoost}
        onFirePoison={firePoison}
        onStopFiringPoison={stopFiringPoison}
        enabled={gameState.status === GameStatus.PLAYING}
      />

      {/* Game Statistics Modal */}
      {showStatistics && gameStatistics && (
        <GameStatisticsComponent statistics={gameStatistics} onClose={handleCloseStatistics} />
      )}

      {/* Boss Debug Panel */}
      <BossDebugPanel
        isOpen={showBossDebug}
        onClose={() => setShowBossDebug(false)}
        onSelectBoss={handleBossSelect}
        currentBoss={gameState.activeBoss}
      />

      {/* Phase Debug Panel */}
      <PhaseDebugPanel
        isOpen={showPhaseDebug}
        onClose={() => setShowPhaseDebug(false)}
        onSelectPhase={handlePhaseSelect}
        currentPhaseId={gameState.currentPhase ?? getPhaseNumber(gameState.level)}
      />
    </div>
  );
}

export default App;
