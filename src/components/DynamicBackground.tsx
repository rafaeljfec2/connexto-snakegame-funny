import { useEffect, useState } from 'react';
import styles from './DynamicBackground.module.css';

interface BackgroundParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

interface DynamicBackgroundProps {
  level: number;
}

// Background gradients that change with level
const getBackgroundGradient = (level: number): string => {
  // Phase 1 (Classic) - Clean starry night (levels 1-5)
  if (level >= 1 && level <= 5) {
    return 'linear-gradient(135deg, #0a0a15 0%, #1a1a2e 30%, #16213e 60%, #1a2332 100%)';
  }

  // Phase 2 (Guardian) - Mystic blue (levels 6-10)
  if (level >= 6 && level <= 10) {
    return 'linear-gradient(135deg, #0f1720 0%, #1e293b 25%, #1e3a5f 50%, #1e40af 75%, #1e3a8a 100%)';
  }

  // Phase 3 (Challenger) - Desert (levels 11-15)
  if (level >= 11 && level <= 15) {
    return 'linear-gradient(135deg, #292524 0%, #451a03 25%, #78350f 50%, #92400e 75%, #713f12 100%)';
  }

  // Phase 4 (Portal) - Cosmic purple (levels 16-20)
  if (level >= 16 && level <= 20) {
    return 'linear-gradient(135deg, #1e1b2e 0%, #2d1b3d 25%, #3d1b4d 50%, #4c1d5f 75%, #5b21b6 100%)';
  }

  // Phase 5 (Speed) - Fire red (levels 21-25)
  if (level >= 21 && level <= 25) {
    return 'linear-gradient(135deg, #1c1917 0%, #450a0a 25%, #7f1d1d 50%, #991b1b 75%, #dc2626 100%)';
  }

  // Phase 6 (Chaos) - Psychedelic (levels 26-30)
  if (level >= 26 && level <= 30) {
    return 'linear-gradient(135deg, #1a0a1a 0%, #2d1b2d 20%, #4d1d4d 40%, #6d2d6d 60%, #9f2d9f 80%, #bf3dbf 100%)';
  }

  // Phase 7 (Architect) - Mist indigo (levels 31-35)
  if (level >= 31 && level <= 35) {
    return 'linear-gradient(135deg, #1e1b2e 0%, #25243e 25%, #312e4e 50%, #3d3a5e 75%, #4c46f1 100%)';
  }

  // Phase 8 (Survivor) - Apocalyptic (levels 36-40)
  if (level >= 36 && level <= 40) {
    return 'linear-gradient(135deg, #1c1917 0%, #292524 20%, #450a0a 40%, #7f1d1d 60%, #991b1b 80%, #dc2626 100%)';
  }

  // Phase 9 (Vortex Challenge) - Storm theme (levels 41-45)
  if (level >= 41 && level <= 45) {
    return 'linear-gradient(135deg, #1a0a1a 0%, #2d1b2d 25%, #1a1a2e 50%, #0f1720 75%, #0a0a15 100%)';
  }

  // Phase 10 (Supreme) - Celestial gold (levels 46-50)
  if (level >= 46 && level <= 50) {
    return 'linear-gradient(135deg, #1c1917 0%, #292524 25%, #451a03 40%, #78350f 60%, #a16207 80%, #fbbf24 100%)';
  }

  const baseColors = [
    { start: '#0a0a0f', mid: '#1a1a2e', end: '#16213e' }, // Fallback
    { start: '#1a1a2e', mid: '#16213e', end: '#0f3460' },
    { start: '#16213e', mid: '#0f3460', end: '#1a2332' },
    { start: '#0f3460', mid: '#1a2332', end: '#2d1b3d' },
    { start: '#1a2332', mid: '#2d1b3d', end: '#3d1b4d' },
  ];

  // Ensure level is valid and at least 1
  const validLevel = Math.max(1, level ?? 1);
  const colorIndex = Math.min(Math.max(0, Math.floor((validLevel - 1) / 3)), baseColors.length - 1);
  const colors = baseColors[colorIndex] ?? baseColors[0];

  return `linear-gradient(135deg, ${colors.start} 0%, ${colors.mid} 50%, ${colors.end} 100%)`;
};

// Radial gradients that change with level
const getRadialGradients = (level: number): string => {
  // Ensure level is valid and at least 1
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

export function DynamicBackground({ level }: DynamicBackgroundProps) {
  const [particles, setParticles] = useState<BackgroundParticle[]>([]);
  // Ensure level is always a valid number
  const validLevel = Math.max(1, level ?? 1);

  // Initialize particles
  useEffect(() => {
    const particleCount = 40;
    const initialParticles: BackgroundParticle[] = [];

    for (let i = 0; i < particleCount; i++) {
      initialParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.2,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    setParticles(initialParticles);
  }, []);

  // Animate particles (parallax effect)
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev.map((particle) => {
          let newY = particle.y + particle.speed;
          if (newY > 100) {
            newY = -5;
            particle.x = Math.random() * 100;
          }
          return { ...particle, y: newY };
        }),
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const backgroundGradient = getBackgroundGradient(validLevel);
  const radialGradients = getRadialGradients(validLevel);

  return (
    <div className={styles.background}>
      <div className={styles.baseGradient} style={{ background: backgroundGradient }} />
      <div className={styles.radialGradients} style={{ background: radialGradients }} />

      {/* Parallax layer 1 - Slow moving stars */}
      <div className={styles.parallaxLayer1}>
        {particles.map((particle) => (
          <div
            key={particle.id}
            className={styles.particle}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              animationDelay: `${particle.id * 0.1}s`,
            }}
          />
        ))}
      </div>

      {/* Parallax layer 2 - Medium moving stars */}
      <div className={styles.parallaxLayer2}>
        {particles.slice(0, 20).map((particle) => (
          <div
            key={`layer2-${particle.id}`}
            className={styles.particle}
            style={{
              left: `${(particle.x + 50) % 100}%`,
              top: `${(particle.y * 0.7) % 100}%`,
              width: `${particle.size * 1.5}px`,
              height: `${particle.size * 1.5}px`,
              opacity: particle.opacity * 0.6,
              animationDelay: `${particle.id * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
