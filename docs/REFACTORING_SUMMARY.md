# Refactoring Summary for `useGameLoop.ts`

> **Historical.** Do not implement from this file. Current runtime: [`ARCHITECTURE.md`](./ARCHITECTURE.md). Trust map: [`README.md`](./README.md).

## Extracted helpers (at the time)

1. **`handleDirection`** — direction changes, reverse controls, move safety
2. **`handlePortalTeleport`** — portal teleport + particles
3. **`handleFoodAndPowerUps`** — food, power-ups, growth/shrink, stats (~130 lines)
4. **`handleObstacles`** — phase-based spawn and timers
5. **`handlePoisonShotsObstacles`** — poison movement, obstacle destruction, particles

## Metrics (historical)

- Start size: 1268 lines
- After extractions: ~1461 lines
- Helpers created: 5
- Lines pulled from `updateGame`: ~280

## Then-open follow-ups

- Boss logic (~400 lines)
- Poison vs boss integration
- Further organization

## Note

Simulation and board paint now live in Web Workers. Prefer `src/workers/game/` and [`ARCHITECTURE.md`](./ARCHITECTURE.md) over this summary when changing gameplay.
