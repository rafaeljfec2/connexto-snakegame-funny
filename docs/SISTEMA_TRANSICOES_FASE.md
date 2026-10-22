# Phase Transition Flow

## Goal

When the player defeats a boss:

1. The game pauses
2. Show a phase-complete screen with phase statistics
3. “Next Phase” continues
4. Show a phase-intro screen with a countdown
5. After the countdown, gameplay resumes automatically

## Components

1. **PhaseCompleteScreen** — end-of-phase stats
2. **PhaseIntroScreen** — new-phase intro with 3, 2, 1, GO!

## `GameStatus` values

- `PHASE_COMPLETE` — end-of-phase UI
- `PHASE_INTRO` — intro countdown UI

## Flow

### On boss defeat

- Set status to `PHASE_COMPLETE`
- Keep the phase snapshot already on `GameState`

### Phase complete screen

- Visible when `status === PHASE_COMPLETE`
- Stats via `calculatePhaseStatistics`
- “Next Phase” sets status to `PHASE_INTRO`

### Phase intro screen

- Visible when `status === PHASE_INTRO`
- Countdown 3 → 2 → 1 → GO!
- After GO!, set status to `PLAYING` and create a new phase snapshot

### Phase snapshot

- Created when a phase starts (phase change or new game)
- Stored as `phaseStartSnapshot` on `GameState`

## Note

Early drafts listed wiring gaps in `useGameLoop` / `App.tsx`. Treat this file as domain description; confirm the current wiring in `src/` before changing transitions.
