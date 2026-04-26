# 🎮 Ideias para Tornar o Jogo Único e Diferente

> **Status de Implementação:** ✅ = Já implementado | 🔄 = Em progresso | ⏳ = Planejado

---

## 📋 FASE 1: Fundamentos (Já Implementados) ✅

### ✅ 1. **Grid Escalável**

- Grid aumentado para 30x30
- Sistema preparado para mudanças de tamanho

### ✅ 2. **Sistema de Combos**

- Multiplicador de pontos ao comer várias comidas seguidas rapidamente
- Barra de combo que aumenta e pode ser perdida
- Efeitos visuais quando atinge combos altos
- Display visual no canto superior direito

### ✅ 3. **Power-ups Negativos (Debuffs)**

- Comida "venenosa" (POISON) que encolhe a cobra
- Comida que inverte os controles temporariamente (REVERSE_CONTROLS)
- Comida que torna a cobra mais lenta (SLOW_DOWN)
- Adiciona desafio estratégico

### ✅ 4. **Partículas e Efeitos Visuais**

- Efeitos de partículas ao comer comida
- Diferentes cores baseadas no tipo de comida
- Animações suaves

### ✅ 5. **Obstáculos e Barreiras**

- Obstáculos que aparecem em níveis específicos (a partir do nível 3)
- 3 padrões diferentes de obstáculos
- Sistema de colisão implementado

### ✅ 6. **Sistema de Conquistas (Achievements)**

- 9 conquistas desbloqueáveis
- Notificações visuais ao desbloquear
- Persistência no localStorage

---

## 📋 FASE 2: Melhorias Visuais e Feedback (Próximas)

### ⏳ 7. **Sons e Música**

**Complexidade:** Média | **Impacto:** Alto

- Efeitos sonoros para cada ação (comer comida, colisão, combo)
- Música de fundo que muda com o nível
- Feedback sonoro para power-ups
- Controle de volume no menu

### ⏳ 8. **Animações Mais Elaboradas**

**Complexidade:** Baixa | **Impacto:** Médio

- Animação de "engolir" quando come comida
- Transições suaves entre níveis
- Efeitos de tela ao game over melhorados
- Animação de morte da cobra

### ⏳ 9. **Rastro Visual na Cobra**

**Complexidade:** Baixa | **Impacto:** Médio

- Rastro visual que segue a cobra
- Efeito de "trail" com fade-out
- Opcional e configurável

### ✅ 10. **Background Dinâmico**

**Complexidade:** Média | **Impacto:** Médio | **STATUS: IMPLEMENTADO**

- Background que muda com o nível ✅
- Efeitos parallax sutis ✅
- Partículas no fundo ✅
- Gradientes dinâmicos ✅
- 10 climas únicos por fase ✅

### ⏳ 11. **Modo Dark/Light**

**Complexidade:** Baixa | **Impacto:** Médio

- Alternância de temas
- Sistema de cores adaptativo
- Preferências salvas no localStorage

---

## 📋 FASE 3: Funcionalidades de Jogabilidade Básicas

### ✅ 12. **Multiplicador de Pontos Baseado em Comprimento**

**Complexidade:** Baixa | **Impacto:** Médio

- Quanto maior a cobra, mais pontos você ganha
- Incentiva estratégia de crescimento
- Fórmula: pontos base × (1 + comprimento/10)

### ✅ 13. **Comida com Timer**

**Complexidade:** Média | **Impacto:** Alto

- Comidas que desaparecem se não forem comidas a tempo
- Comidas especiais que aparecem por pouco tempo
- Pressão adicional e estratégia
- Indicador visual do tempo restante

### ✅ 14. **Sistema de Vidas**

**Complexidade:** Média | **Impacto:** Alto

- Ter 3 vidas antes de game over
- Power-up de vida extra
- Continue após morte com penalidade
- Display visual de vidas restantes

### ✅ 15. **Estatísticas Detalhadas**

**Complexidade:** Média | **Impacto:** Médio | **STATUS: IMPLEMENTADO**

- Tela de estatísticas pós-jogo ✅
- Estatísticas por fase ✅
- Histórico de partidas ✅
- Tempo de jogo, comidas comidas, etc. ✅
- High score persistente ✅
- Sistema de conquistas ✅

---

## 📋 FASE 4: Funcionalidades Intermediárias

### ✅ 16. **Sistema de Skins/Temas** (REF-08)

**Complexidade:** Média | **Impacto:** Alto | **Status:** Shipped — ver [REF-08](./SDD/specs/REF-08-snake-skins.md) e [ADR-0006](./ADR/0006-orthogonal-identity-axes-and-boss-outline-soft-override.md)

- [x] Diferentes skins para a cobra (4 paletas: Neon Green, Retro Arcade, Frozen Ice, Magenta Blaze)
- [x] Seleção em `PowerUpsLegendDrawer` → Settings (`role="radiogroup"` acessível, teclado ArrowLeft/ArrowRight)
- [x] Persistência em `localStorage['snake-game-skin']`, independente do tema (REF-07)
- [x] Boss preserva cor narrativa, recebe outline de contraste derivado do skin do jogador (ADR-0006)
- [ ] Desbloqueáveis por conquistas — deliberadamente fora de escopo (todas as skins grátis desde o dia 1); pode virar extensão aditiva futura

### ⏳ 17. **Comida Especial: Multi-Food (Rastro de Comida)**

**Complexidade:** Alta | **Impacto:** Alto

- Ao comer certas comidas especiais, várias comidas aparecem em sequência
- O jogador precisa seguir o rastro antes que desapareçam
- Bônus maior se conseguir todas
- Power-up especial que ativa o modo

### ⏳ 18. **Sistema de Missões/Desafios Diários**

**Complexidade:** Alta | **Impacto:** Alto

- Desafios diários com recompensas
- "Coma 50 comidas em uma partida"
- "Alcance nível 10 sem morrer"
- "Use 5 power-ups em uma partida"
- Sistema de recompensas

### ✅ 19. **Teleport/Portal**

**Complexidade:** Alta | **Impacto:** Alto

- Portais que teletransportam a cobra
- Estratégia de usar portais para evitar colisões
- Power-up de portal temporário
- Dois portais conectados

### ⏳ 20. **Sistema de Tempo Slow-Motion**

**Complexidade:** Média | **Impacto:** Médio

- Power-up que desacelera o tempo
- Útil para situações difíceis
- Duração curta
- Efeito visual de distorção

---

## 📋 FASE 5: Modos de Jogo Alternativos

### ⏳ 21. **Modo Time Attack**

**Complexidade:** Média | **Impacto:** Alto

- Completar objetivos em tempo limitado
- Metas por nível
- Pontuação baseada em velocidade
- Timer visual

### ⏳ 22. **Modo Sobrevivência**

**Complexidade:** Baixa | **Impacto:** Médio

- Sobreviver o máximo de tempo possível
- Velocidade aumenta constantemente
- Foco em tempo ao invés de pontos
- Leaderboard de sobrevivência

### ⏳ 23. **Modo Labirinto**

**Complexidade:** Média | **Impacto:** Alto

- Grid com obstáculos fixos pré-definidos
- Mapas diferentes por nível
- Desafio de navegação

### ⏳ 24. **Modo Zen**

**Complexidade:** Baixa | **Impacto:** Baixo

- Velocidade constante, mais relaxante
- Sem game over (apenas quando sair)
- Foco em crescimento e exploração

---

## 📋 FASE 6: Funcionalidades Avançadas

### ⏳ 25. **Grid Dinâmico**

**Complexidade:** Alta | **Impacto:** Alto

- Grid que muda de tamanho em certos níveis
- Grid rotativo (gira durante o jogo)
- Grid que se expande/contrai
- Efeitos visuais de transição

### ✅ 26. **Obstáculos Móveis**

**Complexidade:** Alta | **Impacto:** Alto | **STATUS: IMPLEMENTADO**

- Obstáculos que se deslocam pelo grid ✅
- Padrões de movimento diferentes ✅
- Evitar colisões dinâmicas ✅
- Boss "O Desafiador" move obstáculos em direção à cobra ✅

### ⏳ 27. **Modo Multiplayer Local (2 Cobras)**

**Complexidade:** Muito Alta | **Impacto:** Muito Alto

- Duas cobras no mesmo grid
- Competição por comida
- Um pode comer o outro em certos modos
- Controles separados (WASD + Arrow Keys)

### ⏳ 28. **Cobras Rivais (IA)**

**Complexidade:** Muito Alta | **Impacto:** Alto

- Cobras controladas por IA que competem por comida
- Evitar ou enfrentar as rivais
- Diferentes níveis de dificuldade da IA
- AI pathfinding

---

## 📋 FASE 7: Funcionalidades Muito Avançadas

### ⏳ 29. **Sistema de Evolução**

**Complexidade:** Alta | **Impacto:** Alto

- Cobra evolui visualmente conforme cresce
- Diferentes formas em diferentes tamanhos
- Transformações épicas
- Mudanças de aparência por milestones

### ⏳ 30. **Modo Puzzle**

**Complexidade:** Alta | **Impacto:** Médio

- Níveis com objetivos específicos
- "Chegue até a comida sem tocar nas paredes"
- Lógica e estratégia combinadas
- Editor de níveis

### ✅ 31. **Sistema de Boss Fights**

**Complexidade:** Muito Alta | **Impacto:** Alto | **STATUS: IMPLEMENTADO**

- Encontros com "bosses" em níveis específicos ✅
- 10 bosses únicos com habilidades especiais ✅
- Chefes que precisam ser derrotados de forma especial ✅
- Recompensas especiais ✅
- Mecânicas únicas de boss ✅
- Sistema de combate com disparos de veneno ✅

### ⏳ 32. **Power-up de Clone/Tail Split**

**Complexidade:** Muito Alta | **Impacto:** Médio

- Dividir a cobra em duas cobras menores
- Controlar ambas simultaneamente
- Táticas avançadas
- Merge back em certas condições

### ⏳ 33. **Gravidade/Física**

**Complexidade:** Muito Alta | **Impacto:** Médio

- Cobra "cai" se não estiver apoiada
- Diferentes gravidades em níveis
- Power-up de voo temporário
- Física 2D completa

### ⏳ 34. **Cobra com Habilidades Especiais**

**Complexidade:** Muito Alta | **Impacto:** Alto

- Cada segmento pode ter uma habilidade
- Cabeça pode "atirar" para destruir obstáculos
- Cauda pode criar bloqueios temporários
- Sistema de skills

### ⏳ 35. **Sistema de Shop/Loja**

**Complexidade:** Alta | **Impacto:** Alto

- Usar pontos para comprar upgrades
- Power-ups permanentes
- Skins e customizações
- Moeda do jogo

### ⏳ 36. **Modo Construção**

**Complexidade:** Muito Alta | **Impacto:** Médio

- Editar o grid antes de jogar
- Criar seus próprios desafios
- Compartilhar níveis (export/import)
- Editor visual completo

---

## 🎯 Resumo por Prioridade de Implementação

### 🔥 Alta Prioridade (Próximas 5)

1. **Sons e Música** - Melhora imediata da experiência
2. **Animações Mais Elaboradas** - Polimento visual
3. **Comida com Timer** - Adiciona pressão e estratégia
4. **Sistema de Vidas** - Aumenta replayability
5. **Sistema de Skins/Temas** - Personalização e engajamento

### 📊 Média Prioridade

6. Estatísticas Detalhadas
7. Multiplicador de Pontos Baseado em Comprimento
8. Rastro Visual na Cobra
9. Background Dinâmico
10. Modo Dark/Light

### 🎮 Baixa Prioridade (Quando houver tempo)

11. Modos de Jogo Alternativos
12. Funcionalidades Avançadas
13. Multiplayer e IA

---

## 📝 Notas de Implementação

- **Fase 1** está **100% completa** ✅
- **Fase 2** pode ser implementada em paralelo (melhorias visuais)
- **Fases 3-4** adicionam profundidade ao jogo
- **Fases 5-7** são expansões maiores que podem vir em versões futuras

### Recomendação Atual:

Começar pela **Fase 2** (Sons e Música, Animações) para polir o jogo atual antes de adicionar novas mecânicas complexas.

---

## ✅ Checklist de Implementação

### Fase 1 - Fundamentos ✅
- [x] Grid Escalável
- [x] Sistema de Combos
- [x] Power-ups Negativos
- [x] Partículas e Efeitos Visuais
- [x] Obstáculos e Barreiras
- [x] Sistema de Conquistas

### Fase 2 - Melhorias Visuais
- [ ] Sons e Música
- [x] Animações Mais Elaboradas (transições de fase/boss)
- [ ] Rastro Visual na Cobra
- [x] Background Dinâmico (10 climas por fase)
- [ ] Modo Dark/Light

### Fase 3 - Jogabilidade
- [x] Comida com Timer
- [x] Sistema de Vidas
- [x] Estatísticas Detalhadas
- [x] Sistema de Skins/Temas (REF-08)

### Fase 4 - Avançado
- [x] Teleport/Portal
- [x] Sistema de Boss Fights (10 bosses únicos)
- [x] Obstáculos Móveis

### Fase 5 - Mobile
- [x] Layout Mobile-First
- [x] Safe Areas (iOS/Android)
- [x] D-pad Direcional
- [x] Botão START Contextual
- [x] StatusBar Reposicionado
