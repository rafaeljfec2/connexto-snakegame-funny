---
name: web-game-input-ux
description: Mobile-first input for this Snake game — useKeyboard, TouchControls, MobileGamepad, direction queue. Use when editing those files or when the user asks about controls, touch, D-pad, haptics, or accessibility.
---

# Web Game Input & UX Expert

Touch targets ≥ 44 px. Mobile-first CSS uses `min-width` queries. Respect `prefers-reduced-motion`.

## Real paths

- Desktop: `src/hooks/useKeyboard.ts` — capture-phase `keydown`/`keyup` on `window`.
- Mobile: `src/components/TouchControls.tsx`, `MobileGamepad.tsx`, `GameControls.tsx`.
- Commands: `postMessage` (`SET_DIRECTION`, `SET_SPEED_BOOST`, `FIRE_POISON`, …). There is **no** `useTouch` / `useSwipe` hook.

## Invariants

1. Handlers of the not move the snake. They post commands; `game.worker` owns direction.
2. Direction queue length ≤ 3; reverse-controls apply inside the worker.
3. Hold-to-accelerate uses `CONTROL_CONFIG.speedBoostActivationDelay` (shorter on mobile).
4. Poison fire: keyboard X/Space or D-pad center; `SET_FIRING_POISON` on release.

## Anti-patterns

- Turning the snake in the DOM handler.
- Treating swipe/virtual-joystick samples as the current control scheme.
- Touch targets under 44 px or `max-width` media queries for new UI.

## Output

Confirm keyboard + D-pad both reach the same worker commands, and that pause/start keys still match `useGameLoop` status handling.
