import { Particle } from '@/types/game';
import { GAME_CONFIG } from '@/constants/game';
import { useEffect, useState } from 'react';
import styles from './ParticleSystem.module.css';

interface ParticleSystemProps {
  particles: Particle[];
}

export function ParticleSystem({ particles }: ParticleSystemProps) {
  const [cellSize, setCellSize] = useState(GAME_CONFIG.cellSize);

  // Calculate actual cell size from container (same logic as GameBoard)
  useEffect(() => {
    const updateCellSize = () => {
      const container = document.querySelector('.gameBoard') as HTMLElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        const actualCellSize = rect.width / GAME_CONFIG.gridSize;
        setCellSize(actualCellSize);
      }
    };

    updateCellSize();
    window.addEventListener('resize', updateCellSize);
    return () => window.removeEventListener('resize', updateCellSize);
  }, []);

  if (!GAME_CONFIG.enableParticles || particles.length === 0) {
    return null;
  }

  return (
    <>
      {particles.map((particle) => {
        // Convert grid position to pixel position using actual cell size
        const pixelX = particle.position.x * cellSize + cellSize / 2;
        const pixelY = particle.position.y * cellSize + cellSize / 2;

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
