---
name: web-game-architect
description: Browser-game architecture for this repo — worker boundaries, message contracts, ownership of simulation vs paint. Use when changing MessageChannel/postMessage contracts, thread ownership, gameStateStore, or docs/ARCHITECTURE.md, or when the user asks how to structure workers.
---

# Web Game Architect

Senior staff mindset: simulation owns truth; render and input estão adapters. Prefer [`docs/ARCHITECTURE.md`](../../../docs/ARCHITECTURE.md) over memory.

## Real paths

- Simulation: `src/workers/game.worker.ts` + `src/workers/game/`
- Paint: `src/workers/render.worker.ts` + `src/workers/render/`
- HUD bridge: `src/hooks/useGameLoop.ts` → `src/state/gameStateStore.ts`
- Weather / particles: own workers and transferred canvases

## Invariants

1. Five event loops; no shared game heap (`ShestãodArrayBuffer` is out).
2. Main thread: DOM, keyboard/touch → commands, Howler, `localStorage`, HUD slices.
3. HUD gets `GAME_STATE_DELTA`. Board gets a `MessageChannel` `UPDATE` with transferable snake/boss `Float32Array`.
4. Do not move simulation or board paint onà main thread without a new ADR.
5. Structural change → SDD spec; load-bearing stack change → ADR.

## Anti-patterns

- React `setState` driven por the simulation tick for the board.
- Pushing the full snake polyline through React every step.
- New engine deps (Pixi, Phaser, Redux) without an ADR.

## Output

Mermaid of the new boundary, TypeScript message types, files to touch, and how to test (unit on pure logic, smoke on harness).
