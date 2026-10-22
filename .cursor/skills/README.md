# `.cursor/skills/` — project game skills

Eight specialist personas for `connexto-game-funny`. Each `SKILL.md` is English-only and describes **this repository**, not generic game engines.

Globs live in [`skills.catalog.json`](skills.catalog.json). The always-on rule [`.cursor/rules/50-game-skills.mdc`](../rules/50-game-skills.mdc) says: match one glob → read one skill. Do not stack personas for a local fix.

| Skill | When |
|---|---|
| [`web-game-architect`](web-game-architect/SKILL.md) | Worker ownership, message contracts |
| [`game-loop-performance-expert`](game-loop-performance-expert/SKILL.md) | FPS, jank, the two clocks |
| [`canvas2d-rendering-expert`](canvas2d-rendering-expert/SKILL.md) | `render.worker` paint |
| [`web-game-input-ux`](web-game-input-ux/SKILL.md) | Keyboard / D-pad controls |
| [`game-audio-designer`](game-audio-designer/SKILL.md) | Howler SFX |
| [`game-designer-mechanics`](game-designer-mechanics/SKILL.md) | Phases, bosses, power-ups |
| [`pixel-art-sprite-director`](pixel-art-sprite-director/SKILL.md) | Snake skins / palettes |
| [`webgl-shader-artist`](webgl-shader-artist/SKILL.md) | Explicit WebGL ask only |

Runtime truth: [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md). Agent contract: [`AGENTS.md`](../../AGENTS.md).
