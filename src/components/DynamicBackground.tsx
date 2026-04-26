import { memo, useMemo } from 'react';
import { useGameStateSlice } from '@/state/gameStateStore';
import styles from './DynamicBackground.module.css';

interface BackgroundParticle {
  id: number;
  xPercent: number;
  size: number;
  driftSeconds: number;
  driftDelaySeconds: number;
  twinkleDelaySeconds: number;
  opacity: number;
}

const PARTICLE_COUNT = 40;

function buildParticles(): BackgroundParticle[] {
  const list: BackgroundParticle[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const speed = Math.random() * 0.5 + 0.2;
    const driftSeconds = 80 / speed;
    list.push({
      id: i,
      xPercent: Math.random() * 100,
      size: Math.random() * 2 + 1,
      driftSeconds,
      driftDelaySeconds: -Math.random() * driftSeconds,
      twinkleDelaySeconds: -Math.random() * 3,
      opacity: Math.random() * 0.5 + 0.2,
    });
  }
  return list;
}

const getBackgroundGradient = (level: number): string => {
  if (level >= 1 && level <= 5) {
    return 'linear-gradient(135deg, #0a0a15 0%, #1a1a2e 30%, #16213e 60%, #1a2332 100%)';
  }
  if (level >= 6 && level <= 10) {
    return 'linear-gradient(135deg, #0f1720 0%, #1e293b 25%, #1e3a5f 50%, #1e40af 75%, #1e3a8a 100%)';
  }
  if (level >= 11 && level <= 15) {
    return 'linear-gradient(135deg, #292524 0%, #451a03 25%, #78350f 50%, #92400e 75%, #713f12 100%)';
  }
  if (level >= 16 && level <= 20) {
    return 'linear-gradient(135deg, #1e1b2e 0%, #2d1b3d 25%, #3d1b4d 50%, #4c1d5f 75%, #5b21b6 100%)';
  }
  if (level >= 21 && level <= 25) {
    return 'linear-gradient(135deg, #1c1917 0%, #450a0a 25%, #7f1d1d 50%, #991b1b 75%, #dc2626 100%)';
  }
  if (level >= 26 && level <= 30) {
    return 'linear-gradient(135deg, #1a0a1a 0%, #2d1b2d 20%, #4d1d4d 40%, #6d2d6d 60%, #9f2d9f 80%, #bf3dbf 100%)';
  }
  if (level >= 31 && level <= 35) {
    return 'linear-gradient(135deg, #1e1b2e 0%, #25243e 25%, #312e4e 50%, #3d3a5e 75%, #4c46f1 100%)';
  }
  if (level >= 36 && level <= 40) {
    return 'linear-gradient(135deg, #1c1917 0%, #292524 20%, #450a0a 40%, #7f1d1d 60%, #991b1b 80%, #dc2626 100%)';
  }
  if (level >= 41 && level <= 45) {
    return 'linear-gradient(135deg, #1a0a1a 0%, #2d1b2d 25%, #1a1a2e 50%, #0f1720 75%, #0a0a15 100%)';
  }
  if (level >= 46 && level <= 50) {
    return 'linear-gradient(135deg, #1c1917 0%, #292524 25%, #451a03 40%, #78350f 60%, #a16207 80%, #fbbf24 100%)';
  }

  const baseColors = [
    { start: '#0a0a0f', mid: '#1a1a2e', end: '#16213e' },
    { start: '#1a1a2e', mid: '#16213e', end: '#0f3460' },
    { start: '#16213e', mid: '#0f3460', end: '#1a2332' },
    { start: '#0f3460', mid: '#1a2332', end: '#2d1b3d' },
    { start: '#1a2332', mid: '#2d1b3d', end: '#3d1b4d' },
  ];

  const validLevel = Math.max(1, level ?? 1);
  const colorIndex = Math.min(Math.max(0, Math.floor((validLevel - 1) / 3)), baseColors.length - 1);
  const colors = baseColors[colorIndex] ?? baseColors[0];

  return `linear-gradient(135deg, ${colors.start} 0%, ${colors.mid} 50%, ${colors.end} 100%)`;
};

const getRadialGradients = (level: number): string => {
  const validLevel = Math.max(1, level ?? 1);
  const intensity = Math.min(validLevel * 0.02, 0.15);
  const hue = (validLevel * 30) % 360;

  return `
    radial-gradient(circle at 20% 50%, hsla(${hue}, 70%, 60%, ${intensity}) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, hsla(${
      (hue + 120) % 360
    }, 70%, 60%, ${intensity}) 0%, transparent 50%),
    radial-gradient(circle at 50% 20%, hsla(${(hue + 240) % 360}, 70%, 60%, ${
      intensity * 0.5
    }) 0%, transparent 60%)
  `;
};

function DynamicBackgroundComponent() {
  const level = useGameStateSlice((s) => s.level);
  const validLevel = Math.max(1, level ?? 1);

  const particles = useMemo(() => buildParticles(), []);

  const backgroundGradient = useMemo(() => getBackgroundGradient(validLevel), [validLevel]);
  const radialGradients = useMemo(() => getRadialGradients(validLevel), [validLevel]);

  return (
    <div className={styles.background}>
      <div className={styles.baseGradient} style={{ background: backgroundGradient }} />
      <div className={styles.radialGradients} style={{ background: radialGradients }} />

      <div className={styles.parallaxLayer1}>
        {particles.map((particle) => (
          <div
            key={particle.id}
            className={styles.particle}
            style={{
              left: `${particle.xPercent}%`,
              top: 0,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              animationName: `${styles.drift}, ${styles.twinkle}`,
              animationDuration: `${particle.driftSeconds}s, 3s`,
              animationDelay: `${particle.driftDelaySeconds}s, ${particle.twinkleDelaySeconds}s`,
              animationTimingFunction: 'linear, ease-in-out',
              animationIterationCount: 'infinite, infinite',
            }}
          />
        ))}
      </div>

      <div className={styles.parallaxLayer2}>
        {particles.slice(0, 20).map((particle) => (
          <div
            key={`layer2-${particle.id}`}
            className={styles.particle}
            style={{
              left: `${(particle.xPercent + 50) % 100}%`,
              top: 0,
              width: `${particle.size * 1.5}px`,
              height: `${particle.size * 1.5}px`,
              opacity: particle.opacity * 0.6,
              animationName: `${styles.drift}, ${styles.twinkle}`,
              animationDuration: `${particle.driftSeconds * 0.7}s, 3s`,
              animationDelay: `${particle.driftDelaySeconds}s, ${particle.twinkleDelaySeconds}s`,
              animationTimingFunction: 'linear, ease-in-out',
              animationIterationCount: 'infinite, infinite',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export const DynamicBackground = memo(DynamicBackgroundComponent);
DynamicBackground.displayName = 'DynamicBackground';
