import { Particle } from "@/types/game";
import { GAME_CONFIG } from "@/constants/game";
import styles from "./ParticleSystem.module.css";
import { useEffect, useState } from "react";

interface ParticleSystemProps {
  particles: Particle[];
}

export function ParticleSystem({ particles }: ParticleSystemProps) {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [particles.length]);

  if (!GAME_CONFIG.enableParticles || particles.length === 0) {
    return null;
  }

  return (
    <>
      {particles.map((particle) => {
        const elapsed = currentTime - particle.startTime;
        const progress = elapsed / particle.lifetime;
        const opacity = Math.max(0, 1 - progress);
        const scale = Math.max(0, 1 - progress * 0.5);
        const translateY = progress * 30;

        if (progress >= 1 || opacity <= 0) return null;

        // Convert grid position to pixel position
        const pixelX = particle.position.x * GAME_CONFIG.cellSize + GAME_CONFIG.cellSize / 2;
        const pixelY = particle.position.y * GAME_CONFIG.cellSize + GAME_CONFIG.cellSize / 2;

        return (
          <div
            key={particle.id}
            className={styles.particle}
            style={
              {
                left: `${pixelX}px`,
                top: `${pixelY}px`,
                backgroundColor: particle.color,
                opacity,
                transform: `translate(-50%, -50%) translateY(${-translateY}px) scale(${scale})`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </>
  );
}

