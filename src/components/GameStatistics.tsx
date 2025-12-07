import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import type { GameStatistics as GameStatisticsType } from '@/types/statistics';
import { formatTime, formatDate } from '@/utils/statistics';
import { FoodType } from '@/types/game';
import styles from './GameStatistics.module.css';

interface GameStatisticsProps {
  statistics: GameStatisticsType;
  onClose: () => void;
}

const getFoodTypeName = (type: FoodType, t: (key: string) => string): string => {
  const foodTypeMap: Record<FoodType, string> = {
    [FoodType.NORMAL]: t('powerUps.normal'),
    [FoodType.SPEED_BOOST]: t('powerUps.speedBoost'),
    [FoodType.BONUS_POINTS]: t('powerUps.bonusPoints'),
    [FoodType.EXTRA_GROWTH]: t('powerUps.extraGrowth'),
    [FoodType.PHASE_THROUGH]: t('powerUps.phaseThrough'),
    [FoodType.JOKER]: t('powerUps.joker'),
    [FoodType.EXTRA_LIFE]: t('powerUps.extraLife'),
    [FoodType.PORTAL]: t('powerUps.portal'),
    [FoodType.POISON]: t('powerUps.poison'),
    [FoodType.REVERSE_CONTROLS]: t('powerUps.reverseControls'),
    [FoodType.SLOW_DOWN]: t('powerUps.slowDown'),
  };
  return foodTypeMap[type] ?? type;
};

export function GameStatistics({ statistics, onClose }: GameStatisticsProps) {
  const { t } = useTranslation();
  const totalFoods = Object.values(statistics.foodsByType).reduce((sum, count) => sum + count, 0);

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <span className={styles.titleIcon}>📊</span>
            {t('statistics.title')}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          {/* Main Stats Grid */}
          <div className={styles.mainStats}>
            <div className={`${styles.statCard} ${styles.statCard1}`}>
              <div className={styles.statIcon}>🏆</div>
              <div className={styles.statValue}>{statistics.score}</div>
              <div className={styles.statLabel}>{t('statistics.finalScore')}</div>
            </div>
            <div className={`${styles.statCard} ${styles.statCard2}`}>
              <div className={styles.statIcon}>⏱️</div>
              <div className={styles.statValue}>{formatTime(statistics.playTime)}</div>
              <div className={styles.statLabel}>{t('statistics.playTime')}</div>
            </div>
            <div className={`${styles.statCard} ${styles.statCard3}`}>
              <div className={styles.statIcon}>⭐</div>
              <div className={styles.statValue}>
                {t('common.level')} {statistics.level}
              </div>
              <div className={styles.statLabel}>{t('statistics.levelReached')}</div>
            </div>
            <div className={`${styles.statCard} ${styles.statCard4}`}>
              <div className={styles.statIcon}>📏</div>
              <div className={styles.statValue}>{statistics.finalSnakeLength}</div>
              <div className={styles.statLabel}>{t('statistics.finalLength')}</div>
            </div>
            <div className={`${styles.statCard} ${styles.statCard5}`}>
              <div className={styles.statIcon}>📈</div>
              <div className={styles.statValue}>{statistics.maxSnakeLength}</div>
              <div className={styles.statLabel}>{t('statistics.maxLength')}</div>
            </div>
            <div className={`${styles.statCard} ${styles.statCard6}`}>
              <div className={styles.statIcon}>🔥</div>
              <div className={styles.statValue}>{statistics.maxCombo}x</div>
              <div className={styles.statLabel}>{t('statistics.maxCombo')}</div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className={styles.detailedStats}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>{t('statistics.foodEaten')}</h3>
              <div className={styles.foodStats}>
                <div className={styles.foodStatRow}>
                  <span className={styles.foodStatLabel}>{t('statistics.total')}:</span>
                  <span className={styles.foodStatValue}>{totalFoods}</span>
                </div>
                {Object.entries(statistics.foodsByType)
                  .filter(([, count]) => count > 0)
                  .map(([type, count]) => (
                    <div key={type} className={styles.foodStatRow}>
                      <span className={styles.foodStatLabel}>
                        {getFoodTypeName(type as FoodType, t)}:
                      </span>
                      <span className={styles.foodStatValue}>{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>{t('statistics.gameInfo')}</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>{t('statistics.startTime')}:</span>
                  <span className={styles.infoValue}>{formatDate(statistics.startTime)}</span>
                </div>
                {statistics.endTime && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>{t('statistics.endTime')}:</span>
                    <span className={styles.infoValue}>{formatDate(statistics.endTime)}</span>
                  </div>
                )}
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>{t('statistics.obstaclesEncountered')}:</span>
                  <span className={styles.infoValue}>{statistics.obstaclesEncountered}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>{t('statistics.livesLost')}:</span>
                  <span className={styles.infoValue}>{statistics.livesLost}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>{t('statistics.achievementsUnlocked')}:</span>
                  <span className={styles.infoValue}>{statistics.achievementsUnlocked}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
