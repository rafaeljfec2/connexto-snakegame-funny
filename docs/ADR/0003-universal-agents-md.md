# ADR-0003 — Universal AGENTS.md as the single source of truth for AI agents

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-04-25 |
| **Deciders** | rafael |
| **Related specs** | — |
| **Supersedes** | — |
| **Superseded by** | — |

## Context

Multiple AI coding tools work in this repository: Cursor, Claude Code, and potentially Codex/others. Each tool has its own conventional location for guidance:

- Cursor: `.cursor/rules/*.mdc` (with frontmatter and globs).
- Claude Code: `CLAUDE.md` at the repo root.
- Many tools (and the emerging community convention): `AGENTS.md` at the repo root.

If we duplicate the same coding rules, workflow, and forbidden-action list into all three locations, they will drift. Drift means an agent may follow stale guidance and ship incorrect code. That is the worst possible failure mode in multi-agent collaboration.

## Decision

`AGENTS.md` at the repository root is the **single source of truth**. All other agent-targeted files are thin pointers:

- `CLAUDE.md` — 3–5 lines pointing to `AGENTS.md`.
- `.cursor/rules/00-load-agents.mdc` — `alwaysApply: true`, instructs the agent to read `AGENTS.md`.
- Other `.cursor/rules/*.mdc` files — scope-specific (testing, mobile-first, coding standards). They never duplicate `AGENTS.md`; they extend it for the file glob they target.

Agents are expected to:

1. Read `AGENTS.md` first.
2. Consult specific `.cursor/rules/*.mdc` rules only for the file/area they are touching.
3. Treat `docs/SDD/specs/REF-XX-*.md` as the source of truth for *what* to build.
4. Treat `docs/ADR/NNNN-*.md` as the source of truth for *why* the architecture is the way it is.

## Consequences

### Positive

- Updates happen in one place (`AGENTS.md`); other files inherit automatically.
- Onboarding any new agent or human is the same: read `AGENTS.md`.
- Aligns with the broader 2025+ ecosystem convention around `AGENTS.md`.

### Negative / accepted trade-offs

- Some Cursor-native conventions (frontmatter globs in `.mdc`) cannot live in plain `AGENTS.md`. We accept a small amount of structured rule files in `.cursor/rules/` for that reason — but they remain *extensions*, not replacements.
- Tools that look only for `CLAUDE.md` need to follow the pointer; this is a one-time read cost.

### Neutral

- If a future tool requires a different filename (e.g., `.codex.md`), we add another pointer. The contract scales linearly.

## Alternatives considered

- **Duplicate content across all three files**: rejected — drift inevitable.
- **Skip `AGENTS.md`, use only `.cursor/rules`**: rejected — locks us into one tool's convention; non-Cursor agents would have nothing canonical to read.
- **Generate the three files from one source**: rejected — adds build tooling for marginal gain; the pointer pattern already solves the problem.

## References

- [`AGENTS.md`](../../AGENTS.md)
- [`CLAUDE.md`](../../CLAUDE.md)
- [`.cursor/rules/00-load-agents.mdc`](../../.cursor/rules/00-load-agents.mdc)
