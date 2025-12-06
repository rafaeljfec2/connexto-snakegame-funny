import { useTranslation } from 'react-i18next';
import { ComboState } from '@/types/game';
import { GAME_CONFIG, COMBO_CONFIG } from '@/constants/game';
import styles from './ComboDisplay.module.css';

interface ComboDisplayProps {
  combo: ComboState;
}

export function ComboDisplay({ combo }: ComboDisplayProps) {
  const { t } = useTranslation();
  if (!GAME_CONFIG.enableCombos) {
    return null;
  }

  // Always show combo display
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
