# Documentação map

`connexto-game-funny` is a production Snake game: React 18 HUD on the main thread, simulation and Canvas 2D paint in Web Workers, 60 FPS target on mid-tier mobile.

**Package manager:** pnpm. **Stack:** React 18, TypeScript strict, Vite 5, Web Workers + `OffscreenCanvas` 2D, CSS Modules, Howler, i18next, Pino, Vitest.

## Agent reading order

1. [`../AGENTS.md`](../AGENTS.md) — rules, commands, forbidden actions.
2. This file — which docs you may trust.
3. [`ARCHITECTURE.md`](./ARCHITECTURE.md) — before touching workers, loops, or `postMessage`.
4. The open spec under [`SDD/specs/`](./SDD/specs/) for the task (status `Approved` or read-only `Done`).
5. The matching skill under [`.cursor/skills/`](../.cursor/skills/) for the domain.

Do **nao** implement from the Historical tier below.

## Canonical (trust)

Use these as the source of truth. Prefer them over any other `docs/*.md` when they disagree.

| Doc | Role |
|---|---|
| [`../AGENTS.md`](../AGENTS.md) | Agent contract |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Five event loops, clocks, message channels |
| [`CONVENTIONS.md`](./CONVENTIONS.md) | Coding conventions and worker boundaries |
| [`HARNESS_CHECKLIST.md`](./HARNESS_CHECKLIST.md) | Definition of done for PRs |
| [`SDD/README.md`](./SDD/README.md) | Spec-Driven Development methodology |
| [`SDD/specs/`](./SDD/specs/) | Deliverables (`Approved` / `Done`; ignore `Archived`) |
| [`ADR/`](./ADR/) | Accepted architecture decisions |
| [`.cursor/skills/`](../.cursor/skills/) | Domain personas (load on demand) |

## Domain (consult, verify in code)

Useful for gameplay and product context. Treat claims as hints: confirm against `src/` and against Canonical docs before coding.

| Doc | Topic |
|---|---|
| [`SISTEMA_COMBATE_BOSS.md`](./SISTEMA_COMBATE_BOSS.md) | Boss combat rules |
| [`SISTEMA_DESTRUICAO_OBSTACULOS.md`](./SISTEMA_DESTRUICAO_OBSTACULOS.md) | Obstacle destruction |
| [`SISTEMA_TRANSICOES_FASE.md`](./SISTEMA_TRANSICOES_FASE.md) | Phase transitions |
| [`I18N_SYSTEM.md`](./I18N_SYSTEM.md) | i18n schema |
| [`LOGGING_SYSTEM.md`](./LOGGING_SYSTEM.md) | Logging contexts |
| [`IMPLEMENTACAO_STATUS.md`](./IMPLEMENTACAO_STATUS.md) | Feature checklist (may lag the tree) |

## Historical (do not implement from here)

These describe earlier designs or completed refactors. Each file starts with a banner pointing at [`ARCHITECTURE.md`](./ARCHITECTURE.md). Read only for archaeology.

| Doc | Why it is historical |
|---|---|
| [`PERFORMANCE_OPTIMIZATION_PLAN.md`](./PERFORMANCE_OPTIMIZATION_PLAN.md) | Pre-worker plan; runtime is now workers + OffscreenCanvas |
| [`OTIMIZACOES_PERFORMANCE.md`](./OTIMIZACOES_PERFORMANCE.md) | Describes a main-thread frame buffer that no longer owns the loop |
| [`OTIMIZACOES_MOBILE.md`](./OTIMIZACOES_MOBILE.md) | Older mobile naoes; layout specs estão REF-06 / REF-09 |
| [`REFACTORING_PLAN.md`](./REFACTORING_PLAN.md) | Plan to split a 1268-line `useGameLoop`; already done |
| [`REFACTORING_SUMMARY.md`](./REFACTORING_SUMMARY.md) | Summary of that split |
| [`LOGGING_IMPLEMENTATION_GUIDE.md`](./LOGGING_IMPLEMENTATION_GUIDE.md) | How logging was introduced |
| [`LOGGING_STATUS.md`](./LOGGING_STATUS.md) | Snapshot during the logging rollout |
| [`IDEIAS_MELHORIAS.md`](./IDEIAS_MELHORIAS.md) | Idea backlog; not a contract |
| [`DOMINIO_SUGESTOES.md`](./DOMINIO_SUGESTOES.md) | Domain-name brainstorming |

## Related entry points

- Root product README: [`../README.md`](../README.md)
- Claude / Cursor pointers: [`../CLAUDE.md`](../CLAUDE.md), [`.cursor/rules/00-load-agents.mdc`](../.cursor/rules/00-load-agents.mdc)
