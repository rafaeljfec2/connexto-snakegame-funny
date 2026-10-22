# 🎮 Ideas to Make the Game Unique

> **Historical / backlog.** Not a contract. New work needs an SDD spec. Runtime: [`ARCHITECTURE.md`](./ARCHITECTURE.md). Trust map: [`README.md`](./README.md).

> **Implementation status:** ✅ = Done | 🔄 = In progress | ⏳ = Planned

---

## 📋 PHASE 1: Foundations (Already Implemented) ✅

### ✅ 1. **Scalable Grid**

- Grid increased to 30×30
- System ready for size changes

### ✅ 2. **Combo System**

- Score multiplier for eating several foods quickly in a row
- Combo bar that builds and can be lost
- Visual effects at high combos
- Display in the top-right corner

### ✅ 3. **Negative Power-Ups (Debuffs)**

- Poison food (POISON) that shrinks the snake
- Food that reverses controls temporarily (REVERSE_CONTROLS)
- Food that slows the snake (SLOW_DOWN)
- Adds strategic challenge

### ✅ 4. **Particles and Visual Effects**

- Particle effects when eating food
- Colors vary by food type
- Smooth animations

### ✅ 5. **Obstacles and Barriers**

- Obstacles from specific levels (from level 3)
- Three obstacle patterns
- Collision system implemented

### ✅ 6. **Achievement System**

- 9 unlockable achievements
- Visual notifications on unlock
- Persistence in localStorage

---

## 📋 PHASE 2: Visual Polish and Feedback (Next)

### ⏳ 7. **Sound and Music**

**Complexity:** Medium | **Impact:** High

- SFX for actions (eat, collision, combo)
- Background music that changes with level
- Audio feedback for power-ups
- Volume control in menu

### ⏳ 8. **Richer Animations**

**Complexity:** Low | **Impact:** Medium

- “Swallow” animation when eating
- Smooth level transitions
- Improved game over screen effects
- Snake death animation

### ⏳ 9. **Visual Snake Trail**

**Complexity:** Low | **Impact:** Medium

- Trail following the snake
- Fade-out trail effect
- Optional and configurable

### ✅ 10. **Dynamic Background**

**Complexity:** Medium | **Impact:** Medium | **STATUS: IMPLEMENTED**

- Background changes with level ✅
- Subtle parallax ✅
- Background particles ✅
- Dynamic gradients ✅
- 10 unique climates per phase ✅

### ⏳ 11. **Dark/Light Mode**

**Complexity:** Low | **Impact:** Medium

- Theme toggle
- Adaptive color system
- Preferences saved in localStorage

---

## 📋 PHASE 3: Core Gameplay Features

### ✅ 12. **Length-Based Score Multiplier**

**Complexity:** Low | **Impact:** Medium

- Longer snake earns more points
- Encourages growth strategy
- Formula: base points × (1 + length/10)

### ✅ 13. **Timed Food**

**Complexity:** Medium | **Impact:** High

- Food disappears if not eaten in time
- Special food with short lifetime
- Extra pressure and strategy
- Visual time remaining indicator

### ✅ 14. **Lives System**

**Complexity:** Medium | **Impact:** High

- Three lives before game over
- Extra-life power-up
- Continue after death with penalty
- Visual remaining lives display

### ✅ 15. **Detailed Statistics**

**Complexity:** Medium | **Impact:** Medium | **STATUS: IMPLEMENTED**

- Post-game statistics screen ✅
- Per-phase statistics ✅
- Match history ✅
- Play time, food eaten, etc. ✅
- Persistent high score ✅
- Achievement system ✅

---

## 📋 PHASE 4: Intermediate Features

### ✅ 16. **Skins/Themes System** (REF-08)

**Complexity:** Medium | **Impact:** High | **Status:** Shipped — see [REF-08](./SDD/specs/REF-08-snake-skins.md) and [ADR-0006](./ADR/0006-orthogonal-identity-axes-and-boss-outline-soft-override.md)

- [x] Multiple snake skins (4 palettes: Neon Green, Retro Arcade, Frozen Ice, Magenta Blaze)
- [x] Selection in `PowerUpsLegendDrawer` → Settings (accessible `role="radiogroup"`, ArrowLeft/ArrowRight)
- [x] Persistence in `localStorage['snake-game-skin']`, independent of theme (REF-07)
- [x] Boss keeps narrative color; contrast outline derived from player skin (ADR-0006)
- [ ] Unlock via achievements — intentionally out of scope (all skins free day one); possible future additive extension

### ⏳ 17. **Special Food: Multi-Food (Food Trail)**

**Complexity:** High | **Impact:** High

- Certain special foods spawn a sequence of foods
- Player must follow the trail before they vanish
- Bigger bonus if all are collected
- Special power-up activates the mode

### ⏳ 18. **Daily Missions/Challenges**

**Complexity:** High | **Impact:** High

- Daily challenges with rewards
- “Eat 50 foods in one run”
- “Reach level 10 without dying”
- “Use 5 power-ups in one run”
- Reward system

### ✅ 19. **Teleport/Portal**

**Complexity:** High | **Impact:** High

- Portals teleport the snake
- Strategy to avoid collisions via portals
- Temporary portal power-up
- Paired connected portals

### ⏳ 20. **Slow-Motion Power-Up**

**Complexity:** Medium | **Impact:** Medium

- Power-up slows time
- Useful in tight situations
- Short duration
- Visual distortion effect

---

## 📋 PHASE 5: Alternate Game Modes

### ⏳ 21. **Time Attack Mode**

**Complexity:** Medium | **Impact:** High

- Complete objectives within a time limit
- Per-level goals
- Score based on speed
- Visible timer

### ⏳ 22. **Survival Mode**

**Complexity:** Low | **Impact:** Medium

- Survive as long as possible
- Speed increases constantly
- Focus on time instead of score
- Survival leaderboard

### ⏳ 23. **Maze Mode**

**Complexity:** Medium | **Impact:** High

- Grid with fixed predefined obstacles
- Different maps per level
- Navigation challenge

### ⏳ 24. **Zen Mode**

**Complexity:** Low | **Impact:** Low

- Constant speed, relaxed pace
- No game over (until exit)
- Focus on growth and exploration

---

## 📋 PHASE 6: Advanced Features

### ⏳ 25. **Dynamic Grid**

**Complexity:** High | **Impact:** High

- Grid size changes at certain levels
- Rotating grid during play
- Expanding/contracting grid
- Transition visuals

### ✅ 26. **Moving Obstacles**

**Complexity:** High | **Impact:** High | **STATUS: IMPLEMENTED**

- Obstacles move on the grid ✅
- Different movement patterns ✅
- Dynamic collision avoidance ✅
- Boss “O Desafiador” moves obstacles toward the snake ✅

### ⏳ 27. **Local Multiplayer (2 Snakes)**

**Complexity:** Very High | **Impact:** Very High

- Two snakes on one grid
- Compete for food
- Eat the other snake in some modes
- Split controls (WASD + arrow keys)

### ⏳ 28. **Rival Snakes (AI)**

**Complexity:** Very High | **Impact:** High

- AI snakes compete for food
- Avoid or fight rivals
- Multiple AI difficulty levels
- AI pathfinding

---

## 📋 PHASE 7: Very Advanced Features

### ⏳ 29. **Evolution System**

**Complexity:** High | **Impact:** High

- Snake evolves visually as it grows
- Different shapes at different sizes
- Epic transformations
- Milestone appearance changes

### ⏳ 30. **Puzzle Mode**

**Complexity:** High | **Impact:** Medium

- Levels with specific goals
- “Reach the food without touching walls”
- Logic plus strategy
- Level editor

### ✅ 31. **Boss Fight System**

**Complexity:** Very High | **Impact:** High | **STATUS: IMPLEMENTED**

- Boss encounters at specific levels ✅
- 10 unique bosses with special abilities ✅
- Bosses defeated in special ways ✅
- Special rewards ✅
- Unique boss mechanics ✅
- Combat with poison shots ✅

### ⏳ 32. **Clone/Tail Split Power-Up**

**Complexity:** Very High | **Impact:** Medium

- Split snake into two smaller snakes
- Control both at once
- Advanced tactics
- Merge back under conditions

### ⏳ 33. **Gravity/Physics**

**Complexity:** Very High | **Impact:** Medium

- Snake “falls” without support
- Different gravity per level
- Temporary flight power-up
- Full 2D physics

### ⏳ 34. **Snake with Special Abilities**

**Complexity:** Very High | **Impact:** High

- Each segment can have an ability
- Head can “shoot” to destroy obstacles
- Tail can create temporary blocks
- Skill system

### ⏳ 35. **Shop System**

**Complexity:** High | **Impact:** High

- Spend points on upgrades
- Permanent power-ups
- Skins and customization
- In-game currency

### ⏳ 36. **Build Mode**

**Complexity:** Very High | **Impact:** Medium

- Edit grid before playing
- Create custom challenges
- Share levels (export/import)
- Full visual editor

---

## 🎯 Implementation Priority Summary

### 🔥 High Priority (Next 5)

1. **Sound and Music** — Immediate experience boost
2. **Richer Animations** — Visual polish
3. **Timed Food** — Pressure and strategy
4. **Lives System** — More replayability
5. **Skins/Themes System** — Personalization and engagement

### 📊 Medium Priority

6. Detailed Statistics
7. Length-Based Score Multiplier
8. Visual Snake Trail
9. Dynamic Background
10. Dark/Light Mode

### 🎮 Low Priority (When time allows)

11. Alternate game modes
12. Advanced features
13. Multiplayer and AI

---

## 📝 Implementation Notes

- **Phase 1** is **100% complete** ✅
- **Phase 2** can run in parallel (visual polish)
- **Phases 3–4** add depth
- **Phases 5–7** are larger expansions for future versions

### Current Recommendation

Start with **Phase 2** (sound and music, animations) to polish the current game before adding complex new mechanics.

---

## ✅ Implementation Checklist

### Phase 1 — Foundations ✅
- [x] Scalable Grid
- [x] Combo System
- [x] Negative Power-Ups
- [x] Particles and Visual Effects
- [x] Obstacles and Barriers
- [x] Achievement System

### Phase 2 — Visual Improvements
- [ ] Sound and Music
- [x] Richer Animations (phase/boss transitions)
- [ ] Visual Snake Trail
- [x] Dynamic Background (10 climates per phase)
- [ ] Dark/Light Mode

### Phase 3 — Gameplay
- [x] Timed Food
- [x] Lives System
- [x] Detailed Statistics
- [x] Skins/Themes System (REF-08)

### Phase 4 — Advanced
- [x] Teleport/Portal
- [x] Boss Fight System (10 unique bosses)
- [x] Moving Obstacles

### Phase 5 — Mobile
- [x] Mobile-First Layout
- [x] Safe Areas (iOS/Android)
- [x] Directional D-Pad
- [x] Contextual START Button
- [x] Repositioned StatusBar
