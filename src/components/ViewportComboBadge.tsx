import { memo } from 'react';
import { COMBO_CONFIG, GAME_CONFIG } from '@/constants/game';
import { useGameStateSlice } from '@/state/gameStateStore';
import { ComboDisplay } from './ComboDisplay';
import styles from './ViewportComboBadge.module.css';

function ViewportComboBadgeComponent() {
  const comboCount = useGameStateSlice((s) => s.combo.count);

  if (!GAME_CONFIG.enableCombos) return null;
  if (comboCount < COMBO_CONFIG.minCombo) return null;

  return (
    <div
      className={styles.badge}
      data-testid='viewport-combo-badge'
      role='status'
      aria-live='polite'
    >
      <ComboDisplay />
    </div>
  );
}

export const ViewportComboBadge = memo(ViewportComboBadgeComponent);
ViewportComboBadge.displayName = 'ViewportComboBadge';
