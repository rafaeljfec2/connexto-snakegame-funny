import { type RenderState } from './renderState';
import { type RenderContext } from './renderDrawers';
import { getInterpolatedPos, calculateSnakeAngle } from './renderUtils';
import { getDeathFade, getHeadDeathFade } from './renderAnimations';
import { drawSnakeSegment } from './renderDrawers';

/**
 * Draw snake body segments
 */
export function drawSnakeBody(
  renderContext: RenderContext,
  state: RenderState,
  cellSize: number,
  t: number,
  now: number,
): void {
  const { ctx } = renderContext;

  for (let i = state.snake.length - 1; i > 0; i--) {
    const prev =
      state.prevSnake[i] || state.prevSnake[state.prevSnake.length - 1] || state.snake[i];
    const pos = getInterpolatedPos(state.snake[i], prev, cellSize, t);

    let scale = 1.15;
    if (i >= state.snake.length - 2 && state.snake.length > 3) {
      scale = 0.85;
    }

    const fade = getDeathFade(now, state.animationState.deathStartTime, i, state.snake.length);
    ctx.globalAlpha = fade;

    drawSnakeSegment(renderContext, {
      x: pos.x,
      y: pos.y,
      cellSize,
      isHead: false,
      isBoss: false,
      activeBoss: state.activeBoss,
      tongueProgress: state.animationState.tongueProgress,
      skin: state.skin,
      scale,
    });
  }
}

/**
 * Draw snake head
 */
export function drawSnakeHead(
  renderContext: RenderContext,
  state: RenderState,
  cellSize: number,
  t: number,
  now: number,
): void {
  const { ctx } = renderContext;

  const headPrev = state.prevSnake[0] || state.snake[0];
  const headPos = getInterpolatedPos(state.snake[0], headPrev, cellSize, t);

  let angle = 0;
  if (state.snake.length > 1) {
    angle = calculateSnakeAngle(state.snake[0], state.snake[1]);
  }

  let headScale = 1.15;
  if (state.isEating) {
    headScale = 1.3;
  }

  const headFade = getHeadDeathFade(now, state.animationState.deathStartTime);
  ctx.globalAlpha = headFade;

  drawSnakeSegment(renderContext, {
    x: headPos.x,
    y: headPos.y,
    cellSize,
    isHead: true,
    isBoss: false,
    activeBoss: state.activeBoss,
    tongueProgress: state.animationState.tongueProgress,
    skin: state.skin,
    scale: headScale,
    angle,
  });
}

/**
 * Draw boss snake
 */
export function drawBossSnake(
  renderContext: RenderContext,
  state: RenderState,
  cellSize: number,
  t: number,
): void {
  if (!state.bossSnake) return;

  // Optimized loop - for is faster than forEach
  const positions = state.bossSnake.positions;
  const positionsLength = positions.length;
  for (let i = 0; i < positionsLength; i++) {
    const seg = positions[i];
    if (!seg) continue;

    const prev = state.prevBossSnake[i] ?? seg;
    const pos = getInterpolatedPos(seg, prev, cellSize, t);

    let bossAngle = 0;
    const secondPos = positions[1];
    if (i === 0 && positionsLength > 1 && secondPos) {
      bossAngle = calculateSnakeAngle(seg, secondPos);
    }

    drawSnakeSegment(renderContext, {
      x: pos.x,
      y: pos.y,
      cellSize,
      isHead: i === 0,
      isBoss: true,
      activeBoss: state.activeBoss,
      tongueProgress: state.animationState.tongueProgress,
      skin: state.skin,
      scale: 1.2,
      angle: bossAngle,
    });
  }
}
