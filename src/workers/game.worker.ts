/// <reference lib="webworker" />

import { GameStatus } from '@/types/game';
import { getActivePowerUps, getEffectiveGameSpeed } from '@/utils/powerUps';
import { logger, LogContext } from '@/utils/logger';
import { updateFrameTime, updateFramesSkipped, logMetrics } from '@/utils/performanceMetrics';
import { createPerfReporter } from './perfReporter';
import {
  createWorkerState,
  initGameState,
  resetWorkerState,
  type WorkerState,
} from './game/gameState';
import {
  createPerformanceState,
  updatePerformanceState,
  type PerformanceState,
} from './game/gamePerformance';
import { broadcastState as broadcastGameState } from './game/gameBroadcast';
import {
  handleInitMessage,
  handleStartGameMessage,
  handlePauseGameMessage,
  handleSetStatusMessage,
  handleSetSpeedBoostMessage,
  handleSetFiringPoisonMessage,
  handleResetGameMessage,
  handleConnectRenderWorkerMessage,
  handleSelectPhaseMessage,
  handleNextPhaseMessage,
  handleSetPhaseCompleteMessage,
  handleSpawnBossMessage,
  handleResumeAfterDeathMessage,
  handleSetDirectionMessage,
  handleFirePoisonMessage,
  type MessageHandlers,
} from './game/gameMessageHandlers';

// Worker state
const workerState: WorkerState = createWorkerState();
const performanceState: PerformanceState = createPerformanceState();

const perfReporter = createPerfReporter({
  source: 'game',
  postMessage: (message) => self.postMessage(message),
});

// Legacy references for compatibility - sync with workerState
let gameState = workerState.gameState;
let gameLoopId = workerState.gameLoopId;
let lastUpdateTime = workerState.lastUpdateTime;
let lastObstacleSpawnTime = workerState.lastObstacleSpawnTime;
const lastPoisonFireTime = 0;
let forcedFoodType = workerState.forcedFoodType;
let bossAbilityCooldowns = workerState.bossAbilityCooldowns;
let pendingPoisonShots = workerState.pendingPoisonShots;
let renderPort = workerState.renderPort;
let directionQueue = workerState.directionQueue;
let previousState = workerState.previousState;
let previousRenderState = workerState.previousRenderState;
let isRenderDirty = workerState.isRenderDirty;
let skipOptionalEffects = performanceState.skipOptionalEffects;
let framesSkipped = performanceState.framesSkipped;

// Helper to sync state back to workerState
function syncStateToWorker(): void {
  workerState.gameState = gameState;
  workerState.gameLoopId = gameLoopId;
  workerState.lastUpdateTime = lastUpdateTime;
  workerState.lastObstacleSpawnTime = lastObstacleSpawnTime;
  workerState.forcedFoodType = forcedFoodType;
  workerState.bossAbilityCooldowns = bossAbilityCooldowns;
  workerState.pendingPoisonShots = pendingPoisonShots;
  workerState.renderPort = renderPort;
  workerState.directionQueue = directionQueue;
  workerState.previousState = previousState;
  workerState.previousRenderState = previousRenderState;
  workerState.isRenderDirty = isRenderDirty;
}

// Helper to sync state from workerState
function syncStateFromWorker(): void {
  gameState = workerState.gameState;
  gameLoopId = workerState.gameLoopId;
  lastUpdateTime = workerState.lastUpdateTime;
  lastObstacleSpawnTime = workerState.lastObstacleSpawnTime;
  forcedFoodType = workerState.forcedFoodType;
  bossAbilityCooldowns = workerState.bossAbilityCooldowns;
  pendingPoisonShots = workerState.pendingPoisonShots;
  renderPort = workerState.renderPort;
  directionQueue = workerState.directionQueue;
  previousState = workerState.previousState;
  previousRenderState = workerState.previousRenderState;
  isRenderDirty = workerState.isRenderDirty;
}

// Initialize Game State
function initGame() {
  logger.info({ context: LogContext.GAME_STATE }, 'Initializing game state');
  resetWorkerState(workerState);
  workerState.gameState = initGameState();
  syncStateFromWorker();
}

// Create message handlers interface
const messageHandlers: MessageHandlers = {
  initGame,
  startGameLoop,
  stopGameLoop,
  broadcastState,
  syncStateToWorker,
  syncStateFromWorker,
  getGameState: () => gameState,
  setGameState: (state) => {
    gameState = state;
  },
  getLastUpdateTime: () => lastUpdateTime,
  setLastUpdateTime: (time) => {
    lastUpdateTime = time;
  },
  getRenderPort: () => renderPort,
  setRenderPort: (port) => {
    renderPort = port;
  },
  forceRenderResync: () => {
    previousRenderState = null;
    isRenderDirty = true;
    workerState.previousRenderState = null;
    workerState.isRenderDirty = true;
  },
};

// Message Handler
globalThis.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'INIT':
      handleInitMessage(payload, messageHandlers);
      break;

    case 'START_GAME':
      handleStartGameMessage(payload, messageHandlers);
      break;

    case 'PAUSE_GAME':
      handlePauseGameMessage(messageHandlers);
      break;

    case 'SET_STATUS':
      handleSetStatusMessage(payload, messageHandlers);
      break;

    case 'SET_DIRECTION':
      handleSetDirectionMessage(payload, workerState, messageHandlers);
      break;

    case 'SET_SPEED_BOOST':
      handleSetSpeedBoostMessage(payload, messageHandlers);
      break;

    case 'FIRE_POISON':
      handleFirePoisonMessage(workerState, messageHandlers);
      break;

    case 'SET_FIRING_POISON':
      handleSetFiringPoisonMessage(payload, messageHandlers);
      break;

    case 'RESET_GAME':
      handleResetGameMessage(payload, messageHandlers);
      break;

    case 'SELECT_PHASE':
      handleSelectPhaseMessage(payload, workerState, messageHandlers);
      break;

    case 'NEXT_PHASE':
      handleNextPhaseMessage(payload, workerState, messageHandlers);
      break;

    case 'SET_PHASE_COMPLETE':
      handleSetPhaseCompleteMessage(payload, workerState, messageHandlers);
      break;

    case 'SPAWN_BOSS':
      handleSpawnBossMessage(payload, workerState, messageHandlers);
      break;

    case 'RESUME_AFTER_DEATH':
      handleResumeAfterDeathMessage(workerState, messageHandlers);
      break;

    case 'CONNECT_RENDER_WORKER':
      handleConnectRenderWorkerMessage(payload, messageHandlers);
      break;
  }
};

function broadcastState() {
  if (!gameState) return;

  syncStateToWorker();
  const result = broadcastGameState(
    gameState,
    previousState,
    previousRenderState,
    renderPort,
    isRenderDirty,
  );

  previousState = result.newPreviousState;
  previousRenderState = result.newPreviousRenderState;
  isRenderDirty = result.newIsRenderDirty;
  workerState.previousState = previousState;
  workerState.previousRenderState = previousRenderState;
  workerState.isRenderDirty = isRenderDirty;
}

function startGameLoop() {
  if (gameLoopId) return;

  let lastTickTs = 0;

  function loop() {
    const frameStart = performance.now();
    const now = frameStart;
    // Cache Date.now() once per frame
    const currentTime = Date.now();
    let didTick = false;

    if (gameState && gameState.status === GameStatus.PLAYING) {
      // Cache activePowerUps calculation - used in both speed calculation and updateGame
      const activePowerUps = getActivePowerUps(gameState.activePowerUps);
      let effectiveSpeed = getEffectiveGameSpeed(gameState.gameSpeed, activePowerUps);

      if (gameState.isSpeedBoosted) {
        effectiveSpeed = Math.floor(effectiveSpeed / 4);
      }

      const timeSinceLastUpdate = now - lastUpdateTime;

      if (timeSinceLastUpdate >= effectiveSpeed) {
        // Pass cached activePowerUps and currentTime to avoid recalculation
        updateGame(now, currentTime, activePowerUps);
        lastUpdateTime = now;
        didTick = true;
        // broadcastState checks dirty flags internally
        broadcastState();
      }
    }

    // Track frame time for adaptive performance - optimized direct assignment
    const frameTime = performance.now() - frameStart;
    const updatedPerformance = updatePerformanceState(performanceState, frameTime);
    // Direct property assignment is faster than Object.assign
    performanceState.frameTimeHistory = updatedPerformance.frameTimeHistory;
    performanceState.skipOptionalEffects = updatedPerformance.skipOptionalEffects;
    performanceState.framesSkipped = updatedPerformance.framesSkipped;
    skipOptionalEffects = performanceState.skipOptionalEffects;
    framesSkipped = performanceState.framesSkipped;

    if (didTick) {
      updateFrameTime(frameTime);
      perfReporter.recordWorkTime(frameTime);
      if (lastTickTs > 0) {
        perfReporter.recordInterval(frameStart - lastTickTs);
      }
      lastTickTs = frameStart;
    }
    updateFramesSkipped(framesSkipped);

    // Log metrics every 60 frames (1 second at 60fps)
    if (framesSkipped % 60 === 0) {
      logMetrics();
    }

    gameLoopId = requestAnimationFrame(loop);
  }

  gameLoopId = requestAnimationFrame(loop);
}

function stopGameLoop() {
  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;
  }
}

import { updateGameLogic, type UpdateContext } from './game/gameUpdate';

// Core Game Update Logic
function updateGame(
  performanceTime: number,
  currentTime: number,
  activePowerUps: ReturnType<typeof getActivePowerUps>,
) {
  if (!gameState) return;

  const updateContext: UpdateContext = {
    gameState,
    directionQueue,
    bossAbilityCooldowns,
    pendingPoisonShots,
    lastObstacleSpawnTime,
    forcedFoodType,
    lastPoisonFireTime,
    skipOptionalEffects,
    framesSkipped,
    activePowerUps,
    currentTime,
  };

  const result = updateGameLogic(updateContext, performanceTime);

  gameState = result.newGameState;
  bossAbilityCooldowns = result.newBossAbilityCooldowns;
  forcedFoodType = result.newForcedFoodType;
  pendingPoisonShots = result.newPendingPoisonShots;
  lastObstacleSpawnTime = result.newLastObstacleSpawnTime;
  isRenderDirty = result.isRenderDirty;

  if (
    result.newGameState?.status === GameStatus.DYING ||
    result.newGameState?.status === GameStatus.GAME_OVER
  ) {
    self.postMessage({
      type: 'GAME_OVER_OR_DYING',
      payload: {
        status: result.newGameState.status,
        score:
          result.newGameState.status === GameStatus.GAME_OVER
            ? result.newGameState.score
            : undefined,
      },
    });
  }
}
