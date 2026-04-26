import { memo, useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { FoodType } from '@/types/game';
import { POWER_UP_CONFIG } from '@/constants/powerUps';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from './ThemeToggle';
import { SkinSelector } from './SkinSelector';
import styles from './PowerUpsLegendDrawer.module.css';

interface PowerUpsLegendDrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

interface LegendItem {
  readonly type: FoodType;
  readonly nameKey: string;
  readonly descriptionKey: string;
  readonly icon: string;
  readonly group: 'positive' | 'negative';
}

const LEGEND_ITEMS: readonly LegendItem[] = [
  {
    type: FoodType.SPEED_BOOST,
    nameKey: 'powerUps.speedBoost',
    descriptionKey: 'powerUpDescriptions.speedBoost',
    icon: '⚡',
    group: 'positive',
  },
  {
    type: FoodType.BONUS_POINTS,
    nameKey: 'powerUps.bonusPoints',
    descriptionKey: 'powerUpDescriptions.bonusPoints',
    icon: '💰',
    group: 'positive',
  },
  {
    type: FoodType.EXTRA_GROWTH,
    nameKey: 'powerUps.extraGrowth',
    descriptionKey: 'powerUpDescriptions.extraGrowth',
    icon: '📈',
    group: 'positive',
  },
  {
    type: FoodType.PHASE_THROUGH,
    nameKey: 'powerUps.phaseThrough',
    descriptionKey: 'powerUpDescriptions.phaseThrough',
    icon: '👻',
    group: 'positive',
  },
  {
    type: FoodType.JOKER,
    nameKey: 'powerUps.joker',
    descriptionKey: 'powerUpDescriptions.joker',
    icon: '🎴',
    group: 'positive',
  },
  {
    type: FoodType.EXTRA_LIFE,
    nameKey: 'powerUps.extraLife',
    descriptionKey: 'powerUpDescriptions.extraLife',
    icon: '❤️',
    group: 'positive',
  },
  {
    type: FoodType.PORTAL,
    nameKey: 'powerUps.portal',
    descriptionKey: 'powerUpDescriptions.portal',
    icon: '🌀',
    group: 'positive',
  },
  {
    type: FoodType.POISON,
    nameKey: 'powerUps.poison',
    descriptionKey: 'powerUpDescriptions.poison',
    icon: '☠️',
    group: 'negative',
  },
  {
    type: FoodType.REVERSE_CONTROLS,
    nameKey: 'powerUps.reverseControls',
    descriptionKey: 'powerUpDescriptions.reverseControls',
    icon: '🔄',
    group: 'negative',
  },
  {
    type: FoodType.SLOW_DOWN,
    nameKey: 'powerUps.slowDown',
    descriptionKey: 'powerUpDescriptions.slowDown',
    icon: '🐌',
    group: 'negative',
  },
];

function PowerUpsLegendDrawerComponent({ open, onClose }: PowerUpsLegendDrawerProps) {
  const { t } = useTranslation();
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    closeRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const grouped = useMemo(() => {
    const positive = LEGEND_ITEMS.filter((i) => i.group === 'positive');
    const negative = LEGEND_ITEMS.filter((i) => i.group === 'negative');
    return { positive, negative };
  }, []);

  return (
    <>
      <div className={styles.scrim} data-open={open} onClick={onClose} aria-hidden='true' />
      <aside
        id='powerups-legend-drawer'
        className={styles.drawer}
        data-open={open}
        data-testid='powerups-legend-drawer'
        role='dialog'
        aria-modal={open}
        aria-label={t('powerUps.legendTitle')}
        aria-hidden={!open}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{t('powerUps.legendTitle')}</h2>
          <button
            ref={closeRef}
            type='button'
            className={styles.closeButton}
            onClick={onClose}
            aria-label={t('common.close')}
            data-testid='powerups-legend-close'
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          <LegendSection title={t('powerUps.legendPositive')} items={grouped.positive} tFn={t} />
          <LegendSection title={t('powerUps.legendNegative')} items={grouped.negative} tFn={t} />

          <section
            className={styles.settingsSection}
            data-testid='drawer-settings-section'
            aria-label={t('drawer.settingsTitle')}
          >
            <h3 className={styles.sectionTitle}>{t('drawer.settingsTitle')}</h3>
            <div className={styles.settingsRow}>
              <span className={styles.settingsLabel}>{t('language.title')}</span>
              <LanguageSelector />
            </div>
            <div className={styles.settingsRow}>
              <span className={styles.settingsLabel}>{t('theme.title')}</span>
              <ThemeToggle />
            </div>
            <div className={styles.settingsRow}>
              <span className={styles.settingsLabel}>{t('skin.title')}</span>
              <SkinSelector />
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}

interface LegendSectionProps {
  readonly title: string;
  readonly items: readonly LegendItem[];
  readonly tFn: (key: string) => string;
}

function LegendSection({ title, items, tFn }: LegendSectionProps) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {items.map((item) => {
        const colors = POWER_UP_CONFIG.colors[item.type];
        const style = {
          '--item-tint': colors?.primary ?? 'var(--color-accent-primary)',
        } as CSSProperties;
        return (
          <div key={item.type} className={styles.item} style={style}>
            <div className={styles.itemIcon} aria-hidden='true'>
              {item.icon}
            </div>
            <div className={styles.itemBody}>
              <div className={styles.itemName}>{tFn(item.nameKey)}</div>
              <div className={styles.itemDescription}>{tFn(item.descriptionKey)}</div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

export const PowerUpsLegendDrawer = memo(PowerUpsLegendDrawerComponent);
PowerUpsLegendDrawer.displayName = 'PowerUpsLegendDrawer';
