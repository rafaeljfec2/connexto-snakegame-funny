/**
 * Weather Effect Types
 *
 * Common types and interfaces for weather particle effects.
 */

/**
 * Base particle with position
 */
export interface BaseParticle {
  readonly id: number;
  readonly x: number;
  readonly y: number;
}

/**
 * Particle with size
 */
export interface SizedParticle extends BaseParticle {
  readonly size: number;
}

/**
 * Particle with animation delay
 */
export interface AnimatedParticle extends BaseParticle {
  readonly delay: number;
}

/**
 * Particle with size and animation
 */
export interface SizedAnimatedParticle extends SizedParticle {
  readonly delay: number;
}

/**
 * Particle with duration
 */
export interface DurationParticle extends AnimatedParticle {
  readonly duration: number;
}

/**
 * Star particle for starry night effect
 */
export interface StarParticle extends SizedParticle {
  readonly opacity: number;
  readonly twinkleDelay: number;
}

/**
 * Fog particle with speed
 */
export interface FogParticle extends SizedParticle {
  readonly speed: number;
}

/**
 * Chaos particle with color
 */
export interface ChaosParticle extends AnimatedParticle {
  readonly color: string;
}

/**
 * Geometric shape particle
 */
export interface GeometricParticle extends SizedParticle {
  readonly rotation: number;
}

/**
 * Props for weather effect components
 */
export interface EffectProps {
  readonly isMobile: boolean;
}

/**
 * Particle configuration for generation
 */
export interface ParticleConfig {
  readonly mobileCount: number;
  readonly desktopCount: number;
}

/**
 * Phase configuration for weather effects
 */
export interface PhaseWeatherConfig {
  readonly phaseId: number;
  readonly primaryParticles: ParticleConfig;
  readonly secondaryParticles?: ParticleConfig;
}
