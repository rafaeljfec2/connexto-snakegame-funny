import { memo } from 'react';
import { PhaseDisplay } from './PhaseDisplay';
import styles from './BottomInfoBar.module.css';

function BottomInfoBarComponent() {
  return (
    <div className={styles.bar} data-testid='bottom-info-bar' role='complementary'>
      <div className={styles.host}>
        <PhaseDisplay />
      </div>
    </div>
  );
}

export const BottomInfoBar = memo(BottomInfoBarComponent);
BottomInfoBar.displayName = 'BottomInfoBar';
