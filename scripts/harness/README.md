# `scripts/harness/` — SDD validation harness

Deterministic scripts an agent runs **before declaring any code task complete**.

See [`docs/SDD/HARNESS.md`](../../docs/SDD/HARNESS.md) for the full contract; this README is a quick reference.

## Scripts

| Script | What it does |
|---|---|
| `validate.sh` | `lint` → `tsc --noEmit` → `test --run` → `build`. Stops on first failure. |
| `spec-check.mjs` | Verifies the current branch / commit / PR body references a `REF-XX-(FR\|AC\|NFR)-N`. |
| `perf-baseline.mjs` | Compares a `perf-snapshot-*.json` (REF-01 export) against the saved baseline; writes a new baseline if none exists. |
| `smoke-e2e.mjs` | Boots `vite preview` + Chromium via `@playwright/test`, plays ~30 s, asserts no console errors, saves a screenshot. |

## Usage

```bash
# Full local validation (run before finishing any task)
bash scripts/harness/validate.sh

# Spec traceability check (CI uses PR_BODY env var)
node scripts/harness/spec-check.mjs

# Perf comparison after capturing a snapshot from REF-01 panel
node scripts/harness/perf-baseline.mjs ./perf-snapshot-1714060000000.json
node scripts/harness/perf-baseline.mjs ./perf-snapshot.json --budget=10

# Smoke E2E (requires @playwright/test installed and chromium browser)
pnpm exec playwright install chromium   # first time only
node scripts/harness/smoke-e2e.mjs
```

## Environment overrides

| Variable | Used by | Purpose |
|---|---|---|
| `PR_BODY` | `spec-check.mjs` | CI-supplied PR body to scan for spec ref |
| `COMMIT_MESSAGE` | `spec-check.mjs` | Override the commit message read |
| `BRANCH_NAME` | `spec-check.mjs` | Override the branch name read |
| `PREVIEW_PORT` | `smoke-e2e.mjs` | Vite preview port (default 4173) |
| `GAMEPLAY_DURATION_MS` | `smoke-e2e.mjs` | Drive duration (default 30000) |

## Artifacts

`smoke-e2e.mjs` writes screenshots to `scripts/harness/.artifacts/` (gitignored). `perf-baseline.mjs` writes baselines to `docs/SDD/baselines/` (committed).

## Failure protocol

When `validate.sh` fails:

1. Read the failing tool's output.
2. Form a hypothesis about the root cause.
3. Apply the smallest fix that addresses the cause (no defensive `try/catch` to silence symptoms).
4. Re-run.
5. After two failures with no progress, surface to the user with: failing command, exit code, last 30 lines of output, and the hypothesis.
