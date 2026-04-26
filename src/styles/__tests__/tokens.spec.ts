import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/*
 * Validates the design tokens contract enforced by REF-06-FR-7 / REF-06-AC-7 / REF-06-AC-8.
 *
 * REF-07 Phase A extends the matrix to run across BOTH themes (dark, light) so the AA/AAA
 * contract is enforced cross-theme. The dark scope is the `:root {}` block; the light scope
 * is `:root[data-theme='light'] {}`. Tokens not redefined on the light scope cascade from
 * the dark scope (the `readVariable(scope, ...)` fallback mirrors browser cascade).
 *
 * The tokens file ships sRGB hex fallbacks outside `@supports` and overrides them with
 * OKLCH equivalents inside an `@supports (color: oklch(0 0 0)) {}` block. WCAG contrast is
 * checked against the sRGB fallbacks because every browser falls back to them when OKLCH is
 * unsupported and because sRGB is the deterministic reference for AC-8 / REF-07-AC-6.
 *
 * Relative luminance and contrast follow WCAG 2.1 §1.4.3 / §1.4.6.
 */

const TOKENS_PATH = path.resolve(process.cwd(), 'src/styles/tokens.css');
const tokensCss = readFileSync(TOKENS_PATH, 'utf8');

type ThemeName = 'dark' | 'light';

interface ThemeScope {
  readonly name: ThemeName;
  readonly raw: string;
  readonly fallback?: ThemeScope;
}

function extractBlock(startSignature: RegExp, css: string): string {
  const match = startSignature.exec(css);
  if (!match) {
    throw new Error(`Could not find selector ${startSignature} in tokens.css`);
  }
  const openIdx = css.indexOf('{', match.index);
  if (openIdx === -1) {
    throw new Error(`Missing opening brace after ${startSignature}`);
  }
  let depth = 1;
  let i = openIdx + 1;
  while (i < css.length && depth > 0) {
    const ch = css[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') depth -= 1;
    i += 1;
  }
  if (depth !== 0) {
    throw new Error(`Unbalanced braces starting at ${startSignature}`);
  }
  return css.slice(openIdx + 1, i - 1);
}

function readDarkScope(): ThemeScope {
  return {
    name: 'dark',
    raw: extractBlock(/:root\s*\{/, tokensCss),
  };
}

function readLightScope(darkScope: ThemeScope): ThemeScope {
  return {
    name: 'light',
    raw: extractBlock(/:root\[data-theme='light'\]\s*\{/, tokensCss),
    fallback: darkScope,
  };
}

function readVariable(scope: ThemeScope, name: string): string {
  const escaped = name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const re = new RegExp(`${escaped}\\s*:\\s*([^;]+);`);
  const match = re.exec(scope.raw);
  if (match) {
    return match[1]?.trim() ?? '';
  }
  if (scope.fallback) {
    return readVariable(scope.fallback, name);
  }
  throw new Error(`Token ${name} not found in ${scope.name} scope (no fallback)`);
}

function resolveHex(scope: ThemeScope, value: string): string {
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

describe('design tokens (REF-06-FR-7 / AC-7 / AC-8 · REF-07-FR-4 / AC-6)', () => {
  const darkScope = readDarkScope();
  const lightScope = readLightScope(darkScope);

  const minBody = 4.5;
  const minHudCritical = 7;

  interface ContrastPair {
    readonly name: string;
    readonly bg: string;
    readonly fg: string;
    readonly min: number;
  }

  const pairs: readonly ContrastPair[] = [
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
    {
      name: 'accent-danger over bg-base (AA — game-over text)',
      bg: '--color-bg-base',
      fg: '--color-accent-danger',
      min: minBody,
    },
    {
      name: 'accent-warn over bg-base (AA — low-lives amber)',
      bg: '--color-bg-base',
      fg: '--color-accent-warn',
      min: minBody,
    },
    {
      name: 'accent-special over bg-base (AA — boss violet)',
      bg: '--color-bg-base',
      fg: '--color-accent-special',
      min: minBody,
    },
    {
      name: 'on-bg over bg-elevated (AAA — drawer headings)',
      bg: '--color-bg-elevated',
      fg: '--color-on-bg',
      min: minHudCritical,
    },
  ];

  const themes: ReadonlyArray<{ readonly name: ThemeName; readonly scope: ThemeScope }> = [
    { name: 'dark', scope: darkScope },
    { name: 'light', scope: lightScope },
  ];

  for (const theme of themes) {
    describe(`WCAG contrast pairs — ${theme.name} theme`, () => {
      it.each(pairs)('$name should be at least $min:1', ({ bg, fg, min }) => {
        const bgHex = resolveHex(theme.scope, readVariable(theme.scope, bg));
        const fgHex = resolveHex(theme.scope, readVariable(theme.scope, fg));
        const ratio = contrastRatio(bgHex, fgHex);
        expect(ratio).toBeGreaterThanOrEqual(min);
      });
    });
  }

  describe('catalogue completeness (dark scope)', () => {
    it('exposes every required semantic background token', () => {
      const required = [
        '--color-bg-base',
        '--color-bg-surface',
        '--color-bg-elevated',
        '--color-bg-hover',
      ];
      for (const token of required) {
        expect(() => readVariable(darkScope, token)).not.toThrow();
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
        expect(() => readVariable(darkScope, token)).not.toThrow();
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
        expect(() => readVariable(darkScope, token)).not.toThrow();
      }
    });
  });

  describe('light theme overrides (REF-07 Phase A)', () => {
    it('redefines every background / foreground / stroke token on its own scope', () => {
      const mustOverride = [
        '--color-bg-base',
        '--color-bg-surface',
        '--color-bg-elevated',
        '--color-bg-hover',
        '--color-on-bg',
        '--color-on-bg-strong',
        '--color-on-bg-muted',
        '--color-on-bg-faint',
        '--color-stroke-subtle',
        '--color-stroke-soft',
        '--color-stroke-strong',
        '--color-overlay-scrim',
        '--color-surface-translucent',
      ];
      for (const token of mustOverride) {
        const escaped = token.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        const re = new RegExp(`${escaped}\\s*:`);
        expect(re.test(lightScope.raw)).toBe(true);
      }
    });

    it('redefines every semantic accent token with a deep-on-light variant', () => {
      const accents = [
        '--color-accent-primary',
        '--color-accent-success',
        '--color-accent-warn',
        '--color-accent-danger',
        '--color-accent-combo',
        '--color-accent-special',
      ];
      for (const token of accents) {
        const escaped = token.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        const re = new RegExp(`${escaped}\\s*:`);
        expect(re.test(lightScope.raw)).toBe(true);
      }
    });

    it('does NOT override spacing, radii, or z-index tokens (these are theme-invariant)', () => {
      const invariants = [
        '--radius-md',
        '--radius-lg',
        '--space-3',
        '--space-4',
        '--z-hud',
        '--hud-strip-height',
      ];
      for (const token of invariants) {
        const escaped = token.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        const re = new RegExp(`${escaped}\\s*:`);
        expect(re.test(lightScope.raw)).toBe(false);
      }
    });
  });
});
