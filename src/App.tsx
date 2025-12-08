import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useKeyboard } from '@/hooks/useKeyboard';
import { logger, LogContext } from '@/utils/logger';
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
import { TouchControls } from './components/TouchControls';
// import { MobileGamepad } from './components/MobileGamepad';
import { PhaseTransition } from './components/PhaseTransition';
import { BossDefeatTransition } from './components/BossDefeatTransition';
import { PhaseIntroScreen } from './components/PhaseIntroScreen';
import { PhaseCompleteScreen } from './components/PhaseCompleteScreen';
import { GameStatus } from '@/types/game';
import { createFinalStatistics, saveGameSession } from '@/utils/statistics';
import { didPhaseChange, getPhaseNumber, getPhaseConfig } from '@/utils/phases';
import { getPhaseTranslationKey } from '@/utils/phaseTranslations';
import { calculatePhaseStatistics, createPhaseStartSnapshot } from '@/utils/phaseStatistics';
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
    selectPhase,
    nextPhase,
    setPhaseComplete,
    setGameStatus,
    resumeAfterDeath,
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
  const [gameResetToken, setGameResetToken] = useState(0);
  const [isProcessingGameOver, setIsProcessingGameOver] = useState(false);
  const previousLevelRef = useRef(gameState.level);
  const previousScoreRef = useRef(gameState.score);
  const previousAchievementsRef = useRef(gameState.achievements);
  const previousStatusRef = useRef(gameState.status);
  const previousPhaseRef = useRef<number | undefined>(gameState.currentPhase);
  const previousActiveBossRef = useRef<Chef | undefined>(gameState.activeBoss);
  const gameStateRef = useRef(gameState);

  useEffect(() => {
    logger.info({ context: LogContext.GAME_STATE }, 'App mounted');
    return () => {
      logger.info({ context: LogContext.GAME_STATE }, 'App unmounted');
    };
  }, []);

  // Wrapper to block inputs during game over processing
  const handleKeyPressWrapper = useCallback(
    (key: string) => {
      if (isProcessingGameOver) return;
      handleKeyPress(key);
    },
    [isProcessingGameOver, handleKeyPress],
  );

  useKeyboard({
    onDirectionChange: setDirection,
    onSpeedBoost: setSpeedBoost,
    onKeyPress: handleKeyPressWrapper,
    onFirePoison: firePoison,
    onStopFiringPoison: stopFiringPoison,
    enabled: gameState.status === GameStatus.PLAYING || gameState.status === GameStatus.GAME_OVER,
  });

  // Detect level up
  useEffect(() => {
    if (gameState.status === GameStatus.PLAYING && gameState.level > previousLevelRef.current) {
      setShowLevelUp(true);
      logger.info({ context: LogContext.GAME_STATE, level: gameState.level }, 'Level up detected');
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
      logger.info({ context: LogContext.PHASE, phase: newPhaseNumber }, 'Phase transition started');
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
      // Boss was defeated
      const bossLevel = previousLevelRef.current;
      const phaseNumber = getPhaseNumber(bossLevel);
      const scoreIncrease = gameState.score - previousScoreRef.current;

      // Pause the game immediately when boss is defeated
      setGameStatus(GameStatus.PAUSED);

      setDefeatedBoss(previousActiveBossRef.current);
      setBossDefeatScore(scoreIncrease);
      setDefeatedBossPhaseNumber(phaseNumber);
      setShowBossDefeatTransition(true);
      logger.info(
        { context: LogContext.BOSS, boss: previousActiveBossRef.current.id },
        'Boss defeat transition started',
      );
    }
    previousActiveBossRef.current = gameState.activeBoss;
    previousScoreRef.current = gameState.score;
  }, [gameState.activeBoss, gameState.score, gameState.status, gameState.level, setGameStatus]);

  // Reset level up animation
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

  // Global spacebar handler
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && e.target === document.body && gameState.status !== GameStatus.PLAYING) {
        e.preventDefault();
        handleKeyPress(' ');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [gameState.status, handleKeyPress]);

  // Debug mode keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
        const testBoss = CHEFS.find((chef) => chef.id === 'guardian') ?? CHEFS[0];
        if (testBoss) {
          setDefeatedBoss(testBoss);
          setBossDefeatScore(1000); // Test score
          setShowBossDefeatTransition(true);
        }
      }

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
      selectPhase(phase.id);
      setShowPhaseDebug(false);
    },
    [selectPhase],
  );

  // Save statistics when game ends
  useEffect(() => {
    const wasNotGameOver = previousStatusRef.current !== GameStatus.GAME_OVER;
    const isNowGameOver = gameState.status === GameStatus.GAME_OVER;

    if (wasNotGameOver && isNowGameOver) {
      setIsProcessingGameOver(true);
      const snakeLength = gameStateRef.current.snake.length;
      const cameFromDying = previousStatusRef.current === GameStatus.DYING;
      // If came from DYING, animation already played, so reduce delay
      const deathAnimationDuration = cameFromDying ? 500 : Math.min(2500, snakeLength * 50 + 300);

      const timer = setTimeout(() => {
        setIsProcessingGameOver(false);
        try {
          const currentGameState = gameStateRef.current;
          const finalStats = createFinalStatistics(currentGameState);
          saveGameSession(finalStats);
          setGameStatistics(finalStats);
          setShowStatistics(true);
        } catch (error) {
          console.error('Failed to create/save statistics:', error);
        }
      }, deathAnimationDuration);

      return () => clearTimeout(timer);
    }

    previousStatusRef.current = gameState.status;
  }, [gameState.status]);

  const handleReset = useCallback(() => {
    if (isProcessingGameOver) return;
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
    setGameResetToken((prev) => prev + 1);
    resetGame();
  }, [isProcessingGameOver, resetGame]);

  const handleCloseStatistics = useCallback(() => {
    setShowStatistics(false);
    setGameStatistics(null);
    handleReset();
  }, [handleReset]);

  const handleLevelUpAnimationEnd = useCallback(() => {
    setShowLevelUp(false);
  }, []);

  const handleBossDefeatTransitionComplete = useCallback(() => {
    setShowBossDefeatTransition(false);
    // Change status to PHASE_COMPLETE after animation
    setPhaseComplete(defeatedBossPhaseNumber ?? undefined);
  }, [setPhaseComplete, defeatedBossPhaseNumber]);

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
              resetToken={gameResetToken}
            />
          </div>
          <div className={styles.statusBarContainer}>
            <StatusBar
              length={gameState.snake.length}
              lives={gameState.lives}
              level={gameState.level}
            />
          </div>

          <div className={styles.gameControls} data-status={gameState.status}>
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
      <DeathTransition
        status={gameState.status}
        lives={gameState.lives}
        onComplete={resumeAfterDeath}
      />

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
            const phase = getPhaseConfig(defeatedBossPhaseNumber);
            if (!phase) return t('phase.complete');
            return t(`phases.${getPhaseTranslationKey(phase.type)}.name`);
          })()}
          statistics={calculatePhaseStatistics(
            gameState,
            gameState.phaseStartSnapshot ?? createPhaseStartSnapshot(gameState),
          )}
          onNextPhase={() => {
            const nextPhaseNumber = defeatedBossPhaseNumber + 1;
            if (nextPhaseNumber <= 10) {
              nextPhase(nextPhaseNumber);
            } else {
              setGameStatus(GameStatus.GAME_OVER);
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
            startGame();
          }}
        />
      )}

      {/* Touch Controls for Mobile */}
      <TouchControls
        onDirectionChange={setDirection}
        onSpeedBoost={setSpeedBoost}
        onFirePoison={firePoison}
        onStopFiringPoison={stopFiringPoison}
        enabled={gameState.status === GameStatus.PLAYING}
      />

      {/* Mobile Gamepad - Disabled
      <MobileGamepad
        onDirectionChange={setDirection}
        onSpeedBoost={setSpeedBoost}
        onFirePoison={firePoison}
        onStopFiringPoison={stopFiringPoison}
        enabled={gameState.status === GameStatus.PLAYING}
      /> */}

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
