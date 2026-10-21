/**
 * REF-09 playfield budget.
 * The CSS grid uses the same column widths; this function is the testable form
 * of "largest square after HUD, footer, padding, and side columns".
 */

export const PLAYFIELD_LAYOUT = {
  columnBreakpointPx: 964,
  /** Desktop shell max width — keeps side columns tight to the board (REF-09-FR-8). */
  shellMaxWidthPx: 964,
  /**
   * Desktop shell max height — avoids 100dvh stretch that leaves empty side rails
   * and horizontal gutters beside a height-limited board square.
   */
  shellMaxHeightPx: 640,
  leftColumnPx: 160,
  rightColumnPx: 240,
  hudCompactPx: 44,
} as const;

export interface PlayfieldBudgetInput {
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly hudHeight: number;
  readonly footerHeight: number;
  readonly mainPadding: number;
  readonly columnGap: number;
  readonly leftColumn: number;
  readonly rightColumn: number;
}

export function playfieldBoardSide(input: PlayfieldBudgetInput): number {
  const vertical =
    input.viewportHeight - input.hudHeight - input.footerHeight - input.mainPadding * 2;
  const horizontal =
    input.viewportWidth -
    input.leftColumn -
    input.rightColumn -
    input.columnGap * 2 -
    input.mainPadding * 2;
  return Math.max(0, Math.min(vertical, horizontal));
}

/**
 * Mirrors render.worker RESIZE: backing store is the CSS box times DPR,
 * and the draw cell is cssWidth / gridSize. Collision grid size is the caller's.
 */
export function canvasBackingStore(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
  gridSize: number,
): { readonly backingWidth: number; readonly backingHeight: number; readonly cellSize: number } {
  const dpr = devicePixelRatio > 0 ? devicePixelRatio : 1;
  const safeGrid = gridSize > 0 ? gridSize : 1;
  return {
    backingWidth: cssWidth * dpr,
    backingHeight: cssHeight * dpr,
    cellSize: cssWidth / safeGrid,
  };
}
