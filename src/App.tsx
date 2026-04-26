import { useState, useEffect, useCallback } from 'react';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useGameStateTracking } from '@/hooks/useGameStateTracking';
import { useGameOverHandler } from '@/hooks/useGameOverHandler';
import { useDebugControls } from '@/hooks/useDebugControls';
import { useGameTransitions } from '@/hooks/useGameTransitions';
import { logger, LogContext } from '@/utils/logger';
import { GameStatus } from '@/types/game';
import { getPhaseNumber } from '@/utils/phases';
import { PhaseType } from '@/types/phases';
import { GameHeader } from './components/GameHeader';
import { GameArea } from './components/GameArea';
import { GameOverlays } from './components/GameOverlays';
import { TouchControls } from './components/TouchControls';
import { GameStatistics as GameStatisticsComponent } from './components/GameStatistics';
import { BossDebugPanel } from './components/BossDebugPanel';
import { PhaseDebugPanel } from './components/PhaseDebugPanel';
import { PerfDebugPanel } from './components/PerfDebugPanel';
import { DynamicBackground } from './components/DynamicBackground';
import { ActivePowerUps } from './components/ActivePowerUps';
import { ComboDisplay } from './components/ComboDisplay';
import { PhaseDisplay } from './components/PhaseDisplay';
import { getGameStore } from '@/state/gameStateStore';
import { useTranslation } from 'react-i18next';
import styles from './App.module.css';

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
    gameWorker,
  } = useGameLoop();

  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState<string[]>([]);
  const [showStatistics, setShowStatistics] = useState(false);
  const [gameStatistics, setGameStatistics] = useState<ReturnType<
    typeof import('@/utils/statistics').createFinalStatistics
  > | null>(null);
  const [gameResetToken, setGameResetToken] = useState(0);

  const { isProcessingGameOver, resetProcessingState } = useGameOverHandler({
    gameState,
    onStatisticsReady: setGameStatistics,
  });

  const transitions = useGameTransitions(() => {
    setGameStatus(GameStatus.PAUSED);
  });

  useGameStateTracking({
    gameState,
    onLevelUp: transitions.handleLevelUp,
    onPhaseTransition: transitions.handlePhaseTransition,
    onBossDefeat: transitions.handleBossDefeat,
    onAchievementsUnlocked: setNewlyUnlockedAchievements,
  });

  const debugControls = useDebugControls(
    (boss) => spawnBoss(boss),
    (boss, score) => {
      transitions.handleBossDefeat(boss, score, getPhaseNumber(gameState.level));
    },
    {
      onSnapshotContext: () => ({
        phaseId: gameState.currentPhase ?? getPhaseNumber(gameState.level),
        bossId: gameState.activeBoss?.id,
      }),
    },
  );

  useEffect(() => {
    logger.info({ context: LogContext.GAME_STATE }, 'App mounted');
    return () => {
      logger.info({ context: LogContext.GAME_STATE }, 'App unmounted');
    };
  }, []);

  // Reset level up animation when game state changes
  useEffect(() => {
    if (
      gameState.status === GameStatus.GAME_OVER ||
      gameState.status === GameStatus.IDLE ||
      gameState.status === GameStatus.PAUSED
    ) {
      transitions.setShowLevelUp(false);
    }
  }, [gameState.status, transitions]);

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

  const handleStart = useCallback(() => {
    if (getGameStore().getState().status === GameStatus.IDLE) {
      startGame();
    }
  }, [startGame]);

  const handlePause = useCallback(() => {
    pauseGame();
  }, [pauseGame]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === ' ' &&
        e.target === document.body &&
        getGameStore().getState().status !== GameStatus.PLAYING
      ) {
        e.preventDefault();
        handleKeyPress(' ');
      }
    };

    globalThis.addEventListener('keydown', handleGlobalKeyDown);
    return () => globalThis.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleKeyPress]);

  const handleBossSelect = useCallback(
    (boss: import('@/types/phases').Chef | null) => {
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
      debugControls.setShowPhaseDebug(false);
    },
    [selectPhase, debugControls],
  );

  const handleReset = useCallback(() => {
    if (isProcessingGameOver) return;
    transitions.resetTransitions();
    setNewlyUnlockedAchievements([]);
    setShowStatistics(false);
    setGameStatistics(null);
    setGameResetToken((prev) => prev + 1);
    resetGame();
    resetProcessingState();
  }, [isProcessingGameOver, resetGame, transitions, resetProcessingState]);

  const handleCloseStatistics = useCallback(() => {
    setShowStatistics(false);
    setGameStatistics(null);
    handleReset();
  }, [handleReset]);

  const handleLevelUpAnimationEnd = useCallback(() => {
    transitions.setShowLevelUp(false);
  }, [transitions]);

  const handleBossDefeatTransitionComplete = useCallback(() => {
    transitions.handleBossDefeatTransitionComplete();
    setPhaseComplete(transitions.defeatedBossPhaseNumber ?? undefined);
  }, [transitions, setPhaseComplete]);

  const handlePhaseTransitionComplete = useCallback(() => {
    transitions.resetTransitions();
  }, [transitions]);

  const handlePhaseIntroComplete = useCallback(() => {
    startGame();
  }, [startGame]);

  const handleNextPhase = useCallback(
    (phaseNumber: number) => {
      nextPhase(phaseNumber);
    },
    [nextPhase],
  );

  const handleGameOver = useCallback(() => {
    setGameStatus(GameStatus.GAME_OVER);
  }, [setGameStatus]);

  return (
    <div className={styles.app}>
      <DynamicBackground />

      <GameHeader />

      <main className={styles.main}>
        {/* Left Panel */}
        <aside className={styles.leftPanel}>
          <div className={styles.panelContent}>
            <div className={styles.panelSection}>
              <h3 className={styles.panelTitle}>{t('panels.powerUps')}</h3>
              <ActivePowerUps />
            </div>
          </div>
        </aside>

        <GameArea
          gameWorker={gameWorker}
          resetToken={gameResetToken}
          onStart={handleStart}
          onPause={handlePause}
          onReset={handleReset}
        />

        {/* Right Panel */}
        <aside className={styles.rightPanel}>
          <div className={styles.panelContent}>
            <div className={styles.panelSection}>
              <PhaseDisplay />
            </div>
            <div className={styles.panelSection}>
              <h3 className={styles.panelTitle}>{t('panels.combo')}</h3>
              <ComboDisplay />
            </div>
          </div>
        </aside>
      </main>

      <GameOverlays
        gameState={gameState}
        showLevelUp={transitions.showLevelUp}
        showPhaseTransition={transitions.showPhaseTransition}
        phaseTransitionNumber={transitions.phaseTransitionNumber}
        showBossDefeatTransition={transitions.showBossDefeatTransition}
        defeatedBoss={transitions.defeatedBoss}
        bossDefeatScore={transitions.bossDefeatScore}
        defeatedBossPhaseNumber={transitions.defeatedBossPhaseNumber}
        newlyUnlockedAchievements={newlyUnlockedAchievements}
        onLevelUpAnimationEnd={handleLevelUpAnimationEnd}
        onBossDefeatTransitionComplete={handleBossDefeatTransitionComplete}
        onPhaseTransitionComplete={handlePhaseTransitionComplete}
        onPhaseIntroComplete={handlePhaseIntroComplete}
        onNextPhase={handleNextPhase}
        onGameOver={handleGameOver}
        onResumeAfterDeath={resumeAfterDeath}
      />

      <TouchControls
        onDirectionChange={setDirection}
        onSpeedBoost={setSpeedBoost}
        onFirePoison={firePoison}
        onStopFiringPoison={stopFiringPoison}
        enabled={gameState.status === GameStatus.PLAYING}
      />

      {showStatistics && gameStatistics && (
        <GameStatisticsComponent statistics={gameStatistics} onClose={handleCloseStatistics} />
      )}

      <BossDebugPanel
        isOpen={debugControls.showBossDebug}
        onClose={() => debugControls.setShowBossDebug(false)}
        onSelectBoss={handleBossSelect}
        currentBoss={gameState.activeBoss}
      />

      <PhaseDebugPanel
        isOpen={debugControls.showPhaseDebug}
        onClose={() => debugControls.setShowPhaseDebug(false)}
        onSelectPhase={handlePhaseSelect}
        currentPhaseId={gameState.currentPhase ?? getPhaseNumber(gameState.level)}
      />

      <PerfDebugPanel visible={debugControls.showPerfDebug} />
    </div>
  );
}

export default App;
