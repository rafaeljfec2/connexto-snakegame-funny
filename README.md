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
- **Combo System** - Earn multipliers by eating food quickly
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
- **Safe Areas** - Support for notches and navigation bars (iOS/Android)
- **Smooth Animations** - Transitions and animations on all elements
- **Game-Like Layout** - Game-style interface with integrated HUD
- **Dynamic Visual Effects** - Backgrounds and effects that change per phase
- **Contextual START Button** - Visible only when needed, centered on grid

### 🔧 Technical Features

- **Multi-Thread Architecture (Web Workers)**:
  - `game.worker.ts`: Processes all game logic (movement, collisions, AI) in a separate thread to not block the UI.
  - `render.worker.ts`: Renders the game board (Snake, Food, Obstacles, Portals) using `OffscreenCanvas` in another thread, ensuring smooth graphics.
  - `weather.worker.ts`: Manages background weather effects.
  - `particle.worker.ts`: Manages the particle and explosion system.
- **Mobile Performance**:
  - Optimizations for stable 60 FPS.
  - Removal of heavy shadows on mobile.
  - State update batching.
- **Safe Areas (iOS/Android)**:
  - Full support for `env(safe-area-inset-*)` for notches and navigation bars.
  - `viewport-fit=cover` for fullscreen on modern devices.
  - Dynamic padding that respects device safe areas.
- Automatic save system (high score and achievements)
- Structured logging system with Pino for debugging
- Responsive grid that adapts to screen size

### 📝 Logging System

The game has a complete logging system for debugging and observability, categorized by contexts (GAME_LOOP, BOSS, PHASE, etc.) and log levels.

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
├── workers/            # Web Workers (Logic, Render, Weather, Particles)
├── components/         # React Components (UI)
├── hooks/              # Custom Hooks
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
- **Safe Areas (iOS/Android)**: Full support for notches, navigation bars, and system gestures.
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
- **Centered Grid**: Maximized and centered game area
- **START Button on Grid**: Positioned at the center of the grid for easy access
- **StatusBar Below Grid**: Status information (Length, Lives, Phase) below the game area
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
- Input Validation
- State Protection

## 📊 Performance

- **Web Workers**: Total separation of logic and rendering from the main thread.
- **OffscreenCanvas**: Complex graphics without cost to the UI thread.
- **Memoization**: Efficient use of React.memo and useMemo.

## 📚 Additional Documentation

Check the documents in `docs/` for more details:

- `I18N_SYSTEM.md`
- `LOGGING_SYSTEM.md`
- `PERFORMANCE_OPTIMIZATION_PLAN.md`
- `SISTEMA_COMBATE_BOSS.md`

## 📈 Recent Evolution

### v2.0 - Redesigned Mobile Layout
- **Safe Areas**: Complete implementation of safe area support for iOS and Android
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

You are free to use, modify and share this project for personal and educational purposes.

**Commercial use is strictly prohibited without explicit authorization from the author.**

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)

See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Developed with ❤️ using the best practices in React and TypeScript development.

---

© 2026 SnakeFlow — CC BY-NC 4.0
