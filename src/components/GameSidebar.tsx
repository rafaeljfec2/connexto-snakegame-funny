import { useTranslation } from 'react-i18next';
import { ActivePowerUp } from '@/types/game';
import { ActivePowerUps } from './ActivePowerUps';
import { ComboDisplay } from './ComboDisplay';
import { PhaseDisplay } from './PhaseDisplay';
import styles from '../App.module.css';

interface GameSidebarProps {
  activePowerUps: ActivePowerUp[];
  combo: { count: number; multiplier: number; lastFoodTime: number };
  level: number;
  currentPhase?: number;
}

export function GameSidebar({
  activePowerUps,
  combo,
  level,
  currentPhase,
}: Readonly<GameSidebarProps>) {
  const { t } = useTranslation();

  return (
    <>
      {/* Left Panel */}
      <aside className={styles.leftPanel}>
        <div className={styles.panelContent}>
          <div className={styles.panelSection}>
            <h3 className={styles.panelTitle}>{t('panels.powerUps')}</h3>
            <ActivePowerUps powerUps={activePowerUps} />
          </div>
        </div>
      </aside>

      {/* Right Panel */}
      <aside className={styles.rightPanel}>
        <div className={styles.panelContent}>
          <PhaseDisplay level={level} currentPhase={currentPhase} />
          <div className={styles.panelSection}>
            <h3 className={styles.panelTitle}>{t('panels.combo')}</h3>
            <ComboDisplay combo={combo} />
          </div>
        </div>
      </aside>
    </>
  );
}
