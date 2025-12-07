import { useEffect, useState } from 'react';
import { getCurrentPhase } from '@/utils/phases';
import styles from './StormEffect.module.css';

interface StormEffectProps {
  level: number;
  isMobile?: boolean;
}

export function StormEffect({ level, isMobile = false }: StormEffectProps) {
  const phase = getCurrentPhase(level);
  const isVortexPhase = phase?.id === 9;

  const [lightningActive, setLightningActive] = useState(false);
  const [rainDrops, setRainDrops] = useState<
    Array<{ id: number; left: number; delay: number; duration: number }>
  >([]);
  const [clouds, setClouds] = useState<
    Array<{ id: number; left: number; top: number; size: number; speed: number; opacity: number }>
  >([]);

  // Initialize rain drops and clouds
  useEffect(() => {
    if (!isVortexPhase) {
      setRainDrops([]);
      setClouds([]);
      return;
    }

    const dropCount = isMobile ? 15 : 50;
    const drops: Array<{ id: number; left: number; delay: number; duration: number }> = [];
    for (let i = 0; i < dropCount; i++) {
      drops.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 0.5 + Math.random() * 0.5,
      });
    }
    setRainDrops(drops);

    // Initialize clouds
    const cloudCount = isMobile ? 3 : 8;
    const cloudArray: Array<{
      id: number;
      left: number;
      top: number;
      size: number;
      speed: number;
      opacity: number;
    }> = [];
    for (let i = 0; i < cloudCount; i++) {
      cloudArray.push({
        id: i,
        left: Math.random() * 120 - 20, // Start slightly off-screen
        top: Math.random() * 80 + 10, // Between 10% and 90% from top
        size: 80 + Math.random() * 120, // Size between 80px and 200px
        speed: 0.01 + Math.random() * 0.02, // Slow movement
        opacity: 0.4 + Math.random() * 0.3, // Between 0.4 and 0.7
      });
    }
    setClouds(cloudArray);
  }, [isVortexPhase, isMobile]);

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

  const windCount = isMobile ? 8 : 20;

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

      {/* Animated background clouds */}
      <div className={styles.cloudsContainer}>
        {clouds.map((cloud) => (
          <div
            key={cloud.id}
            className={styles.cloud}
            style={{
              left: `${cloud.left}%`,
              top: `${cloud.top}%`,
              width: `${cloud.size}px`,
              height: `${cloud.size * 0.6}px`,
              opacity: cloud.opacity,
              animationDuration: `${100 / cloud.speed}s`,
            }}
          />
        ))}
      </div>

      {/* Wind particles */}
      <div className={styles.windContainer}>
        {[...Array(windCount)].map((_, i) => (
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
