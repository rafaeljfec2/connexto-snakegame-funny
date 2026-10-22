---
name: game-designer-mechanics
description: Gameplay design for this Snake — phases, bosses, power-ups, feel. Use when editing boss/phase/power-up utils or constants, or when the user asks for new mechanics, balancing, bosses, or progression.
---

# Game Designer — Mechanics & Feel

Ask: what interesting decision does the player make, and what is the risk/reward? New mechanics need an SDD spec before code.

## Real paths

- Phases: `src/constants/phases.ts`, `src/utils/phases.ts`, `src/utils/phaseMechanics.ts`
- Bosses: `src/utils/bosses.ts`, `src/utils/boss/**`, `src/utils/bossSnake.ts`, `docs/SISTEMA_COMBATE_BOSS.md` (verify in code)
- Power-ups: `src/constants/powerUps.ts`, `src/utils/powerUps.ts`
- Combat rules live in the game worker helpers, not in React

## Invariants

1. 10 phases × 5 levels; boss on levels divisible by 5 (up to 50).
2. Shared boss combat: body hit weakens; head kills player if boss is strong; head defeats if ≤3 segments (see boss combat doc + worker tests).
3. Power-ups are food types with durations/effects in `POWER_UP_CONFIG`.
4. Do not change score/level formulas or boss roster without a spec Acceptance Criterion.

## Anti-patterns

- Shipping a mechanic with no playable AC / test.
- Putting boss AI in a React component.
- Balancing only by feel with no constant or config the harness can regress.

## Output

Player decision, risk/reward, config knobs, AC ids, and which worker files change.
