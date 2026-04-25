# Harness — Validation pipeline

The "harness" is the deterministic set of scripts an agent runs **before declaring any code task complete**. It is the safety net between an LLM and the user's keyboard.

## Scripts

All harness scripts live under [`scripts/harness/`](../../scripts/harness).

| Script | Purpose | Exit codes |
|---|---|---|
| `validate.sh` | Full local pipeline: lint → typecheck → test → build. | `0` ok / non-zero on first failure |
| `spec-check.mjs` | Verifies that the current branch / latest commit / PR title references at least one `REF-XX-(FR|AC)-N`. | `0` ok / `1` no reference / `2` invalid spec id |
| `perf-baseline.mjs` | Reads a `perf-snapshot-*.json` produced by REF-01's panel and compares it to `docs/SDD/baselines/<phase>-<device>.json`. | `0` ok / `1` regression beyond budget |
| `smoke-e2e.mjs` | Boots the app via Playwright, runs ~30s of simulated gameplay, asserts no console errors, saves a screenshot. | `0` ok / non-zero on assertion failure |

## When to run each

| Situation | Run |
|---|---|
| Before finishing any code task | `bash scripts/harness/validate.sh` |
| Opening a PR | `validate.sh` + `node scripts/harness/spec-check.mjs` |
| Closing REF-01 (perf panel) or anything performance-sensitive | `validate.sh` + `perf-baseline.mjs` after capturing a fresh snapshot |
| Before merging to `main` | All four scripts |
| Smoke check after a dependency upgrade | `validate.sh` + `smoke-e2e.mjs` |

## `validate.sh` contract

Sequence (always):

1. `pnpm lint`
2. `pnpm tsc --noEmit`
3. `pnpm test --run`
4. `pnpm build`

The script uses `set -euo pipefail`. The first failing step terminates the run with the non-zero exit code from that tool. Subsequent steps are skipped — fix and re-run.

Expected runtime on this codebase (cold cache): **≤ 60 s** on a modern dev machine. If it grows past 90 s, treat as a regression and investigate.

## `spec-check.mjs` contract

Looks for `REF-\d{2}-(FR|AC|NFR)-\d+` in (priority order):

1. `$PR_BODY` env var (used in CI).
2. The latest commit message on the current branch.
3. The branch name.

**Bypass**: prefix the commit subject with `[hotfix]` to skip the check (documented escape hatch for emergencies).

## `perf-baseline.mjs` contract

Inputs:

- Path to a `perf-snapshot-*.json` (the format defined in REF-01).
- Optional `--budget=<percent>` flag (default `5`).

Compares `p5(frameTime)` and `fps` against the matching baseline file under `docs/SDD/baselines/`. Fails on any regression beyond the budget.

When no baseline exists, the script writes a new one and exits `0` with a notice.

## `smoke-e2e.mjs` contract

Uses `@playwright/test` (Chromium only by default). Steps:

1. `vite preview` (or reuse a running `vite` dev server if present).
2. Navigate to `http://localhost:4173/`.
3. Press `Space` to start.
4. Drive the snake for ~30 seconds with a deterministic input pattern.
5. Assert no `console.error` events.
6. Save screenshot to `scripts/harness/.artifacts/smoke-<timestamp>.png` (gitignored).

## Outputs and artifacts

Harness outputs go to:

- stdout/stderr (always — the agent reads exit code + last lines).
- `scripts/harness/.artifacts/` for screenshots and snapshots (gitignored).

Never commit `.artifacts/`. Anything that needs to persist (a baseline) goes to `docs/SDD/baselines/` explicitly.

## Failure protocol for agents

1. Read the failing tool's output.
2. Form a hypothesis.
3. Apply the smallest fix that addresses the root cause (no defensive `try/catch` to silence symptoms).
4. Re-run `validate.sh`.
5. If the same step fails twice with no progress, surface the failure to the user with: failing command, exit code, last 30 lines of output, and your hypothesis.
