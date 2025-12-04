import type { GameStatistics as GameStatisticsType } from '@/types/statistics';
import { formatTime, formatDate } from '@/utils/statistics';
import { FoodType } from '@/types/game';
import styles from './GameStatistics.module.css';

interface GameStatisticsProps {
  statistics: GameStatisticsType;
  onClose: () => void;
}

const FOOD_TYPE_NAMES: Record<FoodType, string> = {
  [FoodType.NORMAL]: 'Normal',
  [FoodType.SPEED_BOOST]: 'Speed Boost',
  [FoodType.BONUS_POINTS]: 'Bonus Points',
  [FoodType.EXTRA_GROWTH]: 'Extra Growth',
  [FoodType.PHASE_THROUGH]: 'Phase Through',
  [FoodType.JOKER]: 'Joker',
  [FoodType.EXTRA_LIFE]: 'Extra Life',
  [FoodType.POISON]: 'Poison',
  [FoodType.REVERSE_CONTROLS]: 'Reverse Controls',
  [FoodType.SLOW_DOWN]: 'Slow Down',
};

export function GameStatistics({ statistics, onClose }: GameStatisticsProps) {
  const totalFoods = Object.values(statistics.foodsByType).reduce((sum, count) => sum + count, 0);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <span className={styles.titleIcon}>📊</span>
            Game Statistics
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
              <div className={styles.statLabel}>Final Score</div>
            </div>
            <div className={`${styles.statCard} ${styles.statCard2}`}>
              <div className={styles.statIcon}>⏱️</div>
              <div className={styles.statValue}>{formatTime(statistics.playTime)}</div>
              <div className={styles.statLabel}>Play Time</div>
            </div>
            <div className={`${styles.statCard} ${styles.statCard3}`}>
              <div className={styles.statIcon}>⭐</div>
              <div className={styles.statValue}>Level {statistics.level}</div>
              <div className={styles.statLabel}>Level Reached</div>
            </div>
            <div className={`${styles.statCard} ${styles.statCard4}`}>
              <div className={styles.statIcon}>📏</div>
              <div className={styles.statValue}>{statistics.finalSnakeLength}</div>
              <div className={styles.statLabel}>Final Length</div>
            </div>
            <div className={`${styles.statCard} ${styles.statCard5}`}>
              <div className={styles.statIcon}>📈</div>
              <div className={styles.statValue}>{statistics.maxSnakeLength}</div>
              <div className={styles.statLabel}>Max Length</div>
            </div>
            <div className={`${styles.statCard} ${styles.statCard6}`}>
              <div className={styles.statIcon}>🔥</div>
              <div className={styles.statValue}>{statistics.maxCombo}x</div>
              <div className={styles.statLabel}>Max Combo</div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className={styles.detailedStats}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Food Eaten</h3>
              <div className={styles.foodStats}>
                <div className={styles.foodStatRow}>
                  <span className={styles.foodStatLabel}>Total:</span>
                  <span className={styles.foodStatValue}>{totalFoods}</span>
                </div>
                {Object.entries(statistics.foodsByType)
                  .filter(([, count]) => count > 0)
                  .map(([type, count]) => (
                    <div key={type} className={styles.foodStatRow}>
                      <span className={styles.foodStatLabel}>
                        {FOOD_TYPE_NAMES[type as FoodType]}:
                      </span>
                      <span className={styles.foodStatValue}>{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Game Info</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Start Time:</span>
                  <span className={styles.infoValue}>{formatDate(statistics.startTime)}</span>
                </div>
                {statistics.endTime && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>End Time:</span>
                    <span className={styles.infoValue}>{formatDate(statistics.endTime)}</span>
                  </div>
                )}
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Obstacles Encountered:</span>
                  <span className={styles.infoValue}>{statistics.obstaclesEncountered}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Lives Lost:</span>
                  <span className={styles.infoValue}>{statistics.livesLost}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Achievements Unlocked:</span>
                  <span className={styles.infoValue}>{statistics.achievementsUnlocked}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
