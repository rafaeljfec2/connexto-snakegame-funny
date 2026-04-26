# ADR-0006 — Orthogonal identity axes (chrome × canvas × weather) and soft boss-outline override

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-04-26 |
| **Deciders** | rafael (product owner / tech lead) |
| **Related specs** | [REF-08](../SDD/specs/REF-08-snake-skins.md) — Snake skins system; [REF-07](../SDD/specs/REF-07-theme-light-mode.md) — Light theme mode |
| **Supersedes** | — |
| **Superseded by** | — |

> Status: `Proposed` → `Accepted` / `Rejected` / `Deprecated` / `Superseded by ADR-NNNN`.

## Context

By the end of REF-07 the product had two distinct user-visible identity surfaces:

1. **Chrome identity** — light / dark / auto (REF-07), expressed via `:root[data-theme]` attribute on `<html>` and consumed by every CSS module through design tokens.
2. **Background identity** — the 10 phase-specific weather systems (fog, rain, snow, vortex, etc.), driven by the phase state and rendered inside `WeatherCanvas` as an independent subsystem.

REF-08 then introduced a third identity surface — **canvas / snake identity** — the four player snake skins (`neon-green`, `retro-arcade`, `frozen-ice`, `magenta-blaze`). Each skin is a triad-of-triads: `body` (3 stops), `head` (3 stops), and `bossContrast` (3 stops). The snake is the element the player stares at for ≈ 99 % of the session, so this axis alone materially changes how "the game" feels.

Two architectural questions surfaced during REF-08 scoping:

**Q1.** Should these three identity axes be modeled as **one orchestrated theme** (a single preset that sets chrome + skin + weather together, e.g. "Retro Arcade Pack") or as **three orthogonal axes** that the user can mix freely?

**Q2.** How should the player skin interact with the **boss snakes**? Bosses already have a unique narrative `activeBoss.color` (per the 10 boss identities shipped pre-REF-08). Options ranged from the **hard override** (player skin fully paints the boss, erasing narrative color) to the **pure preserve** (boss ignores skin, player skin only paints the player), with intermediate options in between.

These are design decisions with structural implications — they shape the type system, the render worker contract, and future extensibility (e.g., adding a 5th skin, or a seasonal weather pack). Documenting them here keeps future contributors from relitigating them or accidentally regressing the invariant.

Forces at play:

- **Code / state complexity.** Orchestrated presets require a joined state (`Theme × SkinId × WeatherOverride`) with a combinatorial migration surface; orthogonal axes keep three small independent state slices (`Theme`, `SkinId`, phase-driven weather).
- **Player expressiveness.** Players in the Neon Arcade aesthetic universe expect to mix taste freely — light-mode chrome with a magenta snake on foggy weather is a valid self-expression. Presets gate that.
- **Boss narrative integrity.** The 10 bosses are hand-designed visual identities (`The Guardian` — crimson, `The Vortex` — purple, etc.). A hard skin override on bosses would erase 10 shipped assets and make bosses visually interchangeable.
- **Boss-vs-player distinguishability.** In `magenta-blaze` mode the player paints pink; a pink boss would be unreadable. So `pure preserve` (boss untouched) is also unacceptable — some signal from the player skin must reach bosses so the silhouette remains legible.
- **Render worker contract cost.** The worker lives in an `OffscreenCanvas` with no DOM access; any decision that spans chrome, skin, and weather has to be serializable across three `postMessage` channels or be packed into a single one.

## Decision

We will treat **chrome theme**, **canvas snake skin**, and **phase weather** as **three strictly orthogonal identity axes**, each owned by an independent React context with its own persistence key, its own render-worker message type (or no message at all for chrome, which is CSS-driven), and zero awareness of the other two.

And we will implement the player-skin → boss interaction as a **soft override**: bosses fully preserve their narrative `activeBoss.color` as the **fill** of the boss snake body, and receive an **outline / stroke** whose color triad is the `skin.bossContrast` gradient derived from the active player skin. No other boss property changes — boss size, shape, head radius, particle trail, and narrative color all stay exactly as shipped pre-REF-08.

Concretely:

| Axis | State owner | Persistence key | Worker contract | DOM surface |
|---|---|---|---|---|
| Chrome theme | `ThemeContext` (REF-07) | `snake-game-theme` | none (CSS only) | `html[data-theme]` |
| Canvas snake skin | `SkinContext` (REF-08) | `snake-game-skin` | `postMessage({ type: 'UI_SKIN', payload: { skin: SkinPalette } })` | none |
| Phase weather | phase state (pre-existing) | none (derived from phase) | weather worker channel (pre-existing) | none |

The three contexts are nested in `main.tsx` as `<ThemeProvider><SkinProvider><App /></SkinProvider></ThemeProvider>` — order is alphabetical for predictability; they have no cross-dependencies, so reordering them would be purely cosmetic.

The soft-boss-outline override is implemented inside `drawSnakeSegment` in `src/workers/render/renderDrawers.ts`: when `isBoss === true`, the fill still uses `activeBoss.color`, but after filling, a `ctx.stroke()` pass paints a ring of thickness `max(1.5, radius * 0.12)` in `skin.bossContrast.mid`. Player segments keep a single-pass fill with the skin's `body` / `head` gradient and receive no outline.

## Consequences

### Positive

- **Zero regression on boss narrative.** The 10 bosses look identical to pre-REF-08 from the perspective of their core silhouette color; only the outline signals "the player is wearing skin X".
- **Player / boss always distinguishable.** Because `bossContrast` is the color-wheel complement of each skin's `body.mid`, no skin → boss combination can collapse into indistinguishable silhouettes.
- **Axes extend independently.** Adding a 5th skin touches only `SkinId`, `SKIN_CATALOG`, and `SkinSelector`; adding a weather pack touches only the phase engine; changing the chrome palette touches only `tokens.css`. Each extension is a one-file-family change.
- **Type safety scales.** Each axis has its own union (`Theme`, `SkinId`, `PhaseId`), so TypeScript enforces exhaustive handling per axis without cross-product explosion.
- **Persistence is trivial.** Two separate `localStorage` keys, each with its own migration path. An orchestrated preset would need a migration story whenever either axis changed shape.
- **No frame cost for the boss outline.** `ctx.stroke()` after `ctx.fill()` is one extra draw call per boss segment, at boss-spawn-rare cadence; the profiler in REF-06 validated that this is < 0.1 ms at p95.

### Negative / accepted trade-offs

- **Players cannot publish "theme packs" that preset all three axes together.** If that becomes desirable (e.g., "Neon Winter Pack") it will need a presenter-layer that dispatches to the three contexts — a purely additive change, but one we explicitly deferred.
- **Three persistence keys, three write paths.** Each axis has its own `try/catch` around `localStorage`. This is duplication, but each is ~6 lines and the duplication is preferable to coupling.
- **Boss outline occupies ~10–12 % of boss radius.** This is visible but, by design, not dominant. If player feedback surfaces that the outline feels too heavy on small bosses, the 0.12 multiplier is a single-line tune in `drawSnakeSegment`.
- **Orthogonality means some combinations look objectively worse than hand-curated presets.** `frozen-ice` snake on `light` chrome is legible but less punchy than on `dark`. We accept this — player choice beats curated "correctness".

### Neutral

- The REF-08 implementation does not emit any `data-skin` attribute to `<html>`. The skin lives exclusively in the render worker's state; only code paths that need skin data (today: `drawSnakeSegment` and `SkinSelector`'s preview chip) consume it. If a future CSS surface ever needs skin-aware styling, adding `<html data-skin>` is a one-line change in `SkinContext`.
- The `RenderState.skin` defaults to `SKIN_CATALOG['neon-green']`, which is pixel-identical to the pre-REF-08 hardcoded gradient. First paint before the `UI_SKIN` message arrives therefore stays identical to baseline for the default user; only players with a non-default stored skin will see a one-frame "green → chosen" transition on reload, which is acceptable.

## Alternatives considered

- **Orchestrated preset bundles** (one `VisualPreset` = chrome + skin + weather). Rejected because it multiplies the state surface combinatorially, blocks free mixing, and would force any future skin addition to cascade through every preset definition. Presets can be re-introduced later as a composed layer on top of the three axes.
- **Hard boss-skin override** (player skin paints boss body fully, erasing `activeBoss.color`). Rejected because it erases the 10 shipped boss narrative identities and makes bosses visually interchangeable. The feature delta — "the player's skin is even more visible" — is not worth the narrative loss.
- **Pure preserve** (boss completely ignores the player skin). Rejected because in `magenta-blaze` mode the boss `The Supreme` (which uses a pink narrative color) would be visually indistinguishable from the player silhouette.
- **Outline on both player and boss.** Rejected because an outline on the player would double the silhouette perimeter and hurt readability on small screen sizes. The outline is the *boss-specific* signal of "the player has a skin".
- **Skin surfaces beyond snake** (portal colors, food hues, trail particles). Out of scope for REF-08 explicitly (non-objective §1). Each is orthogonal to the snake path and would triple the spec surface. Left as future work; the orthogonal-axes decision in this ADR is compatible with each of them becoming its own future axis.

## References

- [REF-08 — Snake skins system](../SDD/specs/REF-08-snake-skins.md)
- [REF-07 — Light theme mode](../SDD/specs/REF-07-theme-light-mode.md)
- [ADR-0005 — Neon Arcade design system and L1 full-bleed layout](./0005-neon-arcade-design-system-and-l1-full-bleed-layout.md)
- `src/workers/render/renderDrawers.ts` — implementation of the soft boss-outline override
- `src/constants/skins.ts` — palette catalog including per-skin `bossContrast` triads
- `src/constants/__tests__/skins.test.ts` — contrast + legibility invariants proving player and boss stay distinguishable in every combination
