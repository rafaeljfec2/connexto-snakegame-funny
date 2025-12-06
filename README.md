# Snake Game 🐍

Um jogo Snake moderno e completo desenvolvido com React, TypeScript e Vite. Interface moderna, responsiva, totalmente internacionalizada e com sistema de progressão complexo incluindo fases, bosses, power-ups e muito mais.

## 🚀 Tecnologias

- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool rápido
- **Vitest** - Framework de testes
- **CSS Modules** - Estilização escopada
- **i18next & react-i18next** - Sistema de internacionalização
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

3. **Controles Mobile:**
   - Use os controles touch na parte inferior da tela
   - Botão verde no centro: Atirar veneno

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

### 🌍 Internacionalização (i18n)

- Suporte completo para **Português (Brasil)** e **English (US)**
- Detecção automática do idioma do navegador
- Seletor de idioma na interface
- Todas as strings do jogo traduzidas (fases, bosses, power-ups, etc.)

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

### 👾 Sistema de Bosses

Cada fase possui um boss único com habilidades especiais:

1. **O Clássico** (Fase 1) - Boss básico
2. **O Guardião** (Fase 2) - Defende um power-up de vida
3. **O Desafiador** (Fase 3) - Move obstáculos
4. **O Portal** (Fase 4) - Mestre dos portais
5. **O Veloz** (Fase 5) - Acelera o jogo
6. **O Caos** (Fase 6) - Altera power-ups
7. **O Arquiteto** (Fase 7) - Controla labirintos
8. **O Sobrevivente** (Fase 8) - Remove vidas
9. **O Vortex** (Fase 9) - Múltiplas habilidades
10. **O Supremo** (Fase 10) - Boss final com todas as habilidades

### 📊 Sistema de Estatísticas

- Pontuação final e recorde
- Tempo de jogo
- Nível alcançado
- Tamanho máximo da cobra
- Combo máximo
- Comida consumida (por tipo)
- Obstáculos encontrados
- Vidas perdidas

### 🎨 Interface

- **Design Moderno** - Interface dark mode com gradientes e efeitos visuais
- **Totalmente Responsiva** - Otimizado para desktop, tablet e mobile
- **Controles Touch** - Controles nativos para dispositivos móveis
- **Animações Suaves** - Transições e animações em todos os elementos
- **Tema Escuro** - Visual moderno e confortável

### 🔧 Funcionalidades Técnicas

- Sistema de salvamento automático (high score e conquistas)
- Sistema de logging para debugging
- Performance otimizada (limites de partículas, portais, etc.)
- Grid responsivo que se adapta ao tamanho da tela
- Sistema de detecção de mudanças de fase

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
│   ├── TouchControls.tsx       # Controles touch para mobile
│   ├── LanguageSelector.tsx    # Seletor de idioma
│   └── ...
├── hooks/              # Custom Hooks
│   ├── useGameLoop.ts          # Loop principal do jogo
│   ├── useGameState.ts         # Gerenciamento de estado
│   └── useKeyboard.ts          # Handlers de teclado
├── types/              # Definições de tipos
│   ├── game.ts                 # Tipos do jogo
│   └── phases.ts               # Tipos de fases e bosses
├── utils/              # Funções utilitárias
│   ├── gameLogic.ts            # Lógica do jogo
│   ├── phases.ts               # Utilitários de fases
│   ├── bosses.ts               # Utilitários de bosses
│   ├── phaseMechanics.ts       # Mecânicas por tipo de fase
│   ├── phaseStatistics.ts      # Estatísticas de fases
│   ├── phaseTranslations.ts    # Traduções de fases
│   └── logger.ts               # Sistema de logging
├── constants/          # Constantes do jogo
│   ├── game.ts                 # Configurações gerais
│   ├── phases.ts               # Configurações de fases e bosses
│   ├── powerUps.ts             # Configurações de power-ups
│   └── ...
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

- `gridSize`: Tamanho do grid (padrão: 40x40)
- `cellSize`: Tamanho de cada célula em pixels (padrão: 12px)
- `gameSpeed`: Velocidade do jogo em milissegundos
- `initialSnakeLength`: Comprimento inicial da cobra

### Configurações de Fases

Edite `src/constants/phases.ts` para modificar:
- Nomes e descrições das fases
- Configurações de cada fase (obstáculos, portais, power-ups)
- Bosses e suas habilidades

### Traduções

Adicione novos idiomas em `src/i18n/locales/` seguindo o padrão dos arquivos existentes (`pt-BR.json`, `en-US.json`).

## 🎯 Fases do Jogo

1. **Cobra Clássica** - O jogo básico sem obstáculos
2. **Percurso de Obstáculos** - Obstáculos estáticos aparecem
3. **Perigos em Movimento** - Obstáculos que se movem pelo grid
4. **Domínio de Portais** - Portais e teletransporte
5. **Desafio de Velocidade** - Alta velocidade e obstáculos complexos
6. **Caos de Power-Ups** - Muitos power-ups positivos e negativos
7. **Mestre do Labirinto** - Labirintos complexos
8. **Modo Sobrevivência** - Sobrevivência extrema
9. **Desafio Vortex** - Mecânicas complexas combinadas
10. **Desafio Supremo** - Todas as mecânicas em velocidade máxima

## 📱 Suporte Mobile

O jogo é totalmente responsivo e otimizado para dispositivos móveis:

- Grid adaptativo que se ajusta ao tamanho da tela
- Controles touch nativos
- Layout otimizado para telas pequenas
- Performance otimizada para dispositivos móveis

## 🐛 Debug Mode

Pressione **F1** ou **Ctrl+D** durante o jogo para abrir o painel de debug de bosses. Permite:
- Selecionar qualquer boss para testar
- Visualizar informações dos bosses
- Ativar/remover bosses durante o jogo

## 📝 Licença

Este projeto foi criado para fins educacionais e de entretenimento.

## 🙏 Agradecimentos

Desenvolvido com ❤️ usando as melhores práticas de desenvolvimento React e TypeScript.
