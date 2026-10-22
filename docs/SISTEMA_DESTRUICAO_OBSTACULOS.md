# Generic Obstacle Destruction

## Overview

Obstacle destruction physics are **shared** across the game. Every feature that destroys obstacles should use the same helpers so visuals and behavior stay consistent.

## Module

`src/utils/obstacleDestruction.ts`

1. `destroyObstacles()` — main entry
2. `destroyObstaclesAtPositions()` — destroy by grid cell
3. `canDestroyObstacle()` — destroyability check

## Shared config

```typescript
OBSTACLE_DESTRUCTION_CONFIG = {
  particles: {
    count: 8,
    color: '#ef4444',
    lifetime: 400, // ms
  },
};
```

This config applies to **all** destruction paths.

## Process

1. Identify obstacles to remove
2. Remove them from the list
3. Spawn destruction particles at each position
4. Return remaining obstacles + particles

Visuals: red (`#ef4444`), 8 particles, 400 ms lifetime, at the obstacle cell.

## Current use

Poison shots hit obstacles and call `destroyObstacles()` from the game worker / helpers (historically referenced from `useGameLoop`; verify the current call site under `src/workers/game/`).

Future mechanisms (explosions, special abilities) should reuse the same helpers.

## API sketch

```typescript
destroyObstacles(
  obstacles: Obstacle[],
  obstaclesToDestroy: Obstacle[] | string[],
  existingParticles: Particle[] = [],
): ObstacleDestructionResult

destroyObstaclesAtPositions(
  obstacles: Obstacle[],
  positions: Position[],
  existingParticles?: Particle[],
): ObstacleDestructionResult
```

Result shape:

```typescript
{
  remainingObstacles: Obstacle[];
  destroyedObstacles: Obstacle[];
  particles: Particle[];
}
```

## Validation

`canDestroyObstacle(obstacle)` currently returns `true` for all obstacles. It can later gate invincible or multi-hit obstacles.

## Performance

- Particles capped by `PERFORMANCE_CONFIG`
- Obstacles capped by `OBSTACLE_CONFIG`
- Designed for batch destruction in one tick
