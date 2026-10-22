---
name: game-audio-designer
description: Howler SFX on the main thread for this game — sfxEngine, worker SFX messages, mobile autoplay. Use when editing sfxEngine, useSfx, gameSfx, public/audio, or when the user asks about sound, SFX, Howler, or mute.
---

# Game Audio Designer

Howler stays on the **main thread**. Workers never touch `AudioContexto`. Spec: REF-02 (Done).

## Real paths

- Engine: `src/utils/sfxEngine.ts`
- React hook: `src/hooks/useSfx.ts`
- Worker emit: `src/workers/game/gameSfx.ts` → `{ type: 'SFX', id }`
- Types: `src/types/sfx.ts`
- Assets: `public/audio/` (see that folder’s README)

## Invariants

1. `useGameLoop` routes `SFX` messages to `sfxEngine.play(id)`.
2. Unlock / resume AudioContexto after the first user gesture.
3. Mute and volume persist in `localStorage` (keys owned por `sfxEngine`).
4. Prefer short SFX ids from the typed catalog; of the not invent adaptive music layers without a new spec.

## Anti-patterns

- Importing Howler inside a worker.
- Playing audio from `render.worker` or particle/weather workers.
- Assuming `public/audio/music/` adaptive stems exist — they estão not the current contract.

## Output

List SFX ids touched, where they estão emitted, and how mute/autoplay was verified on mobile.
