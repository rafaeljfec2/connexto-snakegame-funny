import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivePowerUp, FoodType } from '@/types/game';
import { POWER_UP_CONFIG } from '@/constants/powerUps';
import { getActivePowerUps } from '@/utils/powerUps';
import { useGameStateSlice } from '@/state/gameStateStore';
import styles from './ActivePowerUps.module.css';

function powerUpsEqual(a: readonly ActivePowerUp[], b: readonly ActivePowerUp[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const aa = a[i];
    const bb = b[i];
    if (!aa || !bb) return false;
    if (aa.type !== bb.type || aa.startTime !== bb.startTime || aa.duration !== bb.duration) {
      return false;
    }
  }
  return true;
}

const POWER_UP_ICONS: Record<FoodType, string> = {
  [FoodType.NORMAL]: '🍎',
  [FoodType.SPEED_BOOST]: '⚡',
  [FoodType.BONUS_POINTS]: '💰',
  [FoodType.EXTRA_GROWTH]: '📈',
  [FoodType.PHASE_THROUGH]: '👻',
  [FoodType.JOKER]: '🎴',
  [FoodType.EXTRA_LIFE]: '❤️',
  [FoodType.PORTAL]: '🌀',
  [FoodType.POISON]: '☠️',
  [FoodType.REVERSE_CONTROLS]: '🔄',
  [FoodType.SLOW_DOWN]: '🐌',
};

const POWER_UP_NAME_KEYS: Record<FoodType, string> = {
  [FoodType.NORMAL]: 'powerUps.normal',
  [FoodType.SPEED_BOOST]: 'powerUps.speedBoost',
  [FoodType.BONUS_POINTS]: 'powerUps.bonusPoints',
  [FoodType.EXTRA_GROWTH]: 'powerUps.extraGrowth',
  [FoodType.PHASE_THROUGH]: 'powerUps.phaseThrough',
  [FoodType.JOKER]: 'powerUps.joker',
  [FoodType.EXTRA_LIFE]: 'powerUps.extraLife',
  [FoodType.PORTAL]: 'powerUps.portal',
  [FoodType.POISON]: 'powerUps.poison',
  [FoodType.REVERSE_CONTROLS]: 'powerUps.reverseControls',
  [FoodType.SLOW_DOWN]: 'powerUps.slowDown',
};

function ActivePowerUpsComponent() {
  const { t } = useTranslation();
  const powerUps = useGameStateSlice((s) => s.activePowerUps, powerUpsEqual);
  const [now, setNow] = useState(() => Date.now());
  const activePowerUps = getActivePowerUps(powerUps);

  useEffect(() => {
    if (activePowerUps.length === 0) return;
    const interval = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(interval);
  }, [activePowerUps.length]);

  if (activePowerUps.length === 0) {
    return null;
  }

  return (
    <ul
      className={styles.list}
      role='list'
      aria-label={t('powerUps.activeAriaLabel')}
      data-testid='active-powerups'
    >
      {activePowerUps.map((powerUp, index) => {
        const colors = POWER_UP_CONFIG.colors[powerUp.type];
        const elapsed = now - powerUp.startTime;
        const remainingMs = Math.max(0, powerUp.duration - elapsed);
        const remainingSec = Math.ceil(remainingMs / 1000);
        const progress = powerUp.duration > 0 ? Math.max(0, remainingMs / powerUp.duration) : 0;
        const name = t(POWER_UP_NAME_KEYS[powerUp.type] ?? POWER_UP_NAME_KEYS[FoodType.NORMAL]);
        const icon = POWER_UP_ICONS[powerUp.type] ?? '✨';

        return (
          <li
            key={`${powerUp.type}-${powerUp.startTime}-${index}`}
            className={styles.pill}
            style={
              {
                '--pill-tint': colors.primary,
                '--pill-tint-deep': colors.secondary,
              } as React.CSSProperties
            }
          >
            <span className={styles.icon} aria-hidden='true'>
              {icon}
            </span>
            <span className={styles.name}>{name}</span>
            {remainingSec > 0 && (
              <span className={styles.timer} aria-label={t('powerUps.remainingAriaLabel')}>
                {remainingSec}s
              </span>
            )}
            <span
              className={styles.progress}
              style={{ width: `${progress * 100}%` }}
              aria-hidden='true'
            />
          </li>
        );
      })}
    </ul>
  );
}

export const ActivePowerUps = memo(ActivePowerUpsComponent);
ActivePowerUps.displayName = 'ActivePowerUps';
