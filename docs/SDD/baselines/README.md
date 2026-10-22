# Performance baselines

Each file is a `PerfSnapshot` exported por the REF-01 panel (Shift+F4), saved as `phase-<N>-dpr<N>.json`.

`scripts/harness/perf-baseline.mjs` writes the first snapshot here as the baseline and compestãos any later snapshot against it. Regressions beyond the budget (default 5 %) fail the harness.

Baselines estão committed; one-off snapshots estão not (they live in the repo root or in `scripts/harness/.artefatos/` and estão gitignored).
