# Architecture Decision Records (ADR)

An ADR captures **a single architectural decision**, **why** it was made, and **what we accept as consequences**. ADRs are immutable historical records: once accepted, you do not edit them — you write a new ADR that supersedes them.

## Process

1. Copy [`TEMPLATE.md`](TEMPLATE.md) to `NNNN-<short-slug>.md` (next zero-padded number).
2. Set status `Proposed`.
3. Open a PR; discuss with the team and the user.
4. On approval, change status to `Accepted` (or `Rejected` and explain why).
5. If a future ADR replaces this one, set status to `Superseded by ADR-NNNN` and link both ways.

## Naming

`NNNN-<slug>.md` where `NNNN` is zero-padded (e.g., `0001-adopt-sdd.md`).

## When to write an ADR

- Adopting/replacing a framework, runtime, or library category (state mgmt, animation engine, audio, persistence).
- Choosing between architecture patterns (workers vs main thread, ECS vs OOP, monorepo vs polyrepo).
- Decisions that will be hard or costly to reverse.
- Decisions that future agents/devs will ask "why is it like this?" within 12 months.

## When NOT to write an ADR

- Adding a small utility library used in one place — that goes in the spec.
- Implementation details that the spec already covers.
- One-off bugfixes.

## Index

- [ADR-0001 — Adopt Spec-Driven Development](0001-adopt-sdd.md)
- [ADR-0002 — Keep Canvas 2D, defer PixiJS until metrics demand it](0002-keep-canvas2d-defer-pixijs.md)
- [ADR-0003 — Universal AGENTS.md as the single source of truth for AI agents](0003-universal-agents-md.md)
- [ADR-0004 — React external store via `useSyncExternalStore` and CSS-driven background animation](0004-react-external-store-and-css-driven-background.md)
- [ADR-0005 — Neon Arcade design system and L1 full-bleed layout](0005-neon-arcade-design-system-and-l1-full-bleed-layout.md)
