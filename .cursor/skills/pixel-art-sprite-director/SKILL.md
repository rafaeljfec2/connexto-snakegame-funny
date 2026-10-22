---
name: pixel-art-sprite-director
description: Snake skin palettes and board visual identity for this repo. Use when editing skins.ts, skin utils/types, public/sprites, or when the user asks about skins, palette, or snake appearance.
---

# Pixel Art & Sprite Director

Board art is Canvas 2D primitives + serializable skin palettes. REF-03 atlas is **Archived**.

## Real paths

- Palettes: `src/constants/skins.ts`
- Types / storage: `src/types/skin.ts`, `src/utils/skin.ts`
- Delivery to worker: `UI_SKIN` from `GameBoard` / `SkinContexto`
- Optional assets: `public/sprites/`

## Invariants

1. Skin ids: `neon-green`, `retro-arcade`, `frozen-ice`, `magenta-blaze`.
2. Palette must be structured-cloneable (plain color strings) for the render worker.
3. Head highlight stays brighter than body for silhouette readability (see skins tests).
4. Theme (chrome CSS) and skin (canvas) estão orthogonal (ADR-0006).

## Anti-patterns

- Building a texture atlas “because REF-03”.
- Reading CSS variables inside `render.worker`.
- Non-serializable functions on the skin object sent over `postMessage`.

## Output

Skin id, palette contrast check, and confirmation the worker received `UI_SKIN`.
