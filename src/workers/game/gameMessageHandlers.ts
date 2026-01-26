import { GameStatus, GameState, Direction } from '@/types/game';
import { logger, LogContext } from '@/utils/logger';
import type { WorkerState } from './gameState';
import {
  handleResumeAfterDeath,
  handleSpawnBoss,
  handleSelectPhase,
  handleNextPhase,
  handleSetPhaseComplete,
  handleSetDirection,
  handleFirePoison,
} from './gameHandlers';

export interface MessageHandlers {
  initGame: () => void;
  startGameLoop: () => void;
  stopGameLoop: () => void;
  broadcastState: () => void;
  syncStateToWorker: () => void;
  syncStateFromWorker: () => void;
  getGameState: () => GameState | null;
  setGameState: (state: GameState | null) => void;
  getLastUpdateTime: () => number;
  setLastUpdateTime: (time: number) => void;
  getRenderPort: () => MessagePort | null;
  setRenderPort: (port: MessagePort | null) => void;
}

/**
 * Handle INIT message
 */
export function handleInitMessage(
  payload: { highScore?: number },
  handlers: MessageHandlers,
): void {
  handlers.initGame();
  const gameState = handlers.getGameState();
  if (payload?.highScore && gameState) {
    gameState.highScore = payload.highScore;
  }
  handlers.broadcastState();
  logger.info({ context: LogContext.GAME_STATE }, 'Game worker initialized');
}

/**
 * Handle START_GAME message
 */
export function handleStartGameMessage(
  payload: { highScore?: number },
  handlers: MessageHandlers,
): void {
  const gameState = handlers.getGameState();
  if (!gameState) return;

  if (gameState.status === GameStatus.IDLE || gameState.status === GameStatus.GAME_OVER) {
    handlers.initGame();
    const resetState = handlers.getGameState();
    if (payload?.highScore && resetState) {
      resetState.highScore = payload.highScore;
    }
  }

  const currentState = handlers.getGameState();
  if (currentState) {
    currentState.status = GameStatus.PLAYING;
    handlers.setLastUpdateTime(performance.now());
    handlers.startGameLoop();
    handlers.broadcastState();
    logger.info({ context: LogContext.GAME_STATE, status: currentState.status }, 'Game started');
  }
}

/**
 * Handle PAUSE_GAME message
 */
export function handlePauseGameMessage(handlers: MessageHandlers): void {
  const gameState = handlers.getGameState();
  if (!gameState) return;

  gameState.status =
    gameState.status === GameStatus.PAUSED ? GameStatus.PLAYING : GameStatus.PAUSED;
  if (gameState.status === GameStatus.PLAYING) {
    handlers.setLastUpdateTime(performance.now());
    handlers.startGameLoop();
  } else {
    handlers.stopGameLoop();
  }
  handlers.broadcastState();
  logger.info({ context: LogContext.GAME_STATE, status: gameState.status }, 'Game pause toggled');
}

/**
 * Handle SET_STATUS message
 */
export function handleSetStatusMessage(
  payload: { status: GameStatus },
  handlers: MessageHandlers,
): void {
  const gameState = handlers.getGameState();
  if (!gameState) return;

  gameState.status = payload.status;
  if (payload.status !== GameStatus.PLAYING) {
    handlers.stopGameLoop();
    gameState.isSpeedBoosted = false;
    gameState.isFiringPoison = false;
  }
  handlers.broadcastState();
}

/**
 * Handle SET_SPEED_BOOST message
 */
export function handleSetSpeedBoostMessage(
  payload: { enabled: boolean },
  handlers: MessageHandlers,
): void {
  const gameState = handlers.getGameState();
  if (gameState) {
    gameState.isSpeedBoosted = payload.enabled;
  }
}

/**
 * Handle SET_FIRING_POISON message
 */
export function handleSetFiringPoisonMessage(
  payload: { enabled: boolean },
  handlers: MessageHandlers,
): void {
  const gameState = handlers.getGameState();
  if (gameState) {
    gameState.isFiringPoison = payload.enabled;
  }
}

/**
 * Handle RESET_GAME message
 */
export function handleResetGameMessage(
  payload: { highScore?: number },
  handlers: MessageHandlers,
): void {
  handlers.initGame();
  const gameState = handlers.getGameState();
  if (payload?.highScore && gameState) {
    gameState.highScore = payload.highScore;
  }
  handlers.broadcastState();
  logger.info({ context: LogContext.GAME_STATE }, 'Game reset');
}

/**
 * Handle CONNECT_RENDER_WORKER message
 */
export function handleConnectRenderWorkerMessage(
  payload: { port: MessagePort },
  handlers: MessageHandlers,
): void {
  handlers.setRenderPort(payload.port);
  const renderPort = handlers.getRenderPort();
  if (renderPort) {
    renderPort.start();
    logger.info(
      { context: LogContext.GAME_STATE },
      'Connected to render worker via MessageChannel',
    );
  }
}

/**
 * Handle SELECT_PHASE message
 */
export function handleSelectPhaseMessage(
  payload: { phaseId: number },
  workerState: WorkerState,
  handlers: MessageHandlers,
): void {
  handlers.syncStateToWorker();
  handleSelectPhase(workerState, payload.phaseId, handlers.stopGameLoop, handlers.broadcastState);
  handlers.syncStateFromWorker();
}

/**
 * Handle NEXT_PHASE message
 */
export function handleNextPhaseMessage(
  payload: { phaseNumber: number },
  workerState: WorkerState,
  handlers: MessageHandlers,
): void {
  handlers.syncStateToWorker();
  handleNextPhase(workerState, payload.phaseNumber, handlers.stopGameLoop, handlers.broadcastState);
  handlers.syncStateFromWorker();
}

/**
 * Handle SET_PHASE_COMPLETE message
 */
export function handleSetPhaseCompleteMessage(
  payload: { defeatedBossPhaseNumber?: number },
  workerState: WorkerState,
  handlers: MessageHandlers,
): void {
  handlers.syncStateToWorker();
  handleSetPhaseComplete(
    workerState,
    payload.defeatedBossPhaseNumber,
    handlers.stopGameLoop,
    handlers.broadcastState,
  );
  handlers.syncStateFromWorker();
}

/**
 * Handle SPAWN_BOSS message
 */
export function handleSpawnBossMessage(
  payload: { bossId: string | null },
  workerState: WorkerState,
  handlers: MessageHandlers,
): void {
  handlers.syncStateToWorker();
  handleSpawnBoss(workerState, payload.bossId, handlers.broadcastState);
  handlers.syncStateFromWorker();
  logger.info({ context: LogContext.BOSS, bossId: payload.bossId }, 'Spawn boss command received');
}

/**
 * Handle RESUME_AFTER_DEATH message
 */
export function handleResumeAfterDeathMessage(
  workerState: WorkerState,
  handlers: MessageHandlers,
): void {
  handlers.syncStateToWorker();
  handleResumeAfterDeath(
    workerState,
    handlers.startGameLoop,
    handlers.stopGameLoop,
    handlers.broadcastState,
  );
  handlers.syncStateFromWorker();
  logger.info({ context: LogContext.GAME_STATE }, 'Resume after death command received');
}

/**
 * Handle SET_DIRECTION message
 */
export function handleSetDirectionMessage(
  payload: { direction: Direction },
  workerState: WorkerState,
  handlers: MessageHandlers,
): void {
  handlers.syncStateToWorker();
  handleSetDirection(workerState, payload.direction);
  handlers.syncStateFromWorker();
}

/**
 * Handle FIRE_POISON message
 */
export function handleFirePoisonMessage(workerState: WorkerState, handlers: MessageHandlers): void {
  handlers.syncStateToWorker();
  handleFirePoison(workerState);
  handlers.syncStateFromWorker();
}
