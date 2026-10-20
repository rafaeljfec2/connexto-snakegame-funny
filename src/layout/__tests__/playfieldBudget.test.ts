import { describe, expect, it } from 'vitest';
import { GAME_CONFIG } from '@/constants/game';
import { PLAYFIELD_LAYOUT, canvasBackingStore, playfieldBoardSide } from '@/layout/playfieldBudget';

describe('playfieldBoardSide (REF-09-AC-1)', () => {
  it('is limited by height at 964x583 so the columns do not shrink the board', () => {
    const hudHeight = PLAYFIELD_LAYOUT.hudCompactPx;
    const footerHeight = 32;
    const mainPadding = 8;
    const columnGap = 8;
    const vertical = 583 - hudHeight - footerHeight - mainPadding * 2;
    const horizontal =
      964 -
      PLAYFIELD_LAYOUT.leftColumnPx -
      PLAYFIELD_LAYOUT.rightColumnPx -
      columnGap * 2 -
      mainPadding * 2;

    const side = playfieldBoardSide({
      viewportWidth: 964,
      viewportHeight: 583,
      hudHeight,
      footerHeight,
      mainPadding,
      columnGap,
      leftColumn: PLAYFIELD_LAYOUT.leftColumnPx,
      rightColumn: PLAYFIELD_LAYOUT.rightColumnPx,
    });

    expect(side).toBe(vertical);
    expect(side).toBeLessThan(horizontal);
    expect(PLAYFIELD_LAYOUT.leftColumnPx).toBe(160);
    expect(PLAYFIELD_LAYOUT.rightColumnPx).toBe(240);
  });

  it('returns 0 when hud, footer, and columns consume the viewport', () => {
    expect(
      playfieldBoardSide({
        viewportWidth: 100,
        viewportHeight: 100,
        hudHeight: 80,
        footerHeight: 40,
        mainPadding: 8,
        columnGap: 8,
        leftColumn: PLAYFIELD_LAYOUT.leftColumnPx,
        rightColumn: PLAYFIELD_LAYOUT.rightColumnPx,
      }),
    ).toBe(0);
  });
});

describe('canvasBackingStore (REF-09-AC-3)', () => {
  it('scales the backing store by device pixel ratio and keeps the 40-cell grid', () => {
    expect(GAME_CONFIG.gridSize).toBe(40);

    expect(canvasBackingStore(470, 470, 2, GAME_CONFIG.gridSize)).toEqual({
      backingWidth: 940,
      backingHeight: 940,
      cellSize: 470 / 40,
    });
  });

  it('treats a non-positive device pixel ratio as 1', () => {
    expect(canvasBackingStore(100, 80, 0, GAME_CONFIG.gridSize).backingWidth).toBe(100);
  });
});
