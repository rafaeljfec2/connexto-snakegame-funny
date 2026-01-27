/**
 * Weather Effect Components
 *
 * Individual phase-specific weather effect components.
 */

import type { EffectProps } from './weatherTypes';
import {
  useStarParticles,
  useMysticFogParticles,
  useDesertStormParticles,
  useCosmicParticles,
  useFireSpeedParticles,
  useChaosParticles,
  useGeometricParticles,
  useApocalypticParticles,
  useDivineParticles,
} from './useWeatherParticles';
import styles from '../WeatherEffect.module.css';

/**
 * Phase 1 - Starry Night Effect
 */
export function StarryNightEffect({ isMobile }: Readonly<EffectProps>) {
  const stars = useStarParticles(isMobile);

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

/**
 * Phase 2 - Mystic Fog Effect
 */
export function MysticFogEffect({ isMobile }: Readonly<EffectProps>) {
  const { fogParticles, protectiveLights } = useMysticFogParticles(isMobile);

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

/**
 * Phase 3 - Desert Storm Effect
 */
export function DesertStormEffect({ isMobile }: Readonly<EffectProps>) {
  const sandParticles = useDesertStormParticles(isMobile);

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

/**
 * Phase 4 - Cosmic Space Effect
 */
export function CosmicSpaceEffect({ isMobile }: Readonly<EffectProps>) {
  const cosmicParticles = useCosmicParticles(isMobile);

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

/**
 * Phase 5 - Fire Speed Effect
 */
export function FireSpeedEffect({ isMobile }: Readonly<EffectProps>) {
  const { fireParticles, speedTrails } = useFireSpeedParticles(isMobile);

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

/**
 * Phase 6 - Chaos Psychedelic Effect
 */
export function ChaosPsychedelicEffect({ isMobile }: Readonly<EffectProps>) {
  const chaosParticles = useChaosParticles(isMobile);

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

/**
 * Phase 7 - Mist Geometric Effect
 */
export function MistGeometricEffect({ isMobile }: Readonly<EffectProps>) {
  const geometricShapes = useGeometricParticles(isMobile);

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

/**
 * Phase 8 - Apocalyptic Lava Effect
 */
export function ApocalypticLavaEffect({ isMobile }: Readonly<EffectProps>) {
  const { ashParticles, lavaGlow } = useApocalypticParticles(isMobile);

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

/**
 * Phase 10 - Celestial Divine Effect
 */
export function CelestialDivineEffect({ isMobile }: Readonly<EffectProps>) {
  const divineParticles = useDivineParticles(isMobile);

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
