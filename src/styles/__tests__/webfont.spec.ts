import { describe, expect, it } from 'vitest';
import { readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TYPOGRAPHY_PATH = path.resolve(ROOT, 'src/styles/typography.css');
const FONT_PATH = path.resolve(ROOT, 'public/fonts/galaxy-sans-var.woff2');
const OFL_PATH = path.resolve(ROOT, 'public/fonts/OFL.txt');
const INDEX_HTML_PATH = path.resolve(ROOT, 'index.html');

const typographyCss = readFileSync(TYPOGRAPHY_PATH, 'utf8');
const indexHtml = readFileSync(INDEX_HTML_PATH, 'utf8');

const FONT_BUDGET_BYTES = 50_000;

describe('REF-06 Phase B — webfont contract', () => {
  describe('asset on disk', () => {
    it('ships the woff2 file at /fonts/galaxy-sans-var.woff2', () => {
      expect(existsSync(FONT_PATH)).toBe(true);
    });

    it('keeps the woff2 file under the bundle budget (≤ 50 kB)', () => {
      const size = statSync(FONT_PATH).size;
      expect(size).toBeLessThanOrEqual(FONT_BUDGET_BYTES);
    });

    it('ships the SIL Open Font License next to the font asset', () => {
      expect(existsSync(OFL_PATH)).toBe(true);
      const license = readFileSync(OFL_PATH, 'utf8');
      expect(license).toMatch(/SIL Open Font License/i);
    });
  });

  describe('@font-face declaration', () => {
    it('declares a single @font-face for "Galaxy Sans Var"', () => {
      const declarations = typographyCss.match(/@font-face\s*\{[^}]*\}/g) ?? [];
      expect(declarations.length).toBe(1);
      expect(declarations[0]).toContain("font-family: 'Galaxy Sans Var'");
    });

    it('points to the self-hosted woff2 with the variations format hint', () => {
      expect(typographyCss).toMatch(
        /src:\s*url\(['"]?\/fonts\/galaxy-sans-var\.woff2['"]?\)\s+format\(['"]woff2-variations['"]\)/,
      );
    });

    it('uses font-display: swap to avoid FOIT and meet REF-05 CLS budget', () => {
      expect(typographyCss).toMatch(/font-display:\s*swap/);
    });

    it('exposes the full variable weight axis (50–900)', () => {
      expect(typographyCss).toMatch(/font-weight:\s*50\s+900/);
    });

    it('declares a unicode-range covering Latin-1 + extended punctuation', () => {
      expect(typographyCss).toMatch(/unicode-range:[^;]*U\+0000-007F/);
      expect(typographyCss).toMatch(/U\+00A0-00FF/);
    });

    it('declares CLS override metrics (size-adjust + ascent/descent/line-gap)', () => {
      expect(typographyCss).toMatch(/size-adjust:\s*\d+%/);
      expect(typographyCss).toMatch(/ascent-override:/);
      expect(typographyCss).toMatch(/descent-override:/);
      expect(typographyCss).toMatch(/line-gap-override:/);
    });
  });

  describe('--font-display token', () => {
    it('lists "Galaxy Sans Var" as the first family in --font-display', () => {
      const match = /--font-display:\s*([^;]+);/.exec(typographyCss);
      expect(match).not.toBeNull();
      const stack = match![1].trim();
      expect(stack.startsWith("'Galaxy Sans Var'") || stack.startsWith('"Galaxy Sans Var"')).toBe(
        true,
      );
    });

    it('keeps the system fallback chain after the webfont', () => {
      const match = /--font-display:\s*([^;]+);/.exec(typographyCss);
      expect(match).not.toBeNull();
      const stack = match![1].trim();
      expect(stack).toMatch(/'SF Pro Display'/);
      expect(stack).toMatch(/system-ui/);
      expect(stack).toMatch(/sans-serif\s*$/);
    });
  });

  describe('preload hint in index.html', () => {
    it('preloads the webfont with crossorigin=anonymous', () => {
      expect(indexHtml).toMatch(
        /<link[^>]+rel="preload"[^>]+href="\/fonts\/galaxy-sans-var\.woff2"[^>]+as="font"[^>]+type="font\/woff2"[^>]+crossorigin="anonymous"\s*\/?>/,
      );
    });
  });
});
