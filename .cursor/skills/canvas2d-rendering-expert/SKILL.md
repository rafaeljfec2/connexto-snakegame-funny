---
name: canvas2d-rendering-expert
description: Canvas 2D OffscreenCanvas paint in render.worker — dirty flags, interpolation, UI_SKIN. Use when editing src/workers/render/**, render.worker.ts, or GameBoard.tsx, or when debugging board FPS/draw order.
---

# Canvas 2D Rendering Expert

Helpers live in `src/workers/render/` (nao `src/render/`). Runtime: [`docs/ARCHITECTURE.md`](../../../docs/ARCHITECTURE.md).

## Invariants

1. Board canvas is transferred once via `transferControlToOffscreen` from `GameBoard.tsx`.
2. Visual state arrives on a `MessageChannel` as `UPDATE` (snake/boss as transferable `Float32Array`).
3. Interpolation: `t = clamp((now - lastUpdate) / speed, 0, 1)` while `PLAYING`.
4. Skin palette arrives as `UI_SKIN` — the worker cannao read the DOM.
5. Resize: CSS width/height + `devicePixelRatio`; collision grid stays 40×40 in `game.worker`.
6. **REF-03 (texture atlas) is Archived.** Draw with Canvas 2D primitives. Do not add an atlas pipeline unless a new baseline reopens it (ADR-0002).

## Anti-patterns

- Drawing the board on the main thread.
- Recreating gradients / measuring text every frame in hot paths.
- Re-pushing full game state from React instead of the game↔render channel.

## Output

When changing draw code: naoe dirty-flag impact, DPR handling, and whether mobile shadows/effects stay reduced.
