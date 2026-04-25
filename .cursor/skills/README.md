# `.cursor/skills/` — Game Dev Personas para `connexto-game-funny`

Conjunto de **8 skills especialistas** que dão personalidade e expertise aos agentes de IA do Cursor para projetar, codar, desenhar e equilibrar jogos web (Snake e além).

Skills auto-invocadas pelo agente quando o contexto disparar os termos das descrições. Você também pode citar pelo nome (`@web-game-architect`).

## Mapa rápido

| Skill | Foco | Personalidade | Quando dispara |
|---|---|---|---|
| [`web-game-architect`](web-game-architect/SKILL.md) | Game loop, ECS, FSM, Workers, OffscreenCanvas | Senior staff, técnico | Arquitetura, fronteiras de thread, contratos |
| [`canvas2d-rendering-expert`](canvas2d-rendering-expert/SKILL.md) | Render Canvas 2D (atlas, batching, dirty rects) | Render programmer veterana | Pipeline de desenho, FPS no canvas |
| [`webgl-shader-artist`](webgl-shader-artist/SKILL.md) | WebGL/WebGPU, GLSL, post-process | Demoscener / graphics nerd | Migração WebGL, shaders, efeitos GPU |
| [`game-loop-performance-expert`](game-loop-performance-expert/SKILL.md) | Fixed timestep, profile, GC, 60 FPS mobile | Perf engineer obcecado por flame charts | Jank, frame drops, otimização |
| [`game-designer-mechanics`](game-designer-mechanics/SKILL.md) | Mecânicas, balanceamento, juice, bosses | Game designer apaixonado, criativo | Novo gameplay, balanceamento, "deixar divertido" |
| [`pixel-art-sprite-director`](pixel-art-sprite-director/SKILL.md) | Paleta, sprite, atlas, animação | Art director que respira pixel | Arte visual, sprites, paletas, atlas |
| [`game-audio-designer`](game-audio-designer/SKILL.md) | SFX, música adaptativa, Howler/Web Audio, mobile | Sound designer + engenheiro | Áudio do jogo, mixing, autoplay mobile |
| [`web-game-input-ux`](web-game-input-ux/SKILL.md) | Touch, gestures, joystick, haptics, a11y | UX engineer mobile-first | Controles, acessibilidade, tutorial, onboarding |

## Como funcionam

Cada skill tem:

- **Persona / Mindset** — pra dar tom e atitude ao agente
- **Stack defaults do projeto** — opinativo na stack atual (React 18 + Vite + Workers + Canvas 2D + Howler + i18next)
- **Outras stacks** — alternativas (Phaser, PixiJS, Three.js, Web Audio puro, etc.)
- **Workflows / checklists** — pra evitar ações soltas
- **Anti-patterns** — pra recusar com justificativa
- **Output esperado** — pra entregar valor consistente
- **Referências** — autores, livros, GDC talks, MDN

Todas alinhadas com o **AGENTS.md**, a SDD obrigatória (`docs/SDD/specs/REF-XX-*.md`) e o harness (`bash scripts/harness/validate.sh`).

## Como invocar

1. **Auto-discovery**: descreva sua tarefa naturalmente. Ex.: *"preciso otimizar FPS no mobile"* dispara `game-loop-performance-expert`.
2. **Explícito**: cite o nome no prompt. Ex.: *"agindo como `game-designer-mechanics`, proponha um power-up novo para a fase 5"*.
3. **Combo**: pode misturar várias. Ex.: *"@web-game-architect + @game-loop-performance-expert: redesenhe o loop pra 30Hz sim + 60Hz render"*.

## Como o carregamento dinâmico funciona (progressive disclosure)

O Cursor **não carrega o conteúdo de `SKILL.md` no início da sessão**. Apenas o `description` do frontmatter YAML é injetado no system prompt do agente.

```
Início da sessão:
  agent.systemPrompt += "Available skills: <id> — <description>" (1 linha por skill)

Durante a tarefa:
  agent detecta match (description ↔ contexto)
  → executa Read tool em .cursor/skills/<id>/SKILL.md
  → conteúdo entra no contexto SÓ AGORA
  → aplica persona, mindset, checklist, anti-patterns
```

Reforços ativos no projeto para garantir o carregamento correto:

- **[`.cursor/rules/50-game-skills.mdc`](../rules/50-game-skills.mdc)** (`alwaysApply: true`) — regra com tabela situação→skill e auto-apply por glob de arquivo. Esta regra é injetada em **toda** sessão e força a consulta antes de agir.
- **[`skills.catalog.json`](skills.catalog.json)** — catálogo machine-readable com tags, globs e combos. Permite ao agente listar/decidir rapidamente sem ler cada SKILL.md.
- **Trigger-rich descriptions** — cada `SKILL.md` traz termos em PT-BR e EN-US (ex.: *"FPS, jank, mobile, 60 FPS, fix your timestep"*) para casar com a intenção do usuário.

Se o agente esquecer de carregar uma skill quando deveria, basta lembrar com:

> "Carregue a skill `<id>` antes de prosseguir."

## Ordem natural de uso por fase do projeto

| Fase | Skills primárias |
|---|---|
| Conceito de feature | `game-designer-mechanics` → spec SDD |
| Arquitetura | `web-game-architect` → ADR se necessário |
| Implementação | `canvas2d-rendering-expert`, `web-game-input-ux`, `game-audio-designer` |
| Polimento | `pixel-art-sprite-director`, `game-designer-mechanics` (juice) |
| Otimização | `game-loop-performance-expert`, `canvas2d-rendering-expert` |
| Migração futura | `webgl-shader-artist` (com ADR aprovado) |

## Edição

- Edite os arquivos `SKILL.md` diretamente para tunar tom, defaults ou trechos específicos do projeto.
- Mantenha cada SKILL.md sob ~500 linhas (regra do `~/.cursor/skills-cursor/create-skill`).
- Novas skills devem seguir o template das existentes: frontmatter YAML + persona + stack + workflow + anti-patterns.

## Relação com skills globais

Estas skills convivem com as do `~/.cursor/skills/` e `~/.claude/skills/` (architecture, security, qa, etc.). Quando houver overlap, as do projeto têm prioridade contextual porque conhecem a stack e o SDD.
