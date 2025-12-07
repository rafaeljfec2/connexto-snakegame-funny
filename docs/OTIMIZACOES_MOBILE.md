# Otimizações de Performance para Mobile

Este documento resume as melhores práticas de otimização de gráficos e performance para jogos mobile baseadas em pesquisa e documentação de engines e frameworks.

## 🎯 Principais Técnicas Encontradas

### 1. **Cache de Elementos (Shape Caching)**

Cachar elementos complexos evita re-renders desnecessários:

```javascript
// Cache de formas complexas
shape.cache();
shape.drawHitFromCache();

// Benefícios:
// - Reduz operações de desenho
// - Melhora performance de hit detection
// - Essencial para elementos que não mudam frequentemente
```

### 2. **Separação de Layers (Layer Management)**

Separar elementos estáticos de animados em layers diferentes:

```javascript
// Static layer - não precisa re-renderizar
const staticLayer = new Layer({ listening: false });

// Animated layer - apenas este precisa atualizar
const animatedLayer = new Layer();

// Benefícios:
// - Reduz área de re-render
// - Melhora performance significativamente
// - Backgorund não precisa ser redesenhado
```

### 3. **Otimização de Pixel Ratio para Mobile**

Ajustar pixel ratio para evitar renderização excessiva:

```javascript
// Mobile: usar pixel ratio 1 ou 2 (não 3+)
canvas.setPixelRatio(isMobile ? 1 : 2);

// Benefícios:
// - Reduz uso de memória
// - Melhora performance em dispositivos móveis
// - Evita renderização de alta resolução desnecessária
```

### 4. **Viewport Meta Tag Otimizado**

Viewport tag adequado evita scaling desnecessário:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
```

### 5. **Desabilitar Event Listeners Desnecessários**

Reduzir listeners em layers que não precisam de interação:

```javascript
// Desabilitar listening em layers estáticos
layer.listening(false);

// Benefícios:
// - Reduz overhead de event handling
// - Melhora performance
```

### 6. **Otimizações CSS para GPU**

Propriedades CSS que aceleram pela GPU:

```css
.element {
  /* Força aceleração GPU */
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
  
  /* Usar transform em vez de top/left */
  transform: translate(x, y); /* ✅ Bom */
  /* top: y; left: x; */ /* ❌ Evitar */
  
  /* Evitar filtros pesados */
  /* filter: blur(); */ /* ❌ Pesado no mobile */
  /* box-shadow: ... */ /* ✅ Mais leve */
}
```

### 7. **Redução de Efeitos Visuais no Mobile**

Desabilitar ou reduzir efeitos pesados:

```javascript
const isMobile = window.innerWidth <= 768;

// Desabilitar efeitos pesados no mobile
const enableEffects = !isMobile;

// Reduzir qualidade de partículas
const particleCount = isMobile ? count * 0.4 : count;
```

### 8. **Otimização de Animações**

Animações mais leves e eficientes:

```css
/* ✅ Bom - usar transform e opacity */
@keyframes smooth {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100px); opacity: 0.5; }
}

/* ❌ Evitar - animar propriedades que causam reflow */
@keyframes heavy {
  from { width: 100px; height: 100px; }
  to { width: 200px; height: 200px; }
}
```

### 9. **Batching de Atualizações**

Agrupar múltiplas atualizações em uma única operação:

```javascript
// ✅ Bom - agrupar atualizações
requestAnimationFrame(() => {
  updateMultipleElements();
});

// ❌ Evitar - atualizações separadas
updateElement1();
updateElement2();
updateElement3();
```

### 10. **Virtualização e Culling**

Renderizar apenas elementos visíveis:

```javascript
// Renderizar apenas elementos no viewport
const visibleElements = elements.filter(element => 
  isInViewport(element, viewport)
);
```

## 📱 Técnicas Específicas para Mobile

### Performance de Touch

```css
/* Otimizar touch response */
.touchable {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
```

### Limites de Entidades

```javascript
// Limites mais conservadores no mobile
const MAX_PARTICLES = isMobile ? 30 : 100;
const MAX_EFFECTS = isMobile ? 5 : 20;
```

### Redução de Complexidade Visual

- Desabilitar efeitos climáticos no mobile
- Reduzir qualidade de partículas
- Simplificar animações
- Usar cores sólidas em vez de gradientes complexos

## 🔧 Implementações Recomendadas para o Projeto

### 1. Cache de Elementos Complexos

Cachear elementos que não mudam frequentemente:
- Obstáculos estáticos
- Background elements
- UI components

### 2. Separar Layers

Criar layers separados para:
- Background (estático)
- Game elements (snake, food)
- Effects (particles, animations)
- UI (overlay)

### 3. Otimizar CSS

Aplicar otimizações GPU em:
- Snake segments
- Poison shots
- Particles
- Animations

### 4. Reduzir Efeitos no Mobile

- Desabilitar weather effects
- Reduzir particle count
- Simplificar animations
- Usar box-shadow em vez de filter

### 5. Otimizar Pixel Ratio

Ajustar para mobile:
```javascript
const pixelRatio = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);
```

## 📊 Métricas Esperadas

### Antes das Otimizações
- FPS: ~30-40
- Render time: ~25-33ms
- Memory: Alta
- Battery: Alto consumo

### Depois das Otimizações
- FPS: 60 estável
- Render time: ~16ms
- Memory: Reduzida
- Battery: Menor consumo

## 🎯 Prioridades

1. **Alta Prioridade**
   - Separar layers (background vs animated)
   - Desabilitar efeitos pesados no mobile
   - Otimizar CSS (will-change, transform)

2. **Média Prioridade**
   - Cache de elementos estáticos
   - Reduzir pixel ratio no mobile
   - Virtualização de elementos

3. **Baixa Prioridade**
   - Web Workers para cálculos pesados
   - Service Worker para cache
   - Lazy loading de assets

## 📚 Referências

- Konva.js Performance Tips
- LittleJS Engine Optimizations
- React Performance Best Practices
- Mobile Game Development Guidelines

