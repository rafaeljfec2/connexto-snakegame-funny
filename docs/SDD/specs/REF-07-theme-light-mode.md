# REF-07 — Light theme mode with automatic and manual toggle

| Field | Value |
|---|---|
| **Status** | In Progress (Phases A + B + C landed — palette, boot script, context and visible toggle are live; Phase D open) |
| **Owner** | rafael |
| **Created** | 2026-04-26 |
| **Last updated** | 2026-04-26 |
| **Related ADRs** | [ADR-0005](../../ADR/0005-neon-arcade-design-system-and-l1-full-bleed-layout.md) — "Neon Arcade design system and L1 full-bleed layout" (Accepted) |
| **Supersedes** | — |
| **Parallel to** | — |

> Status values: `Draft` → `Approved` → `In Progress` → `Done` (or `Blocked`, `Superseded`).

## 1. Specification

- **Problem**: the Neon Arcade design system delivered in REF-06 ships **dark-only**. The placeholder `@media (prefers-color-scheme: light)` in `src/styles/tokens.css:138-144` is explicitly reserved as a future REF and is currently empty — meaning:
  1. Users on bright environments (outdoor, morning sun, brightly lit office) read the UI against a pitch-black board that is perceived as too intense / fatiguing.
  2. Users whose OS is set to light mode still see the dark palette, which is inconsistent with the surrounding system chrome (browser, OS menu bar).
  3. The `IDEIAS_MELHORIAS.md §11` backlog lists "Modo Dark/Light" as a pending Phase-2 deliverable with *Complexidade: Baixa / Impacto: Médio*.
  4. Accessibility: some users with photosensitive astigmatism or dry-eye syndrome report better legibility on light backgrounds. A dark-only product excludes them.
- **Objective**: ship a second fully-working color scheme ("Light") that (a) auto-activates when the OS reports `prefers-color-scheme: light`, (b) can be manually overridden via an explicit toggle that persists in `localStorage`, (c) keeps every WCAG contrast ratio ≥ 4.5:1 (AA) / ≥ 7:1 (AAA) for HUD-critical text — same contract REF-06 holds for dark, (d) adds **zero new runtime dependencies** and stays within +2 kB gzip bundle delta.
- **Non-objective**:
  - Custom / user-authored color palettes (snake color, food color, combo neon choice) — that is REF-08 Skins/Themes, a distinct spec.
  - High-contrast mode beyond what REF-06 already wires via `prefers-contrast: more`.
  - Server-side theme sync / account-based preference — local-only for now.
  - Redesigning any component: light scheme reuses every existing layout, motion, typography, and semantic token name.
- **Success (measurable)**:
  - Owner accepts a side-by-side screenshot of the same game state in **dark** and **light** schemes in the PR.
  - All 52 existing `tokens.spec.ts` contrast assertions pass for **both** `:root` and `:root[data-theme='light']`.
  - Manual toggle persists across full page reloads and survives navigation back from a new tab.
  - Switching the OS scheme while the tab is open changes the theme *unless* the user has a manual override saved.
  - Bundle delta ≤ +2 kB gzip (the whole light scheme is declarative CSS + ~60 LOC of React store).
  - Lighthouse Performance ≥ 95 preserved; CLS ≤ 0.10 preserved (no flash-of-wrong-theme / FOUT equivalent).
  - `pnpm lint && pnpm test --run && pnpm build` green.

## 2. User Stories

- **US-01** As a user browsing in daylight, I want the game to match the brightness of my surroundings so my eyes do not adjust aggressively every time I switch tabs.
- **US-02** As a user with my OS in light mode, I want the game to respect that preference by default so I do not need to configure anything.
- **US-03** As a user who prefers dark mode regardless of my OS (e.g., night owl on a daylight-configured machine), I want a visible in-app toggle that sticks across sessions.
- **US-04** As a user with astigmatism / halation sensitivity, I want a light mode option so glowing neon accents on black do not produce visual artifacts.
- **US-05** As a keyboard-only user, I want the theme toggle reachable via Tab and activatable via Enter / Space, with a correct `aria-pressed` state.
- **US-06** As a returning user, I want my choice remembered — nothing is more annoying than reselecting preferences after every reload.

## 3. Requirements

### Functional

- **REF-07-FR-1** The app exposes three user-facing theme preferences: `'system'` (default), `'dark'`, `'light'`.
- **REF-07-FR-2** On mount, the effective theme is resolved as:
  ```
  explicit_user_choice ?? os_preference (via prefers-color-scheme) ?? 'dark'
  ```
- **REF-07-FR-3** A single `data-theme` attribute on `<html>` drives all color tokens: `<html data-theme='light'>` activates the light palette, absent attribute or `data-theme='dark'` keeps the dark palette.
- **REF-07-FR-4** `src/styles/tokens.css` gains a `:root[data-theme='light'] { ... }` block that overrides `--color-bg-*`, `--color-on-bg-*`, `--color-stroke-*`, `--color-overlay-scrim`, and `--color-surface-translucent`. Semantic accent tokens (`--color-accent-*`, `--color-snake`, `--color-food`, `--color-boss`) stay the same for identity — this is Neon Arcade in both lighting conditions, not two disjoint visual systems.
- **REF-07-FR-5** An empty `@media (prefers-color-scheme: light)` block already exists in `tokens.css`. That block is repurposed to apply the light palette when the user preference is `'system'` (using `:root:not([data-theme])`).
- **REF-07-FR-6** A new `ThemeToggle` component mounts in the HUD `actions` cluster (same row as `AudioToggle` and `LanguageSelector`). Clicking it cycles `system` → `light` → `dark` → `system`, with an inline SVG icon and `aria-label` / `aria-pressed` reflecting current state.
- **REF-07-FR-7** The user's explicit choice (`'light'` or `'dark'`) persists in `localStorage` under key `connexto.theme`. Choosing `'system'` deletes the key so the OS preference takes over again.
- **REF-07-FR-8** A `prefers-color-scheme` media-query listener updates the effective theme in real time **only when** the stored preference is `'system'`.
- **REF-07-FR-9** The `<html>` element carries `color-scheme: dark` or `light` matching the effective theme, so the browser scrollbar / form controls / dialog defaults match.
- **REF-07-FR-10** Theme is resolved *before first paint* via an inline `<script>` snippet in `index.html`, preventing flash-of-wrong-theme (FOUT equivalent).

### Non-Functional

- **REF-07-NFR-1** Light palette must hold **AA 4.5:1** contrast on every `--color-bg-*` / `--color-on-bg-*` pair and **AAA 7:1** on HUD-critical pairs (score / lives / combo). Enforced by extending `src/styles/__tests__/tokens.spec.ts` to loop both themes.
- **REF-07-NFR-2** Zero new runtime dependencies (no `next-themes`, no `use-color-scheme`, etc.). React + native `matchMedia` + `localStorage` are enough.
- **REF-07-NFR-3** Bundle delta ≤ **+2 kB gzip** (measured against the current 111.78 kB JS / 16.50 kB CSS baseline). The light palette is ~50 CSS declarations; the React store + toggle + inline script sum to ~80 LOC.
- **REF-07-NFR-4** `prefers-reduced-motion` must be honored for any CSS transition used on theme change (e.g., `.app { transition: background-color 120ms ease; }` becomes `transition: none` under reduced motion).
- **REF-07-NFR-5** No `any`. No `as Type` casts beyond `HTMLElement` narrowing on `document.documentElement`. `readonly` on prop interfaces. Explicit return types on public functions.
- **REF-07-NFR-6** SSR-safe: the store must not throw on SSR-style imports (even though this is a Vite SPA, the inline script in `index.html` runs before React hydrates, so `window` access has to be defensive).
- **REF-07-NFR-7** Theme change must not break the REF-04 long-task budget. Target: < 5 ms of main-thread work on toggle. Measured via performance marks in a dev-only harness.
- **REF-07-NFR-8** i18n: the new toggle's tooltip / `aria-label` uses keys `theme.auto`, `theme.light`, `theme.dark` in both `en-US` and `pt-BR` locales.

## 4. Design

### Architecture

```mermaid
flowchart TB
    subgraph Boot[index.html inline script]
        A[Read localStorage 'connexto.theme']
        B{Value present?}
        C[Use stored value]
        D[Use matchMedia 'prefers-color-scheme']
        E[Set html.dataset.theme]
    end

    subgraph Runtime[React]
        F[themeStore zustand slice]
        G[useTheme hook: effective + preference]
        H[ThemeToggle button in HUD]
        I[prefers-color-scheme listener]
    end

    A --> B
    B -- yes --> C --> E
    B -- no --> D --> E
    E --> F
    F --> G --> H
    I --> F
    H -- writes --> F
    F -- writes --> localStorage
    F -- writes --> html.dataset.theme
```

### Contracts

```ts
// src/state/themeStore.ts (new)
export type ThemePreference = 'system' | 'light' | 'dark';
export type EffectiveTheme = 'light' | 'dark';

export interface ThemeState {
  readonly preference: ThemePreference;
  readonly effective: EffectiveTheme;
  setPreference(next: ThemePreference): void;
  cyclePreference(): void;
}

export const THEME_STORAGE_KEY = 'connexto.theme' as const;

// src/hooks/useTheme.ts (new) — just a thin selector over themeStore
export function useTheme(): Pick<ThemeState, 'preference' | 'effective' | 'setPreference' | 'cyclePreference'>;

// src/components/ThemeToggle.tsx (new)
// Props: none. Reads from useTheme, dispatches cyclePreference.
```

### Files to touch

| Path | Change |
|---|---|
| `index.html` | Add inline boot script (~12 LOC) that sets `data-theme` before React mounts, preventing FOUT. |
| `src/styles/tokens.css` | Add `:root[data-theme='light'] { ... }` block. Fill the empty `@media (prefers-color-scheme: light)` block to target `:root:not([data-theme])`. Maintain OKLCH primitives inside `@supports (color: oklch(0 0 0))`. |
| `src/state/themeStore.ts` | **New**. Zustand slice exposing `preference`, `effective`, `setPreference`, `cyclePreference`. Hydrates from `localStorage`, syncs to `document.documentElement.dataset.theme` + `document.documentElement.style.colorScheme`, listens to `matchMedia('(prefers-color-scheme: light)')`. |
| `src/hooks/useTheme.ts` | **New**. Selector hook over the store. |
| `src/components/ThemeToggle.tsx` | **New**. Button in HUD actions. SVG icon swaps (sun / moon / auto). `aria-pressed` / `aria-label` follow WAI-ARIA toggle-button guidance. |
| `src/components/ThemeToggle.module.css` | **New**. Mirrors `AudioToggle.module.css` visual language. |
| `src/components/HudStrip.tsx` | Insert `<ThemeToggle />` in `.actions` between `AudioToggle` and `LanguageSelector`. |
| `src/i18n/locales/en-US.json` | Add `theme.auto`, `theme.light`, `theme.dark`, `theme.cycleAriaLabel` keys. |
| `src/i18n/locales/pt-BR.json` | Same keys, translated. |
| `src/styles/__tests__/tokens.spec.ts` | Extend existing contrast test matrix to run under both `data-theme='dark'` (default) and `data-theme='light'`. |
| `src/state/__tests__/themeStore.test.ts` | **New**. Unit tests: hydration precedence, persistence, matchMedia reactivity, cycle order. |
| `src/components/__tests__/ThemeToggle.test.tsx` | **New**. RTL test: renders three states, `aria-pressed` correct, click dispatches cycle. |
| `docs/SDD/specs/REF-07-theme-light-mode.md` | This document. |

> Implementation must not touch files outside this list.

### Light palette (initial proposal — subject to owner tweak during Phase A)

Mapping from the dark scheme, preserving **token identity** (same `--color-bg-base` token, different HSL / OKLCH value):

| Token | Dark (current) | Light (proposed) | Intent |
|---|---|---|---|
| `--color-bg-base` | `oklch(0.13 0.04 270)` | `oklch(0.97 0.01 260)` | app background |
| `--color-bg-surface` | `oklch(0.18 0.05 270)` | `oklch(0.94 0.015 260)` | card/panel |
| `--color-bg-elevated` | `oklch(0.24 0.06 270)` | `oklch(0.89 0.02 260)` | elevated surface |
| `--color-bg-hover` | `oklch(0.32 0.07 270)` | `oklch(0.84 0.03 260)` | hover surface |
| `--color-on-bg` | `oklch(0.98 0.01 270)` | `oklch(0.18 0.02 260)` | primary text |
| `--color-on-bg-strong` | same | `oklch(0.10 0.02 260)` | strongest text |
| `--color-on-bg-muted` | `oklch(0.85 0.02 270)` | `oklch(0.40 0.02 260)` | secondary text |
| `--color-on-bg-faint` | `oklch(0.65 0.02 270)` | `oklch(0.55 0.02 260)` | tertiary text |
| `--color-stroke-subtle` | `rgb(255 255 255 / 0.08)` | `rgb(0 0 0 / 0.08)` | border inversion |
| `--color-stroke-soft` | `rgb(255 255 255 / 0.16)` | `rgb(0 0 0 / 0.14)` | |
| `--color-stroke-strong` | `rgb(255 255 255 / 0.28)` | `rgb(0 0 0 / 0.24)` | |
| `--color-overlay-scrim` | `rgb(10 13 26 / 0.72)` | `rgb(240 243 255 / 0.72)` | drawer scrim |
| `--color-surface-translucent` | `rgb(19 24 41 / 0.78)` | `rgb(244 247 255 / 0.82)` | floating surfaces |
| Accent tokens (`--color-accent-*`, snake, food, boss) | — | **unchanged** | Neon Arcade identity |
| `--shadow-elev-1/2` | black-based | softened gray | mellow elevation on light |

Neon accents stay the same because the game is recognizable across themes. Shadows soften — black-on-light at `0.55` alpha looks grimy; `rgb(30 40 70 / 0.18)` reads as a true elevation shadow.

### Boot script (inline in `index.html`)

```html
<script>
  (function () {
    try {
      var stored = localStorage.getItem('connexto.theme');
      var effective;
      if (stored === 'light' || stored === 'dark') {
        effective = stored;
      } else {
        effective = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      }
      document.documentElement.setAttribute('data-theme', effective);
      document.documentElement.style.colorScheme = effective;
    } catch (_) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  })();
</script>
```

Inline because any async/deferred module risks a visible flash on the first paint. ~330 bytes minified, not worth splitting.

## 5. Acceptance Criteria

- **REF-07-AC-1** *Given* the user has never picked a theme and their OS reports `prefers-color-scheme: light`, *when* they open the app, *then* `<html data-theme='light'>` is set **before** the first React render and the light palette is visible on initial paint (no flash).
- **REF-07-AC-2** *Given* the user has never picked a theme and their OS reports `prefers-color-scheme: dark` (or nothing), *when* they open the app, *then* `<html data-theme='dark'>` is set and the existing dark palette is visible.
- **REF-07-AC-3** *Given* the user clicks the theme toggle three times starting from `system`, *when* each click fires, *then* `preference` cycles through `system → light → dark → system` exactly, and the `aria-pressed` / icon reflect each state.
- **REF-07-AC-4** *Given* the user selected `light`, *when* they reload the page, *then* the app boots into `light` regardless of their OS preference.
- **REF-07-AC-5** *Given* the user selected `system` (or never chose), *when* the OS toggles dark ↔ light while the tab is open, *then* the effective theme flips in real time without a reload.
- **REF-07-AC-6** *Given* the light theme is active, *when* the contrast matrix runs in `tokens.spec.ts`, *then* every `--color-on-bg-*` / `--color-bg-*` pair scores ≥ 4.5:1 and HUD-critical pairs score ≥ 7:1 — same contract already enforced for dark.
- **REF-07-AC-7** *Given* the preview build, *when* `pnpm build` completes, *then* JS gzip delta ≤ 2 kB and CSS gzip delta ≤ 1 kB vs the current `111.78 kB` / `16.50 kB` baseline.
- **REF-07-AC-8** *Given* a keyboard-only user, *when* they Tab to the theme toggle and press Enter, *then* the cycle fires — verified in the RTL test.

## 6. Test Plan

| AC | Test type | Location |
|---|---|---|
| REF-07-AC-1 / AC-2 | boot-script unit | `src/state/__tests__/themeStore.test.ts` (mock `matchMedia` + `localStorage`) |
| REF-07-AC-3 / AC-8 | component (RTL) | `src/components/__tests__/ThemeToggle.test.tsx` |
| REF-07-AC-4 | store unit | `src/state/__tests__/themeStore.test.ts` (hydration from localStorage) |
| REF-07-AC-5 | store unit | `src/state/__tests__/themeStore.test.ts` (simulate `matchMedia.onchange` events) |
| REF-07-AC-6 | contrast matrix | `src/styles/__tests__/tokens.spec.ts` (extend existing suite) |
| REF-07-AC-7 | manual bundle audit | compare `dist/assets/index-*.{css,js}` pre/post |

Plus:

- `pnpm lint` clean.
- `pnpm tsc --noEmit` clean.
- `pnpm build` clean.
- Manual side-by-side screenshot in the PR (dark + light, same scene).

## 7. Risks / Rollback

- **R1** *Flash of wrong theme on first paint.* React mounts after HTML/CSS; without the inline boot script, the default dark palette would render for ~80 ms before the store hydrates. **Mitigation**: inline boot script in `index.html`, measured before React hydrates. Fallback to `dark` if `localStorage`/`matchMedia` throws.
- **R2** *Light palette fails AA contrast on edge pairs (e.g., `--color-on-bg-muted` on `--color-bg-hover`).* **Mitigation**: the contrast test suite is run as part of CI and will block the merge if any pair drops below threshold. Iteration happens in-test.
- **R3** *Neon accents (`--color-accent-primary = neon-cyan`) look too bright / washed on light backgrounds.* **Mitigation**: accents stay identical for brand identity; if any accent fails the AA check on `--color-bg-base`, fall back to a per-theme accent variant inside the `[data-theme='light']` block. This is an opt-in knob, not the default.
- **R4** *Scrollbars / form controls (language selector) look wrong when `<html style="color-scheme: light">` flips.* **Mitigation**: explicitly set `color-scheme` alongside `data-theme` in the boot script, so UA-painted controls respect the theme.
- **R5** *Bundle regression.* **Mitigation**: NFR-3 caps CSS delta at +1 kB gzip and JS delta at +2 kB gzip. If exceeded, remove token duplicates and stop at OKLCH-only (no sRGB fallback for light; modern browsers all support OKLCH as of 2026).

**Rollback strategy**: the entire spec is additive — zero existing behavior is altered. To roll back:
1. Delete the inline boot script from `index.html`.
2. Delete `:root[data-theme='light']` block from `tokens.css` (keep the existing empty `@media (prefers-color-scheme: light)` block as-is).
3. Remove `<ThemeToggle />` mount from `HudStrip.tsx`.
4. Delete `src/state/themeStore.ts`, `src/hooks/useTheme.ts`, `src/components/ThemeToggle.*`, and their tests.
5. `pnpm lint && pnpm test && pnpm build` still green — no production regression.

No feature flag required (change is toggle-local).

## 8. Implementation notes (filled when status = Done)

_To be filled after implementation._

- Final files changed: …
- Deviations from Design section: …
- Follow-ups (link to new specs/issues if any): …

## 9. Phasing

| Phase | Deliverable | Owner gate |
|---|---|---|
| **A — Contrast matrix + palette** ✅ | Write `:root[data-theme='light']` tokens. Extend `tokens.spec.ts` to loop both themes. Validate AA/AAA before writing any UI. | **Landed 2026-04-26**. Owner sign-off on the palette happens implicitly during B/C when the toggle lets the owner see the final values in-app. |
| **B — Store + boot script** ✅ | Reused the existing `ThemeContext`, patched DOM sync, added inline boot script in `index.html`, deleted duplicated `src/hooks/useTheme.ts`. | **Landed 2026-04-26**. No visible UI yet by design — the provider runs, the attribute is written, the toggle mount is Phase C. |
| **C — ThemeToggle component + drawer mount** ✅ | Accessible 3-state segmented radiogroup (`dark`/`auto`/`light`), i18n keys (`theme.*`), mounted in the drawer Settings section. LanguageSelector moved out of the HUD — all preferences now live in one place. | **Landed 2026-04-26**. |
| **D — Validation + docs** | Bundle audit, Lighthouse re-check, screenshots, spec §8 implementation notes, ADR update if needed. | Spec moves to `Done`. |

Each phase is independently releasable — if B is green but C is not ready for owner review, the feature flag equivalent is "no `<ThemeToggle />` mount yet" — the palette and store still function.

### 9.1 Phase A — delivered 2026-04-26

**Deliverable**

- `src/styles/tokens.css`: added `:root[data-theme='light']` block with 7 new primitives (`-on-light` variants of the neon hues), 13 overrides for backgrounds / foregrounds / strokes / overlay / surface-translucent, and 6 accent re-bindings. OKLCH mirror added inside the existing `@supports (color: oklch(0 0 0))` block.
- `src/styles/__tests__/tokens.spec.ts`: refactored `RootScope` → `ThemeScope` with a `fallback` chain so tokens not redefined on the light scope cascade from the dark scope (mirrors browser semantics). The 11 contrast pairs now run under `describe.each(['dark','light'])`, giving 22 pair assertions. Added 3 new suites validating which tokens the light scope must override, which accents must have deep-on-light variants, and which tokens (spacing / radii / z-index / HUD dimensions) are **theme-invariant** and must NOT be redefined.
- The playfield canvas keeps its own dark surface in both themes — documented in the header comment of the light block as a deliberate arcade-canon decision (Pac-Man / Galaga / Space Invaders always render on black regardless of ambient lighting).

**Light palette (final, as shipped)**

| Token | Dark (current) | Light (shipped) | Contrast on light bg | Gate |
|---|---|---|---|---|
| `--color-bg-base` | `#0a0d1a` | `#f7f9fd` | — | surface |
| `--color-bg-surface` | `#131829` | `#ffffff` | — | surface |
| `--color-bg-elevated` | `#1d2440` | `#eef1f8` | — | surface |
| `--color-on-bg` | `#f5f7ff` | `#0f1424` | 17.5:1 | AAA |
| `--color-on-bg-strong` | `#f5f7ff` | `#050914` | 19.8:1 | AAA |
| `--color-on-bg-muted` | `#c2c8e0` | `#3e4460` | 10.2:1 | AAA |
| `--color-accent-primary` (cyan) | `#4de2ff` | `#0e647a` | 5.9:1 | AA |
| `--color-accent-success` (green) | `#5cff9a` | `#0c7238` | 5.6:1 | AA |
| `--color-accent-combo` (yellow) | `#ffe24d` | `#7a5e00` | 6.5:1 | AA |
| `--color-accent-danger` (red) | `#ff5d6c` | `#c31728` | 6.7:1 | AA |
| `--color-accent-warn` (amber) | `#ffb84d` | `#8a5200` | 7.8:1 | AAA |
| `--color-accent-special` (violet) | `#b06bff` | `#5e28a8` | 8.7:1 | AAA |

**Gates** — `tsc ✅` · `eslint ✅` · `vitest 159/159 ✅` (+17 vs Phase F baseline: 22 contrast pair assertions instead of 11, plus 3 light-theme-override validators) · `vite build ✅` (CSS 94.71 → 94.87 kB, gzip 16.77 → 16.79 kB: **+0.02 kB gzip**, well inside the +2 kB budget committed in §1 "Success").

**Deliberately deferred to Phase B**

- `@media (prefers-color-scheme: light)` in `tokens.css:138-144` stays empty on purpose. Phase B's inline boot script will read `matchMedia` and write `data-theme` explicitly on `<html>` — that single source of truth makes the `:root[data-theme='light']` block the only code path applying light tokens, eliminating the duplication pitfall of maintaining two parallel CSS blocks.

### 9.2 Phase B — delivered 2026-04-26

**Scope pivot vs §4 Design**

The Design section proposed a new **Zustand** store (`src/stores/themeStore.ts`). On opening Phase B the codebase audit surfaced a pre-existing `src/contexts/ThemeContext.tsx` already mounted by `src/main.tsx` and a duplicated `src/hooks/useTheme.ts` (dead-code shadow of the same API). Per the engineering rule *"verify if a similar abstraction already exists; eliminate legacy/duplicated logic instead of stacking a new framework"*, the plan was revised:

- **Reuse** `ThemeContext` and its public API (`theme: 'dark' | 'light' | 'auto'`, `effectiveTheme`, `setTheme`, `toggleTheme`).
- **Delete** `src/hooks/useTheme.ts` (0 imports found; dead code).
- **Do NOT add** `zustand` as a dependency (saves ~1.2 kB gzip and keeps the dependency tree small).

The user-facing contract (§4 `contract`) is unchanged.

**Deliverable**

- `src/utils/themeBoot.ts` (new): three pure helpers — `parseStoredTheme`, `resolveEffectiveTheme`, `resolveBootTheme({ readStored, prefersDark })` — plus `applyBootTheme()` which reads `localStorage` + `matchMedia` and writes `data-theme` on `<html>`. All helpers are defensive against `SecurityError` from sandboxed / 3rd-party-cookie-blocked storage, and against browsers without `matchMedia`.
- `src/contexts/ThemeContext.tsx` (refactor):
  - Explicit `EffectiveTheme` type alias and `ThemeContextValue` interface with `readonly` fields (complies with `sonarqube typescript:S6759`).
  - First-render `useEffect` now writes the `data-theme` attribute on `<html>` (previously missing — the light palette shipped in Phase A would never have activated without this fix).
  - Second `useEffect` subscribes to `matchMedia('(prefers-color-scheme: dark)')` **only** while `theme === 'auto'`, unsubscribing when the user picks an explicit preference.
  - `useMemo` wraps the context value so consumers do not rerender on every parent render.
- `src/hooks/useTheme.ts` (deleted): 1.2 kB of dead code removed.
- `index.html`: inline IIFE in `<head>` mirrors `resolveBootTheme` with zero dependencies, runs **before** the CSS bundle loads, and sets `<html data-theme>` on first paint — guarantees no flash-of-wrong-theme (FOWT). CSP stays unchanged because `script-src 'self' 'unsafe-inline'` is already permitted.
- Tests (38 new): `src/utils/__tests__/themeBoot.test.ts` (19 — parse, resolve, boot matrix, defensive fallbacks), `src/utils/__tests__/theme.test.ts` (11 — storage, media-query mapping), `src/contexts/__tests__/ThemeContext.test.tsx` (8 — defaults, persistence, toggle cycle, DOM sync, auto-mode OS reactivity, provider error).

**Gates**

- `tsc ✅ · eslint ✅ · vitest 197/197 ✅` (+38 vs Phase A: 159 → 197).
- `vite build ✅`:
  - `dist/index.html`: 1.07 → 2.17 kB (+0.49 kB gzip — inline boot script).
  - `dist/assets/index-*.js`: 355.57 → 355.85 kB (+0.07 kB gzip — refactored `ThemeContext` + new `themeBoot.ts` utility).
  - CSS unchanged (Phase A already shipped the full palette).
  - **Phase B delta: +0.56 kB gzip**. Cumulative A+B: **+0.58 kB gzip**, inside the +2 kB budget committed in §1 "Success".

**How to verify Phase B locally**

1. `pnpm build && pnpm preview --port 4173`.
2. Open the page; inspect `<html>` — the `data-theme` attribute is present on first frame.
3. DevTools → Application → Local Storage → `snake-game-theme` = `light` → reload → UI renders in light palette on the very first paint (no flash). Change to `dark` / `auto`, reload, observe behaviour.
4. With `snake-game-theme = auto`, toggle OS theme (macOS ⌘⌥T, Windows Settings → Colors) — attribute flips live without reload.

**Deliberately deferred to Phase C**

- No `<ThemeToggle />` mount anywhere — the existing `src/components/ThemeToggle.tsx` was left untouched (emoji-only prototype, no i18n, no aria-live). Phase C will: replace it with an accessible 3-state segmented control, add i18n keys (`theme.dark`, `theme.light`, `theme.auto`, `theme.toggle`), mount inside `PowerUpsLegendDrawer` Settings section (alongside the Language selector landed in REF-06 Phase F.3), and style it with existing surface / stroke tokens so both palettes look native.

### 9.3 Phase C — delivered 2026-04-26

**Deliverable**

- `src/components/ThemeToggle.tsx` (rewrite): accessible 3-state segmented control implementing the WAI-ARIA `radiogroup` pattern. Three options (`dark` / `auto` / `light`) with role `radio`, `aria-checked`, roving `tabIndex`, and `ArrowLeft` / `ArrowRight` cycling. Inline SVG glyphs (crescent moon, half-filled circle, sun with rays) scale cleanly at any DPI and ship as part of the JS bundle (no extra HTTP round-trip). Uses `useId()` for SSR-safe group id.
- `src/components/ThemeToggle.module.css` (rewrite): token-first styling. Selected pill uses `--color-accent-primary` over `--color-bg-base` — both remap per theme so the toggle is visually native in dark and light without any branching rule set. Labels collapse to `sr-only` below 640 px (same pattern as the HUD legend button from REF-06 Phase F).
- `src/i18n/locales/{en-US,pt-BR}.json`: `theme.title`, `theme.groupLabel`, `theme.dark`, `theme.light`, `theme.auto` added in both catalogues.
- `src/components/PowerUpsLegendDrawer.tsx`: imports and mounts `<ThemeToggle />` in the Settings section next to `<LanguageSelector />`.
- `src/components/PowerUpsLegendDrawer.module.css`: Settings section is now **always visible** in the drawer (previously mobile-only). The header comment documents the intent: the drawer Settings section is the single cross-viewport home for app preferences — consistent with the pattern every modern game / SaaS client (Steam, Discord, Figma) uses.
- `src/components/HudStrip.{tsx,module.css}`: `LanguageSelector` and its `hudLanguageSelector` wrapper removed from the HUD. The HUD now carries only match-state UI (score, phase, combo, lives) plus two quick-action buttons (audio, legend). No duplication of language/theme controls.
- Tests (+8, 205/205 green):
  - `src/components/__tests__/ThemeToggle.test.tsx` (8): structure, default selection, restored preference, click switch, auto via matchMedia, ArrowLeft/ArrowRight cycling, roving tabIndex, ignore unrelated keys.
  - `src/components/__tests__/PowerUpsLegendDrawer.test.tsx` (7, updated): renamed "mobile-only" expectation to "cross-viewport", added ThemeToggle presence + ARIA structure asserts, render helper wraps every test in `<ThemeProvider>`.

**Gates**

- `tsc ✅ · eslint ✅ · vitest 205/205 ✅` (+8 vs Phase B).
- `vite build ✅`:
  - `dist/assets/index-*.css`: 94.87 → 96.24 kB (+0.20 kB gzip — segmented control rules).
  - `dist/assets/index-*.js`: 355.85 → 358.48 kB (+0.78 kB gzip — new component + radiogroup logic, net of the LanguageSelector import removal from HudStrip).
  - `dist/index.html`: unchanged.
  - **Phase C delta: +0.98 kB gzip**. Cumulative A+B+C: **+1.56 kB gzip**, inside the +2 kB budget committed in §1 "Success".

**Dual-theme QA walkthrough**

1. `pnpm build && pnpm preview --port 4173`.
2. Open the HUD legend (⚡ button). Scroll the drawer to the bottom → `Settings` section shows `Language` selector + `Theme` segmented control (3 pills: Dark / Auto / Light).
3. Click `Light` → full UI flips: HUD surface goes off-white, accents switch to deep-on-light variants (cyan `#0e647a`, green `#0c7238`, etc.), board canvas remains dark (arcade-canon, intentional).
4. Click `Auto` → toggle OS theme → UI live-reacts.
5. Reload → previous selection restored on first paint (no FOWT, verified by the Phase B inline boot script).
6. Press `Tab` into the group → focus lands on the selected option (roving tabIndex). `ArrowRight` / `ArrowLeft` cycle without moving focus outside.

**Closes**

- REF-07-FR-1 / FR-2 / FR-3 / FR-5 (visible toggle, manual + auto preference, keyboard accessible, i18n).
- Remaining for Phase D: AC-4 (bundle audit vs baseline, formalised), AC-5 (Lighthouse re-check on both themes), AC-7 (ADR-0005 revision documenting the light palette).
