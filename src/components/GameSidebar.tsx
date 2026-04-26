import { useTranslation } from 'react-i18next';
import { ActivePowerUps } from './ActivePowerUps';
import { ComboDisplay } from './ComboDisplay';
import { PhaseDisplay } from './PhaseDisplay';
import styles from '../App.module.css';

export function GameSidebar() {
  const { t } = useTranslation();

  return (
    <>
      <aside className={styles.leftPanel}>
        <div className={styles.panelContent}>
          <div className={styles.panelSection}>
            <h3 className={styles.panelTitle}>{t('panels.powerUps')}</h3>
            <ActivePowerUps />
          </div>
        </div>
      </aside>

      <aside className={styles.rightPanel}>
        <div className={styles.panelContent}>
          <PhaseDisplay />
          <div className={styles.panelSection}>
            <h3 className={styles.panelTitle}>{t('panels.combo')}</h3>
            <ComboDisplay />
          </div>
        </div>
      </aside>
    </>
  );
}
