import { memo } from 'react';
import { ActivePowerUps } from './ActivePowerUps';
import { ComboDisplay } from './ComboDisplay';
import { PhaseDisplay } from './PhaseDisplay';
import styles from './BoardOverlays.module.css';

function BoardOverlaysComponent() {
  return (
    <div className={styles.layer} data-testid='board-overlays' aria-hidden='false'>
      <div className={styles.slotTopRight}>
        <div className={styles.activePowerUpsHost}>
          <ActivePowerUps />
        </div>
      </div>

      <div className={styles.slotBottomLeft}>
        <div className={styles.comboHost}>
          <ComboDisplay />
        </div>
        <div className={styles.phaseHost}>
          <PhaseDisplay />
        </div>
      </div>
    </div>
  );
}

export const BoardOverlays = memo(BoardOverlaysComponent);
BoardOverlays.displayName = 'BoardOverlays';
