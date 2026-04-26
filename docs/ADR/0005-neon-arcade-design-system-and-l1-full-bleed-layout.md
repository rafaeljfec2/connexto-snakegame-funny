# ADR-0005 — Neon Arcade design system and L1 full-bleed layout

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-04-25 |
| **Deciders** | rafael |
| **Related specs** | [REF-06](../SDD/specs/REF-06-visual-redesign.md) |
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

2. **3-tier OKLCH design tokens are the single source of truth for color.** [`src/styles/tokens.css`](../../src/styles/tokens.css) defines:
   - **Tier 1 — primitives** (`--c-deep-900`, `--c-neon-cyan`, …) with sRGB hex fallbacks on `:root` and OKLCH overrides inside `@supports (color: oklch(0 0 0))`.
   - **Tier 2 — semantic** (`--color-bg-base`, `--color-on-bg-muted`, `--color-accent-success`, …) — the only tier components are allowed to consume.
   - **Tier 3 — component-scoped** (introduced as needed inside `.module.css`).
   
   No hex / rgb() / hsl() literals are permitted outside `tokens.css`. The same architecture covers radii, spacing, z-indices, shadows, and HUD geometry. Contrast pairs are validated programmatically against the sRGB fallback in [`src/styles/__tests__/tokens.spec.ts`](../../src/styles/__tests__/tokens.spec.ts) (≥ 7:1 for HUD-critical text, ≥ 4.5:1 for body, per WCAG 2.1 §1.4.3 / §1.4.6).

3. **Motion is CSS-only and animates `transform` / `opacity` exclusively.** [`src/styles/motion.css`](../../src/styles/motion.css) exposes the keyframes (`ref06FadeIn`, `ref06SlideInRight`, `ref06SlideInUp`, `ref06Pulse`, `ref06GlowSoft`), durations, and easings. **No** animation of `box-shadow`, `filter: drop-shadow`, `width`/`height`, `top`/`left`, or color. **No** `framer-motion`, **no** runtime animation library — this extends ADR-0004's CSS-only rule from the background particles to the entire UI surface. `prefers-reduced-motion: reduce` collapses every motion duration to 1 ms via a single media query.

4. **Migration discipline (typography phasing).** Phase A ships with a system display stack and `font-feature-settings: "tnum" 1, "ss01" 1` for HUD digits, deferring the `26F Galaxy Sans Variable` webfont to Phase B. This keeps the Phase A bundle delta near zero (CSS only, no font asset) so the visual direction can be validated before we commit ~30 kB to a webfont.

## Consequences

### Positive

- **The board is unambiguously the protagonist.** Removing the side panels lifts the canvas to ~80 % of the viewport (vs ~45 % before), in line with the research norm for arcade-style web games (Slither.io, Agar.io, Diep.io). After Phase A.3, persistent state lives entirely in the HUD strip and transient feedback (combo, active power-ups) lives in viewport-fixed compositors *outside* the game card — nothing competes with the canvas for layout space.
- **Theming and accessibility become structural properties, not vibes.** Any future skin (e.g., a "Carnival" event theme, a high-contrast variant, a colorblind-safe variant) is a swap of the semantic-tier tokens — no component changes. WCAG regressions are caught by `tokens.spec.ts` in CI.
- **Wide-gamut without breaking sRGB.** `@supports (color: oklch(0 0 0))` upgrades supported browsers to OKLCH with no FOUC or fallback flash; legacy browsers keep the curated sRGB palette.
- **Zero new runtime deps.** No `framer-motion`, no icon library, no design-system package. Phase A ships ~+5 kB of CSS and 0 kB of JS / fonts. Aligns with ADR-0001 (SDD)'s small-reversible-change principle.
- **Animations stay on the compositor.** Constraining motion to `transform` / `opacity` extends ADR-0004's INP wins to the new HUD and overlays — power-up pills appearing on screen do not push the main thread.

### Negative / accepted trade-offs

- **Token discipline is now load-bearing.** Any developer (or agent) who reaches for a hex literal in a `.module.css` file silently breaks the theming contract. Mitigated by: (a) tokens.css comments forbid it explicitly, (b) `tokens.spec.ts` catches missing semantic tokens, (c) future ESLint/stylelint rule planned in REF-06 Phase B if drift appears.
- **Full-bleed makes mobile/responsive harder, not easier.** Phase A is desktop-only; mobile-first breakpoints, condensed HUD, and touch HUD ergonomics are explicit Phase B work. Until then, `< 720 px` viewports keep the legacy `.gameContainer` sizing — playable but not yet visually optimized for mobile.
- **Sidebars are gone for good.** Components that lived there (`GameSidebar`, the catalogue card in `ActivePowerUps`) are deleted, not hidden. Any future "stats panel" idea has to ship as a drawer/modal/overlay, not by re-adding a sidebar — that's the cost of committing to L1.
- **CSS-only motion is less expressive.** Animations cannot react to game state (combo strength, boss entrance choreography). Phase A accepts this; level-up animations stay JS-driven (one-off React component using GPU-friendly transforms).
- **System display stack today, webfont tomorrow.** Phase A HUD digits look slightly less distinctive than they will after Phase B's `26F Galaxy Sans Variable`. We accept the temporary aesthetic gap to keep the Phase A delta auditable.

### Neutral

- The `i18next` keys grew (`hud.*`, `powerUps.legend*`); both `pt-BR.json` and `en-US.json` were updated in lockstep.
- The `GameInfo` / `LivesDisplay` / `StatusBar` components survive only for the legacy mobile path and the statistics modal; their CSS modules were rewritten to consume tokens but their public API is unchanged.
- Phase A's bundle delta is dominated by the new CSS files; no JS-side regression is expected and `pnpm build` confirms (verified in REF-06 Phase A validation step).

## Alternatives considered

- **Two-panel layout (HUD + right rail).** Closer to existing AAA web games (Hearthstone-web, Krunker). Rejected because it still cuts the canvas to ~65 % of the viewport, the user explicitly criticized the "dashboard look", and the right rail's content (legend, stats) has no real-time relevance — a drawer suits it better.
- **Tailwind for utility-first styling.** Would replace the CSS-modules + tokens approach with a global utility framework. Rejected because: (a) it introduces a new build pipeline and dep for a game of this size, (b) tokens.css covers the same need with one file and zero deps, (c) Tailwind's color system is HSL-based — converting to OKLCH later would re-invent tokens.css anyway.
- **CSS-in-JS (vanilla-extract / styled-components).** Would give type-safe tokens at the cost of runtime overhead and a heavier learning curve. Rejected because CSS modules + CSS custom properties already give us scoped styles + dynamic theming with zero runtime; vanilla-extract is a future option if token type-safety becomes a real issue.
- **`framer-motion` for animations.** Would simplify gesture-driven and physics-style animations. Rejected because: (a) Phase A needs only fade/slide/pulse — trivially expressible in CSS, (b) `framer-motion` adds ~20 kB gzipped of JS that runs on the main thread, directly contradicting the INP wins from ADR-0004, (c) the team already validated CSS-only animations meet the bar in REF-04. We can revisit only if a future REF needs gesture-tracked physics.
- **Light theme support in Phase A.** Game UIs almost universally ship dark-by-default; a light theme would dilute the "neon arcade" identity and double the contrast-pair test matrix without a clear user request. Reserved for a future REF; tokens.css already declares the empty `prefers-color-scheme: light` slot to prevent UA inversion.

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
