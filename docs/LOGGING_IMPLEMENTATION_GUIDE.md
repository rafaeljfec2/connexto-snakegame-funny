# Guia de Implementação de Logs

Este documento descreve como adicionar logs em todos os eventos importantes do jogo.

## Estrutura de Logs

Todos os logs seguem o padrão:

```typescript
import { logGameEvent, createLogger, LogContext } from '@/utils/logger';

const logger = createLogger(LogContext.CONTEXT_NAME);

// Para eventos simples
logGameEvent('event-name', { metadata });

// Para logs customizados
logger.info({ metadata }, 'Mensagem');
```

## Pontos de Log no useGameLoop

### 1. Colisões

**Localização**: Após detecção de colisão (linha ~665)

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
  // ... resto do código
}
```

### 2. Comida Consumida

**Localização**: Após processar comida (linha ~688-723)

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

**Localização**: Após calcular novo level (linha ~750)

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

### 4. Mudança de Fase

**Localização**: Após detectar mudança de fase (linha ~755-766)

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

**Localização**: Quando boss é inicializado (linha ~848)

```typescript
if (activeBoss && (!prev.activeBoss || prev.activeBoss.id !== activeBoss.id)) {
  logGameEvent('boss-spawn', {
    bossId: activeBoss.id,
    bossName: activeBoss.name,
    level: newLevel,
    phase: currentPhase?.id,
  });
  // ... resto do código
}
```

### 6. Boss Defeat

**Localização**: Quando boss é derrotado (linha ~1016, 1129, etc)

```typescript
if (activeBoss && canDefeatBoss(bossSnake)) {
  logGameEvent('boss-defeated', {
    bossId: activeBoss.id,
    bossName: activeBoss.name,
    score: newScore,
    level: newLevel,
    method: 'head-collision', // ou 'poison', 'flag-capture'
  });
  // ... resto do código
}
```

### 7. Portal Teleport

**Localização**: Após teleportação (linha ~643-646)

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

**Localização**: Quando poison hit boss (linha ~1123, 1162)

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

**Localização**: Quando game over (linha ~675, 1050)

```typescript
logGameEvent('game-over', {
  finalScore: prev.score,
  finalLevel: prev.level,
  highScore: Math.max(prev.score, prev.highScore),
  lives: prev.lives,
});
```

## Componentes de Transição

### PhaseTransition

```typescript
import { createLogger, LogContext } from '@/utils/logger';

const logger = createLogger(LogContext.TRANSITION);

useEffect(() => {
  logger.info({ phaseNumber, level }, 'Phase transition started');

  // ... código existente

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

  // ... código existente

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

    // ... código existente

    if (remaining <= 0) {
      logger.info({ lives: lives - 1 }, 'Death transition completed');
    }
  }
}, [status, lives]);
```

## Sistemas de Colisão e Combate

### Boss Combat (useGameLoop)

Já coberto nos pontos 5 e 6 acima.

### Poison System

Os logs de poison já estão cobertos no ponto 8 acima.

### Obstacle Destruction

**Localização**: `src/utils/obstacleDestruction.ts`

```typescript
import { createLogger, LogContext } from '@/utils/logger';

const logger = createLogger(LogContext.OBSTACLE);

export function destroyObstacles(...) {
  logger.debug({
    obstaclesCount: obstacles.length,
    hitObstaclesCount: hitObstacles.length
  }, 'Destroying obstacles');

  // ... código existente

  logger.info({
    destroyed: hitObstacles.length,
    remaining: remainingObstacles.length
  }, 'Obstacles destroyed');
}
```

## Notas Importantes

1. **Não-intrusivo**: Os logs não devem alterar a lógica do jogo
2. **Performance**: Use `logger.debug()` para logs frequentes, `logger.info()` para eventos importantes
3. **Contexto**: Sempre use o contexto apropriado (`LogContext`)
4. **Metadata**: Inclua informações relevantes mas não sensíveis
