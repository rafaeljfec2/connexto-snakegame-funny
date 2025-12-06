import { memo } from 'react';
import { PoisonShot as PoisonShotType } from '@/types/game';
import { GAME_CONFIG } from '@/constants/game';
import styles from './PoisonShot.module.css';

interface PoisonShotProps {
  shot: PoisonShotType;
}

export const PoisonShot = memo(function PoisonShot({ shot }: PoisonShotProps) {
  const x = Math.max(0, Math.min(shot.position.x, GAME_CONFIG.gridSize - 1));
  const y = Math.max(0, Math.min(shot.position.y, GAME_CONFIG.gridSize - 1));

  // Get direction class for animation
  const directionClass = shot.direction.toLowerCase();

  return (
    <div
      className={`${styles.poisonShot} ${styles[directionClass] ?? ''}`}
      style={
        {
          gridColumn: x + 1,
          gridRow: y + 1,
        } as React.CSSProperties
      }
      aria-label='Poison shot'
    >
      <div className={styles.poisonCore} />
      <div className={styles.poisonGlow} />
    </div>
  );
});
