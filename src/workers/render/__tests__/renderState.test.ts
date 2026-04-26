/*
 * REF-08 Phase A — renderState.handleUiSkin contract tests.
 *
 * The render worker (OffscreenCanvas) cannot read DOM attributes, so the
 * main thread delivers skin palettes via postMessage. These tests lock the
 * contract of `handleUiSkin`:
 *
 *   - valid palette payloads mutate `state.skin` and flag a redraw;
 *   - malformed payloads (missing fields, wrong types, null, undefined) are
 *     rejected silently — the worker keeps its previous skin and the frame
 *     loop is not disrupted.
 *
 * We do NOT mock the canvas context here. `handleUiSkin` only touches
 * `state.skin` and `state.isRenderDirty`; it must remain canvas-agnostic.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { createRenderState, handleUiSkin, type RenderState } from '@/workers/render/renderState';
import { SKIN_CATALOG, DEFAULT_SKIN_ID } from '@/constants/skins';

describe('handleUiSkin (REF-08 Phase A)', () => {
  let state: RenderState;

  beforeEach(() => {
    state = createRenderState();
    state.isRenderDirty = false;
  });

  it('initializes state.skin with the default palette', () => {
    const fresh = createRenderState();
    expect(fresh.skin).toEqual(SKIN_CATALOG[DEFAULT_SKIN_ID]);
  });

  it('swaps the palette and flags a redraw on a valid UI_SKIN payload', () => {
    handleUiSkin(state, { skin: SKIN_CATALOG['retro-arcade'] });
    expect(state.skin).toEqual(SKIN_CATALOG['retro-arcade']);
    expect(state.isRenderDirty).toBe(true);
  });

  it('supports swapping between every palette in the catalog', () => {
    const ids: Array<keyof typeof SKIN_CATALOG> = [
      'frozen-ice',
      'magenta-blaze',
      'neon-green',
      'retro-arcade',
    ];
    for (const id of ids) {
      handleUiSkin(state, { skin: SKIN_CATALOG[id] });
      expect(state.skin.id).toBe(id);
    }
  });

  it('ignores a null payload and preserves the current skin', () => {
    const before = state.skin;
    handleUiSkin(state, null);
    expect(state.skin).toBe(before);
    expect(state.isRenderDirty).toBe(false);
  });

  it('ignores an undefined payload and preserves the current skin', () => {
    const before = state.skin;
    handleUiSkin(state, undefined);
    expect(state.skin).toBe(before);
    expect(state.isRenderDirty).toBe(false);
  });

  it('ignores a payload missing the skin key', () => {
    const before = state.skin;
    handleUiSkin(state, { other: 'field' });
    expect(state.skin).toBe(before);
    expect(state.isRenderDirty).toBe(false);
  });

  it('ignores a payload whose skin is not an object', () => {
    const before = state.skin;
    handleUiSkin(state, { skin: 'neon-green' });
    expect(state.skin).toBe(before);
    expect(state.isRenderDirty).toBe(false);
  });

  it('ignores a payload whose skin is missing a gradient stop', () => {
    const before = state.skin;
    const broken = {
      ...SKIN_CATALOG['neon-green'],
      body: { highlight: '#4ade80', mid: '#16a34a' },
    };
    handleUiSkin(state, { skin: broken });
    expect(state.skin).toBe(before);
    expect(state.isRenderDirty).toBe(false);
  });

  it('ignores a payload whose gradient stop is not a string', () => {
    const before = state.skin;
    const broken = {
      ...SKIN_CATALOG['neon-green'],
      head: { highlight: 123, mid: '#22c55e', shadow: '#15803d' },
    };
    handleUiSkin(state, { skin: broken });
    expect(state.skin).toBe(before);
    expect(state.isRenderDirty).toBe(false);
  });
});
