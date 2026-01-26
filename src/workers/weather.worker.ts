/// <reference lib="webworker" />

// Module isolation marker
const _moduleMarker = Symbol('weather-worker');
export { _moduleMarker as __weatherWorkerModule };

interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  life?: number;
  maxLife?: number;
  type?: 'rain' | 'snow' | 'sand' | 'star' | 'fog' | 'ember' | 'cloud' | 'cosmic' | 'chaos';
}

let ctx: OffscreenCanvasRenderingContext2D | null = null;
let width = 0;
let height = 0;
let particles: WeatherParticle[] = [];
let phaseId = 0;
let isMobile = false;
let lightningTimer = 0;
let lightningActive = false;
let dpr = 1;

// Configuration based on phase
const initWeather = (id: number, mobile: boolean) => {
  phaseId = id;
  isMobile = mobile;
  particles = [];

  const particleCount = getParticleCount(id, mobile);

  for (let i = 0; i < particleCount; i++) {
    particles.push(createParticle(id));
  }
};

const getParticleCount = (id: number, mobile: boolean): number => {
  const multiplier = mobile ? 0.3 : 1;
  switch (id) {
    case 1:
      return Math.floor(60 * multiplier); // Stars
    case 2:
      return Math.floor(20 * multiplier); // Fog
    case 3:
      return Math.floor(80 * multiplier); // Sand
    case 4:
      return Math.floor(50 * multiplier); // Cosmic
    case 5:
      return Math.floor(60 * multiplier); // Fire/Embers
    case 6:
      return Math.floor(40 * multiplier); // Chaos
    case 7:
      return Math.floor(30 * multiplier); // Geometric/Mist
    case 8:
      return Math.floor(50 * multiplier); // Ash/Lava
    case 9:
      return Math.floor(100 * multiplier); // Rain (Storm)
    case 10:
      return Math.floor(50 * multiplier); // Divine
    default:
      return 0;
  }
};

// Helper functions for particle creation - reduces cognitive complexity
function getInitialY(id: number, reset: boolean, baseY: number): number {
  if (!reset) return baseY;
  const needsTopReset = id === 9 || id === 3 || id === 5;
  return needsTopReset ? -10 : baseY;
}

function createStarParticle(x: number, y: number): WeatherParticle {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    size: Math.random() * 2 + 1,
    color: '#ffffff',
    opacity: Math.random(),
    type: 'star',
    life: Math.random() * 100,
  };
}

function createFogParticle(
  x: number,
  y: number,
  color: string,
  sizeRange: [number, number],
): WeatherParticle {
  return {
    x,
    y,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.2,
    size: Math.random() * sizeRange[0] + sizeRange[1],
    color,
    opacity: Math.random() * 0.1 + 0.05,
    type: 'fog',
  };
}

function createSandParticle(_x: number, y: number, reset: boolean): WeatherParticle {
  return {
    x: reset ? -10 : Math.random() * width,
    y,
    vx: Math.random() * 5 + 2,
    vy: Math.random() * 1 + 0.5,
    size: Math.random() * 2 + 1,
    color: '#d97706',
    opacity: Math.random() * 0.6 + 0.2,
    type: 'sand',
  };
}

function createCosmicParticle(x: number, y: number): WeatherParticle {
  return {
    x,
    y,
    vx: (Math.random() - 0.5) * 0.2,
    vy: (Math.random() - 0.5) * 0.2,
    size: Math.random() * 3 + 1,
    color: Math.random() > 0.5 ? '#a855f7' : '#ffffff',
    opacity: Math.random() * 0.5 + 0.3,
    type: 'cosmic',
  };
}

function createEmberParticle(
  x: number,
  y: number,
  reset: boolean,
  config: { yOffset: number; vy: number; color: string },
): WeatherParticle {
  return {
    x,
    y: reset ? config.yOffset : y,
    vx: (Math.random() - 0.5) * 2,
    vy: config.vy,
    size: Math.random() * 4 + 2,
    color: config.color,
    opacity: Math.random() * 0.6 + 0.2,
    type: 'ember',
  };
}

function createChaosParticle(x: number, y: number): WeatherParticle {
  const colors = ['#ff0080', '#00ff80', '#8000ff', '#ff8000', '#0080ff'];
  return {
    x,
    y,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    size: Math.random() * 4 + 2,
    color: colors[Math.floor(Math.random() * colors.length)] ?? '#ff0080',
    opacity: Math.random() * 0.6 + 0.3,
    type: 'chaos',
  };
}

function createRainParticle(x: number, y: number, reset: boolean): WeatherParticle {
  return {
    x,
    y: reset ? -20 : y,
    vx: Math.random() * 2 - 1,
    vy: Math.random() * 10 + 15,
    size: Math.random() * 20 + 10,
    color: '#94a3b8',
    opacity: Math.random() * 0.3 + 0.1,
    type: 'rain',
  };
}

function createDivineParticle(x: number, y: number, reset: boolean): WeatherParticle {
  return {
    x,
    y: reset ? height + 10 : y,
    vx: 0,
    vy: -(Math.random() * 1 + 0.5),
    size: Math.random() * 4 + 1,
    color: '#fbbf24',
    opacity: Math.random() * 0.5 + 0.2,
    type: 'ember',
  };
}

const createParticle = (id: number, reset: boolean = false): WeatherParticle => {
  const x = Math.random() * width;
  const baseY = Math.random() * height;
  const y = getInitialY(id, reset, baseY);

  switch (id) {
    case 1:
      return createStarParticle(x, y);
    case 2:
      return createFogParticle(x, y, '#60a5fa', [50, 20]);
    case 3:
      return createSandParticle(x, y, reset);
    case 4:
      return createCosmicParticle(x, y);
    case 5:
      return createEmberParticle(x, y, reset, {
        yOffset: height + 10,
        vy: -(Math.random() * 3 + 1),
        color: Math.random() > 0.5 ? '#ef4444' : '#f59e0b',
      });
    case 6:
      return createChaosParticle(x, y);
    case 7:
      return createFogParticle(x, y, '#6366f1', [40, 10]);
    case 8:
      return createEmberParticle(x, y, reset, {
        yOffset: -10,
        vy: Math.random() * 2 + 1,
        color: '#7f1d1d',
      });
    case 9:
      return createRainParticle(x, y, reset);
    case 10:
      return createDivineParticle(x, y, reset);
    default:
      return { x: 0, y: 0, vx: 0, vy: 0, size: 0, color: '', opacity: 0 };
  }
};

// Helper to check if particle needs reset based on bounds
function needsReset(p: WeatherParticle): boolean {
  const isUpwardPhase = phaseId === 5 || phaseId === 10;
  if (isUpwardPhase) {
    return p.y < -50;
  }
  return p.y > height + 50 || p.x > width + 50 || p.x < -50;
}

// Helper to update star twinkle effect
function updateStarTwinkle(p: WeatherParticle): void {
  p.life = (p.life ?? 0) + 0.05;
  p.opacity = 0.5 + Math.sin(p.life) * 0.4;
}

// Helper to update lightning for storm phase
function updateLightning(): void {
  if (phaseId !== 9) return;

  if (Math.random() < 0.005) {
    lightningActive = true;
    lightningTimer = 5;
  }
  if (lightningActive) {
    lightningTimer--;
    if (lightningTimer <= 0) lightningActive = false;
  }
}

const updateParticles = () => {
  const particlesLength = particles.length;
  for (let i = 0; i < particlesLength; i++) {
    const p = particles[i];
    if (!p) continue;

    p.x += p.vx;
    p.y += p.vy;

    if (needsReset(p)) {
      Object.assign(p, createParticle(phaseId, true));
    }

    if (p.type === 'star') {
      updateStarTwinkle(p);
    }
  }

  updateLightning();
};

// Helper to draw rain particle
function drawRainParticle(context: OffscreenCanvasRenderingContext2D, p: WeatherParticle): void {
  context.beginPath();
  context.moveTo(p.x, p.y);
  context.lineTo(p.x + p.vx, p.y + p.size);
  context.strokeStyle = p.color;
  context.lineWidth = 1;
  context.stroke();
}

// Helper to draw circle particle (fog, default, etc)
function drawCircleParticle(context: OffscreenCanvasRenderingContext2D, p: WeatherParticle): void {
  context.beginPath();
  context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
  context.fill();
}

const draw = () => {
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);

  if (lightningActive) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, width, height);
  }

  const particlesLength = particles.length;
  for (let i = 0; i < particlesLength; i++) {
    const p = particles[i];
    if (!p) continue;

    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;

    if (p.type === 'rain') {
      drawRainParticle(ctx, p);
    } else {
      drawCircleParticle(ctx, p);
    }
  }

  ctx.globalAlpha = 1;
};

const loop = () => {
  updateParticles();
  draw();
  requestAnimationFrame(loop);
};

globalThis.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'INIT': {
      const canvas = payload.canvas as OffscreenCanvas;
      dpr = payload.dpr || 1;
      width = payload.width * dpr;
      height = payload.height * dpr;
      isMobile = payload.isMobile || false;
      phaseId = payload.phaseId || 1;

      ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        // Reset width/height to logical for calculations
        width = payload.width;
        height = payload.height;
      }

      initWeather(phaseId, isMobile);
      loop();
      break;
    }

    case 'RESIZE':
      if (ctx?.canvas) {
        dpr = payload.dpr || 1;
        const newWidth = payload.width * dpr;
        const newHeight = payload.height * dpr;
        ctx.canvas.width = newWidth;
        ctx.canvas.height = newHeight;
        ctx.scale(dpr, dpr);

        width = payload.width;
        height = payload.height;

        initWeather(phaseId, isMobile);
      }
      break;

    case 'UPDATE_PHASE':
      if (phaseId !== payload.phaseId) {
        initWeather(payload.phaseId, isMobile);
      }
      break;
  }
};
