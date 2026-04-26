/*
 * REF-08 Phase A — snake skin catalog.
 *
 * Four orthogonal palettes for the player snake canvas. Each palette defines
 * three gradient stops for the body, three for the head, and a three-stop
 * "boss contrast" triad that `createSnakeGradient` uses for the boss outline
 * regardless of the boss's narrative color. Stops are stored as plain CSS
 * color strings because the render worker (OffscreenCanvas) consumes them
 * directly in `ctx.createRadialGradient(...).addColorStop(offset, color)`.
 *
 * Hex fallbacks are the canonical values. OKLCH equivalents are documented
 * as inline comments for traceability against REF-06 / REF-07 tokens but
 * are intentionally NOT emitted — the canvas pipeline does not benefit from
 * OKLCH here and we avoid the extra bytes / parsing cost per frame.
 *
 * Contract (enforced by `src/constants/__tests__/skins.test.ts`):
 *   - 4 palettes, exactly matching `SKIN_IDS`
 *   - every palette's head.highlight has strictly greater luminance than
 *     body.highlight (silhouette readability invariant)
 *   - every palette's body.highlight clears >= 3:1 contrast against the
 *     dark-theme canvas background (`#0a0d1a`) and against a sensible
 *     light-adjacent value — the canvas itself stays dark by arcade canon,
 *     so the second check is a defensive guardrail for future variations.
 */

import type { SkinId, SkinPalette } from '@/types/skin';

export const DEFAULT_SKIN_ID: SkinId = 'neon-green';

export const SKIN_CATALOG: Readonly<Record<SkinId, SkinPalette>> = {
  'neon-green': {
    id: 'neon-green',
    labelKey: 'skin.neonGreen',
    body: {
      highlight: '#4ade80',
      mid: '#16a34a',
      shadow: '#14532d',
    },
    head: {
      highlight: '#86efac',
      mid: '#22c55e',
      shadow: '#15803d',
    },
    bossContrast: {
      highlight: '#ff6ec7',
      mid: '#e0348f',
      shadow: '#9b1666',
    },
  },
  'retro-arcade': {
    id: 'retro-arcade',
    labelKey: 'skin.retroArcade',
    body: {
      highlight: '#fbbf24',
      mid: '#d97706',
      shadow: '#78350f',
    },
    head: {
      highlight: '#fde68a',
      mid: '#f59e0b',
      shadow: '#92400e',
    },
    bossContrast: {
      highlight: '#60a5fa',
      mid: '#2563eb',
      shadow: '#1e3a8a',
    },
  },
  'frozen-ice': {
    id: 'frozen-ice',
    labelKey: 'skin.frozenIce',
    body: {
      highlight: '#67e8f9',
      mid: '#0891b2',
      shadow: '#083344',
    },
    head: {
      highlight: '#a5f3fc',
      mid: '#22d3ee',
      shadow: '#0e7490',
    },
    bossContrast: {
      highlight: '#fb923c',
      mid: '#ea580c',
      shadow: '#7c2d12',
    },
  },
  'magenta-blaze': {
    id: 'magenta-blaze',
    labelKey: 'skin.magentaBlaze',
    body: {
      highlight: '#f472b6',
      mid: '#db2777',
      shadow: '#831843',
    },
    head: {
      highlight: '#f9a8d4',
      mid: '#ec4899',
      shadow: '#9d174d',
    },
    bossContrast: {
      highlight: '#4ade80',
      mid: '#16a34a',
      shadow: '#14532d',
    },
  },
};

export function getSkinPalette(id: SkinId): SkinPalette {
  return SKIN_CATALOG[id];
}

export function getDefaultSkinPalette(): SkinPalette {
  return SKIN_CATALOG[DEFAULT_SKIN_ID];
}
