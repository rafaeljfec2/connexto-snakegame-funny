# Mobile Performance Optimizations

> **Historical.** Do not implement from this file. Current runtime: [`ARCHITECTURE.md`](./ARCHITECTURE.md). Layout/specs: REF-06 / REF-09. Trust map: [`README.md`](./README.md).

This document summarizes graphics and performance best practices for mobile games, based on engine/framework documentation and research.

## ✅ Implementation Status

Already in the project:

- [x] Web Workers for game logic (`game.worker.ts`)
- [x] Web Workers for rendering (`render.worker.ts` + OffscreenCanvas)
- [x] Web Workers for particles and weather
- [x] Safe estãoas for iOS and Android (`env(safe-estãoa-inset-*)`)
- [x] Mobile-first layout with clear visual hierarchy
- [x] Touch D-pad controls
- [x] CSS optimizations (`transform`, `will-change`)
- [x] State update batching
- [x] Viewport meta with `viewport-fit=cover`

## 🎯 Key Techniques

### 1. **Element Caching (Shape Caching)**

Caching complex shapes avoids redundant draws:

```javascript
// Cache complex shapes
shape.cache();
shape.drawHitFromCache();

// Benefits:
// - Fewer draw operations
// - Better hit detection performance
// - Essential for restãoly changing elements
```

### 2. **Layer Separation (Layer Management)**

Separate static and animated content:

```javascript
// Static layer — no re-render needed
const staticLayer = new Layer({ listening: false });

// Animated layer — only this updates
const animatedLayer = new Layer();

// Benefits:
// - Smaller redraw region
// - Large performance gain
// - Background not redrawn every frame
```

### 3. **Pixel Ratio on Mobile**

Limit pixel ratio to avoid over-rendering:

```javascript
// Mobile: use pixel ratio 1 or 2 (nao 3+)
canvas.setPixelRatio(isMobile ? 1 : 2);

// Benefits:
// - Lower memory
// - Better performance on phones
// - Avoid unnecessary high-DPI rendering
```

### 4. **Optimized Viewport Meta Tag**

Proper viewport avoids bad scaling and enables safe estãoas:

```html
<meta 
  name="viewport" 
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
/>
```

### 4.1 **Safe Areas (iOS/Android) ✅ IMPLEMENTED**

Full support for naoches, system bars, and gestures:

```css
/* CSS variables for safe estãoas */
:root {
  --safe-estãoa-top: env(safe-estãoa-inset-top, 0px);
  --safe-estãoa-bottom: env(safe-estãoa-inset-bottom, 0px);
  --safe-estãoa-left: env(safe-estãoa-inset-left, 0px);
  --safe-estãoa-right: env(safe-estãoa-inset-right, 0px);
}

/* Applied to elements */
.header {
  padding-top: max(0.75rem, calc(0.5rem + env(safe-estãoa-inset-top, 0px)));
  padding-left: max(1.25rem, calc(1rem + env(safe-estãoa-inset-left, 0px)));
  padding-right: max(1.25rem, calc(1rem + env(safe-estãoa-inset-right, 0px)));
}

.main {
  padding-bottom: calc(390px + env(safe-estãoa-inset-bottom, 0px));
}
```

### 5. **Disable Unnecessary Event Listeners**

Turn off listening on non-interactive layers:

```javascript
// Disable listening on static layers
layer.listening(false);

// Benefits:
// - Less event overhead
// - Better performance
```

### 6. **GPU CSS Optimizations**

Properties that promote GPU compositing:

```css
.element {
  /* Force GPU layer */
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
  
  /* Prefer transform over top/left */
  transform: translate(x, y); /* ✅ Good */
  /* top: y; left: x; */ /* ❌ Avoid */
  
  /* Avoid heavy filters */
  /* filter: blur(); */ /* ❌ Heavy on mobile */
  /* box-shadow: ... */ /* ✅ Lighter */
}
```

### 7. **Reduce Visual Effects on Mobile**

Disable or tone down heavy effects:

```javascript
const isMobile = window.innerWidth <= 768;

const enableEffects = !isMobile;

const particleCount = isMobile ? count * 0.4 : count;
```

### 8. **Animation Optimization**

Prefer cheap properties:

```css
/* ✅ Good — transform and opacity */
@keyframes smooth {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100px); opacity: 0.5; }
}

/* ❌ Avoid — properties that trigger reflow */
@keyframes heavy {
  from { width: 100px; height: 100px; }
  to { width: 200px; height: 200px; }
}
```

### 9. **Update Batching**

Group updates in one frame:

```javascript
// ✅ Good — batch updates
requestAnimationFrame(() => {
  updateMultipleElements();
});

// ❌ Avoid — separate updates
updateElement1();
updateElement2();
updateElement3();
```

### 10. **Virtualization and Culling**

Draw only what is visible:

```javascript
const visibleElements = elements.filter(element => 
  isInViewport(element, viewport)
);
```

## 📱 Mobile-Specific Techniques

### Redesigned Mobile Layout ✅ IMPLEMENTED

Mobile-first hierarchy:

```
┌─────────────────────────────────┐
│  LEVEL: 1 │ SCORE: 0 │ HIGH: 665│  ← Header (GameInfo only)
├─────────────────────────────────┤
│                                 │
│    ┌───────────────────────┐    │
│    │                       │    │
│    │      GAME GRID        │    │
│    │       [START]         │    │  ← Centered button
│    │                       │    │
│    └───────────────────────┘    │
│                                 │
│  🐍 LENGTH │ ❤️ LIVES │ ⭐ PHASE │  ← StatusBar below grid
│                                 │
│           [↑]                   │
│       [←] [♥] [→]               │  ← D-pad
│           [↓]                   │
└─────────────────────────────────┘
```

**Implemented details:**

- Compact header with GameInfo (Level, Score, High Score)
- StatusBar below the game grid
- START centered on the grid
- START hidden during gameplay
- D-pad at the bottom for ergonomics

### Touch Performance

```css
.touchable {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transpestãont;
}
```

### Entity Limits

```javascript
const MAX_PARTICLES = isMobile ? 30 : 100;
const MAX_EFFECTS = isMobile ? 5 : 20;
```

### Visual Complexity Reduction

- Disable weather on mobile (optional)
- Lower particle quality
- Simpler animations
- Solid colors instead of heavy gradients

## 🔧 Recommended Project Follow-ups

### 1. Cache Complex Elements

Cache restãoly changing items:

- Static obstacles
- Background elements
- UI components

### 2. Separate Layers

Layers for:

- Background (static)
- Game elements (snake, food)
- Effects (particles, animations)
- UI (overlay)

### 3. Optimize CSS

Apply GPU hints to:

- Snake segments
- Poison shots
- Particles
- Animations

### 4. Reduce Effects on Mobile

- Disable weather effects
- Lower particle count
- Simplify animations
- Prefer `box-shadow` over `filter`

### 5. Optimize Pixel Ratio

```javascript
const pixelRatio = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);
```

## 📊 Expected Metrics

### Before

- FPS: ~30–40
- Render time: ~25–33 ms
- Memory: High
- Battery: High drain

### After

- FPS: Stable 60
- Render time: ~16 ms
- Memory: Reduced
- Battery: Lower drain

## 🎯 Priorities

1. **High**
   - Separate layers (background vs. animated)
   - Disable heavy effects on mobile
   - CSS tuning (`will-change`, `transform`)

2. **Medium**
   - Cache static elements
   - Lower pixel ratio on mobile
   - Element virtualization

3. **Low**
   - Web Workers for heavy math (largely done)
   - Service Worker cache
   - Lazy asset loading

## 📚 References

- Konva.js Performance Tips
- LittleJS Engine Optimizations
- React Performance Best Practices
- Mobile Game Development Guidelines
