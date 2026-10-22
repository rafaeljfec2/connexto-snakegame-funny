# Logging Implementation Status

> **Historical.** Snapshot from the logging rollout. Prefer [`LOGGING_SYSTEM.md`](./LOGGING_SYSTEM.md). Trust map: [`README.md`](./README.md).

## ✅ Implemented

### 1. Base System

- ✅ Logging utility (`src/utils/logger.ts`)
- ✅ Pino installed
- ✅ Browser configuration
- ✅ Contexts organized by area

### 2. useGameState

- ✅ State change logs
- ✅ Game reset logs
- ✅ Pause/resume logs
- ✅ Initialization logs

### 3. Transition Components

- ✅ `PhaseTransition` — start and end logs
- ✅ `BossDefeatTransition` — start and end logs
- ✅ `PhaseCompleteScreen` — display log
- ✅ `DeathTransition` — start and end logs

## 🚧 Pending (Guides Created)

### useGameLoop — Main Events

Add logs at these points (full guide in `LOGGING_IMPLEMENTATION_GUIDE.md`):

1. **Collisions** (~line 665)
   - Log on collision (obstacle/self)
   - Log when entering DYING
   - Log on game over

2. **Food consumed** (~lines 688–723)
   - Log when food is eaten
   - Log when a power-up activates
   - Log food type

3. **Level up** (~line 750)
   - Log when level increases
   - Log associated phase change

4. **Phase change** (~lines 755–766)
   - Log when phase changes
   - Log phase configuration

5. **Boss spawn** (~line 848)
   - Log when boss appears
   - Log generated resources

6. **Boss defeat** (~lines 1016, 1129)
   - Log when boss is defeated
   - Log defeat method
   - Log reward

7. **Portal teleport** (~lines 643–646)
   - Log on teleport

8. **Poison shot** (~lines 1123, 1162)
   - Log when poison hits boss
   - Log hit part

9. **Game over** (~lines 675, 1050)
   - Log final statistics

### Collision and Combat Systems

- [ ] `src/utils/obstacleDestruction.ts` — obstacle destruction logs
- [ ] `src/utils/poison.ts` — poison creation and impact logs
- [ ] `src/utils/bossSnake.ts` — boss weakening logs

## 📝 Notes

Implementation guides:

- `LOGGING_IMPLEMENTATION_GUIDE.md` — Detailed implementation guide
- `LOGGING_SYSTEM.md` — System documentation

Logs are **non-intrusive** and do not change game logic. They record events for observability and debugging.

## 🔧 How to Add Remaining Logs

1. Open the target file
2. Import: `import { logGameEvent, createLogger, LogContext } from '@/utils/logger';`
3. Create a contextual logger: `const logger = createLogger(LogContext.CONTEXT_NAME);`
4. Log after the event: `logGameEvent('event-name', { metadata });`
5. Use `logger.debug()` for frequent logs, `logger.info()` for important events

## 📊 Example

```typescript
// Before
if (ateFood) {
  // process food
}

// After (with log)
if (ateFood) {
  logGameEvent('food-eaten', {
    foodType: prev.food.type,
    score: newScore,
    level: prev.level,
  });
  // process food
}
```
