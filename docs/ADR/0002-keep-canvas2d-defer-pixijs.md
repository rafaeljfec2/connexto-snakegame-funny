# ADR-0002 — Keep Canvas 2D, defer PixiJS until metrics demand it

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-04-25 |
| **Deciders** | rafael |
| **Related specs** | REF-01, REF-03 |
| **Supersedes** | — |
| **Superseded by** | — |

## Context

Modern web game stacks (PixiJS v8, WebGL/WebGPU, GSAP) offer real performance ceilings: sprite batching, GPU filters, atlas textures. The temptation is to migrate the rendering layer immediately, motivated by social-media buzz around tools like "HTML-in-Canvas" and PixiJS + GSAP demos.

However, this codebase already has:

- A working multi-thread architecture (`game.worker`, `render.worker`, `weather.worker`, `particle.worker`).
- An `OffscreenCanvas` 2D renderer with a dirty-flag, interpolation, and object pools.
- A documented 60 FPS target met on mid-tier mobile.

Migrating prematurely risks: bundle bloat (~150–250 KB gzip), refactor cost (several worker files), regression in cross-browser behavior, and time spent solving a problem that may not exist.

We have **no quantified baseline**: we do not know the current `p5(frameTime)` per phase/device. Without that, "PixiJS is faster" is a slogan, not a decision.

## Decision

We **keep Canvas 2D** as the renderer for the foreseeable future. PixiJS migration is **deferred** and **conditional**:

1. First we ship **REF-01** (performance observability panel) to establish a real baseline per phase/device.
2. We then ship **REF-02** (audio with Howler.js) for the highest perceived-quality gain at lowest engineering cost.
3. We then evaluate **REF-03** (texture atlas inside the existing Canvas 2D worker). It executes only if REF-01 baseline shows `p5(frameTime) > 20 ms` in any real scenario.
4. Only if REF-03 lands and proves insufficient do we open a future ADR to adopt PixiJS.

In short: **measure first, optimize the cheapest lever next, only then consider engine swaps.**

## Consequences

### Positive

- Avoids spending 1–2 weeks on a migration that may not move the needle.
- Keeps the existing worker architecture, which is already differentiated.
- Makes any future migration data-driven (we will have baselines to point at).

### Negative / accepted trade-offs

- We will not enjoy "free" wins like sprite batching and GPU filters until/unless we migrate later.
- Some advanced visual effects (displacement, glow with low cost) remain off-table for now.
- If the team wants to reuse PixiJS knowledge across projects, that knowledge is delayed here.

### Neutral

- Canvas 2D continues to serve mobile well in 2026; it is not "obsolete tech".

## Alternatives considered

- **Migrate to PixiJS now**: rejected. No baseline; risks regressions; violates "no new framework without justification".
- **Move straight to WebGPU**: rejected. Browser support is improving but not universal; would still need WebGL2 fallback.
- **Adopt Three.js / Babylon.js**: rejected. 3D engines for a 2D game are over-engineering.

## References

- [`docs/SDD/specs/REF-01-perf-observability.md`](../SDD/specs/REF-01-perf-observability.md)
- [`docs/SDD/specs/REF-03-texture-atlas.md`](../SDD/specs/REF-03-texture-atlas.md)
- [`docs/PERFORMANCE_OPTIMIZATION_PLAN.md`](../PERFORMANCE_OPTIMIZATION_PLAN.md)
- README section "Performance" and "Recent Evolution" describing the existing worker architecture.

## Update — 2026-04-25 (first baseline confirms the bet)

The first real baseline (iPhone 15 Pro / iOS 18.5 Safari, captured via REF-01's `Shift+F4`, stored at `scripts/harness/.artifacts/perf-baseline.json`) shows render-worker `p5(frameTime) = 0.20 ms` — **two orders of magnitude below** the 20 ms gate that would have justified REF-03 (texture atlas) or any move toward PixiJS. The decision in this ADR is therefore **empirically validated**: the existing Canvas 2D + OffscreenCanvas + worker architecture is not the bottleneck. PixiJS migration remains correctly deferred.

The same baseline reveals the actual bottleneck lives on the **main thread** (`longTasksPerMinute = 256`), redirecting investment toward a new spec REF-04 (main-thread long-task elimination) instead of the renderer.
