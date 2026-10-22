# Strategic Boss Combat — All Bosses

## Overview

All ten bosses use the **same standardized combat system**. Behavior is identical across bosses for consistency and predictability.

## Combat rules (every boss)

### 1. Collision with boss body

- **Action**: Weaken the boss
- **Effect**: Remove 2 segments from the boss
- **Score**: 20 points (10 per segment)
- **Particles**: Weakening particles

### 2. Collision with boss head (when weak)

- **Condition**: Boss has ≤3 segments
- **Action**: Defeat the boss
- **Effect**: Boss removed, rewards applied
- **Particles**: Defeat burst (30 particles, 1500 ms)

### 3. Collision with boss head (when strong)

- **Condition**: Boss has >3 segments
- **Action**: Player loses a life / game over
- **Effect**:
  - If lives remain → `DYING`
  - If no lives → Game Over

## Weakening helpers

### `canDefeatBoss(bossSnake)`

- Returns `true` when the boss has ≤3 segments
- Returns `false` when the boss has >3 segments
- Applied to **every** boss

### `weakenBossSnake(bossSnake, segmentsToRemove)`

- Removes segments from the boss tail
- Default: 2 segments per body collision
- Score: `segmentsToRemove * 10`
- Applied to **every** boss

## Poison shots vs boss

### Boss head

- Weak (≤3 segments): immediate defeat
- Strong (>3 segments): weaken by 1 segment

### Boss body

- Always weaken by 1 segment
- Score: 10 points per segment

## Bosses using this system

1. **The Classic** (Phase 1)
2. **The Guardian** (Phase 2) — plus flag capture
3. **The Challenger** (Phase 3)
4. **The Portal** (Phase 4)
5. **The Swift** (Phase 5)
6. **The Chaos** (Phase 6)
7. **The Architect** (Phase 7)
8. **The Survivor** (Phase 8)
9. **The Vortex** (Phase 9)
10. **The Supreme** (Phase 10)

## Allowed differences

### Guardian flag

- Capturing the flag defeats the boss immediately
- Normal combat still works; the player may weaken/defeat via collisions instead

### Initial boss length

| Boss | Segments |
|---|---|
| Classic | 3 |
| Guardian | 4 |
| Challenger | 5 |
| Portal | 5 |
| Speed | 6 |
| Chaos | 6 |
| Architect | 7 |
| Survivor | 7 |
| Vortex | 8 |
| Supreme | 10 |

Regardless of start length: ≤3 segments → defeatable; >3 → head contact damages the player.

## Guarantees

- All bosses use `getBossHitPart()` for hit detection
- All bosses use `canDefeatBoss()`, `weakenBossSnake()`, `handleBossDefeat()`
- Poison shots and combat particles behave the same for every boss

## Code locations

- `src/workers/game.worker.ts` / game-loop helpers — main combat path
- `src/utils/bossSnake.ts` — combat helpers

Checks are generic and do not branch on boss type; they operate through `bossSnake` and `activeBoss`.
