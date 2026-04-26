import { memo } from 'react';
import { useGameStateSlice, shallowEqualArray } from '@/state/gameStateStore';
import { ActivePowerUps } from './ActivePowerUps';
import styles from './ViewportPowerUpsRail.module.css';

function ViewportPowerUpsRailComponent() {
  const hasActive = useGameStateSlice(
    (s) => s.activePowerUps.map((p) => p.type),
    shallowEqualArray,
  ).length;

  if (hasActive === 0) return null;

  return (
    <div
      className={styles.rail}
      data-testid='viewport-powerups-rail'
      role='region'
      aria-label='active power-ups'
    >
      <ActivePowerUps />
    </div>
  );
}

export const ViewportPowerUpsRail = memo(ViewportPowerUpsRailComponent);
ViewportPowerUpsRail.displayName = 'ViewportPowerUpsRail';
