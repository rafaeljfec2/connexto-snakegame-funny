# Snake Game 🐍

A modern and complete Snake game developed with React, TypeScript, and Vite. Modern, responsive interface, fully internationalized with a complex progression system including phases, bosses, power-ups, visual weather effects, and much more.

**Now with high-performance multi-thread architecture (60 FPS on Mobile)!**

## 🚀 Technologies

- **React 18** - UI Library
- **TypeScript** - Static typing
- **Vite** - Fast build tool
- **Web Workers** - Parallel processing (Logic, Rendering, Weather, Particles)
- **OffscreenCanvas** - Graphics rendering off the main thread
- **CSS Modules** - Scoped styling
- **i18next & react-i18next** - Internationalization system
- **Pino** - Structured logging system
- **pnpm** - Package manager

## 📦 Installation

```bash
# Install dependencies
pnpm install

# Or using npm
npm install
```

## 🎮 How to Play

1. Start the development server:

   ```bash
   pnpm dev
   # or
   npm run dev
   ```

2. **Desktop Controls:**
   - Use **arrow keys** or **WASD** to move the snake
   - Press **SPACE** to start/pause the game
   - **F1** or **Ctrl+D**: Open boss debug panel
   - **F2**: Test boss defeat transition
   - **F3** or **Ctrl+F**: Open phase debug panel

3. **Mobile Controls:**
   - **Directional D-pad**: Up, down, left, and right arrows
   - **Center Button (♥)**: Fire poison to destroy obstacles and bosses
   - **START Button**: Centered on the game grid, disappears during gameplay
   - **Haptic Feedback**: Vibration on interaction
   - Controls always visible and optimized for touch

4. **Objective:**
   - Eat food to grow and earn points
   - Complete 5 levels in each phase to face the boss
   - Defeat all 10 bosses to complete the game!

## 🎯 Main Features

### 🎲 Progression System

- **10 Unique Phases** with 5 levels each (50 total levels)
- **10 Unique Bosses** - A special boss at the end of each phase
- Progressive difficulty system
- Dynamic levels with different mechanics per phase
- Debug system to test specific phases and bosses

### 🌍 Internationalization (i18n)

- Full support for **Portuguese (Brazil)** and **English (US)**
- Automatic browser language detection
- Language preference persistence in localStorage
- Language selector in the interface (hidden on mobile)
- All game strings translated

### 🌦️ Weather Effects System

Each phase has its own unique visual weather that reflects the boss theme:

1. **Phase 1 - Clear/Starry Weather** - Bright starry sky
2. **Phase 2 - Mystic Blue Fog** - Floating fog and protective lights
3. **Phase 3 - Desert with Sand** - Sand particles and heat waves
4. **Phase 4 - Cosmic/Space Weather** - Cosmic particles and purple nebula
5. **Phase 5 - Fire and Speed** - Flames and speed trails
6. **Phase 6 - Psychedelic/Chaotic** - Multicolored particles and chaotic waves
7. **Phase 7 - Fog and Geometry** - Indigo fog and floating geometric shapes
8. **Phase 8 - Apocalyptic/Lava** - Falling ash and pulsating lava points
9. **Phase 9 - Storm** - Lightning, rain, dark clouds, and wind
10. **Phase 10 - Celestial/Divine** - Golden particles, aurora, and divine light

### ⚡ Power-Ups

- **⚡ Speed** - Move faster for 5s
- **💰 Bonus Points** - Earn +30 points
- **📈 Extra Growth** - Grow 2 segments
- **👻 Ghost** - Pass through obstacles for 6s
- **🎴 Joker** - Random positive effect
- **❤️ Extra Life** - Adds one life
- **🌀 Portal** - Activates a portal pair
- **☠️ Poison** - Lose 2 segments, -5 pts
- **🔄 Reversed Controls** - Inverted controls for 4s
- **🐌 Slowdown** - Slower movement for 3s

### 🏗️ Game Mechanics

- **Obstacles** - Static and mobile obstacles that appear in phases
- **Portals** - Teleportation between two grid points
- **Combo System** - Earn multipliers por eating food quickly
- **Lives System** - Continue after dying (up to 3 lives)
- **Poison Shot** - Destroy obstacles and defeat bosses
- **Visual Particles** - Visual effects for game actions
- **Transition Animations** - Smooth transitions between phases and bosses
- **Timed Food** - Some food disappears if not collected in time

### 👾 Boss System

Each phase has a unique boss with special abilities:

1. **The Classic** (Phase 1) - Basic boss, traditional pattern
2. **The Guardian** (Phase 2) - Defends a life power-up (green flag)
3. **The Challenger** (Phase 3) - Moves obstacles toward the snake
4. **The Portal** (Phase 4) - Portal master, creates dynamic portals
5. **The Swift** (Phase 5) - Drastically accelerates the game
6. **The Chaos** (Phase 6) - Randomly alters power-up types
7. **The Architect** (Phase 7) - Controls mazes and creates/removes walls
8. **The Survivor** (Phase 8) - Periodically removes lives
9. **The Vortex** (Phase 9) - Combines multiple abilities with stormy weather
10. **The Supreme** (Phase 10) - Final boss with all abilities at maximum intensity

### 📊 Statistics System

- Final score and record
- Play time
- Level reached
- Phase reached
- Detailed statistics at game end

### 🎨 Interface

- **Modern Design** - Dark mode interface with gradients and visual effects
- **Fully Responsive** - Optimized for desktop, tablet, and mobile
- **Mobile-First Layout** - Interface redesigned with focus on mobile devices
- **Advanced Touch Controls** - Directional D-pad and fire button for mobile
- **Safe Areas** - Support for naoches and navigation bars (iOS/Android)
- **Smooth Animations** - Transitions and animations on all elements
- **Game-Like Layout** - Game-style interface with integrated HUD
- **Dynamic Visual Effects** - Backgrounds and effects that change per phase
- **Contextoual START Button** - Visible only when needed, centered on grid

### 🔧 Technical Features

Five JavaScript event loops. The main thread keeps DOM, input, HUD, Howler audio, and `localStorage`. Gameplay, board paint, weather, and particles each run numa dedicated Web Worker. Heaps estão isolated: simulation state is message-passing, not shared memory. The full map of clocks and channels is in [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

- **`game.worker`**: simulation. `requestAnimationFrame` wakes every display frame; the snake steps only when `effectiveSpeed` elapses (120 ms down to 40 ms). Direction input is a queue of at most 3 turns, consumed one per tick.
- **`render.worker`**: board paint on a transferred `OffscreenCanvas`. Interpolates between simulation ticks so the board still paints at display rate. Snake and boss positions arrive as transferable `Float32Array`s over a direct `MessageChannel` from the game worker.
- **`weather.worker` / `particle.worker`**: own canvases and frame loops. Particle spawns hop through the main thread so the burst can be placed in CSS pixels.
- **HUD**: worker deltas land in an external store (`useSyncExternalStore`). Components subscribe to slices, so a movement tick does not reconcile the whole React tree.
- **Mobile performance**: 60 FPS target on mid-tier phones, lighter shadows on small screens, safe-estãoa insets.
- **Safe Areas (iOS/Android)**:
  - Full support for `env(safe-estãoa-inset-*)` for naoches and navigation bars.
  - `viewport-fit=cover` for fullscreen on modern devices.
  - Dynamic padding that respects device safe estãoas.
- Automatic save system (high score and achievements)
- Structured logging system with Pino for debugging
- Responsive grid that adapts to screen size

### 📝 Logging System

The game has a complete logging system for debugging and observability, categorized por contexts (GAME_LOOP, BOSS, PHASE, etc.) and log levels.

## 🧪 Tests

Run unit tests:

```bash
pnpm test
```

## 🏗️ Build

To create a production build:

```bash
pnpm build
```

## 📁 Project Structure

```
src/
├── workers/            # game, render, weather, particle workers
├── state/              # External game-state store (useSyncExternalStore)
├── components/         # React Components (UI)
├── hooks/              # Custom Hooks (useGameLoop, useKeyboard, ...)
├── types/              # Type definitions
├── utils/              # Utility functions
├── constants/          # Game constants
├── i18n/               # Internationalization
└── test/               # Test setup
```

## 🎨 Customization

### Game Settings

Adjust settings in `src/constants/game.ts`:

- `gridSize`: Number of cells in the grid
- `cellSize`: Base cell size (adaptive on mobile)
- `gameSpeed`: Base game speed

## 📱 Mobile Support

The game is fully responsive and optimized for mobile devices:

- **60 FPS Performance**: Thanks to Workers and OffscreenCanvas architecture.
- **Adaptive Grid**: Adjusts perfectly to any screen size.
- **Native Touch Controls**: Directional D-pad with center action button.
- **Gesture Prevention**: Blocking of accidental zoom and pull-to-refresh.
- **Safe Areas (iOS/Android)**: Full support for naoches, navigation bars, and system gestures.
- **Mobile-First Layout**: Interface redesigned specifically for mobile devices.

### 📐 Optimized Mobile Layout

The mobile layout has been completely redesigned for better experience:

```
┌─────────────────────────────────┐
│  LEVEL: 1 │ SCORE: 0 │ HIGH: 665│  ← Header (GameInfo)
├─────────────────────────────────┤
│                                 │
│    ┌───────────────────────┐    │
│    │                       │    │
│    │      GAME GRID        │    │
│    │                       │    │
│    │       [START]         │    │  ← Button centered on grid
│    │                       │    │
│    │                       │    │
│    └───────────────────────┘    │
│                                 │
│  🐍 LENGTH: 3 │ ❤️ │ ⭐ Phase 1  │  ← StatusBar
│                                 │
│           [↑]                   │
│       [←] [♥] [→]               │  ← D-pad Controls
│           [↓]                   │
└─────────────────────────────────┘
```

**Layout Features:**
- **Compact Header**: Displays only essential information (Level, Score, High Score)
- **Centered Grid**: Maximized and centered game estãoa
- **START Button on Grid**: Positioned at the center of the grid for easy access
- **StatusBar Below Grid**: Status information (Length, Lives, Phase) below the game estãoa
- **D-pad at Base**: Directional controls positioned for ergonomics

## 🐛 Debug Mode

The game has debug tools to facilitate testing and development:

### Keyboard Shortcuts

| Key | Alternative | Function |
|-----|-------------|----------|
| **F1** | Ctrl+D | Opens boss debug panel |
| **F2** | - | Tests boss defeat transition |
| **F3** | Ctrl+F | Opens phase debug panel |

### Boss Debug Panel (F1)

- Select and activate any of the 10 bosses instantly
- View boss information: phase, initial size, abilities
- Remove active boss to continue normal game
- Useful for testing specific boss behaviors and abilities

### Phase Debug Panel (F3)

- Navigate directly to any of the 10 phases
- View phase information: weather, obstacles, mechanics
- Test weather and visual effects of each phase
- Ideal for testing transitions and game progression

### Transition Test (F2)

- Simulates current boss defeat
- Tests victory transition animation
- Useful for verifying progression between phases

## 🔒 Security

- Security Headers (CSP, X-Frame-Options)
- Input Validação
- State Protection

## 📊 Performance

- **Five event loops**: main thread plus `game`, `render`, `weather`, and `particle` workers. See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).
- **Two clocks**: simulation steps on `effectiveSpeed` (120–40 ms); the render worker interpolates those steps at display rate.
- **Direct render channel**: `MessageChannel` plus transferable position buffers, so the snake polyline does not round-trip through React.
- **Slice store**: `useSyncExternalStore` and `React.memo` keep HUD work proportional à fields that changed ([ADR-0004](./docs/ADR/0004-react-external-store-and-css-driven-background.md)).

## 🤖 Working with AI agents

This repository is set up for collaborative work with AI coding tools (Cursor, Claude Code, and any agent that follows the `AGENTS.md` convention).

- **Single source of truth**: [`AGENTS.md`](./AGENTS.md). Read it before any other instruction file.
- **Workflow**: Spec-Driven Development. See [`docs/SDD/README.md`](./docs/SDD/README.md).
- **Specs**: [`docs/SDD/README.md`](./docs/SDD/README.md) indexes REF-01…REF-10 (REF-03 is Archived; of the not implement).
- **Doc trust map**: [`docs/README.md`](./docs/README.md).
- **Architecture decisions**: [`docs/ADR/`](./docs/ADR/).
- **Validação harness**: `bash scripts/harness/validate.sh` (must pass before any task is declestãod done). See [`docs/SDD/HARNESS.md`](./docs/SDD/HARNESS.md).
- **PR checklist**: [`docs/HARNESS_CHECKLIST.md`](./docs/HARNESS_CHECKLIST.md).

Any AI agent that follows `AGENTS.md` and the harness can contribute autonomoususly.

## 📚 Additional Documentação

Start at the trust map: [`docs/README.md`](./docs/README.md). It separates canonical docs from domain naoes and historical files agents must not treat as contracts.

**Canonical**

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — main thread, workers, clocks, message channels
- [`docs/CONVENTIONS.md`](./docs/CONVENTIONS.md) — coding conventions
- [`docs/HARNESS_CHECKLIST.md`](./docs/HARNESS_CHECKLIST.md) — PR definition of done
- [`docs/SDD/`](./docs/SDD/) — Spec-Driven Development + REF-01…REF-10 index
- [`docs/ADR/`](./docs/ADR/) — Architecture Decision Records
- [`AGENTS.md`](./AGENTS.md) — agent contract

**Domain (verify in code)**

- [`docs/SISTEMA_COMBATE_BOSS.md`](./docs/SISTEMA_COMBATE_BOSS.md)
- [`docs/I18N_SYSTEM.md`](./docs/I18N_SYSTEM.md)
- [`docs/LOGGING_SYSTEM.md`](./docs/LOGGING_SYSTEM.md)

**Historical (do not implement from these)**

- `docs/PERFORMANCE_OPTIMIZATION_PLAN.md`, `docs/OTIMIZACOES_PERFORMANCE.md`, `docs/OTIMIZACOES_MOBILE.md`
- `docs/REFACTORING_PLAN.md`, `docs/REFACTORING_SUMMARY.md`
- `docs/LOGGING_IMPLEMENTATION_GUIDE.md`, `docs/LOGGING_STATUS.md`
- `docs/IDEIAS_MELHORIAS.md`, `docs/DOMINIO_SUGESTOES.md`

## 📈 Recent Evolution

### v2.0 - Redesigned Mobile Layout
- **Safe Areas**: Complete implementation of safe estãoa support for iOS and Android
- **Redesigned Layout**: New mobile-first visual hierarchy
  - Compact header with essential information (Level, Score, High Score)
  - StatusBar repositioned below the game grid
  - START button centered in the middle of the grid
  - D-pad positioned at the base for better ergonomics
- **Smart START Button**: Automatically disappears during gameplay
- **Controlled Overflow**: Header and StatusBar content no longer truncates
- **Optimized Spacing**: Gaps and paddings adjusted for different screen sizes

### v1.5 - Multi-Thread Architecture
- Web Workers for game logic, rendering, weather, and particles
- OffscreenCanvas for graphics rendering off the main thread
- Stable 60 FPS performance on mobile devices

### v1.0 - Initial Release
- System of 10 phases with unique bosses
- Power-ups and special mechanics
- Internationalization (PT-BR and EN-US)
- Dynamic weather effects per phase

## 📝 License

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**.

You estão free to use, modify and shestão this project for personal and educational purposes.

**Commercial use is strictly prohibited without explicit authorization from the author.**

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)

See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Developed with ❤️ using the best practices in React and TypeScript development.

---

© 2026 SnakeFlow — CC BY-NC 4.0
