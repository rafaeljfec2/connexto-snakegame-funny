import React from 'react';
import { useTranslation } from 'react-i18next';
import { BossSnake as BossSnakeType, Position } from '@/types/game';
import { Chef } from '@/types/phases';
import { GAME_CONFIG } from '@/constants/game';
import styles from './BossSnake.module.css';

interface BossSnakeProps {
  bossSnake: BossSnakeType;
  boss: Chef;
}

export function BossSnake({ bossSnake, boss }: BossSnakeProps) {
  const { t } = useTranslation();
  const bossColor = boss.visual.color;
  const bossIcon = boss.visual.icon;
  const bossSize = boss.visual.size ?? 1;

  // Helper function to render a boss segment
  const renderBossSegment = (position: Position, isHead: boolean, index: number) => {
    const x = Math.max(0, Math.min(position.x, GAME_CONFIG.gridSize - 1));
    const y = Math.max(0, Math.min(position.y, GAME_CONFIG.gridSize - 1));

    const style = {
      gridColumn: x + 1,
      gridRow: y + 1,
      '--boss-color': bossColor,
      '--boss-size': bossSize,
    } as React.CSSProperties;

    return (
      <div
        key={`boss-snake-${index}`}
        className={`${styles.bossSegment} ${isHead ? styles.bossHead : ''}`}
        style={style}
      >
        {isHead && (
          <div className={styles.bossHeadLabel}>
            <span className={styles.bossIcon}>{bossIcon}</span>
            <span className={styles.bossName}>{t(`bosses.${boss.id}.name`)}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {bossSnake.positions.map((segment, index) => {
        const isHead = index === 0;
        return renderBossSegment(segment, isHead, index);
      })}
    </>
  );
}

