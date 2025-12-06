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
  // Phase 9 (Vortex Challenge) - Storm theme (levels 41-45)
  if (level >= 41 && level <= 45) {
    return 'linear-gradient(135deg, #1a0a1a 0%, #2d1b2d 25%, #1a1a2e 50%, #0f1720 75%, #0a0a15 100%)';
  }

  const baseColors = [
    { start: '#0a0a0f', mid: '#1a1a2e', end: '#16213e' }, // Level 1-3: Dark blue
    { start: '#1a1a2e', mid: '#16213e', end: '#0f3460' }, // Level 4-6: Darker blue
    { start: '#16213e', mid: '#0f3460', end: '#1a2332' }, // Level 7-9: Deep blue
    { start: '#0f3460', mid: '#1a2332', end: '#2d1b3d' }, // Level 10-12: Purple-blue
    { start: '#1a2332', mid: '#2d1b3d', end: '#3d1b4d' }, // Level 13-15: Dark purple
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
