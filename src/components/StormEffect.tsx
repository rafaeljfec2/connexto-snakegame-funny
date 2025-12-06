import { useEffect, useState } from 'react';
import { getCurrentPhase } from '@/utils/phases';
import styles from './StormEffect.module.css';

interface StormEffectProps {
  level: number;
}

export function StormEffect({ level }: StormEffectProps) {
  const phase = getCurrentPhase(level);
  const isVortexPhase = phase?.id === 9;

  const [lightningActive, setLightningActive] = useState(false);
  const [rainDrops, setRainDrops] = useState<
    Array<{ id: number; left: number; delay: number; duration: number }>
  >([]);

  // Initialize rain drops
  useEffect(() => {
    if (!isVortexPhase) {
      setRainDrops([]);
      return;
    }

    const drops: Array<{ id: number; left: number; delay: number; duration: number }> = [];
    for (let i = 0; i < 50; i++) {
      drops.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 0.5 + Math.random() * 0.5,
      });
    }
    setRainDrops(drops);
  }, [isVortexPhase]);

  // Lightning effect - random flashes
  useEffect(() => {
    if (!isVortexPhase) {
      return;
    }

    const lightningInterval = setInterval(() => {
      // Random lightning flash (every 2-5 seconds)
      const delay = 2000 + Math.random() * 3000;
      setTimeout(() => {
        setLightningActive(true);
        setTimeout(() => {
          setLightningActive(false);
        }, 100); // Flash duration
      }, delay);
    }, 5000);

    return () => clearInterval(lightningInterval);
  }, [isVortexPhase]);

  if (!isVortexPhase) {
    return null;
  }

  return (
    <div className={styles.stormContainer}>
      {/* Lightning flash overlay */}
      {lightningActive && <div className={styles.lightning} />}

      {/* Rain effect */}
      <div className={styles.rainContainer}>
        {rainDrops.map((drop) => (
          <div
            key={drop.id}
            className={styles.rainDrop}
            style={{
              left: `${drop.left}%`,
              animationDelay: `${drop.delay}s`,
              animationDuration: `${drop.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Dark clouds overlay */}
      <div className={styles.clouds} />

      {/* Wind particles */}
      <div className={styles.windContainer}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={styles.windParticle}
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
