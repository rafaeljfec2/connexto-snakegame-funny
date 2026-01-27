/**
 * Weather Particles Hook
 *
 * Custom hooks for generating weather particle arrays.
 */

import { useState, useEffect } from 'react';
import type {
  StarParticle,
  FogParticle,
  BaseParticle,
  DurationParticle,
  SizedAnimatedParticle,
  ChaosParticle,
  GeometricParticle,
} from './weatherTypes';
import { WEATHER_CONFIG, getMobileParticleCount, getDesktopParticleCount } from './weatherConfig';

type ParticleCountConfig = { readonly mobile: number; readonly desktop: number };

/**
 * Select appropriate particle count getter based on device type
 */
const selectParticleCountGetter = (isMobile: boolean) =>
  isMobile ? getMobileParticleCount : getDesktopParticleCount;

/**
 * Get particle count using the appropriate getter for the device
 */
const getCount = (config: ParticleCountConfig, isMobile: boolean): number =>
  selectParticleCountGetter(isMobile)(config);

/**
 * Generate star particles for starry night effect
 */
export function useStarParticles(isMobile: boolean): StarParticle[] {
  const [stars, setStars] = useState<StarParticle[]>([]);

  useEffect(() => {
    const count = getCount(WEATHER_CONFIG.starryNight.stars, isMobile);
    const newStars: StarParticle[] = [];

    for (let i = 0; i < count; i++) {
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
  }, [isMobile]);

  return stars;
}

/**
 * Generate fog particles and protective lights
 */
export function useMysticFogParticles(isMobile: boolean): {
  fogParticles: FogParticle[];
  protectiveLights: BaseParticle[];
} {
  const [fogParticles, setFogParticles] = useState<FogParticle[]>([]);
  const [protectiveLights, setProtectiveLights] = useState<BaseParticle[]>([]);

  useEffect(() => {
    const fogCount = getCount(WEATHER_CONFIG.mysticFog.fog, isMobile);
    const lightCount = getCount(WEATHER_CONFIG.mysticFog.lights, isMobile);

    const fog: FogParticle[] = [];
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

    const lights: BaseParticle[] = [];
    for (let i = 0; i < lightCount; i++) {
      lights.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
      });
    }
    setProtectiveLights(lights);
  }, [isMobile]);

  return { fogParticles, protectiveLights };
}

/**
 * Generate sand particles for desert storm
 */
export function useDesertStormParticles(isMobile: boolean): DurationParticle[] {
  const [particles, setParticles] = useState<DurationParticle[]>([]);

  useEffect(() => {
    const count = getCount(WEATHER_CONFIG.desertStorm.sand, isMobile);
    const sand: DurationParticle[] = [];

    for (let i = 0; i < count; i++) {
      sand.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2,
      });
    }
    setParticles(sand);
  }, [isMobile]);

  return particles;
}

/**
 * Generate cosmic particles for space effect
 */
export function useCosmicParticles(isMobile: boolean): SizedAnimatedParticle[] {
  const [particles, setParticles] = useState<SizedAnimatedParticle[]>([]);

  useEffect(() => {
    const count = getCount(WEATHER_CONFIG.cosmicSpace.particles, isMobile);
    const cosmic: SizedAnimatedParticle[] = [];

    for (let i = 0; i < count; i++) {
      cosmic.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 4,
      });
    }
    setParticles(cosmic);
  }, [isMobile]);

  return particles;
}

/**
 * Generate fire and speed trail particles
 */
export function useFireSpeedParticles(isMobile: boolean): {
  fireParticles: DurationParticle[];
  speedTrails: { id: number; x: number; y: number; delay: number }[];
} {
  const [fireParticles, setFireParticles] = useState<DurationParticle[]>([]);
  const [speedTrails, setSpeedTrails] = useState<
    { id: number; x: number; y: number; delay: number }[]
  >([]);

  useEffect(() => {
    const fireCount = getCount(WEATHER_CONFIG.fireSpeed.fire, isMobile);
    const trailCount = getCount(WEATHER_CONFIG.fireSpeed.trails, isMobile);

    const fire: DurationParticle[] = [];
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

    const trails: { id: number; x: number; y: number; delay: number }[] = [];
    for (let i = 0; i < trailCount; i++) {
      trails.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2,
      });
    }
    setSpeedTrails(trails);
  }, [isMobile]);

  return { fireParticles, speedTrails };
}

/**
 * Generate chaos psychedelic particles
 */
export function useChaosParticles(isMobile: boolean): ChaosParticle[] {
  const [particles, setParticles] = useState<ChaosParticle[]>([]);

  useEffect(() => {
    const count = getCount(WEATHER_CONFIG.chaosPsychedelic.particles, isMobile);
    const { colors } = WEATHER_CONFIG.chaosPsychedelic;
    const chaos: ChaosParticle[] = [];

    for (let i = 0; i < count; i++) {
      chaos.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 3,
      });
    }
    setParticles(chaos);
  }, [isMobile]);

  return particles;
}

/**
 * Generate geometric shapes for mist effect
 */
export function useGeometricParticles(isMobile: boolean): GeometricParticle[] {
  const [particles, setParticles] = useState<GeometricParticle[]>([]);

  useEffect(() => {
    const count = getCount(WEATHER_CONFIG.mistGeometric.shapes, isMobile);
    const shapes: GeometricParticle[] = [];

    for (let i = 0; i < count; i++) {
      shapes.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 30 + Math.random() * 50,
        rotation: Math.random() * 360,
      });
    }
    setParticles(shapes);
  }, [isMobile]);

  return particles;
}

/**
 * Generate ash and lava particles for apocalyptic effect
 */
export function useApocalypticParticles(isMobile: boolean): {
  ashParticles: DurationParticle[];
  lavaGlow: BaseParticle[];
} {
  const [ashParticles, setAshParticles] = useState<DurationParticle[]>([]);
  const [lavaGlow, setLavaGlow] = useState<BaseParticle[]>([]);

  useEffect(() => {
    const ashCount = getCount(WEATHER_CONFIG.apocalypticLava.ash, isMobile);
    const lavaCount = getCount(WEATHER_CONFIG.apocalypticLava.lava, isMobile);

    const ash: DurationParticle[] = [];
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

    const lava: BaseParticle[] = [];
    for (let i = 0; i < lavaCount; i++) {
      lava.push({
        id: i,
        x: Math.random() * 100,
        y: 80 + Math.random() * 20,
      });
    }
    setLavaGlow(lava);
  }, [isMobile]);

  return { ashParticles, lavaGlow };
}

/**
 * Generate divine particles for celestial effect
 */
export function useDivineParticles(isMobile: boolean): SizedAnimatedParticle[] {
  const [particles, setParticles] = useState<SizedAnimatedParticle[]>([]);

  useEffect(() => {
    const count = getCount(WEATHER_CONFIG.celestialDivine.particles, isMobile);
    const divine: SizedAnimatedParticle[] = [];

    for (let i = 0; i < count; i++) {
      divine.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 3 + Math.random() * 4,
        delay: Math.random() * 3,
      });
    }
    setParticles(divine);
  }, [isMobile]);

  return particles;
}
