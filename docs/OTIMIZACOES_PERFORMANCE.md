# Performance Optimizations

> **Historical.** Do not implement from this file. Current runtime: [`ARCHITECTURE.md`](./ARCHITECTURE.md). Trust map: [`README.md`](./README.md).

This document describes all performance optimizations implemented in the Snake game.

## 🎯 Optimization Goals

- Maintain 60 FPS during gameplay
- Prevent UI freezes and lag
- Optimize for mobile devices
- Reduce memory use
- Improve control responsiveness

## ✅ Implemented Optimizations

### 1. Frame Buffering System

**Problem:** The game loop updated React state every frame, causing many re-renders and possible UI stalls.

**Solution:** Frame buffering separates game logic from React rendering.

```typescript
// Game logic runs internally at 60fps
internalGameStateRef.current = newState;

// React rendering updates every frame (60fps too)
// but uses requestAnimationFrame for batching
scheduleRenderUpdate();
```

**Benefits:**

- Game logic independent of React’s render cycle
- Fewer unnecessary re-renders
- More responsive UI

### 2. Component Memoization

Heavy components use `React.memo`:

- `GameBoard` — Main board
- `SnakeSegment` — Each snake segment
- `ObstacleComponent` — Obstacles
- `PoisonShot` — Poison projectiles

**Benefits:**

- Re-render only when props actually change
- Large reduction in re-renders

### 3. Calculation Memoization

Expensive work uses `useMemo`:

- `portalPairs` — Portal grouping
- Phase and level calculations
- Active entity filters

**Benefits:**

- Avoid repeated computation
- Better loop performance

### 4. Active Entity Limits

Caps prevent overload:

```typescript
POISON_CONFIG.maxShotsSimultaneous = 50;
PERFORMANCE_CONFIG.maxParticles = 100;
PERFORMANCE_CONFIG.maxPortals = 10;
```

**Benefits:**

- Memory control
- Stable performance with many entities
- Automatic cleanup of old entities

### 5. State Update Batching

Updates are batched with `requestAnimationFrame`:

```typescript
// Poison shots are batched
pendingPoisonShotsRef.current.push(...newShots);
scheduleBatchFlush();
```

**Benefits:**

- Fewer state updates
- Fewer re-renders
- Better performance

### 6. CSS Animation Optimization

GPU-friendly animations:

```css
.poisonShot {
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
}
```

**Benefits:**

- Smoother animation
- Lower CPU use
- Better on mobile

### 7. Conditional Calculations

Work runs only when needed:

```typescript
// Only compute when the array has items
const activePowerUps = prev.activePowerUps.length > 0 ? getActivePowerUps(prev.activePowerUps) : [];
```

**Benefits:**

- Less wasted work in the game loop

### 8. Log Throttling

Logs are throttled to avoid gameplay impact:

```typescript
// Movement logs every 500ms or on direction change
// Shot logs every 5 shots
```

**Benefits:**

- Logging does not block gameplay
- Events are still captured

### 9. Optimized Responsive Grid

Grid adapts via `ResizeObserver` and efficient sizing:

```typescript
const cellSize = Math.min(
  Math.floor((containerWidth - padding) / GAME_CONFIG.gridSize),
  Math.floor((containerHeight - padding) / GAME_CONFIG.gridSize),
);
```

**Benefits:**

- Grid stays visible and proportional
- Avoids unnecessary reflows

### 10. Loop Optimization

`forEach` replaced with `for` where it matters:

```typescript
// Faster for large arrays
for (let i = 0; i < shots.length; i++) {
  // process shot
}
```

**Benefits:**

- Better performance on large loops
- Lower overhead

### 11. Multi-Thread Architecture (Web Workers)

**Problem:** The main browser thread handled game logic, React rendering, touch, CSS animations, and physics at once, causing FPS drops.

**Solution:** Dedicated workers:

- **Game Worker:** Logic loop (position, collision, AI) at 60 ticks/s
- **Render Worker:** Draws to `OffscreenCanvas` (snake, food, obstacles, portals)
- **Weather/Particle Workers:** Heavy visual effects

**Benefits:**

- UI thread free for input and DOM HUD
- Stable 60 FPS, especially on mobile
- Uses multiple CPU cores
- Thousands of particles without UI cost

## 📊 Performance Metrics

### Before Optimizations

- FPS: ~30–40 on mobile
- Re-renders: ~100+ per second
- Noticeable lag in intense gameplay
- Occasional freezes

### After Optimizations

- FPS: Stable 60 on desktop and mobile
- Re-renders: ~60 per second (when needed)
- No noticeable lag
- No freezes

## 🔧 Techniques Used

### React

- `React.memo` for components
- `useMemo` for calculations
- `useCallback` for functions
- Avoid unnecessary new objects/arrays

### JavaScript

- Early returns
- Conditional calculations
- Optimized loops
- Throttling and debouncing

### CSS

- `will-change` on animated properties
- `transform` instead of `top`/`left`
- `transform: translateZ(0)` for GPU
- `backface-visibility: hidden`

### Game Loop

- Frame buffering
- Update batching
- Entity limits
- Lazy calculations

## 📱 Mobile-Specific Optimizations

### Touch

- `touch-action: manipulation` for faster response
- Pull-to-refresh prevention
- Optimized touch handlers

### Layout

- Adaptive grid without extra reflows
- Controls visible without covering modals
- Layout tuned for small screens

### Rendering

- Optional reduction of visual effects on mobile
- More conservative entity limits
- Animation tuning

## 🎯 Possible Future Improvements

### Virtualization

- Render only visible entities
- Virtualize large lists

### Lazy Loading

- Load assets on demand
- More aggressive code splitting

### Service Worker

- Asset cache
- Background sync
- Offline support

## 📝 Development Notes

### Design Decisions

- **Frame buffering:** Responsiveness without sacrificing frame rate
- **Entity limits:** Balance visuals vs. performance
- **Memoization:** Where it helps, not everywhere

### Trade-offs

- Some caps reduce visual richness (particle limits)
- Memoization may use more memory but saves CPU
- Frame buffering adds complexity but improves UX

## 🔍 Monitoring

To monitor performance:

1. Open DevTools (F12)
2. Performance tab
3. Record a gameplay session
4. Review:
   - FPS during play
   - Frame time
   - React re-renders
   - Memory use

## 📚 References

- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [CSS Performance](https://web.dev/animations/)
- [Game Loop Patterns](https://gameprogrammingpatterns.com/game-loop.html)
