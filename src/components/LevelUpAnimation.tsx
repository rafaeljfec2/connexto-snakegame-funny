import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './LevelUpAnimation.module.css';

interface LevelUpAnimationProps {
  level: number;
  show: boolean;
  onAnimationEnd: () => void;
}

export function LevelUpAnimation({ level, show, onAnimationEnd }: LevelUpAnimationProps) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const onAnimationEndRef = useRef(onAnimationEnd);
  const timersRef = useRef<{
    exitTimer?: ReturnType<typeof setTimeout>;
    removeTimer?: ReturnType<typeof setTimeout>;
  }>({});

  // Update ref when callback changes
  useEffect(() => {
    onAnimationEndRef.current = onAnimationEnd;
  }, [onAnimationEnd]);

  useEffect(() => {
    // Clear any existing timers
    if (timersRef.current.exitTimer) {
      clearTimeout(timersRef.current.exitTimer);
    }
    if (timersRef.current.removeTimer) {
      clearTimeout(timersRef.current.removeTimer);
    }
    timersRef.current = {};

    if (show) {
      setIsVisible(true);
      setIsExiting(false);

      // Start exit animation after showing for 1.8s (so fade out completes at 2s)
      timersRef.current.exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, 1800);

      // Remove completely after 2s total
      timersRef.current.removeTimer = setTimeout(() => {
        setIsVisible(false);
        setIsExiting(false);
        onAnimationEndRef.current();
      }, 2000);

      return () => {
        if (timersRef.current.exitTimer) {
          clearTimeout(timersRef.current.exitTimer);
        }
        if (timersRef.current.removeTimer) {
          clearTimeout(timersRef.current.removeTimer);
        }
        timersRef.current = {};
      };
    } else {
      // Immediately hide if show is false
      setIsVisible(false);
      setIsExiting(false);
    }
  }, [show]);

  if (!isVisible) return null;

  return (
    <div className={styles.overlay}>
      <div className={`${styles.levelUp} ${isExiting ? styles.exiting : ''}`}>
        <div className={styles.levelUpTitle}>{t('levelUp.title')}</div>
        <div className={styles.levelUpNumber}>
          {t('levelUp.level')} {level}
        </div>
      </div>
    </div>
  );
}
