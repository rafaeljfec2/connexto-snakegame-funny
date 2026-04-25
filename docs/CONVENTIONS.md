# Code conventions

Shared rules for any code touching this repository. Keep this short and concrete; if a rule does not fit on one screen, it lives in [`AGENTS.md`](../AGENTS.md).

## Naming

| Kind | Style | Example |
|---|---|---|
| Component file | `PascalCase.tsx` | `GameBoard.tsx` |
| Component CSS Module | `PascalCase.module.css` | `GameBoard.module.css` |
| Hook file | `useCamelCase.ts` | `useGameLoop.ts` |
| Util / module file | `camelCase.ts` | `gameLogic.ts` |
| Worker file | `<name>.worker.ts` | `render.worker.ts` |
| Type file | `camelCase.ts` (one domain per file) | `perf.ts`, `sfx.ts` |
| Constant in file | `UPPER_SNAKE_CASE` | `GAME_CONFIG`, `MAX_LIVES` |
| TypeScript type / interface | `PascalCase` | `PerfSnapshot`, `SfxApi` |
| Test file | `*.test.ts(x)` co-located | `gameLogic.test.ts` |

## Imports

- Use the path alias `@/` for any import outside the current feature folder.
  - Good: `import { logger } from '@/utils/logger';`
  - Bad: `import { logger } from '../../../utils/logger';`
- Group imports: external → `@/...` → relative → CSS Module.
- No barrel `index.ts` files unless the folder is genuinely a public API surface (e.g., `src/types/`).

## File layout per feature

```
src/components/MyFeature.tsx
src/components/MyFeature.module.css
src/components/__tests__/MyFeature.test.tsx
```

For larger features, group under a folder:

```
src/components/MyFeature/
  MyFeature.tsx
  MyFeature.module.css
  parts/MyFeatureHeader.tsx
  __tests__/MyFeature.test.tsx
```

## TypeScript

- `strict: true` is on (see `tsconfig.json`). Do not weaken it.
- No `any`. Use `unknown` + narrowing or precise types.
- Prefer `type` for unions and primitives, `interface` for object shapes that may be extended.
- React props: `Readonly<Props>` or `readonly` on each field.
- Do not export types from a component file just to "share"; move them to `src/types/<domain>.ts`.

## React

- Function components only. No class components.
- `useMemo` / `useCallback` only when there is a measured re-render problem. Default is to keep code simple.
- Memoize HUD sub-trees that re-render at gameplay frequency (`React.memo`).
- Side effects in `useEffect`; never in render.
- Subscribe to workers via `useEffect` cleanup; never leak listeners.

## CSS Modules

- Mobile-first: base styles for ≤ 414 px, `min-width` queries to scale up.
- BEM-ish class names within the module are fine but unnecessary because of the file scoping.
- Animation: prefer `transform`/`opacity`. Avoid animating `top/left/width/height`.
- Respect `prefers-reduced-motion`.

## Logging

```ts
import { createLogger, LogContext } from '@/utils/logger';

const log = createLogger(LogContext.PERFORMANCE);
log.info({ event: 'web-vitals', lcp, inp, cls }, 'web-vitals captured');
```

- Never `console.log` in production code.
- Use the smallest level that conveys the meaning: `debug` for dev-only verbosity, `info` for events, `warn` for recoverable issues, `error` for failures.

## Async

- `Promise.all` only for independent operations.
- `Promise.allSettled` when continuing on failure matters.
- Never `Promise.all` for synchronous or dependent work.
- Always handle the rejected branch (no unhandled rejections in tests or runtime).

## Error handling

- Throw `Error` subclasses with clear names; do not throw strings.
- At the boundary (event handlers, worker `onmessage`, async entry points), catch and log via `logError(err, LogContext.<X>)`.

## Comments

- Code explains *what*. Comments explain *why* — only when the reason is non-obvious.
- No "TODO" without an owner or a linked spec/issue.
- Do not narrate the code (`// increment counter`). Delete those comments on sight.

## Worker boundaries

- Workers are **pure** — no DOM access, no `document`, no `window` outside `globalThis`.
- Communication via `postMessage` or `MessageChannel` with typed payloads (`src/types/`).
- Avoid sending large objects every frame; prefer deltas.

## Tests

See [`.cursor/rules/30-testing.mdc`](../.cursor/rules/30-testing.mdc).

## Files and size

- Hard guideline: ≤ 800–1000 LOC per file. Refactor when crossed.
- One responsibility per file. If you cannot describe the file in one sentence, split it.
