import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/*
 * Validates the design tokens contract enforced by REF-06-FR-7 / REF-06-AC-7 / REF-06-AC-8.
 *
 * The tokens file ships sRGB hex fallbacks on the :root selector and overrides them with
 * OKLCH equivalents inside an @supports block. WCAG contrast is checked against the sRGB
 * fallbacks because every browser falls back to them when OKLCH is unsupported and because
 * sRGB is the deterministic reference for AC-8.
 *
 * Relative luminance and contrast follow WCAG 2.1 §1.4.3 / §1.4.6.
 */

const TOKENS_PATH = path.resolve(process.cwd(), 'src/styles/tokens.css');
const tokensCss = readFileSync(TOKENS_PATH, 'utf8');

interface RootScope {
  readonly raw: string;
}

function readRootScope(): RootScope {
  const rootMatch = /:root\s*\{/.exec(tokensCss);
  if (!rootMatch) {
    throw new Error('Could not find :root {} block in tokens.css');
  }
  const rootIndex = rootMatch.index;
  const supportsIndex = tokensCss.indexOf('@supports', rootIndex);
  const end = supportsIndex === -1 ? tokensCss.length : supportsIndex;
  return { raw: tokensCss.slice(rootIndex, end) };
}

function readVariable(scope: RootScope, name: string): string {
  const escaped = name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const re = new RegExp(`${escaped}\\s*:\\s*([^;]+);`);
  const match = re.exec(scope.raw);
  if (!match) {
    throw new Error(`Token ${name} not found in :root scope`);
  }
  return match[1]?.trim() ?? '';
}

function resolveHex(scope: RootScope, value: string): string {
  if (value.startsWith('#')) return value;
  if (value.startsWith('var(')) {
    const inner = value.slice(4, -1).trim();
    return resolveHex(scope, readVariable(scope, inner));
  }
  throw new Error(`Cannot resolve color value: ${value}`);
}

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

describe('design tokens (REF-06-FR-7 / AC-7 / AC-8)', () => {
  const scope = readRootScope();

  describe('WCAG contrast pairs', () => {
    const minBody = 4.5;
    const minHudCritical = 7;

    const pairs: ReadonlyArray<{
      readonly name: string;
      readonly bg: string;
      readonly fg: string;
      readonly min: number;
    }> = [
      {
        name: 'on-bg over bg-base (AAA — HUD-critical text)',
        bg: '--color-bg-base',
        fg: '--color-on-bg',
        min: minHudCritical,
      },
      {
        name: 'on-bg-strong over bg-surface (AAA)',
        bg: '--color-bg-surface',
        fg: '--color-on-bg-strong',
        min: minHudCritical,
      },
      {
        name: 'on-bg-muted over bg-base (AA — body)',
        bg: '--color-bg-base',
        fg: '--color-on-bg-muted',
        min: minBody,
      },
      {
        name: 'on-bg-muted over bg-surface (AA — body)',
        bg: '--color-bg-surface',
        fg: '--color-on-bg-muted',
        min: minBody,
      },
      {
        name: 'accent-primary over bg-base (AA — neon cyan)',
        bg: '--color-bg-base',
        fg: '--color-accent-primary',
        min: minBody,
      },
      {
        name: 'accent-success over bg-base (AA — neon green)',
        bg: '--color-bg-base',
        fg: '--color-accent-success',
        min: minBody,
      },
      {
        name: 'accent-combo over bg-base (AA — neon yellow)',
        bg: '--color-bg-base',
        fg: '--color-accent-combo',
        min: minBody,
      },
    ];

    it.each(pairs)('$name should be at least $min:1', ({ bg, fg, min }) => {
      const bgHex = resolveHex(scope, readVariable(scope, bg));
      const fgHex = resolveHex(scope, readVariable(scope, fg));
      const ratio = contrastRatio(bgHex, fgHex);
      expect(ratio).toBeGreaterThanOrEqual(min);
    });
  });

  describe('catalogue completeness', () => {
    it('exposes every required semantic background token', () => {
      const required = [
        '--color-bg-base',
        '--color-bg-surface',
        '--color-bg-elevated',
        '--color-bg-hover',
      ];
      for (const token of required) {
        expect(() => readVariable(scope, token)).not.toThrow();
      }
    });

    it('exposes every required semantic accent token', () => {
      const required = [
        '--color-accent-primary',
        '--color-accent-success',
        '--color-accent-warn',
        '--color-accent-danger',
        '--color-accent-combo',
        '--color-accent-special',
      ];
      for (const token of required) {
        expect(() => readVariable(scope, token)).not.toThrow();
      }
    });

    it('exposes every required radius and z-index token', () => {
      const required = [
        '--radius-xs',
        '--radius-sm',
        '--radius-md',
        '--radius-lg',
        '--radius-xl',
        '--radius-pill',
        '--z-board',
        '--z-overlay',
        '--z-hud',
        '--z-drawer',
        '--z-modal',
      ];
      for (const token of required) {
        expect(() => readVariable(scope, token)).not.toThrow();
      }
    });
  });
});
