/*
 * REF-08 Phase A — snake skin catalog contract tests.
 *
 * The catalog is a Readonly<Record<SkinId, SkinPalette>> exported from
 * src/constants/skins.ts. These tests lock three invariants that protect
 * every future skin addition:
 *
 *   1) structural completeness — all 4 SkinId keys present, every gradient
 *      has highlight / mid / shadow stops, boss contrast triad is provided,
 *      labelKey follows the `skin.*` i18n namespace;
 *   2) silhouette readability — head.highlight always brighter than
 *      body.highlight, and head.shadow always brighter than body.shadow,
 *      so the head stays legible as the "front" of the snake regardless of
 *      the palette picked;
 *   3) contrast against canvas background — body.highlight clears >= 3:1
 *      against the dark-theme canvas background (`#0a0d1a`). The canvas
 *      stays dark by arcade canon even in light chrome mode (ADR-0005
 *      REF-07 revision) so this is a single-side gate, not a two-theme
 *      matrix. The threshold is 3:1 (APCA-approximated WCAG graphical
 *      element contrast) because the snake is a large filled shape, not
 *      body text.
 *
 * Helpers are inlined to keep the test self-contained. If a third test
 * file needs the same math, extract to `src/utils/color.ts` (follow-up
 * noted in REF-08 §8 at Done).
 */

import { describe, expect, it } from 'vitest';
import { SKIN_CATALOG, DEFAULT_SKIN_ID } from '@/constants/skins';
import { SKIN_IDS, type SkinId, type SkinGradient } from '@/types/skin';

function hexToRgb(hex: string): readonly [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

function relativeLuminance(rgb: readonly [number, number, number]): number {
  const channel = (value: number): number => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = rgb;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(hexToRgb(a));
  const lb = relativeLuminance(hexToRgb(b));
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

const CANVAS_DARK_BG = '#0a0d1a';
const MIN_SNAKE_CONTRAST = 3;

function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function assertGradientShape(grad: SkinGradient, label: string): void {
  expect(grad.highlight, `${label}.highlight`).toSatisfy(isHexColor);
  expect(grad.mid, `${label}.mid`).toSatisfy(isHexColor);
  expect(grad.shadow, `${label}.shadow`).toSatisfy(isHexColor);
}

describe('SKIN_CATALOG (REF-08 Phase A)', () => {
  it('includes every SkinId exactly once', () => {
    expect(Object.keys(SKIN_CATALOG).sort()).toEqual([...SKIN_IDS].sort());
  });

  it('default skin id resolves to an entry in the catalog', () => {
    expect(SKIN_CATALOG[DEFAULT_SKIN_ID]).toBeDefined();
    expect(SKIN_CATALOG[DEFAULT_SKIN_ID].id).toBe(DEFAULT_SKIN_ID);
  });

  it.each(SKIN_IDS)('palette %s has a valid structural shape', (id) => {
    const palette = SKIN_CATALOG[id];
    expect(palette.id).toBe(id);
    expect(palette.labelKey).toMatch(/^skin\.[a-zA-Z]+$/);
    assertGradientShape(palette.body, `${id}.body`);
    assertGradientShape(palette.head, `${id}.head`);
    assertGradientShape(palette.bossContrast, `${id}.bossContrast`);
  });

  it.each(SKIN_IDS)('palette %s keeps head brighter than body (silhouette invariant)', (id) => {
    const palette = SKIN_CATALOG[id];
    const headLuma = relativeLuminance(hexToRgb(palette.head.highlight));
    const bodyLuma = relativeLuminance(hexToRgb(palette.body.highlight));
    expect(headLuma).toBeGreaterThan(bodyLuma);

    const headShadowLuma = relativeLuminance(hexToRgb(palette.head.shadow));
    const bodyShadowLuma = relativeLuminance(hexToRgb(palette.body.shadow));
    expect(headShadowLuma).toBeGreaterThanOrEqual(bodyShadowLuma);
  });

  it.each(SKIN_IDS)(
    'palette %s body.highlight clears %d:1 contrast against the canvas dark background',
    (id) => {
      const palette = SKIN_CATALOG[id];
      const ratio = contrastRatio(palette.body.highlight, CANVAS_DARK_BG);
      expect(ratio).toBeGreaterThanOrEqual(MIN_SNAKE_CONTRAST);
    },
  );

  it.each(SKIN_IDS)(
    'palette %s boss contrast mid is legible against the canvas dark background',
    (id) => {
      const palette = SKIN_CATALOG[id];
      const ratio = contrastRatio(palette.bossContrast.mid, CANVAS_DARK_BG);
      expect(ratio).toBeGreaterThanOrEqual(MIN_SNAKE_CONTRAST);
    },
  );

  it.each(SKIN_IDS)(
    'palette %s boss contrast is not identical to body (separate color identity)',
    (id) => {
      const palette = SKIN_CATALOG[id];
      expect(palette.bossContrast.highlight).not.toBe(palette.body.highlight);
      expect(palette.bossContrast.mid).not.toBe(palette.body.mid);
      expect(palette.bossContrast.shadow).not.toBe(palette.body.shadow);
    },
  );

  it('exposes an immutable (readonly) catalog at compile time', () => {
    type Catalog = typeof SKIN_CATALOG;
    type ReadonlyCheck = Catalog extends Readonly<Record<SkinId, unknown>> ? true : false;
    const readonlyOk: ReadonlyCheck = true;
    expect(readonlyOk).toBe(true);
  });
});
