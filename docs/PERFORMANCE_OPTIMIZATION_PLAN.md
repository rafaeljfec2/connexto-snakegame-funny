# Performance Optimization Plan — Logic vs. Rendering Separation

> **Historical.** Do not implement from this file. Current runtime: [`ARCHITECTURE.md`](./ARCHITECTURE.md). Trust map: [`README.md`](./README.md).

> **Status: ✅ IMPLEMENTED** — The optimizations described here were implemented successfully using Web Workers and OffscreenCanvas.

## Current Implementation

The multi-thread architecture uses these workers:

- `game.worker.ts` — All game logic (movement, collisions, AI)
- `render.worker.ts` — Board rendering via OffscreenCanvas
- `weather.worker.ts` — Background weather effects
- `particle.worker.ts` — Particles and explosions

**Result:** Stable 60 FPS on mobile devices.

---

## Identified Issues (Historical)

### 1. **Unnecessary Re-render Every Frame**

- `updateGameState` calls `setGameState` on every game-loop frame
- That forces re-renders of every component that depends on `gameState`
- GameBoard re-renders all elements (snake, obstacles, portals, particles, shots) on each update

### 2. **Heavy Work on the Main Thread**

- All game logic runs on the same thread as the UI
- Complex work (collisions, obstacle generation, portals, boss) blocks rendering
- Multiple iterations and array transforms every frame

### 3. **Missing Memoization**

- Components are not wrapped in `React.memo`
- Repeated calculations without `useMemo`
- New objects/arrays created on every render

## Proposed Approaches

### **Approach 1: Frame Buffer + Decoupled State (RECOMMENDED)**

**Concept:** Keep internal game state in refs separate from React state. Update React state only when needed for display.

**Advantages:**

- ✅ Zero lag — logic runs independently of rendering
- ✅ Precise control over when to render
- ✅ Works with the current React setup
- ✅ No Web Workers required (avoids extra complexity)

**Implementation:**

1. Keep game state in `useRef` (no re-render)
2. Update React state every N frames or on significant visual changes
3. Use `requestAnimationFrame` to sync rendering
4. Memoize heavy components

### **Approach 2: Web Workers (ALTERNATIVE)**

**Concept:** Move heavy processing to a Web Worker.

**Disadvantages:**

- ❌ Workers cannot access the DOM
- ❌ Serialization overhead and complexity
- ❌ Communication cost
- ❌ Not all code can move (browser dependencies)

**When to use:** Very heavy, independent calculations only (e.g. pathfinding, AI).

### **Approach 3: Debouncing/Throttling State (COMPLEMENTARY)**

**Concept:** Batch multiple state updates.

**Partially implemented:** Batching for poison shots.

## Implementation Plan (Approach 1)

### Phase 1: Decoupled State with Frame Buffer

1. **Frame buffer system:**
   - Hold current state in `gameStateInternalRef`
   - Update React state only when needed
   - Sync with `requestAnimationFrame`

2. **Update frequency:**
   - React state every 2–3 frames (60 FPS feel)
   - Game logic still every frame
   - Slightly “lagged” visuals but no freezes

3. **Visual interpolation** (optional):
   - Smoother motion
   - Interpolate positions between frames

### Phase 2: Component Memoization

1. **Memoize GameBoard:**

   ```tsx
   export const GameBoard = React.memo(({ snake, food, ... }) => {
     // component
   });
   ```

2. **Memoize heavy elements:**
   - SnakeSegment
   - Obstacle
   - PoisonShot
   - ParticleSystem

3. **`useMemo` for calculations:**
   - Portal pairs
   - Active obstacles
   - Filtered particles

### Phase 3: Targeted Optimizations

1. **Virtualization** (if needed):
   - Render only viewport-visible entities
   - For large grids with many objects

2. **Canvas rendering** (alternative):
   - Canvas API instead of DOM
   - Better draw performance
   - More implementation complexity

## Decision: Implement Approach 1

**Reason:**

- Best cost/benefit
- Simpler to ship
- Keeps current React architecture
- Fixes lag without excessive complexity

## Immediate Implementation (Historical Note)

Planned work:

1. Frame buffer to decouple logic from rendering
2. Memoization of critical components
3. Smart throttling of state updates
4. `useMemo` for expensive calculations
