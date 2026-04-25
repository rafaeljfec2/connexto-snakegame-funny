# Definition of Done — feature checklist

Copy this checklist into the PR description and tick every box before requesting review.

## Spec

- [ ] An approved spec exists at `docs/SDD/specs/REF-XX-<slug>.md` (status `Approved` or `In Progress`).
- [ ] All commits in this branch reference at least one `REF-XX-FR-N` or `REF-XX-AC-N`.
- [ ] No files outside the spec's "Files to touch" section were modified (or the spec was updated first).

## Code quality

- [ ] No `any` introduced (`pnpm lint` clean).
- [ ] `??` used for default values; no `||` for default values.
- [ ] Component props are `readonly`.
- [ ] No `console.log` in production code paths (use `createLogger`).
- [ ] No new dependency added unless listed in the spec.
- [ ] No file exceeds ~1000 LOC after the change.
- [ ] No redundant or narrative comments.

## Tests

- [ ] Every Acceptance Criterion (`REF-XX-AC-N`) has at least one automated test.
- [ ] Test descriptions are in English.
- [ ] Tests are independent and deterministic.
- [ ] `pnpm test --run` is green locally.

## Mobile-first

- [ ] New CSS uses `min-width` queries.
- [ ] Interactive elements ≥ 44×44 px.
- [ ] Heavy animations are gated by `prefers-reduced-motion`.

## Harness

- [ ] `bash scripts/harness/validate.sh` returned exit 0.
- [ ] (If perf-sensitive) `node scripts/harness/perf-baseline.mjs` within budget.
- [ ] (If UX-touching) `node scripts/harness/smoke-e2e.mjs` returned exit 0.

## Documentation

- [ ] Spec status updated to `Done` (when this PR closes it) with a one-line "Implementation notes".
- [ ] If a load-bearing decision was made, an ADR was added/updated under `docs/ADR/`.
- [ ] If user-facing strings were added, both PT-BR and EN-US were translated.
- [ ] If new agent guidance is needed, `AGENTS.md` was updated (not duplicated elsewhere).

## Safety

- [ ] No changes to `.env`, `.git/config`, `.ssh/`, or any secret/credential file.
- [ ] No destructive shell command was suggested or run during development.
- [ ] No publish/deploy command (`git push`, `npm publish`, `docker push`, etc.) was run without explicit user authorization.

---

If any box cannot be ticked, explain why in the PR description and link the relevant follow-up spec or issue.
