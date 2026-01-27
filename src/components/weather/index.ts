/**
 * Weather Effects Module
 *
 * Barrel export for weather effect components and utilities.
 */

// Types
export type {
  BaseParticle,
  SizedParticle,
  AnimatedParticle,
  SizedAnimatedParticle,
  DurationParticle,
  StarParticle,
  FogParticle,
  ChaosParticle,
  GeometricParticle,
  EffectProps,
  ParticleConfig,
  PhaseWeatherConfig,
} from './weatherTypes';

// Configuration
export { WEATHER_CONFIG, getMobileParticleCount, getDesktopParticleCount } from './weatherConfig';

// Hooks
export {
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

// Components
export {
  StarryNightEffect,
  MysticFogEffect,
  DesertStormEffect,
  CosmicSpaceEffect,
  FireSpeedEffect,
  ChaosPsychedelicEffect,
  MistGeometricEffect,
  ApocalypticLavaEffect,
  CelestialDivineEffect,
} from './WeatherEffects';
