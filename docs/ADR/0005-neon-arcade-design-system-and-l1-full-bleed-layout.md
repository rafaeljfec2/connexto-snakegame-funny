# ADR-0005 — Neon Arcade design system and L1 full-bleed layout

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-04-25 |
| **Deciders** | rafael |
| **Related specs** | [REF-06](../SDD/specs/REF-06-visual-redesign.md), [REF-07](../SDD/specs/REF-07-theme-light-mode.md) |
| **Related ADRs** | [ADR-0004](0004-react-external-store-and-css-driven-background.md) (CSS-only animations) |
| **Supersedes** | — |
| **Superseded by** | — |

## Context

The user requested a full visual redesign of the game UI, stating the existing layout "não se parece nada com um jogo web" and demanding a **professional UI/UX worthy of a real web game** — explicitly rejecting amateur results. Two structural problems blocked any incremental polish:

1. **Three-panel dashboard layout.** `App.tsx` shipped a header + left sidebar (`GameSidebar`) + right sidebar (`GameInfo`/`StatusBar` cluster) + footer that competed with the canvas for visual weight, fragmented information across the screen, and reproduced a productivity-app aesthetic instead of a game HUD. The board never felt like the protagonist.
2. **Ad-hoc styling.** ~50 hardcoded gradients, hex literals scattered across CSS modules, and a global `Inter` import created drift between components, made theming impossible, and produced contrast pairs that failed WCAG in several spots (button states over translucent surfaces).

REF-06 was opened to address both. The owner approved the spec — including the **L1 full-bleed canvas-first layout**, the **3-tier OKLCH design token system**, and a **vertical-slice Phase A on desktop** — with a single "aprovado". This ADR captures the decisions Phase A executed, since they reach across every component and any future visual work has to live with them.

## Decision

We adopt **three rules** and one **migration discipline** for the entire React tree:

1. **L1 full-bleed layout — the board is the page.** `App.tsx` renders a translucent `HudStrip` (top, 56 px) over a full-viewport `GameArea` whose only first-class child is the canvas. Side panels are deleted (`GameSidebar` removed). The power-ups catalogue moves out of the always-on layout into a slide-out `PowerUpsLegendDrawer` triggered from the HUD. There is no left or right sidebar in any breakpoint.

   **Phase A.2 revision (2026-04-25, same day):** the original Phase A wired secondary read-only data (`ActivePowerUps`, `ComboDisplay`, `PhaseDisplay`) inside a `BoardOverlays` layer floating *over the canvas*. After the first visual review, the owner rejected anything overlapping the playfield. The `BoardOverlays` component was deleted and replaced by **three viewport-anchored compositors**:
   - **`ViewportPowerUpsRail`** — `position: fixed; top-left` outside the board card; vertical pill stack with timer ring; auto-hides when no power-up is active. Visual reference: WoW / FF14 buff bar.
   - **`ViewportComboBadge`** — `position: fixed; top-right` outside the board card; glowing badge gated to `combo.count >= COMBO_CONFIG.minCombo`; auto-hides when combo expires. Visual reference: Devil May Cry / Bayonetta combo meter.
   - **`BottomInfoBar`** — slim horizontal bar that lives in a `.boardStack` flex column directly below `.gameContainer`, sharing its width via `align-items: stretch`; hosts `PhaseDisplay`. Visual reference: Witcher 3 / Hades objective tracker.

   Both viewport-fixed compositors hide on `max-width: 768px` (mobile path keeps the existing `MobileFloatingInfo` / `StatusBar`).

   **Phase A.3 revision (2026-04-26):** the second visual review showed the `BottomInfoBar` was still perceived by the owner as a "container inside the game grid" because it sat directly below the board card and shared its width. The decision: phase + level-in-phase + progress are *persistent state* (same conceptual tier as Score/Best/Lives), so they belong in the **HUD strip itself**, not in a separate companion bar. Concretely:
   - **`BottomInfoBar`** (and the `.boardStack` flex column wrapper) is **deleted**.
   - **`PhaseDisplay`** is **deleted** (dead code after the move; its semantics are absorbed by the HUD).
   - `HudStrip` gains a composite `phaseSlot` that **replaces** the legacy `Level` slot: `FASE N · Nome da Fase · ▓▓░░ X/5`. This kills the duplicated "Level" reading that previously appeared both in the HUD and in `BottomInfoBar`. The slot exposes a real `role="progressbar"` with proper `aria-valuemin/max/now` for screen readers.
   - `--bottom-bar-reserved` token removed from `tokens.css`; `.gameContainer` width formula simplified accordingly.
   - `.gameArea` is now strictly: `MobileFloatingInfo` (mobile only) + `gameContainer` + `mobileStatusBar` (mobile only) + `instructions` (footer hint). On desktop, the game card is the **only** child between the HUD strip and the instructions hint.

   Visual reference for the consolidated HUD: AAA HUDs that compress all persistent state into a single top strip (Hades runs, Slay the Spire act bar, Vampire Survivors top HUD).

   **Phase D revision (2026-04-26):** the first mobile capture made it clear that the desktop consolidation never made it to the mobile path. The HUD was overcrowded in a single row, while a separate `StatusBar` ("MobileStatusBar") rendered under the board, repeating `LIVES` and `PHASE` with different visual weights — the exact duplication problem that motivated Phase A.3 on desktop, replicated on the small viewport. Phase D propagates the same single-source-of-truth contract to mobile:
   - **`StatusBar`** (the so-called MobileStatusBar component) is **deleted**, along with its `i18n` namespace `statusBar.*` and its CSS module.
   - The orphaned `LivesDisplay` component (no remaining caller after the deletion) is removed alongside it to satisfy the "no legacy duplication" principle inherited from ADR-0001.
   - `HudStrip` gains a new `data-mobile-only` `LENGTH` slot so the snake length data — the only piece of state previously unique to `StatusBar` — survives the consolidation. Component-level `[data-mobile-only="true"]` rules toggle the slot via media query, with **zero** runtime branching.
   - The HUD becomes **dual-mode responsive**:
     - `≤ 968 px` (tablet): same single row, brand reduced to mark only, gaps tightened.
     - `≤ 640 px` (mobile): single row keeps Score/Phase/Lives + Length; phase name hidden, `Best` (`data-priority="low"`) hidden.
     - `≤ 480 px` (small mobile): the strip wraps into **two rows** — row 1 is `brand + actions`, row 2 is the full metrics line — and `--hud-strip-height` jumps from 56 → 88 px through a media-query-scoped token override (`--hud-strip-height-mobile`).
   - The board's available area formula (`.gameContainer`) is unaffected because it already reads `--hud-strip-height` instead of a hard-coded value.
   - The board-area instructions (`controls.instructions` — keyboard-only legend) are gated to `[data-variant="keyboard"]` and hidden on `≤ 768 px`. A new `controls.touchInstructions` variant is mounted under `[data-variant="touch"]` so mobile users see a relevant hint ("Swipe or use the D-pad…") instead of a useless `↑↓←→` legend.
   - **`TouchControls`** is rebuilt against the Neon Arcade tokens. The old Material-blue D-pad is replaced by a transparent surface with `--color-stroke-soft` borders, cyan glow on `:active` (matches the HUD palette), and the central poison button uses the success-special gradient with a pill radius. Hit targets enforce `min-width: 56px; min-height: 56px` (Apple HIG / Material Touch). Haptic feedback (`navigator.vibrate(15)`) was already in place; the redesign keeps it untouched. All animations stay on `transform` / `opacity` and a `prefers-reduced-motion` block disables them.

   Visual reference: arcade D-pads (Vampire Survivors mobile, Pixel Dungeon, Streets of Rogue mobile) — neon-tinted glass over the playfield rather than opaque controllers.

   **Phase E revision (2026-04-26) — containing-block fix for `PowerUpsLegendDrawer`:** during the Phase D visual review the power-ups drawer rendered only the "POSITIVOS" heading on both desktop and mobile, with the 10 legend items clipped and invisible. The root cause was structural, not CSS-cosmetic: `HudStrip` is an ancestor with `backdrop-filter: blur(14px) saturate(140%)`, and per the CSS Filter Effects spec, any element with `filter`, `backdrop-filter`, `transform`, `perspective` or `will-change: transform` becomes the **containing block** for any descendant with `position: fixed`. Since the drawer was rendered **inside** `HudStrip` and used `position: fixed`, its `top/right/bottom: 0` resolved against the 56 px tall HUD instead of the viewport, clipping 95 % of its content outside the HUD bounds. The fix was to **lift the drawer up to `App.tsx`** as a sibling of `HudStrip` (outside the `backdrop-filter` ancestor), turn `HudStrip` into a **controlled component** (`legendOpen: boolean` + `onToggleLegend: () => void` props), and let `App.tsx` own the `useState`. Zero CSS was changed — the original `position: fixed; right: 0; top: 0; bottom: 0` is now viewport-anchored as intended. This bug was worth documenting because it is the *structural cost* of our heavy use of `backdrop-filter` across the HUD / drawer / overlay layers, and future components using `position: fixed` must be mounted outside those ancestors.

2. **3-tier OKLCH design tokens are the single source of truth for color.** [`src/styles/tokens.css`](../../src/styles/tokens.css) defines:
   - **Tier 1 — primitives** (`--c-deep-900`, `--c-neon-cyan`, …) with sRGB hex fallbacks on `:root` and OKLCH overrides inside `@supports (color: oklch(0 0 0))`.
   - **Tier 2 — semantic** (`--color-bg-base`, `--color-on-bg-muted`, `--color-accent-success`, …) — the only tier components are allowed to consume.
   - **Tier 3 — component-scoped** (introduced as needed inside `.module.css`).
   
   No hex / rgb() / hsl() literals are permitted outside `tokens.css`. The same architecture covers radii, spacing, z-indices, shadows, and HUD geometry. Contrast pairs are validated programmatically against the sRGB fallback in [`src/styles/__tests__/tokens.spec.ts`](../../src/styles/__tests__/tokens.spec.ts) (≥ 7:1 for HUD-critical text, ≥ 4.5:1 for body, per WCAG 2.1 §1.4.3 / §1.4.6).

3. **Motion is CSS-only and animates `transform` / `opacity` exclusively.** [`src/styles/motion.css`](../../src/styles/motion.css) exposes the keyframes (`ref06FadeIn`, `ref06SlideInRight`, `ref06SlideInUp`, `ref06Pulse`, `ref06GlowSoft`), durations, and easings. **No** animation of `box-shadow`, `filter: drop-shadow`, `width`/`height`, `top`/`left`, or color. **No** `framer-motion`, **no** runtime animation library — this extends ADR-0004's CSS-only rule from the background particles to the entire UI surface. `prefers-reduced-motion: reduce` collapses every motion duration to 1 ms via a single media query.

4. **Typography: system stack — Phase B.1 webfont reverted.** Phase A shipped a pure system display stack with `font-feature-settings: "tnum" 1, "ss01" 1` for HUD digits, and Phase B.1 (2026-04-26) later introduced the `26F Galaxy Sans Variable` webfont (~39 kB subset, OFL) as the canonical display face. On visual review, the webfont rendered poorly on the pieces that actually use the display face — small uppercase labels with aggressive `letter-spacing` (HUD metrics "PONTOS/RECORDE/FASE/VIDAS", drawer heading "CATÁLOGO DE POWER-UPS"): the narrow, geometric letterforms became cramped and uneven at 10–13 px. **The decision: revert Phase B.1 entirely.** Net effect after revert:
   - `@font-face 'Galaxy Sans Var'` removed, `--font-display` unified with the system stack (`'SF Pro Display'` → `'Segoe UI Variable Display'` → `system-ui` → …).
   - `<link rel="preload">` hint removed from `index.html`.
   - `public/fonts/galaxy-sans-var.woff2` + `OFL.txt` deleted (the `public/fonts/` folder is gone).
   - The Phase B.1 contract test (`src/styles/__tests__/webfont.spec.ts`) deleted.
   - Tabular-num / slashed-zero features are preserved (SF Pro, Segoe UI Variable and system-ui all honor `tabular-nums` and `slashed-zero`).
   - **Gains**: -39 kB webfont off the critical path, zero FOUT/FOIT risk, REF-05 CLS budget kept intact with no `size-adjust` gymnastics, small-label rendering visibly better on every platform.

## Consequences

### Positive

- **The board is unambiguously the protagonist.** Removing the side panels lifts the canvas to ~80 % of the viewport (vs ~45 % before), in line with the research norm for arcade-style web games (Slither.io, Agar.io, Diep.io). After Phase A.3, persistent state lives entirely in the HUD strip and transient feedback (combo, active power-ups) lives in viewport-fixed compositors *outside* the game card — nothing competes with the canvas for layout space.
- **Theming and accessibility become structural properties, not vibes.** Any future skin (e.g., a "Carnival" event theme, a high-contrast variant, a colorblind-safe variant) is a swap of the semantic-tier tokens — no component changes. WCAG regressions are caught by `tokens.spec.ts` in CI.
- **Wide-gamut without breaking sRGB.** `@supports (color: oklch(0 0 0))` upgrades supported browsers to OKLCH with no FOUC or fallback flash; legacy browsers keep the curated sRGB palette.
- **Zero new runtime deps.** No `framer-motion`, no icon library, no design-system package. Phase A ships ~+5 kB of CSS and 0 kB of JS / fonts. Aligns with ADR-0001 (SDD)'s small-reversible-change principle.
- **Animations stay on the compositor.** Constraining motion to `transform` / `opacity` extends ADR-0004's INP wins to the new HUD and overlays — power-up pills appearing on screen do not push the main thread.

### Negative / accepted trade-offs

- **Token discipline is now load-bearing.** Any developer (or agent) who reaches for a hex literal in a `.module.css` file silently breaks the theming contract. Mitigated by: (a) tokens.css comments forbid it explicitly, (b) `tokens.spec.ts` catches missing semantic tokens, (c) future ESLint/stylelint rule planned in REF-06 Phase B if drift appears.
- **Full-bleed makes mobile/responsive harder, not easier.** Phase A was desktop-only; Phase D (2026-04-26) addresses mobile by deleting `StatusBar`, folding `LENGTH` into the HUD as a `data-mobile-only` slot, splitting the HUD into a 2-row layout below 480 px, and rebuilding `TouchControls` on the Neon Arcade tokens with ≥ 56 px hit targets. The dual-mode HUD eats 32 extra pixels of vertical space at the smallest viewport, which is reclaimed from the deleted `StatusBar` (~80 px previously). Net board height: **+48 px** at ≤ 480 px.
- **Sidebars are gone for good.** Components that lived there (`GameSidebar`, the catalogue card in `ActivePowerUps`) are deleted, not hidden. Any future "stats panel" idea has to ship as a drawer/modal/overlay, not by re-adding a sidebar — that's the cost of committing to L1.
- **CSS-only motion is less expressive.** Animations cannot react to game state (combo strength, boss entrance choreography). Phase A accepts this; level-up animations stay JS-driven (one-off React component using GPU-friendly transforms).
- **No display webfont for the foreseeable future.** Phase B.1 tried and failed — the 26F Galaxy Sans glyph shapes looked good at `3rem+` but wrong at the sizes the display stack actually powers (HUD labels, drawer title). Any future attempt must target a font whose glyphs were designed for small-caps tracked UI labels (e.g. a dedicated SFX / UI font family like Space Grotesk, Inter Display, Unica One), and must be validated against the actual HUD labels — not against marketing-sized headings — before landing. Until then, the system display stack is the choice.

### Neutral

- The `i18next` keys grew (`hud.*`, `powerUps.legend*`); both `pt-BR.json` and `en-US.json` were updated in lockstep. Phase D removed the orphan `statusBar.*` and `livesDisplay.*` namespaces and added `hud.length`, `hud.lengthAriaLabel`, `controls.touchInstructions`.
- After Phase D, the `StatusBar` and `LivesDisplay` components are deleted (they were the last legacy mobile-only renders). `GameInfo` is the only surviving legacy display component, used only by the statistics modal.
- Phase A's bundle delta is dominated by the new CSS files; no JS-side regression is expected and `pnpm build` confirms (verified in REF-06 Phase A validation step).
- After Phase E (2026-04-26): final gated build ships at **92.39 kB CSS (16.28 kB gzip)** and **354.83 kB JS (111.52 kB gzip)**, with zero webfont on the critical path. Index HTML dropped to 1.07 kB (0.53 kB gzip) after the preload hint was removed. 140 unit tests pass, including the 14-pair WCAG contrast contract in `tokens.spec.ts` (AA ≥ 4.5:1 for body / accents, AAA ≥ 7:1 for HUD-critical + drawer headings).
- The REF-06 container-block lesson (§Decision 1, Phase E revision) is worth internalizing: **any CSS rule mixing `backdrop-filter` + `position: fixed` descendants is a latent bug**. The codebase currently has `backdrop-filter` only on `HudStrip`, but any future "floating" surface using `position: fixed` must either live outside `HudStrip` in the React tree, or be rendered via `ReactDOM.createPortal(..., document.body)`. Candidate follow-up: add an ADR appendix or an ESLint rule, if this pattern reappears.
- **REF-07 revision (2026-04-26) — light palette added to the design system:** the original Phase A decision reserved the `@media (prefers-color-scheme: light)` slot "for a future REF" (see §Alternatives considered). REF-07 cashed that cheque. Three structural additions landed without changing a single Phase A/F decision:
  (a) `src/styles/tokens.css` gains a `:root[data-theme='light']` block with 7 new deep-on-light primitives (`-on-light` variants of each neon hue — e.g. `--c-neon-cyan-on-light: #0e647a`), 13 bg/fg/stroke/overlay overrides, and 6 semantic accent re-bindings. OKLCH mirror added inside the existing `@supports` block. The playfield canvas intentionally keeps its own dark surface in both themes — classic arcade canon (Pac-Man, Galaga, Space Invaders always render on black regardless of ambient lighting); only the app chrome flips.
  (b) `tokens.spec.ts` extends the contrast matrix to `describe.each(['dark','light'])`, doubling WCAG assertions from 11 to 22 pairs — every pair passes AA (≥ 4.5:1) or AAA (≥ 7:1) on both themes. The test-side `ThemeScope` uses a `fallback` chain so tokens not redefined on light cascade from dark, mirroring browser semantics.
  (c) Runtime plumbing: an inline IIFE in `index.html` reads `localStorage('snake-game-theme')` + `matchMedia('(prefers-color-scheme: dark)')` and writes `data-theme` on `<html>` **before the CSS bundle loads** — zero flash-of-wrong-theme. The `ThemeContext` that was already mounted in `main.tsx` but never synced the DOM was patched to write `data-theme` on first render, with `matchMedia` subscription only while `theme === 'auto'`. A dead-code `src/hooks/useTheme.ts` (duplication of the context API, 0 imports) was deleted. A new `<ThemeToggle />` segmented radiogroup (WAI-ARIA 1.2 pattern, 3 states) was mounted in the `PowerUpsLegendDrawer` Settings section alongside the existing `LanguageSelector` — which was removed from the HUD, consolidating every preference in one place (Steam / Discord / Figma pattern). REF-07 bundle delta: **+1.56 kB gzip** total across all phases, inside the spec's +2 kB budget. Concretely the design system now supports two ambient lighting conditions; any future themed content (skins, seasonal events) can reuse the `:root[data-theme=*]` primitive without touching component code.
- **Phase F revision (2026-04-26) — mobile polish after real-device validation:** the first screenshots from a real phone (~462 px viewport) surfaced five issues that Phase D's MCP-browser validation missed, because the embedded browser capped at ~858×475 and never entered the ≤ 480 px token breakpoint. Fixes: (M1) `MobileFloatingInfo` now anchors toast + combo overlays via `calc(var(--hud-strip-height) + var(--space-2))` instead of the stale 65 px / 55 px hard-codes, and dropped the runtime `headerHeight` effect + resize listener; (M2) the `.main` mobile reserve dropped from 280 → 240 px (matching the D-pad's actual footprint), `.gameArea` stopped centering vertically, and the board's `max-height` formula gained back ~40 px of height, eliminating the dead zone between hint and D-pad; (M3) `LanguageSelector` lost its self-imposed `display: none` media rule — on desktop a `HudStrip .hudLanguageSelector` wrapper keeps it visible, on ≤ 640 px the wrapper hides and a new **Settings** section in `PowerUpsLegendDrawer` (visible only in ≤ 640 px) exposes the same selector inside the drawer (drawer identity stays "POWER-UPS", not renamed to "Menu"); (M4) the legend button's 12 px grey-square `.legendIcon` was replaced by a 14×14 inline SVG lightning bolt (~200 B) filled with `--color-accent-combo`, the text became `sr-only` on mobile, and the button gained an explicit `aria-label`; (M5) a new `@media (max-width: 360px)` rule drops the Length slot from the HUD's 2nd row to keep 320 px screens (iPhone SE) from wrapping into a 3rd row. Gates after Phase F: 142 tests (+2 new), `tsc`/`eslint`/`build` green, CSS bundle +0.06 kB raw / flat on gzip, JS bundle +0.03 kB raw / flat on gzip.

## Alternatives considered

- **Two-panel layout (HUD + right rail).** Closer to existing AAA web games (Hearthstone-web, Krunker). Rejected because it still cuts the canvas to ~65 % of the viewport, the user explicitly criticized the "dashboard look", and the right rail's content (legend, stats) has no real-time relevance — a drawer suits it better.
- **Tailwind for utility-first styling.** Would replace the CSS-modules + tokens approach with a global utility framework. Rejected because: (a) it introduces a new build pipeline and dep for a game of this size, (b) tokens.css covers the same need with one file and zero deps, (c) Tailwind's color system is HSL-based — converting to OKLCH later would re-invent tokens.css anyway.
- **CSS-in-JS (vanilla-extract / styled-components).** Would give type-safe tokens at the cost of runtime overhead and a heavier learning curve. Rejected because CSS modules + CSS custom properties already give us scoped styles + dynamic theming with zero runtime; vanilla-extract is a future option if token type-safety becomes a real issue.
- **`framer-motion` for animations.** Would simplify gesture-driven and physics-style animations. Rejected because: (a) Phase A needs only fade/slide/pulse — trivially expressible in CSS, (b) `framer-motion` adds ~20 kB gzipped of JS that runs on the main thread, directly contradicting the INP wins from ADR-0004, (c) the team already validated CSS-only animations meet the bar in REF-04. We can revisit only if a future REF needs gesture-tracked physics.
- **Light theme support in Phase A.** Game UIs almost universally ship dark-by-default; a light theme would dilute the "neon arcade" identity and double the contrast-pair test matrix without a clear user request. **Reserved for a future REF; tokens.css already declares the empty `prefers-color-scheme: light` slot to prevent UA inversion.** → *Superseded by REF-07 on 2026-04-26 (see "REF-07 revision" in Neutral above). Doubling the contrast matrix turned out to be trivial (one `describe.each`), the "identity dilution" risk was mitigated by keeping the board canvas dark on both themes, and shipping a light mode improved accessibility for users with photosensitive astigmatism without costing the neon identity on the playfield.*

## References

- Spec: [REF-06 — Visual Redesign](../SDD/specs/REF-06-visual-redesign.md), Phase A.
- Tokens: [`src/styles/tokens.css`](../../src/styles/tokens.css).
- Typography: [`src/styles/typography.css`](../../src/styles/typography.css).
- Motion: [`src/styles/motion.css`](../../src/styles/motion.css).
- Layout primitives: [`src/styles/layout.css`](../../src/styles/layout.css).
- Contract tests: [`src/styles/__tests__/tokens.spec.ts`](../../src/styles/__tests__/tokens.spec.ts).
- WCAG 2.1 — Contrast (Minimum / Enhanced): <https://www.w3.org/TR/WCAG21/#contrast-minimum>, <https://www.w3.org/TR/WCAG21/#contrast-enhanced>.
- OKLCH and gamut handling — Evil Martians: <https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl>.
- CSS-only motion baseline — McCormick "Roguelike with only CSS": <https://www.mccormick.cx/news/entries/css-only-roguelike>.
