<!--
  Copy this file to docs/SDD/specs/REF-XX-<slug>.md and fill it in.
  Replace XX with the next available ordinal.
  Stable IDs (REF-XX-FR-N, REF-XX-NFR-N, REF-XX-AC-N) MUST not be renumbered after approval.
-->

# REF-XX — \<Title\>

| Field | Value |
|---|---|
| **Status** | Draft |
| **Owner** | \<github-handle or name\> |
| **Created** | YYYY-MM-DD |
| **Last updated** | YYYY-MM-DD |
| **Related ADRs** | \<links or "—"\> |
| **Supersedes** | \<spec id or "—"\> |

> Status values: `Draft` → `Approved` → `In Progress` → `Done` (or `Blocked`, `Superseded`).

## 1. Specification

- **Problem**: what hurts today, with concrete evidence (file paths, metrics, user reports).
- **Objective**: one sentence; what the world looks like when this ships.
- **Non-objective**: what this spec explicitly does *not* cover, to avoid scope creep.
- **Success (measurable)**: bullet list of measurable outcomes. Each must be observable in the running app or in the harness output.

## 2. User Stories

- **US-01** As a \<role\>, I want \<capability\> so that \<benefit\>.
- **US-02** …

## 3. Requirements

### Functional

- **REF-XX-FR-1** Concrete, testable behavior.
- **REF-XX-FR-2** …

### Non-Functional

- **REF-XX-NFR-1** Performance/security/accessibility/budget constraint.
- **REF-XX-NFR-2** …

> Common NFRs to consider: no `any`, mobile-first, `prefers-reduced-motion`, bundle size delta, FPS overhead, latency, accessibility (a11y).

## 4. Design

### Architecture

\<Optional mermaid diagram. Reuse the conventions from `AGENTS.md`.\>

### Contracts

```ts
// Public TypeScript types/interfaces this spec introduces or modifies
```

### Files to touch

- `src/<path>/<file>.ts` — \<what changes\>
- `src/<path>/<file>.tsx` — \<what changes\>
- `package.json` — \<deps added, if any\>

> Implementation must not touch files outside this list. Add new files here before creating them.

## 5. Acceptance Criteria

- **REF-XX-AC-1** Given \<context\>, when \<action\>, then \<observable outcome\>.
- **REF-XX-AC-2** …

> Every AC must be testable. If you cannot describe how to verify it, rewrite it.

## 6. Test Plan

| AC | Test type | Location |
|---|---|---|
| REF-XX-AC-1 | unit | `src/<path>/__tests__/<file>.test.ts` |
| REF-XX-AC-2 | component | `src/components/__tests__/<file>.test.tsx` |
| REF-XX-AC-3 | smoke E2E | `scripts/harness/smoke-e2e.mjs` |

Plus:

- `pnpm lint` clean.
- `pnpm tsc --noEmit` clean.
- `pnpm build` clean.
- (Optional) `node scripts/harness/perf-baseline.mjs` within budget.

## 7. Risks / Rollback

- **R1** \<risk description\>. **Mitigation**: \<how to reduce probability or blast radius\>.
- **R2** …

**Rollback strategy**: how to undo this change without affecting unrelated features. Prefer feature flags (env var) over code reversal when the change is invasive.

## 8. Implementation notes (filled when status = Done)

- Final files changed: …
- Deviations from Design section: …
- Follow-ups (link to new specs/issues if any): …
