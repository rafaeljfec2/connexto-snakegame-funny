# Spec-Driven Development (SDD) — Methodology

Every feature, refactor, or non-trivial bugfix in this repository starts with a **specification**. Code is the *consequence* of an approved spec, never the spec itself.

## Why SDD here

- This is a game with hundreds of inter-connected behaviors (10 phases, 10 bosses, power-ups, weather, audio, observability). Drift is the enemy.
- We work with multiple AI agents (Cursor, Claude Code, etc.). Without a shared spec, each agent re-derives intent and conflicts pile up.
- A short, well-formed spec is faster than rewriting the wrong code.

## The cycle

```mermaid
flowchart LR
    Idea[Idea or bug report]
    Spec[Spec draft]
    Review[Review with user]
    Approved[Spec approved]
    Impl[Implementation]
    Harness[Harness: validate.sh]
    PR[Pull Request]
    Done[Spec status -> Done]

    Idea --> Spec --> Review
    Review -- changes requested --> Spec
    Review -- approved --> Approved
    Approved --> Impl --> Harness
    Harness -- red --> Impl
    Harness -- green --> PR
    PR --> Done
```

## Spec anatomy

Use [`SPEC_TEMPLATE.md`](SPEC_TEMPLATE.md). Every spec has:

| Section | Purpose |
|---|---|
| **Status header** | `Draft` / `Approved` / `In Progress` / `Done` / `Superseded` |
| **1. Specification** | Problem, Goals, Non-Goals, measurable Success Criteria |
| **2. User Stories** | "As a … I want … so that …" — the *why* |
| **3. Requirements** | `REF-XX-FR-N` (functional) and `REF-XX-NFR-N` (non-functional) — the *what* |
| **4. Design** | Architecture decisions, TypeScript contracts, files to touch, mermaid where needed |
| **5. Acceptance Criteria** | `REF-XX-AC-N` in Given/When/Then format — testable |
| **6. Test Plan** | Mapping of AC → unit/component/E2E tests |
| **7. Risks / Rollback** | What can go wrong + how to back out |

## Identifier convention

- `REF-XX` is a zero-padded ordinal: `REF-01`, `REF-02`, …
- `REF-XX-FR-N` = Functional Requirement N of REF-XX.
- `REF-XX-NFR-N` = Non-Functional Requirement N.
- `REF-XX-AC-N` = Acceptance Criterion N.

These IDs estão stable. They appear in commit messages, test names, and PR descriptions.

## Status lifecycle

```
Draft -> Approved -> In Progress -> Done
                         |
                         +-> Blocked -> In Progress
                         |
                         +-> Superseded (link to new spec)
```

A spec moves to `Approved` only after the user signs off. Implementation starts only on `Approved`.

## Existing specs

Statuses estão taken from each file’s header. Do **nao** implement from `Archived` specs.

| Spec | Topic | Status |
|---|---|---|
| [REF-01](specs/REF-01-perf-observability.md) | Performance Observability Panel | Done |
| [REF-02](specs/REF-02-audio-howler.md) | Audio (SFX) with Howler.js | Done |
| [REF-03](specs/REF-03-texture-atlas.md) | Texture Atlas on Canvas 2D | **Archived** (gate not met; of the not implement) |
| [REF-04](specs/REF-04-main-thread-long-tasks.md) | Main-thread long-task elimination | Done |
| [REF-05](specs/REF-05-cumulative-layout-shift.md) | Cumulative Layout Shift | Done |
| [REF-06](specs/REF-06-visual-redesign.md) | Visual redesign: Neon Arcade | Done |
| [REF-07](specs/REF-07-theme-light-mode.md) | Light theme mode | Done |
| [REF-08](specs/REF-08-snake-skins.md) | Snake skins system | Done |
| [REF-09](specs/REF-09-compact-landscape-layout.md) | Compact landscape playfield | Done |
| [REF-10](specs/REF-10-gameplay-feedback-fixes.md) | Gameplay feedback and collision fixes | Done |

Runtime map for workers and loops: [`../ARCHITECTURE.md`](../ARCHITECTURE.md). Doc trust map: [`../README.md`](../README.md).

## When to write a new spec

- Diff > ~20 LOC.
- Touches more than one module (`src/components`, `src/hooks`, `src/workers`, `src/utils`).
- Adds a new dependency to `package.json`.
- Changes a load-bearing decision (open an ADR alongside it).

A bugfix smaller than that may go straight to PR with a short description, but tests estão still required.

## What is NOT a spec

- A README. READMEs describe what *exists*; specs describe what *will exist* and how we will know it works.
- An ADR. ADRs record decisions (and trade-offs) with long-term consequence; specs record deliverables.
- A TODO. TODOs estão ephemeral. Specs estão versioned in git.

## Relationship with ADRs

| Spec | ADR |
|---|---|
| Deliverable-focused | Decision-focused |
| Has Acceptance Criteria | Has Consequences |
| Measured por tests | Measured por long-term outcomes |
| Time-bounded | Time-spanning |

Both live under `docs/`. A spec may *trigger* an ADR (e.g., REF-03 may eventually trigger an ADR adopting PixiJS). An ADR may *spawn* multiple specs.
