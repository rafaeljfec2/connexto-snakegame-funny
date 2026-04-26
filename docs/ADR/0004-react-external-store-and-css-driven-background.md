# ADR-0004 — React external store via `useSyncExternalStore` and CSS-driven background animation

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-04-25 |
| **Deciders** | rafael |
| **Related specs** | [REF-04](../SDD/specs/REF-04-main-thread-long-tasks.md) |
| **Supersedes** | — |
| **Superseded by** | — |

## Context

REF-04 set out to cut main-thread long tasks while keeping render `frameIntervalP95` ≤ 17 ms. Phase A removed the duplicated render-worker dispatch from `GameBoard`, but two structural problems remained on the main thread:

1. **Render cascade from a single `useState<GameState>`**: `useGameLoop` held the entire game state in a local `useState`, and `App.tsx` propagated it as props down to ~10 leaves (`StatusBar`, `ComboDisplay`, `MobileFloatingInfo`, `ActivePowerUps`, `PhaseDisplay`, `LivesDisplay`, `GameInfo`, `GameHeader`, `GameArea`, `GameBoard`). Every game tick that mutated `snake` triggered a render of the whole tree — even leaves whose data had not changed. Empirically, `longTasksTotalMsPerMinute` peaked at ≈ 45 000 ms/min (75 % of wall time blocked).
2. **JS-driven decorative animation**: `DynamicBackground` ran a `setInterval(50ms)` that called `setState` on an array of 40 particles, forcing a React reconciliation and DOM mutation at ≈ 20 Hz, regardless of game state. After fixing the cascade, this single component still accounted for ≈ 25 000 ms/min of long-task time.

Both items were uncovered through three intermediate perf snapshots committed during REF-04 Phase B. They are the kind of cross-cutting decisions ADR-0001 (SDD) calls out as warranting their own record.

## Decision

We will adopt the following three rules across the React tree:

1. **Single external store for `GameState`**, owned by [`src/state/gameStateStore.ts`](../../src/state/gameStateStore.ts), backed by React 18's built-in `useSyncExternalStore`. No new dependency. Components subscribe to **slices** via `useGameStateSlice<T>(selector, equalityFn?)`. Default equality is `Object.is`; `shallowEqualArray` and `shallowEqualObject` are provided as drop-in equalities for array/object slices.
2. **`React.memo` is mandatory on every leaf that consumes the store**. The store can guarantee that *its* notification respects equality, but it cannot prevent a parent's render from cascading into a memoless child. Empirically, leaves without `memo` re-rendered on every tick because their parent (`App`/`GameArea`) re-rendered on every store delta.
3. **Decorative, periodic animations are written as CSS `@keyframes`, not JS update loops.** When randomness is needed (per-particle phase/speed), seed it once at mount with `useMemo` and inject it via inline `style` (`animation-delay`, `animation-duration`); do not drive the animation with `setInterval` + `setState`.

Together, these reduce `longTasksPerMinute` from 467 → 1 (−99.6 %), `longTasksTotalMsPerMinute` from 45 073 → 94 ms (−99.8 %), heap from 67 → 42 MB, and lift `INP` from 288 ms (needs-improvement) to 88 ms (good) on the REF-04 test profile. See [`docs/SDD/baselines/phase-1-dpr1.json`](../SDD/baselines/phase-1-dpr1.json).

## Consequences

### Positive

- Tick cost on the main thread becomes O(slices that actually changed) instead of O(component tree). The cascade is bounded by the store's internal dirty-checking.
- Selector hooks make data dependencies explicit at the call site (`useGameStateSlice(s => s.score)`), which doubles as documentation and as a hint for future code-splitting/lazy loading.
- Decorative animations move off the main thread to the compositor, freeing CPU cycles for input handling and gameplay logic. `INP` improves directly.
- No new runtime dependency. `useSyncExternalStore` ships with React 18.
- Backwards compatible: `useGameLoop` keeps its return shape, so existing callers (and tests) are unaffected.

### Negative / accepted trade-offs

- **`React.memo` discipline is now load-bearing.** Any future leaf that uses `useGameStateSlice` but forgets `memo` will silently bring back the cascade for its own subtree. We accept this and rely on `selectorRerender.test.tsx` plus code review (and a future ESLint rule, if false negatives appear).
- **Custom `equalityFn` discipline for non-primitive slices.** A selector returning a fresh array/object literal each call (e.g., `s => s.activePowerUps.map(...)`) defeats the dirty check. We mitigated by exporting `shallowEqualArray`/`shallowEqualObject` and using them in the touched leaves; documented the pitfall inline at the hook signature.
- **CSS-only animations are less expressive.** They cannot react to game state. This is fine for the background (purely decorative), but is **not** the right tool for animations that depend on score, level transitions, etc. Those stay JS-driven (e.g., `LevelUpAnimation`).
- **`useSyncExternalStore` SSR snapshot path.** The project is currently CSR-only (Vite SPA); we kept the SSR snapshot identical to the client snapshot to avoid future surprises if SSR is ever added.

### Neutral

- The store is intentionally tiny (~80 LOC). It is **not** a Zustand or a Redux replacement; we explicitly chose not to add either (see Alternatives).
- Tests use `replaceGameStoreForTesting` / `resetGameStoreForTesting` to swap the singleton. This is the only place test code touches the store directly.

## Alternatives considered

- **Zustand**. Would give the same ergonomics with batteries (devtools, middleware, persist). Rejected because: (a) it is a new runtime dependency for a contract that fits in 80 LOC, (b) `useSyncExternalStore` is built-in and preserves React's batching guarantees, (c) we have no current need for devtools/middleware, and (d) ADR-0001 (SDD) commits us to small, reversible additions. We can adopt Zustand later by re-exporting `useGameStateSlice` on top of it; the call sites do not change.
- **React Context per slice**. Considered briefly. Rejected because Context still requires every consumer to render when the value changes, defeating the purpose; the workaround (split context per field) explodes the provider tree and is worse to maintain than a single store with selectors.
- **Redux Toolkit**. Same reasoning as Zustand, plus heavier surface area and more boilerplate. Overkill for a single-page game.
- **Driving the background animation with `requestAnimationFrame` instead of `setInterval`**. Slightly cheaper than `setInterval` but still a JS loop touching React state — does not solve the underlying issue. CSS keyframes win on cost (compositor-only) and on simplicity.
- **Web Animations API (`element.animate(...)`)**. Equivalent in performance to CSS keyframes but adds a JS attachment step at mount and is harder to audit in DevTools. We chose declarative CSS.

## References

- Spec: [REF-04 — Main-thread long-task elimination](../SDD/specs/REF-04-main-thread-long-tasks.md), Phases B and C.
- Baseline: [`docs/SDD/baselines/phase-1-dpr1.json`](../SDD/baselines/phase-1-dpr1.json).
- React 18 `useSyncExternalStore` reference: <https://react.dev/reference/react/useSyncExternalStore>.
- Web.dev — INP and main-thread blocking: <https://web.dev/articles/inp>.
