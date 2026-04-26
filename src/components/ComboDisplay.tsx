import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { GAME_CONFIG, COMBO_CONFIG } from '@/constants/game';
import { useGameStateSlice } from '@/state/gameStateStore';
import styles from './ComboDisplay.module.css';

function ComboDisplayComponent() {
  const { t } = useTranslation();
  const combo = useGameStateSlice(
    (s) => s.combo,
    (a, b) =>
      a.count === b.count && a.multiplier === b.multiplier && a.lastFoodTime === b.lastFoodTime,
  );

  if (!GAME_CONFIG.enableCombos) {
    return null;
  }

  const now = Date.now();
  const timeSinceLastFood = combo.lastFoodTime > 0 ? now - combo.lastFoodTime : Infinity;
  const comboWindow = COMBO_CONFIG.comboWindow;
  const remainingTime = Math.max(0, comboWindow - timeSinceLastFood);
  const progress = combo.count >= COMBO_CONFIG.minCombo ? (remainingTime / comboWindow) * 100 : 0;

  const isActive = combo.count >= COMBO_CONFIG.minCombo;

  return (
    <div className={styles.comboDisplay}>
      <div className={styles.comboInfo}>
        <span className={styles.comboLabel}>{t('panels.combo').toUpperCase()}</span>
        <span className={`${styles.comboCount} ${isActive ? styles.active : ''}`}>
          x{combo.multiplier}
        </span>
      </div>
      <div className={styles.comboBar}>
        <div className={styles.comboBarFill} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export const ComboDisplay = memo(ComboDisplayComponent);
ComboDisplay.displayName = 'ComboDisplay';
