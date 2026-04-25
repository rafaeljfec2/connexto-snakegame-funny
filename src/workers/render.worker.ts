/// <reference lib="webworker" />

import { GAME_CONFIG } from '@/constants/game';
import {
  createRenderState,
  handleStateUpdate,
  handleUiHint,
  handleUiLocale,
  type RenderState,
} from './render/renderState';
import {
  drawFood,
  drawObstacle,
  drawPortal,
  drawShot,
  drawGuardianFlag,
  type RenderContext,
} from './render/renderDrawers';
import { updateTongueAnimation } from './render/renderAnimations';
import { drawSnakeBody, drawSnakeHead, drawBossSnake } from './render/renderHelpers';
import { createPerfReporter } from './perfReporter';

// Global render state
const state: RenderState = createRenderState();

const perfReporter = createPerfReporter({
  source: 'render',
  postMessage: (message) => self.postMessage(message),
});

let lastRenderFrameTs = 0;

/**
 * Main render loop
 */
const render = () => {
  if (!state.ctx) {
    requestAnimationFrame(render);
    return;
  }

  const frameTs = performance.now();
  if (lastRenderFrameTs > 0) {
    perfReporter.recordInterval(frameTs - lastRenderFrameTs);
  }
  lastRenderFrameTs = frameTs;

  // Skip render if nothing changed
  if (!state.isRenderDirty) {
    requestAnimationFrame(render);
    return;
  }

  state.isRenderDirty = false;

  const renderStart = frameTs;

  // Time & Interpolation
  const now = renderStart;
  const elapsed = now - state.lastUpdate;
  const t = Math.min(Math.max(elapsed / state.speed, 0), 1);

  // Update tongue animation
  state.animationState.tongueProgress = updateTongueAnimation(now, state.animationState);

  // Clear canvas
  state.ctx.clearRect(0, 0, state.width, state.height);

  // Calculate cell size
  const cellSize = state.width / GAME_CONFIG.gridSize;

  // Create render context
  const renderContext: RenderContext = {
    ctx: state.ctx,
    width: state.width,
    height: state.height,
    isMobile: state.isMobile,
  };

  // Draw Obstacles - optimized loop
  const obstacles = state.obstacles;
  const obstaclesLength = obstacles.length;
  for (let i = 0; i < obstaclesLength; i++) {
    drawObstacle(renderContext, obstacles[i]!, cellSize);
  }

  // Draw Portals - optimized loop
  const portals = state.portals;
  const portalsLength = portals.length;
  for (let i = 0; i < portalsLength; i++) {
    drawPortal(renderContext, portals[i]!, cellSize, now);
  }

  // Draw Food
  if (state.food) {
    drawFood(renderContext, state.food, cellSize, now);
  }

  // Draw Snake
  if (state.snake && state.snake.length > 0) {
    state.ctx.save();
    drawSnakeBody(renderContext, state, cellSize, t, now);
    drawSnakeHead(renderContext, state, cellSize, t, now);
    state.ctx.restore();
  }

  // Draw Boss
  drawBossSnake(renderContext, state, cellSize, t);

  // Draw Guardian Flag
  if (state.guardianFlag) {
    drawGuardianFlag(renderContext, state.guardianFlag, cellSize);
  }

  // Draw Shots - optimized loop
  const shots = state.shots;
  const shotsLength = shots.length;
  for (let i = 0; i < shotsLength; i++) {
    drawShot(renderContext, shots[i]!, cellSize);
  }

  perfReporter.recordWorkTime(performance.now() - renderStart);

  requestAnimationFrame(render);
};

/**
 * Initialize canvas and start render loop
 */
function handleInit(payload: {
  canvas: OffscreenCanvas;
  width: number;
  height: number;
  dpr: number;
  isMobile: boolean;
}) {
  const canvas = payload.canvas;
  state.width = payload.width || 100;
  state.height = payload.height || 100;
  state.dpr = payload.dpr || 1;
  state.isMobile = payload.isMobile;

  try {
    canvas.width = state.width * state.dpr;
    canvas.height = state.height * state.dpr;
    state.ctx = canvas.getContext('2d');
    if (state.ctx) {
      state.ctx.scale(state.dpr, state.dpr);
    }
  } catch (e) {
    console.error('Error setting up canvas', e);
  }

  // Start render loop
  render();
}

/**
 * Handle canvas resize
 */
function handleResize(payload: { width: number; height: number; dpr: number }) {
  state.width = payload.width;
  state.height = payload.height;
  state.dpr = payload.dpr || 1;
  if (state.ctx?.canvas) {
    state.ctx.canvas.width = state.width * state.dpr;
    state.ctx.canvas.height = state.height * state.dpr;
    state.ctx.setTransform(1, 0, 0, 1, 0, 0);
    state.ctx.scale(state.dpr, state.dpr);
  }
}

/**
 * Handle game worker connection
 */
function handleConnectGameWorker(payload: { port: MessagePort }) {
  state.gamePort = payload.port;
  if (state.gamePort) {
    state.gamePort.onmessage = (evt) => {
      if (evt.data.type === 'UPDATE') {
        handleStateUpdate(state, evt.data.payload);
      }
    };
  }
}

// Message handler
globalThis.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'INIT': {
      handleInit(payload);
      break;
    }

    case 'RESIZE': {
      handleResize(payload);
      break;
    }

    case 'UPDATE': {
      handleStateUpdate(state, payload);
      break;
    }

    case 'UI_HINT': {
      handleUiHint(state, payload);
      break;
    }

    case 'UI_LOCALE': {
      handleUiLocale(state, payload);
      break;
    }

    case 'CONNECT_GAME_WORKER': {
      handleConnectGameWorker(payload);
      break;
    }
  }
};
