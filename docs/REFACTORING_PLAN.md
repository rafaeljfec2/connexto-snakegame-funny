# Refactoring Plan for `useGameLoop.ts`

> **Historical.** Do not implement from this file. The split is already done; see `src/hooks/useGameLoop.ts` and `src/workers/game/`. Runtime: [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Snapshot at the time of writing

- **Size**: 1268 lines
- **Complexity**: very high — `updateGame` ~880 lines
- **Issues**: mixed systems, oversized update function (duplicate flag-capture code already removed)

## Proposed structure

Extract helpers por responsibility:

| Helper | Responsibility |
|---|---|
| `handleDirection` | Direction changes, reverse controls, safety |
| `handleCollisions` | Obstacles, self-collision, portals, flag |
| `handleFood` | Food, power-ups, growth/shrink |
| `handleObstacles` | Spawn, timers, expiry |
| `handleBoss` | Spawn, movement, abilities, combat |
| `handlePoisonShots` | Shot movement and hits |
| `handlePhase` | Phase change and phase food rules |

## Implementation approach (historical)

1. Extract helpers inside the same file first
2. Later move modules under `utils/gameUpdates/` (direction, food, boss, …)

## Checklist status (historical)

1. Remove duplicates — done
2. Fix lint warnings — done
3. Extract direction / food / portal / obstacles / poison — done
4. Extract boss (~400 lines) — was still pending when this naoe was written

## Progress naoe (historical)

At the time: ~1461 lines after extractions, 5 of 7 helpers done, ~280 lines pulled out of `updateGame`. Simulation later moved into `game.worker`; use the current tree, not this plan, for new work.
