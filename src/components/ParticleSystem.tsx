import { Particle } from '@/types/game';
import { GAME_CONFIG } from '@/constants/game';
import styles from './ParticleSystem.module.css';

interface ParticleSystemProps {
  particles: Particle[];
}

export function ParticleSystem({ particles }: ParticleSystemProps) {
  if (!GAME_CONFIG.enableParticles || particles.length === 0) {
    return null;
  }

  return (
    <>
      {particles.map((particle) => {
        // Convert grid position to pixel position
        const pixelX = particle.position.x * GAME_CONFIG.cellSize + GAME_CONFIG.cellSize / 2;
        const pixelY = particle.position.y * GAME_CONFIG.cellSize + GAME_CONFIG.cellSize / 2;

        // Use CSS animation duration based on particle lifetime (in seconds)
        const animationDuration = particle.lifetime / 1000;

        return (
          <div
            key={particle.id}
            className={styles.particle}
            style={
              {
                left: `${pixelX}px`,
                top: `${pixelY}px`,
                backgroundColor: particle.color,
                animationDuration: `${animationDuration}s`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </>
  );
}
