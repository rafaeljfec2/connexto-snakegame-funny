import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { LIVES_CONFIG } from '@/constants/lives';
import { useGameStateSlice } from '@/state/gameStateStore';
import { getCurrentPhase, getLevelInPhase, getPhaseProgress } from '@/utils/phases';
import { getPhaseTranslationKey } from '@/utils/phaseTranslations';
import { AudioToggle } from './AudioToggle';
import { LanguageSelector } from './LanguageSelector';
import styles from './HudStrip.module.css';

const LEVELS_PER_PHASE = 5;

interface HudStripProps {
  readonly legendOpen: boolean;
  readonly onToggleLegend: () => void;
}

function HudStripComponent({ legendOpen, onToggleLegend }: HudStripProps) {
  const { t } = useTranslation();
  const score = useGameStateSlice((s) => s.score);
  const highScore = useGameStateSlice((s) => s.highScore);
  const level = useGameStateSlice((s) => s.level);
  const lives = useGameStateSlice((s) => s.lives);
  const length = useGameStateSlice((s) => s.snake.length);
  const currentPhase = useGameStateSlice((s) => s.currentPhase);

  const livesCount = LIVES_CONFIG.enabled ? lives : 0;
  const showLives = LIVES_CONFIG.enabled;

  const phase = getCurrentPhase(level) ?? undefined;
  const phaseNumber = currentPhase ?? phase?.id ?? 1;
  const levelInPhase = getLevelInPhase(level);
  const phaseProgress = getPhaseProgress(level);
  const phaseName = phase ? t(`phases.${getPhaseTranslationKey(phase.type)}.name`) : '';
  const progressPercent = Math.round(phaseProgress * 100);

  return (
    <header className={styles.strip} role='banner' aria-label={t('hud.ariaLabel')}>
      <div className={styles.brand} aria-hidden='true'>
        <span className={styles.brandMark}>S</span>
        <span className={styles.brandSep}>/</span>
        <span className={styles.brandWord}>NEON</span>
      </div>

      <div className={styles.metrics} role='group' aria-label={t('hud.metricsAriaLabel')}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>{t('hud.score')}</span>
          <span className={styles.metricValue} aria-live='polite'>
            {formatScore(score)}
          </span>
        </div>

        <div className={styles.divider} aria-hidden='true' />

        <div className={styles.metric} data-priority='low'>
          <span className={styles.metricLabel}>{t('hud.highScore')}</span>
          <span className={styles.metricValue} data-tone='accent'>
            {formatScore(highScore)}
          </span>
        </div>

        <div className={styles.divider} aria-hidden='true' />

        {phase && (
          <div
            className={styles.phaseSlot}
            data-testid='hud-phase-slot'
            role='group'
            aria-label={t('hud.phaseAriaLabel', {
              phase: phaseNumber,
              name: phaseName,
              current: levelInPhase,
              total: LEVELS_PER_PHASE,
            })}
          >
            <div className={styles.phaseHead}>
              <span className={styles.phaseLabel}>
                {t('hud.phase')} <span className={styles.phaseNumber}>{phaseNumber}</span>
              </span>
              <span className={styles.phaseName} title={phaseName}>
                {phaseName}
              </span>
            </div>
            <div className={styles.phaseFooter}>
              <div
                className={styles.phaseProgress}
                role='progressbar'
                aria-valuemin={0}
                aria-valuemax={LEVELS_PER_PHASE}
                aria-valuenow={levelInPhase}
              >
                <div
                  className={styles.phaseProgressFill}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className={styles.phaseStep} data-testid='hud-phase-step'>
                {levelInPhase}/{LEVELS_PER_PHASE}
              </span>
            </div>
          </div>
        )}

        {showLives && (
          <>
            <div className={styles.divider} aria-hidden='true' />
            <div
              className={styles.metric}
              role='group'
              aria-label={t('hud.livesAriaLabel', { count: livesCount })}
            >
              <span className={styles.metricLabel}>{t('hud.lives')}</span>
              <div className={styles.lives}>
                {Array.from({ length: LIVES_CONFIG.maxLives }, (_, idx) => (
                  <span
                    key={idx}
                    className={styles.lifeDot}
                    data-active={idx < livesCount}
                    aria-hidden='true'
                  />
                ))}
              </div>
            </div>
          </>
        )}

        <div className={styles.divider} data-mobile-only='true' aria-hidden='true' />
        <div
          className={styles.metric}
          data-mobile-only='true'
          data-testid='hud-length-slot'
          role='group'
          aria-label={t('hud.lengthAriaLabel', { count: length })}
        >
          <span className={styles.metricLabel}>{t('hud.length')}</span>
          <span className={styles.metricValue}>{length}</span>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type='button'
          className={styles.legendButton}
          onClick={onToggleLegend}
          data-open={legendOpen}
          data-testid='hud-legend-toggle'
          aria-controls='powerups-legend-drawer'
          aria-expanded={legendOpen}
          aria-label={t('hud.legend')}
        >
          <svg
            className={styles.legendIcon}
            viewBox='0 0 20 20'
            width='14'
            height='14'
            aria-hidden='true'
            focusable='false'
          >
            <path
              d='M11.2 1.5 3 11.3h5.1L7.4 18.5 16.6 8H11l1-6.5Z'
              fill='currentColor'
              stroke='currentColor'
              strokeLinejoin='round'
              strokeWidth='0.6'
            />
          </svg>
          <span className={styles.legendLabel}>{t('hud.legend')}</span>
        </button>
        <AudioToggle />
        <span className={styles.hudLanguageSelector}>
          <LanguageSelector />
        </span>
      </div>
    </header>
  );
}

function formatScore(value: number): string {
  return value.toLocaleString('en-US');
}

export const HudStrip = memo(HudStripComponent);
HudStrip.displayName = 'HudStrip';
