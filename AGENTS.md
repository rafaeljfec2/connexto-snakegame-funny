# AGENTS.md — Guide for AI agents working on this repository

> Single source of truth for any AI agent (Cursor, Claude Code, Codex, etc.).
> `CLAUDE.md` and `.cursor/rules/*.mdc` only point here. Do not duplicate guidance — update this file instead.

## 1. What this repository is

`connexto-game-funny` is a production-grade Snake game built with **React 18 + TypeScript + Vite**, running gameplay logic and rendering off the main thread via **Web Workers** with **`OffscreenCanvas`** (2D context). The project ships 10 phases, 10 unique bosses, a power-up system, weather effects, and a mobile-first HUD.

Stable target: **60 FPS on mid-tier mobile**.

## 2. Repository layout

```
src/
  components/   React UI (HUD, overlays, debug panels) — co-located CSS Modules
  hooks/        Custom React hooks (useGameLoop, useGameState, useKeyboard, ...)
  workers/      Web Workers — game.worker, render.worker, weather.worker, particle.worker
    game/       Logic helpers consumed by game.worker
    render/    Rendering helpers consumed by render.worker
  contexts/     React contexts (ThemeContext)
  i18n/         i18next resources (PT-BR, EN-US)
  utils/        Domain logic (gameLogic, bosses, phases, particles, ...)
  constants/    Static configuration (game.ts: gridSize, cellSize, gameSpeed)
  types/        Shared TypeScript types (one file per domain)
  test/         Vitest setup
docs/
  README.md        Trust map (canonical vs domain vs historical)
  ARCHITECTURE.md  Runtime map: main thread, four workers, clocks, message channels
  SDD/          Spec-Driven Development methodology, template, specs/
  ADR/          Architecture Decision Records
  CONVENTIONS.md, HARNESS_CHECKLIST.md, plus historical design docs
scripts/
  harness/      Validation pipeline (lint+typecheck+test+build), perf baseline, spec-check, smoke E2E
public/         Static assets (sprites/, audio/, ...)
```

Path alias: `@/*` resolves to `src/*` (configured in `tsconfig.json` and `vite.config.ts`).

## 3. Stack and load-bearing decisions (do NOT change without an ADR)

- **React 18** + **TypeScript strict** + **Vite 5**.
- **pnpm** is the package manager. Never invoke `npm install` or `yarn`.
- **Web Workers + `OffscreenCanvas` 2D** for game logic and rendering. Do not move logic back to main thread. The runtime map (five event loops, simulation vs paint clocks, `MessageChannel`, no shared game heap) is [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
- **CSS Modules** for component styling (`*.module.css` co-located with `*.tsx`). No CSS-in-JS, no Tailwind unless an ADR replaces this.
- **`pino`** for structured logging via `src/utils/logger.ts` and `LogContext` enum. Never `console.log` in production code.
- **`i18next`** for any user-facing string (PT-BR + EN-US must be added together).
- **Vitest + Testing Library** for tests.

Replacing any of the above requires opening a new ADR in `docs/ADR/` first.

## 4. Non-negotiable coding rules

These come from the user and project conventions. ESLint enforces what it can; the rest is on the agent.

1. **No `any`**. ESLint `@typescript-eslint/no-explicit-any: error` is on. Use precise types or `unknown` + narrowing.
2. **Use `??` for default values, never `||`**. `||` skips legit falsy values (`0`, `''`, `false`).
3. **Mark React component props `readonly`** (Sonar `typescript:S6759`).
4. **Mobile-first**. New components ship mobile-first; CSS uses `min-width` queries, never `max-width`. Touch targets ≥ 44 px. Respect `prefers-reduced-motion`.
5. **No redundant comments**. Code explains *what*; comments explain *why* only when non-obvious.
6. **Test descriptions in English**. Source code identifiers in English (USA). Conversation with the user is PT-BR.
7. **No new dependencies without justification**. Check `package.json` first; reuse what is there. New deps must be cited in a spec or ADR.
8. **`Promise.all` only for independent async operations**. Use `Promise.allSettled` when you need to continue on failure. Do not `Promise.all` synchronous or dependent work.
9. **Files ≤ ~800–1000 LOC**. Refactor or split when crossed.
10. **Never edit `.env`** without explicit user authorization. Same for `.git`, `.ssh`, and any credential file.
11. **One-off scripts** live under `scripts/` (or are discarded after use). Never inside `src/`.
12. **Design tests around behavior, not implementation**. Independent, deterministic, AAA pattern.

## 5. SDD workflow (mandatory)

Every feature follows **Spec-Driven Development**. The full methodology is in [`docs/SDD/README.md`](docs/SDD/README.md).

Short version:

1. **Spec**: copy [`docs/SDD/SPEC_TEMPLATE.md`](docs/SDD/SPEC_TEMPLATE.md) into `docs/SDD/specs/REF-XX-<slug>.md`. Get it approved by the user before coding.
2. **Design**: contracts (TypeScript interfaces), files to touch, mermaid diagrams as needed — all inside the spec.
3. **Acceptance Criteria**: Given/When/Then format with stable IDs (`REF-XX-AC-N`). These become the test plan.
4. **Implement**: keep the spec open; every commit message references at least one `REF-XX-FR-N` or `REF-XX-AC-N`.
5. **Harness**: run `bash scripts/harness/validate.sh` before declaring the task done.
6. **PR**: title cites the spec ID; body fills the [`docs/HARNESS_CHECKLIST.md`](docs/HARNESS_CHECKLIST.md).

Spec index (statuses, Archived vs Done): [`docs/SDD/README.md`](docs/SDD/README.md). Do not implement from an `Archived` spec (e.g. REF-03).

## 5.1 Agent reading order

1. This file.
2. [`docs/README.md`](docs/README.md) before trusting anything under `docs/`.
3. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) before changing workers, loops, or message contracts.
4. The task’s `docs/SDD/specs/REF-XX-*.md` (`Approved` to code; `Done` for context).
5. The matching skill under [`.cursor/skills/`](./.cursor/skills/) for the domain (see [`.cursor/rules/50-game-skills.mdc`](./.cursor/rules/50-game-skills.mdc)).

## 6. Canonical commands

```bash
pnpm install                          # install deps (use pnpm only)
pnpm dev                              # vite dev server
pnpm test                             # vitest watch
pnpm test --run                       # vitest single run (CI/agent)
pnpm lint                             # eslint
pnpm build                            # tsc + vite build
bash scripts/harness/validate.sh      # full pipeline (lint + tsc --noEmit + test --run + build)
node scripts/harness/spec-check.mjs   # validate REF-XX reference in branch/commit
node scripts/harness/perf-baseline.mjs <snapshot.json>   # compare against baseline (after REF-01)
node scripts/harness/smoke-e2e.mjs    # boot + 30s gameplay + screenshot (Playwright)
```

The agent **must** run `bash scripts/harness/validate.sh` before closing any code task.

Environment requirement: Linux/macOS or WSL. The validate script uses `bash`/`set -euo pipefail`.

## 7. Creating or modifying a feature — step by step

1. Read the relevant spec in `docs/SDD/specs/`. If none exists, write one from the template and pause for user approval.
2. Update todo (`TodoWrite`) when the work has 3+ steps.
3. Touch only files listed in the spec's Design section. If you need a new file, update the spec first.
4. Run `pnpm lint` and `pnpm test --run` after each meaningful chunk.
5. Add/update tests so every Acceptance Criterion has at least one test (unit, component, or smoke).
6. Run `bash scripts/harness/validate.sh`. Fix anything red.
7. Update `docs/SDD/specs/REF-XX-*.md` status header to `Done` and add a one-line "Implementation notes".
8. Open the PR with the harness checklist filled in.

## 8. Forbidden actions (no execution without explicit user authorization)

The user maintains a strict list. Agent **must refuse** to run any of these without the user typing the explicit confirmation:

- Destructive shell: `rm -rf /`, `rm -rf *`, `mkfs`, `dd`, `shutdown`, `reboot`, `chmod -R 777 /`, `chown -R`.
- Piped remote execution: `curl ... | bash`, `wget ... | sh`, `IEX (New-Object Net.WebClient).DownloadString(...)`.
- Touching `.env`, `.git/config`, `.ssh/`, or any secret/credential file.
- Publishing/deploying: `git push`, `npm publish`, `docker push`, `kubectl apply`, force-push to `main`.
- Anything that mutates `/usr`, `/etc`, `C:\Windows`, or paths outside this repository.
- Skipping git hooks (`--no-verify`, `--no-gpg-sign`).
- `git commit --amend` after the commit was pushed; force pushes to `main`.

When in doubt, ask the user.

## 9. Communication contract

- The user converses in **PT-BR**; identifiers, code, comments, and test descriptions are in **English (USA)**.
- After substantive changes, write a short technical summary (1–2 paragraphs) and suggest next steps.
- Be explicit about expected behavior, limitations, and consequences.
- Never claim a task is "done" without running the harness.

## 10. Where to look when stuck

- Which docs to trust → [`docs/README.md`](docs/README.md)
- Runtime / threads / clocks → [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Convention questions → [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md)
- "Is this feature done?" → [`docs/HARNESS_CHECKLIST.md`](docs/HARNESS_CHECKLIST.md)
- "Why is the architecture like this?" → [`docs/ADR/`](docs/ADR/)
- Spec list and statuses → [`docs/SDD/README.md`](docs/SDD/README.md)
- Domain notes (verify in code) → `docs/SISTEMA_*.md`, `docs/LOGGING_SYSTEM.md`, `docs/I18N_SYSTEM.md`
- Idea backlog only (not a contract) → `docs/IDEIAS_MELHORIAS.md`

If the answer is not in any of those, propose an ADR.
