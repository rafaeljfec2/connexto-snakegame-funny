import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LIVES_CONFIG } from '@/constants/lives';
import { useGameStateSlice } from '@/state/gameStateStore';
import { AudioToggle } from './AudioToggle';
import { LanguageSelector } from './LanguageSelector';
import { PowerUpsLegendDrawer } from './PowerUpsLegendDrawer';
import styles from './HudStrip.module.css';

function HudStripComponent() {
  const { t } = useTranslation();
  const score = useGameStateSlice((s) => s.score);
  const highScore = useGameStateSlice((s) => s.highScore);
  const level = useGameStateSlice((s) => s.level);
  const lives = useGameStateSlice((s) => s.lives);

  const [legendOpen, setLegendOpen] = useState(false);
  const closeLegend = useCallback(() => setLegendOpen(false), []);
  const toggleLegend = useCallback(() => setLegendOpen((v) => !v), []);

  const livesCount = LIVES_CONFIG.enabled ? lives : 0;
  const showLives = LIVES_CONFIG.enabled;

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

        <div className={styles.metric}>
          <span className={styles.metricLabel}>{t('hud.level')}</span>
          <span className={styles.metricValue} data-tone='success'>
            {level}
          </span>
        </div>

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
      </div>

      <div className={styles.actions}>
        <button
          type='button'
          className={styles.legendButton}
          onClick={toggleLegend}
          data-open={legendOpen}
          data-testid='hud-legend-toggle'
          aria-controls='powerups-legend-drawer'
          aria-expanded={legendOpen}
        >
          <span className={styles.legendIcon} aria-hidden='true' />
          <span>{t('hud.legend')}</span>
        </button>
        <AudioToggle />
        <LanguageSelector />
      </div>

      <PowerUpsLegendDrawer open={legendOpen} onClose={closeLegend} />
    </header>
  );
}

function formatScore(value: number): string {
  return value.toLocaleString('en-US');
}

export const HudStrip = memo(HudStripComponent);
HudStrip.displayName = 'HudStrip';
