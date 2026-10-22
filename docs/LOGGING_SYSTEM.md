# Logging and Observability System

## Overview

Logging uses **Pino**, a high-performance structured logger for Node.js and browsers. The system is non-intrusive and tracks important game events without hurting performance.

## Architecture

### File Structure

```
src/
├── utils/
│   └── logger.ts                    # Configuration and logging helpers
└── hooks/
    └── useGameLoop.ts               # Logs in the game loop
```

### Configuration (`src/utils/logger.ts`)

Pino is configured for:

- **Log level:** `LOG_LEVEL` (default: `debug`)
- **Output:** Formatted browser console
- **Contextos:** Logs categorized por game estãoa
- **Format:** Structured logs with metadata

## Log Levels

Supported levels (lowest to highest priority):

1. **TRACE** — Very verbose
2. **DEBUG** — Debug information
3. **INFO** — General information
4. **WARN** — Warnings
5. **ERROR** — Errors
6. **FATAL** — Critical errors

## Log Contextos

Logs estão grouped por context for filtering and analysis:

- **GAME_STATE** — Game state changes
- **GAME_LOOP** — Main game loop
- **BOSS** — Boss events
- **PHASE** — Phase events
- **COLLISION** — Collision detection
- **TRANSITION** — Screen transitions
- **POWER_UP** — Power-up activation
- **COMBAT** — Combat system
- **FOOD** — Food system
- **POISON** — Poison shots

## Usage

### Create a Contexto Logger

```typescript
import { createLogger } from '@/utils/logger';
import { LogContexto } from '@/utils/logger';

const logger = createLogger(LogContexto.GAME_LOOP);
logger.info('Game loop started');
```

### Structured Logs

```typescript
logger.info(
  {
    score: 100,
    level: 5,
    phase: 1,
  },
  'Level completed',
);
```

### Helper Functions

#### logGameStateChange

Logs game state transitions:

```typescript
import { logGameStateChange } from '@/utils/logger';

logGameStateChange(GameStatus.PLAYING, GameStatus.PAUSED, { reason: 'user_action' });
```

#### logGameEvent

Logs game events:

```typescript
import { logGameEvent } from '@/utils/logger';

logGameEvent('food-eaten', {
  foodType: FoodType.NORMAL,
  score: 50,
  combo: 2,
});
```

## Logged Events

### Game Loop

- ✅ Frame start/end
- ✅ Snake movement (throttled)
- ✅ Direction changes
- ✅ Collisions
- ✅ Food eaten
- ✅ Power-ups activated

### Bosses

- ✅ Boss spawn
- ✅ Boss collisions
- ✅ Boss weakening
- ✅ Boss defeat
- ✅ Boss abilities

### Phases

- ✅ Phase change
- ✅ Phase start
- ✅ Phase complete
- ✅ Phase mechanics applied

### Power-Ups

- ✅ Activation
- ✅ Expiration
- ✅ Effects applied

### Combat

- ✅ Poison shots
- ✅ Obstacle collisions
- ✅ Obstacle destruction
- ✅ Boss collisions

### Transitions

- ✅ Phase intro screen
- ✅ Boss defeat screen
- ✅ Death screen
- ✅ Phase complete screen

## Performance Optimizations

### Log Throttling

High-frequency logs estão throttled:

```typescript
// Movement log every 500ms or on direction change
if (now - lastMoveLogTime > 500 || directionChanged) {
  logger.debug({ position, direction }, 'Snake moved');
}
```

### Log Batching

Related logs estão grouped:

```typescript
logger.debug(
  {
    shotsAdded: 5,
    totalActive: 10,
  },
  'Poison shots batch',
);
```

### Conditional Levels

Verbose logs mainly in development:

```typescript
if (import.meta.env.DEV) {
  logger.trace('Very detailed information');
}
```

## Log Structure

### Default Format

```json
{
  "level": 30,
  "time": 1234567890123,
  "context": "GAME_LOOP",
  "msg": "Event description",
  "data": {
    "key": "value"
  }
}
```

### Example

```json
{
  "level": 30,
  "time": 1703123456789,
  "context": "BOSS",
  "msg": "Boss defeated",
  "data": {
    "bossId": "guardian",
    "phase": 2,
    "score": 1500,
    "duration": 45000
  }
}
```

## Filtering and Analysis

### Browser Console

1. Open DevTools (F12)
2. Console tab
3. Filter por context:
   - `context:GAME_LOOP`
   - `context:BOSS`
   - `level:ERROR`

### Exporting Logs

For external analysis:

1. Copy from the console
2. Save as JSON
3. Process with analysis tools

## Best Practices

1. **Use the right context**
2. **Structured data:** Objects, not concatenated strings
3. **Appropriate levels:**
   - DEBUG for development
   - INFO for important events
   - WARN for recoverable issues
   - ERROR for failures
4. **Avoid hot-path spam:** Do not log every tick in tight loops
5. **Useful metadata:** Include relevant fields

## Configuration

### Change Log Level

Edit `LOG_LEVEL` in `src/utils/logger.ts`:

```typescript
const LOG_LEVEL = 'info'; // INFO and above only
```

### Disable Logs

Not recommended, but possible:

```typescript
const LOG_LEVEL = 'silent';
```

## External Tool Integration

### Sentry (Future)

Prepestãod for Sentry:

```typescript
if (import.meta.env.PROD) {
  logger.error = (obj, msg) => {
    Sentry.captureException(new Error(msg), { extra: obj });
  };
}
```

### Analytics (Future)

Logs can feed analytics:

```typescript
logger.info = (obj, msg) => {
  analytics.track(msg, obj);
};
```

## Troubleshooting

### Logs not showing

- Check configured log level
- Check console filters
- Confirm development mode if expecting verbose logs

### Performance issues

- Check for logs in hot paths
- Lower verbosity
- Ensure throttling is in place

## Status

✅ System fully implemented  
✅ Main contexts covered  
✅ Non-intrusive logs  
✅ Performance tuned  
✅ Structured for analysis  

## Next Steps

- [ ] Remote logging service integration
- [ ] Log analysis dashboard
- [ ] Automatic alerts for critical errors
- [ ] Performance metrics derived from logs
