# Logging Implementation Guide

> **Historical.** Do not implement from this file. Prefer [`LOGGING_SYSTEM.md`](./LOGGING_SYSTEM.md) and `src/utils/logger.ts`. Trust map: [`README.md`](./README.md).

This document describes how to add logs for important game events.

## Log Structure

All logs follow this pattern:

```typescript
import { logGameEvent, createLogger, LogContext } from '@/utils/logger';

const logger = createLogger(LogContext.CONTEXT_NAME);

// Simple events
logGameEvent('event-name', { metadata });

// Custom logs
logger.info({ metadata }, 'Message');
```

## Log Points in useGameLoop

### 1. Collisions

**Location:** After collision detection (~line 665)

```typescript
if (hasCollision) {
  const hasObstacleColl =
    GAME_CONFIG.enableObstacles &&
    !canPhaseThrough &&
    hasObstacleCollision(headPosition ?? newSnake[0], activeObstacles);
  const hasSelfColl = newSnake.length >= 4 && hasSelfCollision(newSnake);

  logGameEvent('collision', {
    obstacleCollision: hasObstacleColl,
    selfCollision: hasSelfColl,
    level: prev.level,
    score: prev.score,
    lives: prev.lives,
  });
  // ... rest of handler
}
```

### 2. Food Consumed

**Location:** After processing food (~lines 688–723)

```typescript
if (ateFood) {
  logGameEvent('food-eaten', {
    foodType: prev.food.type,
    score: newScore,
    level: prev.level,
    combo: newCombo.multiplier,
    snakeLength: finalSnake.length,
  });

  if (atePowerUp) {
    logGameEvent('power-up-activated', {
      foodType: prev.food.type,
      activePowerUps: newActivePowerUps.length,
    });
  }
}
```

### 3. Level Up

**Location:** After computing new level (~line 750)

```typescript
const newLevel = calculateLevel(newScore);
if (newLevel > prev.level) {
  logGameEvent('level-up', {
    fromLevel: prev.level,
    toLevel: newLevel,
    score: newScore,
    phase: currentPhase?.id,
  });
}
```

### 4. Phase Change

**Location:** After detecting phase change (~lines 755–766)

```typescript
if (currentPhase?.id !== prev.currentPhase) {
  logGameEvent('phase-change', {
    fromPhase: prev.currentPhase,
    toPhase: currentPhase?.id,
    phaseName: currentPhase?.name,
    level: newLevel,
  });
}
```

### 5. Boss Spawn

**Location:** When boss is initialized (~line 848)

```typescript
if (activeBoss && (!prev.activeBoss || prev.activeBoss.id !== activeBoss.id)) {
  logGameEvent('boss-spawn', {
    bossId: activeBoss.id,
    bossName: activeBoss.name,
    level: newLevel,
    phase: currentPhase?.id,
  });
  // ... rest of handler
}
```

### 6. Boss Defeat

**Location:** When boss is defeated (~lines 1016, 1129, etc.)

```typescript
if (activeBoss && canDefeatBoss(bossSnake)) {
  logGameEvent('boss-defeated', {
    bossId: activeBoss.id,
    bossName: activeBoss.name,
    score: newScore,
    level: newLevel,
    method: 'head-collision', // or 'poison', 'flag-capture'
  });
  // ... rest of handler
}
```

### 7. Portal Teleport

**Location:** After teleport (~lines 643–646)

```typescript
const portalResult = handlePortalTeleport(newSnake, prev.portals, newParticles);
if (portalResult.snake !== newSnake) {
  logGameEvent('portal-teleport', {
    fromPosition: newSnake[0],
    toPosition: portalResult.snake[0],
  });
}
```

### 8. Poison Shot

**Location:** Poison hits boss (~lines 1123, 1162)

```typescript
if (hasBossHeadCollision(shot, bossSnake) || hasBossBodyCollision(shot, bossSnake)) {
  logGameEvent('poison-hit-boss', {
    bossId: activeBoss?.id,
    hitPart: hasBossHeadCollision(shot, bossSnake) ? 'head' : 'body',
    bossSegments: bossSnake.positions.length,
  });
}
```

### 9. Game Over

**Location:** Game over (~lines 675, 1050)

```typescript
logGameEvent('game-over', {
  finalScore: prev.score,
  finalLevel: prev.level,
  highScore: Math.max(prev.score, prev.highScore),
  lives: prev.lives,
});
```

## Transition Components

### PhaseTransition

```typescript
import { createLogger, LogContext } from '@/utils/logger';

const logger = createLogger(LogContext.TRANSITION);

useEffect(() => {
  logger.info({ phaseNumber, level }, 'Phase transition started');

  // ... existing code

  if (newProgress >= 100) {
    logger.info({ phaseNumber }, 'Phase transition completed');
    onComplete();
  }
}, [phaseNumber]);
```

### BossDefeatTransition

```typescript
import { createLogger, LogContext } from '@/utils/logger';

const logger = createLogger(LogContext.TRANSITION);

useEffect(() => {
  logger.info({ bossId: boss.id, bossName: boss.name, score }, 'Boss defeat transition started');

  // ... existing code

  if (currentProgress >= 100) {
    logger.info({ bossId: boss.id }, 'Boss defeat transition completed');
    onCompleteRef.current();
  }
}, [boss.id]);
```

### PhaseCompleteScreen

```typescript
import { createLogger, LogContext } from '@/utils/logger';

const logger = createLogger(LogContext.TRANSITION);

useEffect(() => {
  logger.info({ phaseNumber, phaseName, statistics }, 'Phase complete screen displayed');
}, [phaseNumber, phaseName, statistics]);
```

### DeathTransition

```typescript
import { createLogger, LogContext } from '@/utils/logger';

const logger = createLogger(LogContext.TRANSITION);

useEffect(() => {
  if (status === GameStatus.DYING && lives > 0) {
    logger.info({ lives, status }, 'Death transition started');

    // ... existing code

    if (remaining <= 0) {
      logger.info({ lives: lives - 1 }, 'Death transition completed');
    }
  }
}, [status, lives]);
```

## Collision and Combat Systems

### Boss Combat (useGameLoop)

Covered in sections 5 and 6 above.

### Poison System

Covered in section 8 above.

### Obstacle Destruction

**Location:** `src/utils/obstacleDestruction.ts`

```typescript
import { createLogger, LogContext } from '@/utils/logger';

const logger = createLogger(LogContext.OBSTACLE);

export function destroyObstacles(...) {
  logger.debug({
    obstaclesCount: obstacles.length,
    hitObstaclesCount: hitObstacles.length
  }, 'Destroying obstacles');

  // ... existing code

  logger.info({
    destroyed: hitObstacles.length,
    remaining: remainingObstacles.length
  }, 'Obstacles destroyed');
}
```

## Important Notes

1. **Non-intrusive:** Logs must not change game logic
2. **Performance:** Use `logger.debug()` for frequent events, `logger.info()` for important ones
3. **Context:** Always use the right `LogContext`
4. **Metadata:** Include relevant, non-sensitive fields only
