import { useTranslation } from 'react-i18next';
import { Chef } from '@/types/phases';
import { Position } from '@/types/game';
import styles from './Boss.module.css';

interface BossProps {
  boss: Chef;
  position: Position;
  gridSize: number;
}

export function Boss({ boss, position, gridSize }: BossProps) {
  const { t } = useTranslation();
  const cellSize = 100 / gridSize;

  return (
    <div
      className={styles.boss}
      style={
        {
          left: `${position.x * cellSize}%`,
          top: `${position.y * cellSize}%`,
          width: `${cellSize}%`,
          height: `${cellSize}%`,
          '--boss-color': boss.visual.color,
          '--boss-size': boss.visual.size ?? 1,
        } as React.CSSProperties
      }
    >
      <div className={styles.bossIcon}>{boss.visual.icon}</div>
      <div className={styles.bossGlow} />
      <div className={styles.bossName}>{t(`bosses.${boss.id}.name`)}</div>
    </div>
  );
}
