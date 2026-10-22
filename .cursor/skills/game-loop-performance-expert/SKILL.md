---
name: game-loop-performance-expert
description: Performance for this game's two clocks — game.worker RAF + effectiveSpeed, render.worker interpolation. Use when investigating FPS, jank, long tasks, GC, or editing game.worker.ts, render.worker.ts, or src/utils/perf*.ts.
---

# Game Loop Performance Expert

Measure first. Target 60 FPS on mid-tier mobile. Prefer [`docs/ARCHITECTURE.md`](../../../docs/ARCHITECTURE.md).

## Current loop (do not rewrite without spec + ADR)

```ts
// game.worker — wake every display frame; step on interval
if (status === PLAYING && now - lastUpdateTime >= effectiveSpeed) {
  updateGame(...); // effectiveSpeed: 120ms → 40ms; boost ÷ 4
  broadcastState();
}
requestAnimationFrame(loop);

// render.worker — interpolate between ticks
const t = clamp((now - lastUpdate) / speed, 0, 1);
```

Glenn Fiedler’s fixed-timestep accumulator is a **reference only**, not this codebase.

## Invariants

- Main thread does not run the game loop.
- Skip paint when not dirty, `t >= 1`, and not invulnerability-blinking.
- Prefer deltas and transferables over cloning large arrays every tick.
- Use `performance.now()`; avoid allocations in hot paths (`for` over `map`/`filter`).

## Anti-patterns

- `setInterval` / `setTimeout` for the game or paint loop.
- `setState` every frame for decorative motion (use CSS; see ADR-0004).
- “Optimize” by adopting Pixi/WebGL without a REF-01 baseline that demands it (ADR-0002).

## Validation

REF-01 panel / `scripts/harness/perf-baseline.mjs`. Compare the same device and phase before claiming a win.
