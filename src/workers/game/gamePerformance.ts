/**
 * Performance tracking and frame skipping for adaptive performance
 */

export interface PerformanceState {
  frameTimeHistory: number[];
  skipOptionalEffects: boolean;
  framesSkipped: number;
}

export const FRAME_TIME_HISTORY_SIZE = 10;
export const TARGET_FRAME_TIME = 16.67; // 60fps
export const MAX_FRAME_TIME = TARGET_FRAME_TIME * 2; // Allow up to 2x target

/**
 * Create initial performance state
 */
export function createPerformanceState(): PerformanceState {
  return {
    frameTimeHistory: [],
    skipOptionalEffects: false,
    framesSkipped: 0,
  };
}

/**
 * Update performance state with frame time - optimized version
 */
export function updatePerformanceState(
  state: PerformanceState,
  frameTime: number,
): PerformanceState {
  // Use circular buffer approach - much faster than shift() and reduce()
  const history = state.frameTimeHistory;
  const count = history.length;

  if (count < FRAME_TIME_HISTORY_SIZE) {
    // Add new entry
    history.push(frameTime);
  } else {
    // Replace oldest entry (circular buffer) - remove first, add to end
    history.shift();
    history.push(frameTime);
  }

  // Calculate average efficiently with simple loop (faster than reduce)
  let sum = 0;
  const currentCount = history.length;
  for (let i = 0; i < currentCount; i++) {
    sum += history[i] ?? 0;
  }

  const avgFrameTime = currentCount > 0 ? sum / currentCount : frameTime;
  const skipOptionalEffects = avgFrameTime > MAX_FRAME_TIME;
  const framesSkipped =
    skipOptionalEffects && frameTime > TARGET_FRAME_TIME * 1.5
      ? state.framesSkipped + 1
      : state.framesSkipped;

  return {
    frameTimeHistory: history,
    skipOptionalEffects,
    framesSkipped,
  };
}
