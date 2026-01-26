/**
 * Animation state and utilities for render worker
 */

export interface AnimationState {
  lastTongueFlick: number;
  nextTongueFlick: number;
  tongueProgress: number;
  deathStartTime: number;
}

/**
 * Initialize animation state
 */
export function createAnimationState(): AnimationState {
  return {
    lastTongueFlick: 0,
    nextTongueFlick: 0,
    tongueProgress: 0,
    deathStartTime: 0,
  };
}

/**
 * Update tongue animation state
 */
export function updateTongueAnimation(now: number, state: AnimationState): number {
  if (now > state.nextTongueFlick) {
    state.lastTongueFlick = now;
    state.nextTongueFlick = now + 500 + Math.random() * 1500;
  }

  const flickDur = 200;
  if (now - state.lastTongueFlick < flickDur) {
    return Math.sin(((now - state.lastTongueFlick) / flickDur) * Math.PI);
  }
  return 0;
}

/**
 * Calculate death animation fade for a segment
 */
export function getDeathFade(
  now: number,
  deathStartTime: number,
  segmentIndex: number,
  totalSegments: number,
): number {
  if (deathStartTime <= 0) return 1;

  const time = now - deathStartTime;
  const totalDur = 2000;
  const step = Math.min(50, totalDur / (totalSegments || 1));
  const delay = segmentIndex * step;
  return Math.max(0, 1 - (time - delay) / 200);
}

/**
 * Calculate head death fade
 */
export function getHeadDeathFade(now: number, deathStartTime: number): number {
  if (deathStartTime <= 0) return 1;
  const time = now - deathStartTime;
  return Math.max(0, 1 - time / 200);
}

/**
 * Calculate pulse animation (for food, portals, etc.)
 */
export function getPulseAnimation(now: number, period: number = 200): number {
  return 1 + Math.sin(now / period) * 0.1;
}
