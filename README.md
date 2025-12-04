# Snake Game 🐍

Um jogo Snake clássico desenvolvido com React, TypeScript e Vite. Interface moderna, responsiva e totalmente funcional.

## 🚀 Tecnologias

- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool rápido
- **Vitest** - Framework de testes
- **CSS Modules** - Estilização escopada

## 📦 Instalação

```bash
npm install
```

## 🎮 Como Jogar

1. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

2. Use as setas do teclado ou **WASD** para controlar a cobra
3. Pressione **SPACE** para iniciar/pausar o jogo
4. Evite colidir com seu próprio corpo!
5. Coma a comida vermelha para crescer e ganhar pontos

## 🎯 Funcionalidades

- ✅ Movimento suave da cobra
- ✅ Sistema de pontuação
- ✅ Recorde persiste no localStorage
- ✅ Detecção de colisão
- ✅ Interface moderna e responsiva
- ✅ Suporte a tema claro/escuro
- ✅ Wrap-around (a cobra atravessa as bordas)

## 🧪 Testes

Execute os testes unitários:

```bash
npm test
```

Execute os testes com cobertura:

```bash
npm run test:coverage
```

Interface visual dos testes:

```bash
npm run test:ui
```

## 🏗️ Build

Para criar uma build de produção:

```bash
npm run build
```

Para preview da build:

```bash
npm run preview
```

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── GameBoard.tsx
│   ├── SnakeSegment.tsx
│   ├── Food.tsx
│   ├── GameInfo.tsx
│   └── GameControls.tsx
├── hooks/              # Custom Hooks
│   ├── useGameLoop.ts
│   ├── useGameState.ts
│   └── useKeyboard.ts
├── types/              # Definições de tipos
│   └── game.ts
├── utils/              # Funções utilitárias
│   └── gameLogic.ts
├── constants/          # Constantes do jogo
│   └── game.ts
└── test/               # Setup de testes
    └── setup.ts
```

## 🎨 Customização

Você pode ajustar as configurações do jogo em `src/constants/game.ts`:

- `gridSize`: Tamanho do grid (padrão: 20x20)
- `cellSize`: Tamanho de cada célula em pixels
- `gameSpeed`: Velocidade do jogo em milissegundos
- `initialSnakeLength`: Comprimento inicial da cobra

## 📝 Licença

Este projeto foi criado para fins educacionais e de entretenimento.
