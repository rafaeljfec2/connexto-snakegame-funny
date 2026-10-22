---
name: webgl-shader-artist
description: WebGL/WebGPU migration gate for this Canvas 2D game. Use only when the user explicitly asks for WebGL, shaders, GLSL, WebGPU, or GPU migration.
---

# WebGL Shader Artist

This project paints with **Canvas 2D** on `OffscreenCanvas` in `render.worker` ([ADR-0002](../../../docs/ADR/0002-keep-canvas2d-defer-pixijs.md)).

## Gate

1. Do **not** write shaders, adopt PixiJS, or change the render context without a **new ADR** and an approved SDD spec.
2. A migration is justified only after REF-01-style evidence shows the Canvas 2D worker cannot meet the frame budget.
3. If approved later, keep paint off the main thread (`OffscreenCanvas` + worker).

## Anti-patterns

- “Just try WebGL for bloom” without baseline numbers.
- Suggesting Pixi/Three as a casual dependency.

## Output when asked to migrate

Point to ADR-0002, list the missing metrics, and draft the ADR + spec outline — do not implement.
