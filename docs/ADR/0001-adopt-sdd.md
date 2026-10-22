# ADR-0001 — Adopt Spec-Driven Development

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-04-25 |
| **Deciders** | rafael |
| **Related specs** | REF-01, REF-02, REF-03 |
| **Supersedes** | — |
| **Superseded by** | — |

## Context

The project has grown rapidly: 30+ React components, 4 Web Workers, 10 phases, 10 bosses, multiple subsystems (weather, particles, power-ups, achievements, i18n, logging). Existing documentation (`docs/IDEIAS_MELHORIAS.md`, `docs/PERFORMANCE_OPTIMIZATION_PLAN.md`, `docs/SISTEMA_*.md`) describes *what exists* and *what is desired* but does not enforce a workflow. New work — including work delegated to AI agents — re-derives intent each time.

Multiple agents (Cursor, Claude Code) collaborate on the codebase. Without shared, versioned specs, each agent invents conventions, duplicates logic, and re-debates settled questions.

## Decision

We will adopt **Spec-Driven Development (SDD)** as the standard workflow for any change beyond a trivial bugfix. The methodology, template, and harness live under [`docs/SDD/`](../SDD/README.md) and are mandatory:

- Every feature/refactor/non-trivial bugfix starts with an approved spec under `docs/SDD/specs/REF-XX-<slug>.md`.
- Specs use the canonical template ([`SPEC_TEMPLATE.md`](../SDD/SPEC_TEMPLATE.md)) with stable IDs (`REF-XX-FR-N`, `REF-XX-AC-N`).
- Implementation only begins on `Approved` status.
- Every commit/PR references at least one spec ID.
- The harness (`scripts/harness/validate.sh`) must pass before a task is declared done.

Agents are guided by [`AGENTS.md`](../../AGENTS.md), which encodes this workflow.

## Consequences

### Positive

- Multi-agent collaboration becomes deterministic. A new agent reads `AGENTS.md` + the relevant spec and is productive immediately.
- Acceptance criteria are written before code, which keeps tests honest.
- PRs are easy to review: cite the spec, check the AC, run the harness.
- Decisions and trade-offs survive turnover (in ADRs and specs, not commit history).

### Negative / accepted trade-offs

- Initial overhead per feature (writing the spec) is real. We accept this cost for changes > ~20 LOC or touching multiple modules; trivial fixes can skip it.
- Specs and the codebase can drift if not maintained. Mitigation: PR template forces spec status update; `spec-check.mjs` enforces traceability.

### Neutral

- Existing legacy docs (`docs/SISTEMA_*.md`, `docs/IDEIAS_MELHORIAS.md`) are kept as historical/inspirational records but are not part of the SDD workflow.

## Alternatives considered

- **Continue ad-hoc**: rejected — does not scale with multi-agent work.
- **Full RFC process**: rejected — too heavyweight for a game of this size; SDD is the lighter sibling.
- **TDD only**: rejected — tests alone do not capture intent or trade-offs.

## References

- [`docs/SDD/README.md`](../SDD/README.md)
- [`docs/SDD/SPEC_TEMPLATE.md`](../SDD/SPEC_TEMPLATE.md)
- [`AGENTS.md`](../../AGENTS.md)
