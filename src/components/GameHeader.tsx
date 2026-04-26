import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { GameInfo } from './GameInfo';
import { StatusBar } from './StatusBar';
import { LanguageSelector } from './LanguageSelector';
import { AudioToggle } from './AudioToggle';
import styles from '../App.module.css';

function GameHeaderComponent() {
  const { t } = useTranslation();

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <h1 className={styles.title}>{t('common.snakeGame')}</h1>
        <div className={styles.headerStats}>
          <GameInfo />
          <div className={styles.headerStatusBar}>
            <StatusBar />
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

export const GameHeader = memo(GameHeaderComponent);
GameHeader.displayName = 'GameHeader';
