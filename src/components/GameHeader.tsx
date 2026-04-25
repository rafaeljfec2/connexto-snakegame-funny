import { useTranslation } from 'react-i18next';
import { GameInfo } from './GameInfo';
import { StatusBar } from './StatusBar';
import { LanguageSelector } from './LanguageSelector';
import { AudioToggle } from './AudioToggle';
import styles from '../App.module.css';

interface GameHeaderProps {
  score: number;
  highScore: number;
  level: number;
  snakeLength: number;
  lives: number;
}

export function GameHeader({
  score,
  highScore,
  level,
  snakeLength,
  lives,
}: Readonly<GameHeaderProps>) {
  const { t } = useTranslation();

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <h1 className={styles.title}>{t('common.snakeGame')}</h1>
        <div className={styles.headerStats}>
          <GameInfo score={score} highScore={highScore} level={level} />
          <div className={styles.headerStatusBar}>
            <StatusBar length={snakeLength} lives={lives} level={level} />
          </div>
        </div>
        <div className={styles.headerActions}>
          <AudioToggle />
          <LanguageSelector />
        </div>
      </div>
    </header>
  );
}
