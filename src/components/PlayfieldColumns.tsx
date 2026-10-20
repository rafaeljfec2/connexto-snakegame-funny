import type { CSSProperties, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ComboDisplay } from '@/components/ComboDisplay';
import { LEGEND_ITEMS } from '@/components/PowerUpsLegendDrawer';
import { ViewportPowerUpsRail } from '@/components/ViewportPowerUpsRail';
import { POWER_UP_CONFIG } from '@/constants/powerUps';
import { useGameStateSlice } from '@/state/gameStateStore';
import { getPhaseTranslationKey } from '@/utils/phaseTranslations';
import { getCurrentPhase, getLevelInPhase } from '@/utils/phases';
import styles from './PlayfieldColumns.module.css';

const ARROW_KEYS = ['↑', '↓', '←', '→'] as const;
const WASD_KEYS = ['W', 'A', 'S', 'D'] as const;

type PlayfieldColumnsProps = Readonly<{
  controls: ReactNode;
  board: ReactNode;
}>;

function Keycaps({
  keys,
  testId,
}: Readonly<{ keys: readonly string[]; testId: string }>): JSX.Element {
  return (
    <span className={styles.keyRow} data-testid={testId}>
      {keys.map((key) => (
        <kbd key={key}>{key}</kbd>
      ))}
    </span>
  );
}

export function PlayfieldColumns({ controls, board }: PlayfieldColumnsProps): JSX.Element {
  const { t } = useTranslation();
  const level = useGameStateSlice((state) => state.level);
  const phase = getCurrentPhase(level);
  const step = getLevelInPhase(level);
  const phaseKey = phase ? getPhaseTranslationKey(phase.type) : 'classicSnake';

  return (
    <div className={styles.grid}>
      <section className={styles.controls} aria-label={t('playfield.controls')}>
        <h2 className={styles.sectionTitle}>{t('playfield.controls')}</h2>
        {controls}
        <h2 className={styles.sectionTitle}>{t('playfield.keyboard')}</h2>
        <div className={styles.keyboard}>
          <Keycaps keys={ARROW_KEYS} testId='playfield-arrow-keys' />
          <span className={styles.or}>{t('playfield.or')}</span>
          <Keycaps keys={WASD_KEYS} testId='playfield-wasd-keys' />
        </div>
      </section>

      <div className={styles.boardColumn} data-testid='playfield-board'>
        <div className={styles.boardCell}>
          <div className={styles.boardSquare}>{board}</div>
        </div>
        <div className={styles.pillSlot} data-testid='playfield-footer'>
          <p
            className={styles.pill}
            data-variant='touch'
            dangerouslySetInnerHTML={{ __html: t('controls.touchInstructions') }}
          />
          <p
            className={styles.pill}
            data-variant='keyboard'
            dangerouslySetInnerHTML={{ __html: t('controls.instructions') }}
          />
        </div>
      </div>

      <aside className={styles.side} data-testid='playfield-side' aria-label={t('panels.powerUps')}>
        <section className={styles.phase}>
          <p className={styles.phaseName} data-testid='playfield-phase-name'>
            {t(`phases.${phaseKey}.name`)}
          </p>
          <div
            className={styles.phaseTrack}
            role='progressbar'
            aria-valuemin={1}
            aria-valuemax={5}
            aria-valuenow={step}
            aria-label={t('phaseDisplay.levelInPhase')}
          >
            <span className={styles.phaseFill} style={{ width: `${(step / 5) * 100}%` }} />
          </div>
          <p className={styles.phaseStep} data-testid='playfield-phase-step'>
            {step}/5
          </p>
          <p className={styles.objective} data-testid='playfield-phase-objective'>
            {t(`phases.${phaseKey}.description`)}
          </p>
        </section>

        <div className={styles.catalogue}>
          <ViewportPowerUpsRail />
          <h2 className={styles.sectionTitle}>{t('panels.powerUps')}</h2>
          <ul className={styles.legend} data-testid='playfield-legend'>
            {LEGEND_ITEMS.map((item) => {
              const tint =
                POWER_UP_CONFIG.colors[item.type]?.primary ?? 'var(--color-accent-primary)';
              return (
                <li
                  key={item.type}
                  className={styles.legendItem}
                  data-testid='playfield-legend-item'
                  style={{ '--item-tint': tint } as CSSProperties}
                >
                  <span className={styles.legendIcon} aria-hidden='true'>
                    {item.icon}
                  </span>
                  <span className={styles.legendCopy}>
                    <span className={styles.legendName}>{t(item.nameKey)}</span>
                    <span className={styles.legendEffect}>{t(item.descriptionKey)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <section className={styles.combo} data-testid='playfield-combo'>
          <ComboDisplay />
        </section>
      </aside>
    </div>
  );
}
