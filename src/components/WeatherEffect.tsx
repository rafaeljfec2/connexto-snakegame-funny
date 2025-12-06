import { useEffect, useState } from 'react';
import { getCurrentPhase } from '@/utils/phases';
import styles from './WeatherEffect.module.css';

interface WeatherEffectProps {
  level: number;
}

export function WeatherEffect({ level }: WeatherEffectProps) {
  const phase = getCurrentPhase(level);
  const phaseId = phase?.id ?? 0;

  // Fase 1 - Clima Limpo/Estrelado
  if (phaseId === 1) {
    return <StarryNightEffect />;
  }

  // Fase 2 - Névoa Azul Mística
  if (phaseId === 2) {
    return <MysticFogEffect />;
  }

  // Fase 3 - Deserto com Areia
  if (phaseId === 3) {
    return <DesertStormEffect />;
  }

  // Fase 4 - Clima Cósmico/Espacial
  if (phaseId === 4) {
    return <CosmicSpaceEffect />;
  }

  // Fase 5 - Fogo e Velocidade
  if (phaseId === 5) {
    return <FireSpeedEffect />;
  }

  // Fase 6 - Psicodélico/Caótico
  if (phaseId === 6) {
    return <ChaosPsychedelicEffect />;
  }

  // Fase 7 - Neblina e Geometria
  if (phaseId === 7) {
    return <MistGeometricEffect />;
  }

  // Fase 8 - Apocalíptico/Lava
  if (phaseId === 8) {
    return <ApocalypticLavaEffect />;
  }

  // Fase 9 - Tempestade (já implementado como StormEffect)
  // Fase 10 - Celestial/Divino
  if (phaseId === 10) {
    return <CelestialDivineEffect />;
  }

  return null;
}

// Fase 1 - Clima Limpo/Estrelado
function StarryNightEffect() {
  const [stars, setStars] = useState<
    Array<{ id: number; x: number; y: number; size: number; opacity: number; twinkleDelay: number }>
  >([]);

  useEffect(() => {
    const starCount = 60;
    const newStars: Array<{
      id: number;
      x: number;
      y: number;
      size: number;
      opacity: number;
      twinkleDelay: number;
    }> = [];

    for (let i = 0; i < starCount; i++) {
      newStars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.5,
        twinkleDelay: Math.random() * 3,
      });
    }
    setStars(newStars);
  }, []);

  return (
    <div className={styles.weatherContainer}>
      <div className={styles.starryNight}>
        {stars.map((star) => (
          <div
            key={star.id}
            className={styles.star}
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.twinkleDelay}s`,
            }}
          />
        ))}
      </div>
      <div className={styles.gentleGlow} />
    </div>
  );
}

// Fase 2 - Névoa Azul Mística
function MysticFogEffect() {
  const [fogParticles, setFogParticles] = useState<
    Array<{ id: number; x: number; y: number; size: number; speed: number }>
  >([]);
  const [protectiveLights, setProtectiveLights] = useState<
    Array<{ id: number; x: number; y: number }>
  >([]);

  useEffect(() => {
    // Fog particles
    const fogCount = 30;
    const fog: Array<{ id: number; x: number; y: number; size: number; speed: number }> = [];
    for (let i = 0; i < fogCount; i++) {
      fog.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 50 + Math.random() * 100,
        speed: 0.02 + Math.random() * 0.03,
      });
    }
    setFogParticles(fog);

    // Protective lights
    const lightCount = 6;
    const lights: Array<{ id: number; x: number; y: number }> = [];
    for (let i = 0; i < lightCount; i++) {
      lights.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
      });
    }
    setProtectiveLights(lights);
  }, []);

  return (
    <div className={styles.weatherContainer}>
      <div className={styles.mysticFog}>
        {fogParticles.map((particle) => (
          <div
            key={`fog-${particle.id}`}
            className={styles.fogParticle}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDuration: `${5 / particle.speed}s`,
            }}
          />
        ))}
      </div>
      <div className={styles.protectiveLights}>
        {protectiveLights.map((light) => (
          <div
            key={`light-${light.id}`}
            className={styles.protectiveLight}
            style={{
              left: `${light.x}%`,
              top: `${light.y}%`,
              animationDelay: `${light.id * 0.5}s`,
            }}
          />
        ))}
      </div>
      <div className={styles.blueGlow} />
    </div>
  );
}

// Fase 3 - Deserto com Areia
function DesertStormEffect() {
  const [sandParticles, setSandParticles] = useState<
    Array<{ id: number; x: number; y: number; delay: number; duration: number }>
  >([]);

  useEffect(() => {
    const sandCount = 40;
    const sand: Array<{ id: number; x: number; y: number; delay: number; duration: number }> = [];
    for (let i = 0; i < sandCount; i++) {
      sand.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2,
      });
    }
    setSandParticles(sand);
  }, []);

  return (
    <div className={styles.weatherContainer}>
      <div className={styles.desertStorm}>
        {sandParticles.map((particle) => (
          <div
            key={`sand-${particle.id}`}
            className={styles.sandParticle}
            style={{
              left: `${particle.x}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
      </div>
      <div className={styles.heatWave} />
      <div className={styles.amberGlow} />
    </div>
  );
}

// Fase 4 - Clima Cósmico/Espacial
function CosmicSpaceEffect() {
  const [cosmicParticles, setCosmicParticles] = useState<
    Array<{ id: number; x: number; y: number; size: number; delay: number }>
  >([]);

  useEffect(() => {
    const particleCount = 50;
    const particles: Array<{ id: number; x: number; y: number; size: number; delay: number }> = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 4,
      });
    }
    setCosmicParticles(particles);
  }, []);

  return (
    <div className={styles.weatherContainer}>
      <div className={styles.cosmicSpace}>
        {cosmicParticles.map((particle) => (
          <div
            key={`cosmic-${particle.id}`}
            className={styles.cosmicParticle}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>
      <div className={styles.nebula} />
      <div className={styles.purpleEnergy} />
    </div>
  );
}

// Fase 5 - Fogo e Velocidade
function FireSpeedEffect() {
  const [fireParticles, setFireParticles] = useState<
    Array<{ id: number; x: number; y: number; delay: number; duration: number }>
  >([]);
  const [speedTrails, setSpeedTrails] = useState<
    Array<{ id: number; x: number; y: number; delay: number }>
  >([]);

  useEffect(() => {
    // Fire particles
    const fireCount = 30;
    const fire: Array<{ id: number; x: number; y: number; delay: number; duration: number }> = [];
    for (let i = 0; i < fireCount; i++) {
      fire.push({
        id: i,
        x: Math.random() * 100,
        y: 100 + Math.random() * 20,
        delay: Math.random() * 1,
        duration: 1 + Math.random() * 1.5,
      });
    }
    setFireParticles(fire);

    // Speed trails
    const trailCount = 15;
    const trails: Array<{ id: number; x: number; y: number; delay: number }> = [];
    for (let i = 0; i < trailCount; i++) {
      trails.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2,
      });
    }
    setSpeedTrails(trails);
  }, []);

  return (
    <div className={styles.weatherContainer}>
      <div className={styles.fireSpeed}>
        {fireParticles.map((particle) => (
          <div
            key={`fire-${particle.id}`}
            className={styles.fireParticle}
            style={{
              left: `${particle.x}%`,
              bottom: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
        {speedTrails.map((trail) => (
          <div
            key={`trail-${trail.id}`}
            className={styles.speedTrail}
            style={{
              left: `${trail.x}%`,
              top: `${trail.y}%`,
              animationDelay: `${trail.delay}s`,
            }}
          />
        ))}
      </div>
      <div className={styles.fireGlow} />
    </div>
  );
}

// Fase 6 - Psicodélico/Caótico
function ChaosPsychedelicEffect() {
  const [chaosParticles, setChaosParticles] = useState<
    Array<{ id: number; x: number; y: number; color: string; delay: number }>
  >([]);

  useEffect(() => {
    const particleCount = 40;
    const colors = ['#ff0080', '#00ff80', '#8000ff', '#ff8000', '#0080ff', '#80ff00'];
    const particles: Array<{ id: number; x: number; y: number; color: string; delay: number }> = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 3,
      });
    }
    setChaosParticles(particles);
  }, []);

  return (
    <div className={styles.weatherContainer}>
      <div className={styles.chaosPsychedelic}>
        {chaosParticles.map((particle) => (
          <div
            key={`chaos-${particle.id}`}
            className={styles.chaosParticle}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              backgroundColor: particle.color,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>
      <div className={styles.chaosWaves} />
    </div>
  );
}

// Fase 7 - Neblina e Geometria
function MistGeometricEffect() {
  const [geometricShapes, setGeometricShapes] = useState<
    Array<{ id: number; x: number; y: number; size: number; rotation: number }>
  >([]);

  useEffect(() => {
    const shapeCount = 12;
    const shapes: Array<{ id: number; x: number; y: number; size: number; rotation: number }> = [];
    for (let i = 0; i < shapeCount; i++) {
      shapes.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 30 + Math.random() * 50,
        rotation: Math.random() * 360,
      });
    }
    setGeometricShapes(shapes);
  }, []);

  return (
    <div className={styles.weatherContainer}>
      <div className={styles.mistGeometric}>
        <div className={styles.mistLayer} />
        {geometricShapes.map((shape) => (
          <div
            key={`shape-${shape.id}`}
            className={styles.geometricShape}
            style={{
              left: `${shape.x}%`,
              top: `${shape.y}%`,
              width: `${shape.size}px`,
              height: `${shape.size}px`,
              transform: `rotate(${shape.rotation}deg)`,
              animationDelay: `${shape.id * 0.3}s`,
            }}
          />
        ))}
      </div>
      <div className={styles.indigoGlow} />
    </div>
  );
}

// Fase 8 - Apocalíptico/Lava
function ApocalypticLavaEffect() {
  const [ashParticles, setAshParticles] = useState<
    Array<{ id: number; x: number; y: number; delay: number; duration: number }>
  >([]);
  const [lavaGlow, setLavaGlow] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    // Ash particles
    const ashCount = 35;
    const ash: Array<{ id: number; x: number; y: number; delay: number; duration: number }> = [];
    for (let i = 0; i < ashCount; i++) {
      ash.push({
        id: i,
        x: Math.random() * 100,
        y: -10,
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 2,
      });
    }
    setAshParticles(ash);

    // Lava glow spots
    const lavaCount = 8;
    const lava: Array<{ id: number; x: number; y: number }> = [];
    for (let i = 0; i < lavaCount; i++) {
      lava.push({
        id: i,
        x: Math.random() * 100,
        y: 80 + Math.random() * 20,
      });
    }
    setLavaGlow(lava);
  }, []);

  return (
    <div className={styles.weatherContainer}>
      <div className={styles.apocalypticLava}>
        {ashParticles.map((particle) => (
          <div
            key={`ash-${particle.id}`}
            className={styles.ashParticle}
            style={{
              left: `${particle.x}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
        {lavaGlow.map((glow) => (
          <div
            key={`lava-${glow.id}`}
            className={styles.lavaGlow}
            style={{
              left: `${glow.x}%`,
              bottom: `${100 - glow.y}%`,
              animationDelay: `${glow.id * 0.4}s`,
            }}
          />
        ))}
      </div>
      <div className={styles.lavaHeat} />
      <div className={styles.redGlow} />
    </div>
  );
}

// Fase 10 - Celestial/Divino
function CelestialDivineEffect() {
  const [divineParticles, setDivineParticles] = useState<
    Array<{ id: number; x: number; y: number; size: number; delay: number }>
  >([]);

  useEffect(() => {
    const particleCount = 45;
    const particles: Array<{ id: number; x: number; y: number; size: number; delay: number }> = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 3 + Math.random() * 4,
        delay: Math.random() * 3,
      });
    }
    setDivineParticles(particles);
  }, []);

  return (
    <div className={styles.weatherContainer}>
      <div className={styles.celestialDivine}>
        {divineParticles.map((particle) => (
          <div
            key={`divine-${particle.id}`}
            className={styles.divineParticle}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>
      <div className={styles.aurora} />
      <div className={styles.divineLight} />
      <div className={styles.goldenGlow} />
    </div>
  );
}
