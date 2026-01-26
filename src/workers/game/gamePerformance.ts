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
 * Update performance state with frame time
 */
export function updatePerformanceState(
  state: PerformanceState,
  frameTime: number,
): PerformanceState {
  const frameTimeHistory = [...state.frameTimeHistory, frameTime];
  if (frameTimeHistory.length > FRAME_TIME_HISTORY_SIZE) {
    frameTimeHistory.shift();
  }

  const avgFrameTime = frameTimeHistory.reduce((a, b) => a + b, 0) / frameTimeHistory.length;
  const skipOptionalEffects = avgFrameTime > MAX_FRAME_TIME;
  const framesSkipped =
    skipOptionalEffects && frameTime > TARGET_FRAME_TIME * 1.5
      ? state.framesSkipped + 1
      : state.framesSkipped;

  return {
    frameTimeHistory,
    skipOptionalEffects,
    framesSkipped,
  };
}
