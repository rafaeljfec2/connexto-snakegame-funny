import { useTranslation } from 'react-i18next';
import { GameState, GameStatus } from '@/types/game';
import { Chef } from '@/types/phases';
import { LevelUpAnimation } from './LevelUpAnimation';
import { AchievementNotification } from './AchievementNotification';
import { DeathTransition } from './DeathTransition';
import { PhaseTransition } from './PhaseTransition';
import { BossDefeatTransition } from './BossDefeatTransition';
import { PhaseIntroScreen } from './PhaseIntroScreen';
import { PhaseCompleteScreen } from './PhaseCompleteScreen';
import { getPhaseNumber, getPhaseConfig } from '@/utils/phases';
import { getPhaseTranslationKey } from '@/utils/phaseTranslations';
import { calculatePhaseStatistics, createPhaseStartSnapshot } from '@/utils/phaseStatistics';

interface GameOverlaysProps {
  gameState: GameState;
  showLevelUp: boolean;
  showPhaseTransition: boolean;
  phaseTransitionNumber: number | null;
  showBossDefeatTransition: boolean;
  defeatedBoss: Chef | null;
  bossDefeatScore: number;
  defeatedBossPhaseNumber: number | null;
  newlyUnlockedAchievements: string[];
  onLevelUpAnimationEnd: () => void;
  onBossDefeatTransitionComplete: () => void;
  onPhaseTransitionComplete: () => void;
  onPhaseIntroComplete: () => void;
  onNextPhase: (phaseNumber: number) => void;
  onGameOver: () => void;
  onResumeAfterDeath: () => void;
}

export function GameOverlays({
  gameState,
  showLevelUp,
  showPhaseTransition,
  phaseTransitionNumber,
  showBossDefeatTransition,
  defeatedBoss,
  bossDefeatScore,
  defeatedBossPhaseNumber,
  newlyUnlockedAchievements,
  onLevelUpAnimationEnd,
  onBossDefeatTransitionComplete,
  onPhaseTransitionComplete,
  onPhaseIntroComplete,
  onNextPhase,
  onGameOver,
}: Readonly<GameOverlaysProps>) {
  const { t } = useTranslation();

  return (
    <>
      {/* Level Up Animation */}
      <LevelUpAnimation
        level={gameState.level}
        show={showLevelUp}
        onAnimationEnd={onLevelUpAnimationEnd}
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
        onComplete={onPhaseIntroComplete}
      />

      {/* Phase Transition Animation */}
      {showPhaseTransition && phaseTransitionNumber && (
        <PhaseTransition
          phaseNumber={phaseTransitionNumber}
          level={gameState.level}
          onComplete={onPhaseTransitionComplete}
        />
      )}

      {/* Boss Defeat Transition Animation */}
      {showBossDefeatTransition && defeatedBoss && (
        <BossDefeatTransition
          key={`boss-defeat-${defeatedBoss.id}`}
          boss={defeatedBoss}
          score={bossDefeatScore}
          onComplete={onBossDefeatTransitionComplete}
        />
      )}

      {/* Phase Complete Screen */}
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
              onNextPhase(nextPhaseNumber);
            } else {
              onGameOver();
            }
          }}
        />
      )}

      {/* Phase Intro Screen */}
      {gameState.status === GameStatus.PHASE_INTRO && (
        <PhaseIntroScreen
          phaseNumber={gameState.currentPhase ?? getPhaseNumber(gameState.level)}
          level={gameState.level}
          onComplete={onPhaseIntroComplete}
        />
      )}
    </>
  );
}
