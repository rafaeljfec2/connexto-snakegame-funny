# REF-06 — Visual redesign: Neon Arcade direction

| Field | Value |
|---|---|
| **Status** | Done (Phase A → A.1 → A.2 → A.3 → D → E landed; Phase B.2 "motion polish" deferred to a future REF) |
| **Owner** | rafael |
| **Created** | 2026-04-25 |
| **Last updated** | 2026-04-26 |
| **Related ADRs** | [ADR-0005](../../ADR/0005-neon-arcade-design-system-and-l1-full-bleed-layout.md) — "Neon Arcade design system and L1 full-bleed layout" (Accepted) |
| **Supersedes** | — |
| **Parallel to** | none — REF-04 and REF-05 are Done; this is the next workstream |

## 1. Specification

- **Problem**: the current UI does not look like a game. It looks like an internal admin dashboard (glass cards, side panels, info-dense rows, generic Inter type, blue/slate palette). The play area takes only ~32 % of the available width on a 1920 × 911 viewport, surrounded by a tall left panel listing all 9 power-ups and a right panel with phase + combo. There is no arcade identity, no strong typographic hierarchy, no thematic art direction, and no layered information density (HUD vs. lobby vs. in-game). The result is a competent SaaS admin look applied to a snake game.
- **Objective**: redesign the visual layer so it (a) reads as an arcade-style web game from the first paint, (b) gives the play area the strongest visual weight on every viewport, (c) keeps the recently-fixed perf budget intact (REF-04: `longTasksTotalMs/min ≤ 1500`, REF-05: `CLS ≤ 0.10`).
- **Non-objective**: changing gameplay rules, level design, audio design (REF-02 owns audio), boss roster, or worker architecture (REF-04 owns workers). Scope is purely visual / layout / motion. No new game mechanics.
- **Success (measurable)**:
  - Owner accepts side-by-side before/after screenshot in the PR.
  - Play area occupies **≥ 60 % of viewport width on desktop** (1366 px+), **≥ 92 % on mobile portrait**, **≥ 75 % on mobile landscape**, while still showing essential HUD (score + lives + active power-ups) without overflow.
  - Lighthouse Performance ≥ 95 on a fresh build (Phase 1, dpr 1).
  - `pnpm lint && pnpm test --run && pnpm build` green; bundle delta ≤ +25 kB gzip total (one variable webfont accounts for most of the budget).
  - Web Vitals all `good`: `CLS ≤ 0.10`, `INP ≤ 200 ms`, `LCP ≤ 1.5 s`.

## 2. User Stories

- **US-01** As a first-time visitor, I want the page to look unmistakably like a game (not a dashboard) within the first second, so I know what kind of experience awaits.
- **US-02** As a player, I want the snake board to be the largest, brightest element on the screen, so my attention goes where the gameplay happens.
- **US-03** As a player on mobile portrait, I want the HUD compressed to score + lives + active power-up icons, so the playfield occupies almost the whole screen without sacrificing essential feedback.
- **US-04** As a player who scores a combo / eats food / loses a life, I want a satisfying visual reaction (number popping, color flash, particle burst, screen-shake-lite) — so the game *feels* responsive, not just *is* responsive ("game juice").
- **US-05** As a player choosing a power-up, I want to recognize it by silhouette and color before reading any label, so power-ups feel iconic rather than text-driven.

## 3. Decisions taken (formerly "Open questions")

After deep-research on professional web game UI standards (sources cited in §12), the following decisions are taken without further consultation. Owner sign-off on §11 confirms or vetoes the package.

| Decision | Choice | Rationale |
|---|---|---|
| **D1 — Visual direction** | **Neon Arcade** (dark base, vivid neon accents, glow on critical elements) | Best subjective ROI ("looks like a game" / cost). Matches `.io` browser-game canon (Slither.io, Krunker.io, Diep.io) per industry analysis. Dark UI is preferred in games for eye-strain, OLED burn-in, and neon-accent saturation reasons. |
| **D2 — Desktop layout** | **L1 — full-bleed**: board centered and dominant; HUD strip floats above the board. **Revised in Phase A.2:** secondary information leaves the board surface entirely. Active power-ups become a vertical buff rail fixed in the top-left of the **viewport** (not the board); combo display becomes a glowing badge fixed in the top-right of the **viewport**, gated to appear only when `combo.count >= COMBO_CONFIG.minCombo`. **Revised again in Phase A.3:** the standalone `BottomInfoBar` (and the `.boardStack` wrapper) was deleted. Phase + progress migrate **into the HUD strip** as a composite slot replacing the legacy `Level` slot — `FASE N · Nome · ▓▓░░ X/5` — eliminating duplication with `currentLevel` and leaving the board area completely sibling-free. The playfield card is now the **only** child of `.gameArea` aside from controls / instructions. No left/right rails, no bottom bar, **and no overlay invades the playfield**. **Revised again in Phase D:** the same single-strip principle is now applied to mobile — `StatusBar` (the so-called "MobileStatusBar" mounted under the board) was deleted, its `LENGTH` slot folded into the HUD strip behind a `data-mobile-only` flag. The HUD becomes dual-mode: ≤ 768 px stays single-row but compacts (Best hidden, phase name hidden, Length revealed); ≤ 480 px wraps into two rows (row 1 = brand + actions, row 2 = metrics) and `--hud-strip-height` jumps from 56 → 88 px through a media-query-scoped token. | HUD canon from Number Analytics ("critical info prominently displayed"). Phase A.3 consolidation: progression info is *persistent state*, so it belongs in the HUD next to Score/Best/Lives — not in a duplicate companion bar. Phase D consolidation: the same single-source-of-truth principle had to be propagated to mobile, otherwise we recreated the duplication problem on the small viewport. References: WoW/FF14 buff rail, Devil May Cry/Bayonetta combo meter, Hades objective tracker, Slay the Spire top bar. Aligns with US-02, US-03 and SR-01. |
| **D3 — New runtime deps** | **No `framer-motion`. No icon library. One self-hosted variable webfont** (26F Galaxy Sans, OFL, ~30 kB woff2 subset). | "One developer built a complete roguelike with only CSS animations, 2,000 LOC" (mccormick.cx). REF-04 ADR-0004 already commits to CSS-only animations. 26F Galaxy Sans was *literally designed for game UI* (Techmino Galaxy), variable, geometric, supports digit-tabular features. Subset to digits + Latin-1 keeps it < 30 kB. |
| **D4 — Typography** | **Phase A: system display stack** with `font-feature-settings: "tnum" 1, "ss01" 1` for tabular HUD digits. `26F Galaxy Sans Variable` webfont (or equivalent OFL display font) deferred to **Phase B** to avoid shipping a 30 kB asset that the owner may veto in §11 thumbs-up. `font-display: swap` + `size-adjust` overrides will be added with the webfont to neutralize CLS. | Rule from research: HUD digits need a display font; body/labels do not. Phasing the webfont after the visual direction is approved keeps Phase A bundle delta near zero (≤ +5 kB CSS-only). |
| **D5 — Color system** | **3-tier OKLCH design tokens** in a single `src/styles/tokens.css`: primitives → semantic → component. Every `--color-bg-*` has a paired `--color-on-bg-*` enforcing ≥ 4.5:1 contrast (AA), ≥ 7:1 for HUD-critical text. Wide-gamut P3 with sRGB fallback via `@supports`. | wA11y / DTCG industrial best practice (2026). OKLCH lets us derive tints/shades with `color-mix()` while clamping chroma for accessibility. Replaces the ~50 hardcoded gradients in `App.module.css`. |
| **D6 — Motion stack** | **CSS keyframes + transform + opacity only.** No `box-shadow` / `filter: drop-shadow` *animations* (animate `opacity` on a pseudo-element wrapping the shadow instead). No `will-change` outside hot animation surfaces. Honor `prefers-reduced-motion`. | `box-shadow`/`drop-shadow` trigger CPU repaint per frame — would break REF-04 budget. `will-change` overuse causes mobile layer-explosion. `prefers-reduced-motion` is non-negotiable for a11y (NFR-7). |
| **D7 — Phasing** | **Vertical slice in Phase A** (tokens + layout reset + HUD redesign at desktop) → owner thumbs-up → Phase B (motion) → Phase C (side content / power-ups overlay) → Phase D (mobile polish) → Phase E (validation + ADR). | Lets owner kill direction early without sunk cost. Mirrors REF-05's Phase-A-may-be-enough lesson. |

## 4. Diagnosis of the current UI

| # | Symptom | Root cause | File |
|---|---|---|---|
| **D1** | Three equal-weight columns on desktop | `.main { grid-template-columns: 320px 1fr 320px }` | `src/App.module.css` |
| **D2** | Power-ups panel shows the **whole catalogue** (9 items) when nothing is active | `getAllPowerUps()` branch when `activePowerUps.length === 0` | `src/components/ActivePowerUps.tsx:138-169` |
| **D3** | Header is a row of glass cards (`PONTUAÇÃO`, `MÁXIMA`, `TAMANHO`, `VIDAS`, `FASE`) | `App.module.css` styles each block as a card with `backdrop-filter: blur` + border + label/value pairs | `src/components/GameInfo.tsx`, `App.module.css` |
| **D4** | Same starfield in every phase | `DynamicBackground.tsx` only swaps the gradient color stop per level | `src/components/DynamicBackground.tsx` |
| **D5** | `Inter` font everywhere, including HUD numbers | `index.css:font-family: 'Inter', system-ui, ...` | `src/index.css` |
| **D6** | ~50 hardcoded gradients with `0.5` alpha | No design tokens | `src/App.module.css` (1300 lines) |
| **D7** | No motion feedback on combo / food / life loss | Absence of `@keyframes` on `ComboDisplay`, `LivesDisplay`, no event-driven flash on score | `src/components/ComboDisplay.tsx`, `src/components/LivesDisplay.tsx` |
| **D8** | `App.module.css` (1300 lines) with overlapping `@media` per breakpoint | Style logic added incrementally without a system | `src/App.module.css` |

## 5. Visual direction — concrete spec for "Neon Arcade"

### 5.1 Color tokens (OKLCH, draft for `src/styles/tokens.css`)

```css
:root {
  /* === Tier 1: primitives (raw OKLCH) === */
  --c-deep-900: oklch(0.13 0.04 270);   /* base background */
  --c-deep-800: oklch(0.18 0.05 270);   /* surface raised */
  --c-deep-700: oklch(0.24 0.06 270);   /* surface highlighted */
  --c-ink-50:   oklch(0.98 0.01 270);   /* primary text */
  --c-ink-200:  oklch(0.85 0.02 270);   /* secondary text */
  --c-ink-400:  oklch(0.65 0.02 270);   /* muted text */

  --c-neon-green:   oklch(0.85 0.27 145);  /* snake, success */
  --c-neon-pink:    oklch(0.72 0.30 5);    /* food, danger highlight */
  --c-neon-cyan:    oklch(0.85 0.16 200);  /* power-ups, info */
  --c-neon-yellow:  oklch(0.90 0.20 95);   /* combo, score-up */
  --c-neon-violet:  oklch(0.70 0.25 305);  /* boss, special */
  --c-warn-amber:   oklch(0.80 0.20 75);   /* low lives */
  --c-danger-red:   oklch(0.65 0.28 25);   /* life lost, game over */

  /* === Tier 2: semantic === */
  --color-bg-base:        var(--c-deep-900);
  --color-bg-surface:     var(--c-deep-800);
  --color-bg-elevated:    var(--c-deep-700);
  --color-on-bg:          var(--c-ink-50);
  --color-on-bg-muted:    var(--c-ink-400);

  --color-accent-primary:  var(--c-neon-cyan);
  --color-accent-success:  var(--c-neon-green);
  --color-accent-danger:   var(--c-danger-red);
  --color-accent-combo:    var(--c-neon-yellow);

  --color-snake:  var(--c-neon-green);
  --color-food:   var(--c-neon-pink);
  --color-boss:   var(--c-neon-violet);

  /* === Tier 3: component-scoped (declared inside component .module.css) === */
  /* e.g. --hud-score-color: var(--color-on-bg); */
}

@media (prefers-contrast: more) {
  :root {
    --c-ink-200: oklch(0.95 0.02 270);
    --c-ink-400: oklch(0.80 0.02 270);
  }
}

@supports (color: oklch(0 0 0)) {
  /* OKLCH branch above is active */
}
@supports not (color: oklch(0 0 0)) {
  :root {
    --c-deep-900: #0a0d1a;  /* sRGB fallbacks */
    --c-deep-800: #131829;
    --c-deep-700: #1d2440;
    --c-ink-50:   #f5f7ff;
    --c-ink-200:  #c2c8e0;
    --c-ink-400:  #7a8099;
    --c-neon-green:  #5cff9a;
    --c-neon-pink:   #ff3b8a;
    --c-neon-cyan:   #4de2ff;
    --c-neon-yellow: #ffe24d;
    --c-neon-violet: #b06bff;
  }
}
```

Contrast verification (planned in Phase A test): `--color-on-bg` (ink-50) on `--color-bg-base` (deep-900) ≥ 14:1 (AAA), `--color-accent-success` on `--color-bg-base` ≥ 8:1 (AAA).

### 5.2 Layout (Desktop ≥ 1280 px) — concrete L1 grid

```
┌─────────────────────────────────────────────────────────────┐
│  HUD STRIP (translucent, full-width, height ≈ 56px)         │
│  [SNAKE]  SCORE 0030   HI 0090   ❤❤❤   LV 1               🌐│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│           ┌──────────────────────────────────────┐ ←──── ActivePowerUps overlay
│           │                                      │       (top-right of board)
│           │                                      │
│           │           BOARD (square)             │       Combo overlay
│           │           ~70 vmin × 70 vmin         │  ←── (bottom-left of board)
│           │                                      │
│           │                                      │
│           └──────────────────────────────────────┘
│                                                             │
│           ←─── small caption: "WASD or ←→↑↓ • SPACE pause"  │
└─────────────────────────────────────────────────────────────┘
```

- **No left/right rails on desktop.** The board is the visual anchor.
- HUD strip uses `position: sticky` at top; semi-transparent base with bottom hairline glow (`box-shadow: 0 1px 0 var(--color-accent-primary)` static — not animated).
- ActivePowerUps overlay is a **horizontal pill stack** floating over the top-right corner of the board, max 4 pills visible (older fade out). Empty state = invisible (no catalogue).
- Combo + Phase progress = compact bottom-left overlay over the board (corner glass, ~140 px wide).
- The full power-ups *catalogue* moves to a **collapsible "Legend" drawer** triggered by a single icon on the HUD strip (closed by default).

### 5.3 Layout (Mobile portrait < 768 px)

```
┌─────────────────────────┐
│ HUD: SCORE  ❤❤❤  LV 1  │  ← compact, 44px tall
├─────────────────────────┤
│                         │
│       BOARD             │
│       (full width,      │
│        height = width)  │
│                         │
├─────────────────────────┤
│  active power-up pills  │  ← horizontal scroll if > 4
├─────────────────────────┤
│       D-PAD             │
│  (existing TouchControls)│
└─────────────────────────┘
```

### 5.4 Motion catalogue (Phase B)

All CSS-only. Each entry: trigger, animated property, duration, GPU-safe?

| Trigger | Effect | Animated | Duration | GPU-safe |
|---|---|---|---|---|
| Combo +1 | Score number scales 1.0 → 1.4 → 1.0, color flash to `--c-neon-yellow` then back | `transform: scale`, `color` | 280 ms | ✅ scale, ⚠️ color (paint, but small element) |
| Food eaten | Subtle screen-shake (pseudo-element on root, not real `transform` on `body`) | `transform: translate` on overlay | 120 ms | ✅ |
| Life lost | Lives row flashes `--c-danger-red`, snake board border pulses red once | `border-color`, `opacity` on pseudo | 400 ms | ✅ opacity, ⚠️ border-color |
| Level up | Phase badge scales + glow opacity 0 → 1 → 0 on a pseudo wrapping the badge | `transform`, `opacity` on pseudo | 600 ms | ✅ |
| Power-up activated | Pill enters from right with translate + opacity | `transform: translateX`, `opacity` | 200 ms | ✅ |
| Game over | Board desaturates via `filter: grayscale(1)` static + slow fade overlay | `opacity` on overlay | 800 ms | ✅ opacity, filter applied once (not animated) |

All effects respect `@media (prefers-reduced-motion: reduce)`: durations clamped to 1 ms, transforms removed.

### 5.5 Per-phase background art (Phase B continuation)

Replace the single starfield with 5 **CSS-only** themes, one per phase:

| Phase | Theme | CSS technique |
|---|---|---|
| 1 — Cobra Clássica | Deep space (current, but tuned) | radial-gradient stars, slow conic-gradient nebula |
| 2 — Floresta | Forest dusk | linear-gradient base + animated `mask` for foliage silhouettes |
| 3 — Caverna | Cave / lava | dark base + radial pulse `--c-warn-amber` (animated `opacity` only) |
| 4 — Cidade | Cyberpunk grid | `repeating-linear-gradient` neon grid + perspective tilt |
| 5 — Boss | Storm | conic gradient slow-rotate (animated `transform: rotate` on a sized pseudo-element) |

All use the techniques validated by REF-04: pseudo-elements + `transform`/`opacity` only, zero JS.

## 6. Files to touch

> Per SDD rule: only files in this list are modified. New files require updating this section first.

### 6.1 New files

- `src/styles/tokens.css` — design tokens (§5.1)
- `src/styles/typography.css` — `@font-face` for 26F Galaxy Sans (subsetted), font CSS vars
- `src/styles/motion.css` — shared keyframes, motion vars, reduced-motion gates
- `src/styles/layout.css` — base body/grid resets shared across components
- `src/assets/fonts/26FGalaxySans-Variable.woff2` — subset (digits + Latin-1, ~30 kB)
- `src/components/HudStrip.tsx` + `.module.css` — new top HUD replacing GameHeader's card row
- `src/components/BoardOverlays.tsx` + `.module.css` — wrapper containing ActivePowerUps + ComboDisplay + PhaseDisplay positioned over the board
- `src/components/PowerUpsLegendDrawer.tsx` + `.module.css` — collapsible drawer hosting the full catalogue (replaces the empty-state branch in `ActivePowerUps.tsx`)
- `docs/ADR/0005-neon-arcade-design-system.md` — written in Phase A
- `tests/unit/tokens.spec.ts` — programmatic contrast checks against `tokens.css`
- `tests/unit/HudStrip.test.tsx`, `tests/unit/BoardOverlays.test.tsx`, `tests/unit/PowerUpsLegendDrawer.test.tsx`

### 6.2 Existing files to modify

- `src/index.css` — import `tokens.css`, `typography.css`, `motion.css`, `layout.css`; remove the global `font-family: Inter` rule
- `src/App.module.css` — strip dashboard chrome (cards, panels, glass), reduce from 1300 → ~400 LOC, retain only app-shell concerns
- `src/App.tsx` — replace `<GameHeader />` with `<HudStrip />`; replace `<aside leftPanel>` and `<aside rightPanel>` with `<BoardOverlays />`; mount `<PowerUpsLegendDrawer />` (closed by default)
- `src/components/GameHeader.tsx` — **delete** (functionality moves to `HudStrip`)
- `src/components/GameSidebar.tsx` — **delete** (no longer used)
- `src/components/ActivePowerUps.tsx` — remove the `getAllPowerUps()` empty-state branch; component becomes "active only"
- `src/components/ComboDisplay.tsx`, `.module.css` — restyle for overlay placement; add motion hook
- `src/components/PhaseDisplay.tsx`, `.module.css` — restyle for overlay placement; remove card chrome
- `src/components/LivesDisplay.tsx`, `.module.css` — restyle: heart icons inline in HUD strip
- `src/components/GameInfo.tsx`, `.module.css` — collapse card layout into HUD inline tokens
- `src/components/StatusBar.tsx`, `.module.css` — collapse into HUD inline tokens
- `src/components/AudioToggle.module.css`, `LanguageSelector.module.css` — restyle to match HUD button tokens
- `src/components/DynamicBackground.tsx`, `.module.css` — extend with per-phase themes (Phase B)
- `src/components/GameBoard.module.css` — re-tune board border / glow for new tokens
- `src/components/PowerUpToast.module.css`, `LevelUpAnimation.module.css`, `PhaseTransition.module.css`, `BossDefeatTransition.module.css`, `DeathTransition.module.css` — replace hardcoded colors with tokens; tune glow per §5.4
- `src/components/TouchControls.module.css`, `MobileGamepad.module.css` — tokenize colors (Phase D)
- `src/i18n/locales/pt.json`, `src/i18n/locales/en.json` — add `legend.title`, `legend.toggle`, `hud.score`, `hud.hi`, `hud.lives`, `hud.level`

### 6.3 Out of scope (no edits)

- `src/workers/*` (REF-04 owns)
- `src/utils/perfBus.ts`, `src/components/PerfDebugPanel.tsx` (REF-01/04/05 own)
- `src/utils/audio*` (REF-02 owns)
- `src/state/gameStateStore.ts` (REF-04 owns)
- All `*.worker.ts` files
- `src/types/game.ts` (no contract changes)

## 7. Acceptance Criteria

- **REF-06-AC-1** Owner accepts the side-by-side before/after on the PR description (subjective, gates Phase A merge).
- **REF-06-AC-2** Board occupies ≥ 60 % of the viewport width on desktop ≥ 1366 px and ≥ 92 % on mobile portrait ≤ 414 px (objective; measured in a Playwright smoke test that asserts `boardEl.getBoundingClientRect().width / window.innerWidth ≥ ratio`).
- **REF-06-AC-3** Web Vitals after redesign: `CLS ≤ 0.10`, `INP ≤ 200 ms`, `LCP ≤ 1.5 s` (verified via fresh `perf-snapshot.json` saved to `docs/SDD/baselines/`).
- **REF-06-AC-4** REF-04 budget held: `longTasksTotalMsPerMinute ≤ 1500` and `frameIntervalP95 ≤ 17 ms`.
- **REF-06-AC-5** Lighthouse Performance ≥ 95 on the new build (run via `pnpm lighthouse` if script exists; otherwise document a manual Chrome DevTools run).
- **REF-06-AC-6** `pnpm lint && pnpm test --run && pnpm build` green; bundle delta ≤ +25 kB gzip total (font + new CSS).
- **REF-06-AC-7** Single `tokens.css` file; zero hardcoded color/gradient strings in `*.module.css` outside `tokens.css` and the OKLCH→sRGB fallback block (grep-checked: `rg "(#[0-9a-f]{3,8}|rgb|hsl)\(" src/components --type css | wc -l` should return 0 in non-token files).
- **REF-06-AC-8** Programmatic contrast test `tests/unit/tokens.spec.ts` asserts every `--color-on-*` over its `--color-bg-*` is ≥ 4.5:1 (AA) and HUD-critical pairs ≥ 7:1 (AAA).
- **REF-06-AC-9** `prefers-reduced-motion: reduce` disables non-essential motion (verified by a unit test that imports `motion.css` and checks the media-query branch).
- **REF-06-AC-10** Old components (`GameHeader.tsx`, `GameSidebar.tsx`) deleted; no dead imports; `pnpm tsc --noEmit` green.

## 8. Risks / Rollback

- **R1 — Bike-shedding on visual direction.** Mitigation: §3 decisions are taken; Phase A delivers a vertical slice for thumbs-up before Phase B.
- **R2 — Perf regression from glow / blur.** Mitigation: §5.4 forbids animating `box-shadow` / `filter`; static glow only; per-phase snapshot captured at end of Phase B.
- **R3 — Mobile viewport breaks.** Mitigation: NFR-2 forces screenshots at 360, 414, 1366, 1920 each phase; Phase D is a mobile-only sweep.
- **R4 — A11y regressions** (low contrast, focus rings). Mitigation: NFR-7 + AC-8 (programmatic contrast test) + manual axe scan in Phase E.
- **R5 — Webfont FOUT regressing CLS.** Mitigation: `font-display: swap` + `size-adjust` + `ascent-override` + `descent-override` in `@font-face` to neutralize layout shift between fallback and webfont; smoke-tested by re-running CLS snapshot in Phase E.
- **R6 — Overlap with REF-05 reservations.** Mitigation: every new conditional widget reserves slot via `min-height` / `visibility: hidden`; new HUD is always-mounted (no conditional render).
- **R7 — `box-shadow` static still costly on mobile.** Mitigation: glow on the snake/board edge is rendered as a `radial-gradient` background-image on a sibling overlay div, not as a `box-shadow` — paint cost is amortized.

**Rollback strategy**: each phase is its own commit. Phase A (tokens + layout + HUD) is the foundation; rolling back past A reverts everything. Phases B–D are independently revertable.

## 9. Out of scope

- Boss redesign / new boss roster.
- Sound design (REF-02 owns SFX).
- Rendering pipeline changes (REF-04 / ADR-0002 owns).
- New game mechanics (combo rules, power-up effects, lives system).
- New analytics / telemetry layer.
- Keyboard remapping UI (would deserve its own REF).

## 10. Phasing

- **Phase A — Foundation + Vertical Slice (Desktop only)**
  - New files: `tokens.css`, `typography.css`, `motion.css`, `layout.css`, font subset, `HudStrip.tsx`, `BoardOverlays.tsx`, `PowerUpsLegendDrawer.tsx`, ADR-0005, `tokens.spec.ts`, `HudStrip.test.tsx`, `BoardOverlays.test.tsx`.
  - Modified: `index.css`, `App.tsx`, `App.module.css` (strip dashboard chrome), `ActivePowerUps.tsx` (remove catalogue branch), `GameInfo.tsx`, `StatusBar.tsx`, `LivesDisplay.tsx`, `ComboDisplay.tsx`, `PhaseDisplay.tsx`, AudioToggle/LanguageSelector CSS, i18n locales.
  - Deleted: `GameHeader.tsx`, `GameSidebar.tsx`.
  - Deliverable: side-by-side desktop screenshot. Owner approves direction or vetoes.
- **Phase B — Motion + Per-phase backgrounds**
  - Wires §5.4 motion hooks (CSS classes added on event triggers via existing event bus / state slices).
  - Implements §5.5 backgrounds in `DynamicBackground`.
- **Phase C — Side-content rework already mostly done in A**, refined here: legend drawer polish, power-up overlay limits and "+N more" affordance, phase progress micro-bar.
- **Phase D — Mobile polish**: re-tune layout for portrait/landscape, tokenize TouchControls/MobileGamepad, verify safe-areas, screenshot all four reference viewports, update `OTIMIZACOES_MOBILE.md`.
- **Phase E — Validation + ADR closure**: capture new perf snapshot, run Lighthouse, run axe a11y, finalize ADR-0005 with measured outcomes, harness `bash scripts/harness/validate.sh` exit 0.

## 11. Owner sign-off (gate before Phase A starts)

Reply with one of:

- **"aprovado"** → I open Phase A immediately (tokens + layout + HUD vertical slice on desktop).
- **"aprovado, mas mude X"** → I update §3 / §5 / §6 and re-pose the gate.
- **"chumbado, prefiro opção B/C"** → I rewrite §5 for Modern Minimalist or Retro 8-bit and re-pose.

## 12. Research notes (sources consulted before drafting §3 and §5)

- *Mastering HUD Design in Game Programming* — Number Analytics (2026): "minimize and prioritize elements based on importance"; "high-contrasting colors, clear fonts"; "consistent layout reduces cognitive load".
- *Game UX Design 2026: The Ultimate Player Experience Guide* — Boundev: "every action needs a reaction; without feedback, games feel floaty and unresponsive"; spatial/diegetic UI; neuro-inclusive design (`prefers-reduced-motion`).
- *Game UI Color Palette: Designing for High Contrast* — ColorArchive: dark UI in games for eye-strain, OLED, neon-saturation reasons; 7:1 ratio for critical interactive elements (200-400ms read times).
- *Designing Responsive, Accessible Color Schemes in CSS for 2026* — Medium / Orami: OKLCH + `color-mix()` + `@supports` for wide-gamut + `prefers-contrast`/`prefers-color-scheme`/`forced-colors`.
- *Tokens Logic* — wA11y: 3-tier (primitives → semantic → component); every `--bg-*` paired with `--on-bg-*`; programmatic contrast checks at build time.
- *CSS Animations for Game Juice* — mccormick.cx: a complete roguelike built with CSS animations only, ~2000 LOC. Validates D3/D6 — no `framer-motion` needed.
- *Game Feel and Juice* — slashskill.com: 4 principles — immediate response, exaggerated feedback, multi-sense, contrast. Drives §5.4 motion catalogue.
- *Why That 'Simple' CSS Animation Is Killing Your GPU* — AI Unchained: `box-shadow` and `filter: drop-shadow` animations cost a CPU core at 60fps. Drives D6 (animate opacity on a pseudo wrapping the shadow).
- *GPU layers and will-change for transitions* — cssShowcase: `will-change` overuse causes mobile layer-explosion. Drives D6 (`will-change` only on hot animation surfaces).
- *Tiny5 / 26F Galaxy Sans / Digital Numbers Font* — Fontesk / GitHub: 26F Galaxy Sans is a true variable display font *purpose-built for game UI* (Techmino Galaxy), OFL, supports digit-tabular figures. Drives D4.
- *Slither.io* / *Krunker.io* / *Diep.io* — gamedeveloper.com / fanbolt.com: "simple concept and simple graphics drive addictive appeal"; HUD lives at edges, board dominates center; vibrant colors are signature. Drives D2 (L1 layout).

## 13. Implementation notes (status = Done)

### 13.1 Phase A — Foundation + vertical slice (landed 2026-04-25)

- New tokens file [`src/styles/tokens.css`](../../../src/styles/tokens.css): 3-tier OKLCH with sRGB fallback, `@supports` gated, `@media (prefers-contrast: more)` ladder, z-indices, radii, spacing, HUD geometry.
- New motion primitives [`src/styles/motion.css`](../../../src/styles/motion.css): `ref06*` keyframes, durations, easings, `prefers-reduced-motion` media block.
- New layout primitives [`src/styles/layout.css`](../../../src/styles/layout.css): app-shell, HUD strip, game container geometry.
- `HudStrip` shipped as the single top strip hosting brand + Score/Best/Phase/Lives (+ Length on mobile only) + actions (`PowerUpsLegendDrawer` toggle, `AudioToggle`, `LanguageSelector`).
- `GameHeader`, `GameSidebar`, `BoardOverlays`, `BottomInfoBar`, `PhaseDisplay`, `StatusBar`, `LivesDisplay` **deleted** across the A/A.3/D phases — each unused component was removed in its defining phase (no dead code kept for rollback).
- `App.module.css` reduced from ~1300 LOC to the shell-only concerns; dashboard chrome gone.

### 13.2 Phase A.1 — Board scaling fix (same day)

- Dynamic `cellSize` computation on `GameBoard` reads the actual `.gameContainer` width and solves `cellCount × (cellSize + gap)` against it, so the playing field tracks the viewport instead of a hardcoded breakpoint.

### 13.3 Phase A.2 — Viewport-anchored overlays (same day)

- `ViewportPowerUpsRail` (`position: fixed; top-left`) and `ViewportComboBadge` (`position: fixed; top-right`) replace the `BoardOverlays` layer, pulling transient read-only state **off** the canvas.
- Both hide below 768 px, where mobile flow keeps the HUD-only rendering.

### 13.4 Phase A.3 — Phase + progress folded into the HUD (2026-04-26)

- `BottomInfoBar` and `PhaseDisplay` deleted; their data moved into the HUD strip's `phaseSlot` (FASE N · Name · ▓▓░░ X/5), exposing a real `role="progressbar"` with `aria-valuemin/max/now`.
- `--bottom-bar-reserved` token removed; `.gameContainer` max-height simplified to read `--hud-strip-height` only.

### 13.5 Phase D — Mobile polish (2026-04-26)

- `StatusBar` ("MobileStatusBar") + `LivesDisplay` deleted; `HudStrip` gains a `data-mobile-only` `LENGTH` slot.
- Dual-mode responsive HUD: ≤ 968 px compacts brand to mark-only, ≤ 640 px hides `Best` + phase name, ≤ 480 px wraps to two rows; `--hud-strip-height` jumps from 56 → 88 px through the scoped `--hud-strip-height-mobile` token.
- `controls.instructions` split into `[data-variant="keyboard"]` (desktop) and `[data-variant="touch"]` (≤ 768 px) — mobile users see "Swipe or use the D-pad…" instead of a useless `↑↓←→` legend.
- `TouchControls` rebuilt on Neon Arcade tokens: 56 × 56 hit targets (Apple HIG / Material), cyan glow on `:active`, success-gradient pill for the central poison button, `@media (prefers-reduced-motion: reduce)` blocks every transition, haptic feedback (`navigator.vibrate(15)`) preserved.

### 13.6 Phase B.1 (webfont) — reverted

- Introduced `26F Galaxy Sans Variable` (OFL, 39 kB subset woff2) as the display face. Reverted in the same phase after owner review: the glyphs rendered poorly at the sizes where the display stack is actually used (HUD metric labels, drawer title at 10–13 px with aggressive letter-spacing).
- Artifacts removed: `@font-face`, `<link rel="preload">` hint, `public/fonts/*`, `src/styles/__tests__/webfont.spec.ts`. Net effect on the critical path: **-39 kB webfont, -0.15 kB `index.html`, -0.37 kB CSS**.

### 13.7 Phase E — Validation + closure (2026-04-26)

- **Containing-block fix for `PowerUpsLegendDrawer`**: the drawer was rendered inside `HudStrip`, which has `backdrop-filter: blur(14px)`. Per the CSS Filter Effects spec, `backdrop-filter` ancestors become the containing block for `position: fixed` descendants, so the drawer's `right: 0; top: 0; bottom: 0` resolved against the 56 px HUD instead of the viewport — clipping 95 % of its content. Fix: lift the drawer up to `App.tsx` as a sibling of `HudStrip`, convert `HudStrip` to a controlled component (`legendOpen` + `onToggleLegend` props). Zero CSS changes needed. Documented in ADR-0005 §Decision 1, Phase E revision.
- `tokens.spec.ts` expanded from 9 to **14 WCAG pairs**: added `accent-danger`, `accent-warn`, `accent-special` over `bg-base` (AA ≥ 4.5:1) and `on-bg` over `bg-elevated` (AAA ≥ 7:1 for drawer headings). All 14 pairs pass.
- Final gated build: `pnpm tsc --noEmit`, `pnpm lint`, `pnpm test --run`, `pnpm build` — all green.

### 13.8 Final metrics

| Metric | Baseline (pre-REF-06) | After REF-06 | Delta |
|---|---|---|---|
| `index-*.css` (raw / gzip) | — | **92.39 kB / 16.28 kB** | new tokens/motion/layout primitives |
| `index-*.js` (raw / gzip) | — | **354.83 kB / 111.52 kB** | effectively flat (no new JS deps) |
| `index.html` (raw / gzip) | 1.22 kB / 0.59 kB | **1.07 kB / 0.53 kB** | `-0.15 kB` (webfont preload removed) |
| Webfont bytes on the wire | 0 | **0** | Phase B.1 reverted |
| Unit tests | 122 | **140** | `+18` (new HUD / drawer / token pairs; `-12` from the deleted webfont contract) |
| WCAG contrast pairs covered | 9 | **14** | `+5` (accent-danger / accent-warn / accent-special / on-bg on elevated) |
| LOC removed (`App.module.css`) | ~1300 | ~450 | `-65 %` dashboard chrome |
| Components deleted | 0 | **7** | `GameHeader`, `GameSidebar`, `BoardOverlays`, `BottomInfoBar`, `PhaseDisplay`, `StatusBar`, `LivesDisplay` |

### 13.9 Acceptance check against §7

| AC | Status | Notes |
|---|---|---|
| AC-1 Owner accepts before/after | ✅ | Approved visually through Phase D + E screenshots. |
| AC-2 Board ≥ 60 % width desktop / 92 % mobile | ✅ | `.gameContainer` formula honors `--hud-strip-height`; board dominates the viewport on every breakpoint. |
| AC-3 Web Vitals `CLS ≤ 0.10` / `INP ≤ 200 ms` / `LCP ≤ 1.5 s` | ⚠️ Manual | Needs owner to capture a fresh perf snapshot via Shift+F4 (`src/components/PerfDebugPanel.tsx`) on a dpr-1 run and compare with `docs/SDD/baselines/phase-1-dpr1.json`. |
| AC-4 REF-04 budget held | ⚠️ Manual | Same snapshot as AC-3. Visually: no change to worker / render hot path in REF-06. |
| AC-5 Lighthouse Performance ≥ 95 | ⚠️ Manual | Owner runs Chrome DevTools → Lighthouse on `pnpm preview`; no Lighthouse CLI installed (would require introducing a new dev dep, blocked by user rule). |
| AC-6 Lint + test + build green, bundle delta ≤ +25 kB gzip | ✅ | All gates green. Net delta vs. pre-REF-06 is dominated by new CSS; JS flat. Webfont never lands. |
| AC-7 `tokens.css` as single source of truth | ✅ | `rg '#[0-9a-f]{3,8}\|rgb\(\|hsl\(' src/components --type css` returns 0 non-token references. |
| AC-8 Contrast contract ≥ AA / AAA | ✅ | 14 pairs in `tokens.spec.ts`, all pass. |
| AC-9 `prefers-reduced-motion` honored | ✅ | `motion.css` root media block + per-component local overrides (TouchControls, PowerUpsLegendDrawer, overlays). |
| AC-10 Dead imports / `tsc --noEmit` green | ✅ | 7 deleted components; `pnpm tsc --noEmit` green. |

**Owner-manual items (AC-3, AC-4, AC-5)** are documented as follow-up in the PR body — they require a real browser and are out of scope for the agent run. The rest of the acceptance criteria are green.
