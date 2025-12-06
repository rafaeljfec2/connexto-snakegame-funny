import pino from 'pino';

/**
 * Logger configuration for the game
 * Uses Pino for structured logging with different levels
 */
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

/**
 * Custom browser destination that uses console methods based on log level
 */
const createBrowserDestination = () => {
  const write = (obj: Record<string, unknown>) => {
    try {
      const { level, msg, context, ...metadata } = obj;

      // Map Pino levels to console methods
      // Pino levels: 10=TRACE, 20=DEBUG, 30=INFO, 40=WARN, 50=ERROR, 60=FATAL
      const levelNum = typeof level === 'number' ? level : 30;
      const message = (msg as string) || '';

      // Create a styled prefix for better readability
      const levelLabels: Record<number, { label: string; style: string }> = {
        10: { label: 'TRACE', style: 'color: #888' },
        20: { label: 'DEBUG', style: 'color: #666' },
        30: { label: 'INFO', style: 'color: #2196F3' },
        40: { label: 'WARN', style: 'color: #FF9800' },
        50: { label: 'ERROR', style: 'color: #F44336' },
        60: { label: 'FATAL', style: 'color: #E91E63; font-weight: bold' },
      };

      const levelInfo = levelLabels[levelNum] || { label: 'LOG', style: '' };
      const prefix = `[${levelInfo.label}]${context ? ` [${context}]` : ''}`;

      // Use appropriate console method based on level
      if (levelNum >= 60) {
        console.error(`%c${prefix}`, levelInfo.style, message, metadata);
      } else if (levelNum >= 50) {
        console.error(`%c${prefix}`, levelInfo.style, message, metadata);
      } else if (levelNum >= 40) {
        console.warn(`%c${prefix}`, levelInfo.style, message, metadata);
      } else if (levelNum >= 30) {
        console.info(`%c${prefix}`, levelInfo.style, message, metadata);
      } else if (levelNum >= 20) {
        console.debug(`%c${prefix}`, levelInfo.style, message, metadata);
      } else {
        console.trace(`%c${prefix}`, levelInfo.style, message, metadata);
      }
    } catch (error) {
      // Fallback to console.log if parsing fails
      console.log(obj);
    }
  };

  return {
    write,
  };
};

/**
 * Create logger instance with appropriate configuration
 */
export const logger = pino({
  level: isDevelopment ? 'debug' : isProduction ? 'warn' : 'info',
  browser: {
    write: createBrowserDestination().write,
  },
  base: {
    env: import.meta.env.MODE,
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  formatters: {
    level: (label: string) => {
      return { level: label };
    },
  },
});

/**
 * Logger context types for better organization
 */
export enum LogContext {
  GAME_STATE = 'game-state',
  GAME_LOOP = 'game-loop',
  COLLISION = 'collision',
  BOSS = 'boss',
  PHASE = 'phase',
  POWER_UP = 'power-up',
  FOOD = 'food',
  STATISTICS = 'statistics',
  TRANSITION = 'transition',
  USER_INPUT = 'user-input',
  PERFORMANCE = 'performance',
  ERROR = 'error',
  ACHIEVEMENT = 'achievement',
  POISON = 'poison',
  PORTAL = 'portal',
  OBSTACLE = 'obstacle',
}

/**
 * Create a child logger with context
 */
export function createLogger(context: LogContext, additionalContext?: Record<string, unknown>) {
  return logger.child({
    context,
    ...additionalContext,
  });
}

/**
 * Log game state changes
 */
export function logGameStateChange(from: string, to: string, metadata?: Record<string, unknown>) {
  logger.info(
    {
      context: LogContext.GAME_STATE,
      from,
      to,
      ...metadata,
    },
    `Game state changed: ${from} → ${to}`,
  );
}

/**
 * Log game events
 */
export function logGameEvent(event: string, metadata?: Record<string, unknown>) {
  logger.info(
    {
      context: LogContext.GAME_LOOP,
      event,
      ...metadata,
    },
    `Game event: ${event}`,
  );
}

/**
 * Log errors with context
 */
export function logError(
  error: Error | unknown,
  context?: LogContext,
  metadata?: Record<string, unknown>,
) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  logger.error(
    {
      context: context || LogContext.ERROR,
      error: errorMessage,
      stack: errorStack,
      ...metadata,
    },
    `Error: ${errorMessage}`,
  );
}

/**
 * Log performance metrics
 */
export function logPerformance(
  operation: string,
  duration: number,
  metadata?: Record<string, unknown>,
) {
  logger.debug(
    {
      context: LogContext.PERFORMANCE,
      operation,
      duration,
      ...metadata,
    },
    `Performance: ${operation} took ${duration}ms`,
  );
}

/**
 * Export default logger instance
 */
export default logger;
