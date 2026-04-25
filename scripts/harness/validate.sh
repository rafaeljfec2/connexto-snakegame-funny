#!/usr/bin/env bash
# Validation pipeline for the SDD harness.
# Exit non-zero on first failure. See docs/SDD/HARNESS.md for the contract.

set -euo pipefail

cd "$(dirname "$0")/../.."

step() {
  printf '\n\033[1;36m[harness] %s\033[0m\n' "$*"
}

t0=$(date +%s)

step "1/4 lint"
pnpm lint

step "2/4 typecheck"
pnpm tsc --noEmit

step "3/4 test"
pnpm test --run

step "4/4 build"
pnpm build

t1=$(date +%s)
elapsed=$((t1 - t0))
printf '\n\033[1;32m[harness] all green in %ss\033[0m\n' "$elapsed"
