/// <reference lib="webworker" />

export {};

interface Particle {
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
let particles: Particle[] = [];
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

const createParticle = (id: number, reset: boolean = false): Particle => {
  const x = Math.random() * width;
  const y = reset
    ? id === 9 || id === 3 || id === 5
      ? -10
      : Math.random() * height
    : Math.random() * height;

  switch (id) {
    case 1: // Starry Night
      return {
        x,
        y,
        vx: 0,
        vy: 0,
        size: Math.random() * 2 + 1,
        color: '#ffffff',
        opacity: Math.random(),
        type: 'star',
        life: Math.random() * 100, // Used for twinkling
      };

    case 2: // Mystic Fog
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 50 + 20,
        color: '#60a5fa',
        opacity: Math.random() * 0.1 + 0.05,
        type: 'fog',
      };

    case 3: // Desert Storm
      return {
        x: reset ? -10 : Math.random() * width,
        y,
        vx: Math.random() * 5 + 2, // Fast horizontal
        vy: Math.random() * 1 + 0.5,
        size: Math.random() * 2 + 1,
        color: '#d97706', // amber-600
        opacity: Math.random() * 0.6 + 0.2,
        type: 'sand',
      };

    case 4: // Cosmic
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

    case 5: // Fire Speed
      return {
        x,
        y: reset ? height + 10 : y,
        vx: (Math.random() - 0.5) * 2,
        vy: -(Math.random() * 3 + 1), // Upward
        size: Math.random() * 4 + 2,
        color: Math.random() > 0.5 ? '#ef4444' : '#f59e0b',
        opacity: Math.random() * 0.6 + 0.2,
        type: 'ember',
      };

    case 6: // Chaos
      const colors = ['#ff0080', '#00ff80', '#8000ff', '#ff8000', '#0080ff'];
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.6 + 0.3,
        type: 'chaos',
      };

    case 8: // Ash/Lava
      return {
        x,
        y: reset ? -10 : y,
        vx: (Math.random() - 0.5) * 1,
        vy: Math.random() * 2 + 1, // Downward ash
        size: Math.random() * 3 + 1,
        color: '#7f1d1d', // dark red
        opacity: Math.random() * 0.6 + 0.2,
        type: 'ember',
      };

    case 9: // Rain (Vortex)
      return {
        x,
        y: reset ? -20 : y,
        vx: Math.random() * 2 - 1, // Slight wind
        vy: Math.random() * 10 + 15, // Fast drop
        size: Math.random() * 20 + 10, // Length of drop
        color: '#94a3b8',
        opacity: Math.random() * 0.3 + 0.1,
        type: 'rain',
      };

    case 10: // Divine
      return {
        x,
        y: reset ? height + 10 : y,
        vx: 0,
        vy: -(Math.random() * 1 + 0.5), // Slow rise
        size: Math.random() * 4 + 1,
        color: '#fbbf24', // amber
        opacity: Math.random() * 0.5 + 0.2,
        type: 'ember',
      };

    default:
      return { x: 0, y: 0, vx: 0, vy: 0, size: 0, color: '', opacity: 0 };
  }
};

const updateParticles = () => {
  particles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;

    // Reset if out of bounds
    if (phaseId === 5 || phaseId === 10) {
      // Upward movement
      if (p.y < -50) {
        Object.assign(p, createParticle(phaseId, true));
      }
    } else {
      // Downward/General movement
      if (p.y > height + 50 || p.x > width + 50 || p.x < -50) {
        Object.assign(p, createParticle(phaseId, true));
      }
    }

    // Special updates
    if (p.type === 'star') {
      // Twinkle
      p.life = (p.life || 0) + 0.05;
      p.opacity = 0.5 + Math.sin(p.life) * 0.4;
    }
  });

  // Lightning for phase 9
  if (phaseId === 9) {
    if (Math.random() < 0.005) {
      // Occasional flash
      lightningActive = true;
      lightningTimer = 5; // Frames
    }
    if (lightningActive) {
      lightningTimer--;
      if (lightningTimer <= 0) lightningActive = false;
    }
  }
};

const draw = () => {
  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Apply lightning
  if (lightningActive) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, width, height);
  }

  // Draw particles
  particles.forEach((p) => {
    ctx!.globalAlpha = p.opacity;
    ctx!.fillStyle = p.color;

    if (p.type === 'rain') {
      ctx!.beginPath();
      ctx!.moveTo(p.x, p.y);
      ctx!.lineTo(p.x + p.vx, p.y + p.size);
      ctx!.strokeStyle = p.color;
      ctx!.lineWidth = 1; // Thinner rain
      ctx!.stroke();
    } else if (p.type === 'fog') {
      // Simple circle for fog
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx!.fill();
    } else {
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx!.fill();
    }
  });

  ctx.globalAlpha = 1;
};

const loop = () => {
  updateParticles();
  draw();
  requestAnimationFrame(loop);
};

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'INIT':
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

    case 'RESIZE':
      if (ctx && ctx.canvas) {
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
