# Snake Game 🐍

Um jogo Snake moderno e completo desenvolvido com React, TypeScript e Vite. Interface moderna, responsiva, totalmente internacionalizada e com sistema de progressão complexo incluindo fases, bosses, power-ups, efeitos climáticos visuais e muito mais.

## 🚀 Tecnologias

- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool rápido
- **Vitest** - Framework de testes
- **CSS Modules** - Estilização escopada
- **i18next & react-i18next** - Sistema de internacionalização
- **Pino** - Sistema de logging estruturado
- **pnpm** - Gerenciador de pacotes

## 📦 Instalação

```bash
# Instalar dependências
pnpm install

# Ou usando npm
npm install
```

## 🎮 Como Jogar

1. Inicie o servidor de desenvolvimento:

   ```bash
   pnpm dev
   # ou
   npm run dev
   ```

2. **Controles Desktop:**
   - Use as **setas do teclado** ou **WASD** para mover a cobra
   - Pressione **ESPAÇO** para iniciar/pausar o jogo
   - **F1** ou **Ctrl+D**: Abrir painel de debug de bosses
   - **F3** ou **Ctrl+F**: Abrir painel de debug de fases

3. **Controles Mobile:**
   - **Joystick Analógico** (esquerda): Controle a direção da cobra
   - **Botão FIRE** (direita): Dispara veneno para destruir obstáculos e bosses
   - Controles sempre visíveis e otimizados para touch

4. **Objetivo:**
   - Coma a comida para crescer e ganhar pontos
   - Complete 5 níveis em cada fase para enfrentar o boss
   - Derrote os 10 bosses para completar o jogo!

## 🎯 Funcionalidades Principais

### 🎲 Sistema de Progressão

- **10 Fases** únicas com 5 níveis cada (50 níveis totais)
- **10 Bosses Únicos** - Um chefe especial no final de cada fase
- Sistema de dificuldade progressiva
- Níveis dinâmicos com mecânicas diferentes por fase
- Sistema de debug para testar fases e bosses específicos

### 🌍 Internacionalização (i18n)

- Suporte completo para **Português (Brasil)** e **English (US)**
- Detecção automática do idioma do navegador
- Persistência da preferência de idioma no localStorage
- Seletor de idioma na interface (oculto no mobile)
- Todas as strings do jogo traduzidas:
  - Nomes e descrições de fases
  - Nomes e descrições de bosses
  - Power-ups e suas descrições
  - Mensagens de UI e transições
  - Estatísticas e conquistas

### 🌦️ Sistema de Efeitos Climáticos

Cada fase possui seu próprio clima visual único que reflete o tema do boss:

1. **Fase 1 - Clima Limpo/Estrelado** - Céu estrelado brilhante
2. **Fase 2 - Névoa Azul Mística** - Névoa flutuante e luzes protetoras
3. **Fase 3 - Deserto com Areia** - Partículas de areia e ondas de calor
4. **Fase 4 - Clima Cósmico/Espacial** - Partículas cósmicas e nebulosa roxa
5. **Fase 5 - Fogo e Velocidade** - Chamas e rastros de velocidade
6. **Fase 6 - Psicodélico/Caótico** - Partículas multicoloridas e ondas caóticas
7. **Fase 7 - Neblina e Geometria** - Névoa índigo e formas geométricas flutuantes
8. **Fase 8 - Apocalíptico/Lava** - Cinzas caindo e pontos de lava pulsantes
9. **Fase 9 - Tempestade** - Relâmpagos, chuva, nuvens escuras e vento
10. **Fase 10 - Celestial/Divino** - Partículas douradas, aurora e luz divina

### ⚡ Power-Ups

- **⚡ Velocidade** - Move mais rápido por 5s
- **💰 Pontos Bônus** - Ganhe +30 pontos
- **📈 Crescimento Extra** - Cresça 2 segmentos
- **👻 Fantasma** - Passe por obstáculos por 6s
- **🎴 Coringa** - Efeito positivo aleatório
- **❤️ Vida Extra** - Adiciona uma vida
- **🌀 Portal** - Ativa um par de portais
- **☠️ Veneno** - Perde 2 segmentos, -5 pts
- **🔄 Controles Revertidos** - Controles invertidos por 4s
- **🐌 Desaceleração** - Movimento mais lento por 3s

### 🏗️ Mecânicas de Jogo

- **Obstáculos** - Estáticos e móveis que aparecem nas fases
- **Portais** - Teletransporte entre dois pontos do grid
- **Sistema de Combos** - Ganhe multiplicadores ao comer comida rapidamente
- **Sistema de Vidas** - Continue após morrer (até 3 vidas)
- **Tiro de Veneno** - Destrua obstáculos e derrote bosses
- **Partículas Visuais** - Efeitos visuais para ações do jogo
- **Animações de Transição** - Transições suaves entre fases e bosses
- **Comida Temporizada** - Alguns alimentos desaparecem se não forem coletados a tempo

### 👾 Sistema de Bosses

Cada fase possui um boss único com habilidades especiais:

1. **O Clássico** (Fase 1) - Boss básico, padrão tradicional
2. **O Guardião** (Fase 2) - Defende um power-up de vida (flag verde)
3. **O Desafiador** (Fase 3) - Move obstáculos em direção à cobra
4. **O Portal** (Fase 4) - Mestre dos portais, cria portais dinâmicos
5. **O Veloz** (Fase 5) - Acelera drasticamente o jogo
6. **O Caos** (Fase 6) - Altera tipos de power-ups aleatoriamente
7. **O Arquiteto** (Fase 7) - Controla labirintos e cria/remove paredes
8. **O Sobrevivente** (Fase 8) - Remove vidas periodicamente
9. **O Vortex** (Fase 9) - Combina múltiplas habilidades com clima tempestuoso
10. **O Supremo** (Fase 10) - Boss final com todas as habilidades em máxima intensidade

### 📊 Sistema de Estatísticas

- Pontuação final e recorde
- Tempo de jogo
- Nível alcançado
- Fase alcançada
- Tamanho máximo da cobra
- Combo máximo
- Comida consumida (por tipo)
- Obstáculos encontrados
- Vidas perdidas
- Estatísticas por fase

### 🎨 Interface

- **Design Moderno** - Interface dark mode com gradientes e efeitos visuais
- **Totalmente Responsiva** - Otimizado para desktop, tablet e mobile
- **Controles Touch Avançados** - Joystick analógico e botão de fogo para mobile
- **Animações Suaves** - Transições e animações em todos os elementos
- **Tema Escuro** - Visual moderno e confortável
- **Layout Game-Like** - Interface estilo jogo com HUD integrado
- **Efeitos Visuais Dinâmicos** - Backgrounds e efeitos que mudam por fase

### 🔧 Funcionalidades Técnicas

- Sistema de salvamento automático (high score e conquistas)
- Sistema de logging estruturado com Pino para debugging
- Performance otimizada com:
  - Frame buffering (separação de lógica e renderização)
  - Limites de partículas, portais e disparos simultâneos
  - Memoização de componentes e cálculos
  - Batching de atualizações de estado
- Grid responsivo que se adapta ao tamanho da tela
- Sistema de detecção de mudanças de fase
- Validação de progressão de jogo
- Proteção contra manipulação de estado

### 📝 Sistema de Logging

O jogo possui um sistema completo de logging para debugging e observabilidade:

- **Contextos de Log**: Categorização por área do jogo (GAME_LOOP, BOSS, PHASE, COLLISION, etc.)
- **Níveis de Log**: TRACE, DEBUG, INFO, WARN, ERROR, FATAL
- **Logs de Eventos**: Todos os eventos importantes são registrados
- **Logs Estruturados**: Dados estruturados para facilitar análise
- **Não Intrusivo**: Logs não interferem na lógica do jogo

## 🧪 Testes

Execute os testes unitários:

```bash
pnpm test
# ou
npm test
```

Execute os testes com cobertura:

```bash
pnpm test:coverage
# ou
npm run test:coverage
```

Interface visual dos testes:

```bash
pnpm test:ui
# ou
npm run test:ui
```

## 🏗️ Build

Para criar uma build de produção:

```bash
pnpm build
# ou
npm run build
```

Para preview da build:

```bash
pnpm preview
# ou
npm run preview
```

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── GameBoard.tsx           # Tabuleiro principal do jogo
│   ├── SnakeSegment.tsx        # Segmento da cobra
│   ├── Food.tsx                # Comida e power-ups
│   ├── Obstacle.tsx            # Obstáculos
│   ├── Portal.tsx              # Portais de teletransporte
│   ├── Boss.tsx                # Componente de boss
│   ├── BossSnake.tsx           # Cobra do boss
│   ├── GameInfo.tsx            # Informações do jogo
│   ├── StatusBar.tsx           # Barra de status
│   ├── GameControls.tsx        # Controles do jogo
│   ├── PhaseIntroScreen.tsx    # Tela de introdução da fase
│   ├── PhaseCompleteScreen.tsx # Tela de conclusão da fase
│   ├── BossDefeatTransition.tsx # Animação de derrota do boss
│   ├── DeathTransition.tsx     # Animação de morte
│   ├── MobileGamepad.tsx       # Controles com joystick analógico
│   ├── LanguageSelector.tsx    # Seletor de idioma
│   ├── WeatherEffect.tsx       # Efeitos climáticos por fase
│   ├── StormEffect.tsx         # Efeito de tempestade (Fase 9)
│   └── ...
├── hooks/              # Custom Hooks
│   ├── useGameLoop.ts          # Loop principal do jogo
│   ├── useGameState.ts         # Gerenciamento de estado
│   └── useKeyboard.ts          # Handlers de teclado
├── types/              # Definições de tipos
│   ├── game.ts                 # Tipos do jogo
│   ├── phases.ts               # Tipos de fases e bosses
│   └── statistics.ts           # Tipos de estatísticas
├── utils/              # Funções utilitárias
│   ├── gameLogic.ts            # Lógica do jogo
│   ├── phases.ts               # Utilitários de fases
│   ├── bosses.ts               # Utilitários de bosses
│   ├── phaseMechanics.ts       # Mecânicas por tipo de fase
│   ├── phaseStatistics.ts      # Estatísticas de fases
│   ├── phaseTranslations.ts    # Traduções de fases
│   ├── logger.ts               # Sistema de logging (Pino)
│   └── poison.ts               # Sistema de disparos de veneno
├── constants/          # Constantes do jogo
│   ├── game.ts                 # Configurações gerais
│   ├── phases.ts               # Configurações de fases e bosses
│   ├── powerUps.ts             # Configurações de power-ups
│   └── obstacles.ts            # Configurações de obstáculos
├── i18n/               # Internacionalização
│   ├── config.ts               # Configuração do i18next
│   └── locales/                # Arquivos de tradução
│       ├── pt-BR.json          # Português (Brasil)
│       └── en-US.json          # Inglês (US)
└── test/               # Setup de testes
    └── setup.ts
```

## 🎨 Customização

### Configurações do Jogo

Ajuste as configurações em `src/constants/game.ts`:

- `gridSize`: Número de células no grid (padrão: 40x40, total de 1600 células)
- `cellSize`: Tamanho de cada célula em pixels (padrão: 12px)
  - **Nota Importante**: No desktop, `cellSize` controla tanto o tamanho de cada célula quanto o tamanho total do grid. O tamanho do grid será `gridSize × cellSize` (por padrão: 40 × 12 = 480px). Alterar `cellSize` alterará o tamanho total do grid proporcionalmente.
  - No mobile, o `cellSize` é calculado automaticamente para se adaptar ao tamanho da tela, respeitando o tamanho disponível e ignorando o valor configurado.
- `gameSpeed`: Velocidade base do jogo em milissegundos
- `initialSnakeLength`: Comprimento inicial da cobra
- `POISON_CONFIG`: Configurações dos disparos de veneno

### Configurações de Fases

Edite `src/constants/phases.ts` para modificar:

- Nomes e descrições das fases
- Configurações de cada fase (obstáculos, portais, power-ups)
- Bosses e suas habilidades
- Efeitos climáticos visuais

### Traduções

Adicione novos idiomas em `src/i18n/locales/` seguindo o padrão dos arquivos existentes (`pt-BR.json`, `en-US.json`).

## 🎯 Fases do Jogo

1. **Cobra Clássica** - O jogo básico sem obstáculos (Clima: Estrelado)
2. **Percurso de Obstáculos** - Obstáculos estáticos aparecem (Clima: Névoa Azul)
3. **Perigos em Movimento** - Obstáculos que se movem pelo grid (Clima: Deserto)
4. **Domínio de Portais** - Portais e teletransporte (Clima: Cósmico)
5. **Desafio de Velocidade** - Alta velocidade e obstáculos complexos (Clima: Fogo)
6. **Caos de Power-Ups** - Muitos power-ups positivos e negativos (Clima: Psicodélico)
7. **Mestre do Labirinto** - Labirintos complexos (Clima: Névoa e Geometria)
8. **Modo Sobrevivência** - Sobrevivência extrema (Clima: Apocalíptico)
9. **Desafio Vortex** - Mecânicas complexas combinadas (Clima: Tempestade)
10. **Desafio Supremo** - Todas as mecânicas em velocidade máxima (Clima: Celestial)

## 📱 Suporte Mobile

O jogo é totalmente responsivo e otimizado para dispositivos móveis:

- **Grid Adaptativo**: Grid que se ajusta ao tamanho da tela mantendo proporções
- **Controles Touch Nativos**:
  - Joystick analógico para movimento preciso
  - Botão de fogo para disparos
  - Controles sempre visíveis (não sobrepõem modais)
- **Layout Otimizado**:
  - Status bar no rodapé da área de combate
  - HUD compacto e informativo
  - Toasts posicionados abaixo do header
- **Performance Otimizada**:
  - Frame buffering para separar lógica e renderização
  - Limites de entidades ativas
  - Animações otimizadas com GPU
- **Experiência Touch Melhorada**:
  - Prevenção de pull-to-refresh
  - Touch action otimizado
  - Sem seleção de texto acidental

## 🐛 Debug Mode

### Painel de Debug de Bosses

Pressione **F1** ou **Ctrl+D** durante o jogo para abrir o painel de debug de bosses. Permite:

- Selecionar qualquer boss para testar
- Visualizar informações dos bosses (nome, descrição, comportamento)
- Ativar/remover bosses durante o jogo
- Testar habilidades especiais de cada boss

### Painel de Debug de Fases

Pressione **F3** ou **Ctrl+F** durante o jogo para abrir o painel de debug de fases. Permite:

- Selecionar qualquer fase para testar
- Visualizar informações das fases
- Resetar o jogo para iniciar em uma fase específica
- Testar mecânicas específicas de cada fase

## 📝 Logging e Observabilidade

O jogo possui um sistema completo de logging usando Pino:

### Contextos de Log Disponíveis

- `GAME_STATE`: Mudanças de estado do jogo
- `GAME_LOOP`: Loop principal do jogo
- `BOSS`: Eventos relacionados a bosses
- `PHASE`: Eventos relacionados a fases
- `COLLISION`: Detecção de colisões
- `TRANSITION`: Transições de tela
- `POWER_UP`: Ativação de power-ups
- `COMBAT`: Sistema de combate com bosses

### Exemplo de Uso

Os logs são automaticamente gerados durante o jogo. Em desenvolvimento, você pode visualizá-los no console do navegador.

## 🔒 Segurança

O jogo implementa várias práticas de segurança:

- **Headers de Segurança**: CSP, X-Frame-Options, X-XSS-Protection
- **Validação de Entrada**: Sanitização de inputs
- **Proteção de Estado**: Validação de mudanças de estado do jogo
- **Rate Limiting**: Limites de ações por segundo
- **Detecção de Manipulação**: Verificação de valores suspeitos

## 📊 Performance

O jogo foi otimizado para performance:

- **Frame Buffering**: Separação de lógica (60fps) e renderização React
- **Memoização**: Componentes e cálculos memoizados
- **Limites de Entidades**: Máximo de partículas, portais e disparos simultâneos
- **Batching**: Agrupamento de atualizações de estado
- **CSS Otimizado**: Uso de `transform` e `will-change` para animações GPU

## 📚 Documentação Adicional

Consulte os documentos em `docs/` para mais detalhes:

- `I18N_SYSTEM.md` - Documentação do sistema de internacionalização
- `LOGGING_SYSTEM.md` - Documentação do sistema de logging
- `PERFORMANCE_OPTIMIZATION_PLAN.md` - Plano de otimização de performance
- `SISTEMA_COMBATE_BOSS.md` - Sistema de combate com bosses
- `SISTEMA_TRANSICOES_FASE.md` - Sistema de transições de fase

## 📝 Licença

Este projeto foi criado para fins educacionais e de entretenimento.

## 🙏 Agradecimentos

Desenvolvido com ❤️ usando as melhores práticas de desenvolvimento React e TypeScript.
