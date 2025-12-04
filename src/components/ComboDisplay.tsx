import { ComboState } from "@/types/game";
import { GAME_CONFIG, COMBO_CONFIG } from "@/constants/game";
import styles from "./ComboDisplay.module.css";

interface ComboDisplayProps {
  combo: ComboState;
}

export function ComboDisplay({ combo }: ComboDisplayProps) {
  if (!GAME_CONFIG.enableCombos || combo.count < COMBO_CONFIG.minCombo) {
    return null;
  }

  // Calculate remaining time in combo window
  const now = Date.now();
  const timeSinceLastFood = now - combo.lastFoodTime;
  const comboWindow = COMBO_CONFIG.comboWindow;
  const remainingTime = Math.max(0, comboWindow - timeSinceLastFood);
  const progress = (remainingTime / comboWindow) * 100;

  return (
    <div className={styles.comboDisplay}>
      <div className={styles.comboInfo}>
        <span className={styles.comboLabel}>COMBO</span>
        <span className={styles.comboCount}>x{combo.multiplier}</span>
      </div>
      <div className={styles.comboBar}>
        <div
          className={styles.comboBarFill}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

