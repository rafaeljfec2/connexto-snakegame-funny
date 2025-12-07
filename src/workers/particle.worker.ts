/// <reference lib="webworker" />

/* eslint-disable no-restricted-globals */
interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

// External entities (like poison shots) to be rendered
interface ExternalEntity {
  x: number;
  y: number;
  color: string;
  size: number;
  type: 'rect' | 'circle';
  glow?: boolean;
}

let particles: Particle[] = [];
let externalEntities: ExternalEntity[] = [];
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let width = 0;
let height = 0;
let lastTime = 0;
let animationFrameId: number;
let dpr = 1;

const selfWorker = self as unknown as Worker;

selfWorker.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'INIT':
      const canvas = payload.canvas as OffscreenCanvas;
      dpr = payload.dpr || 1;
      width = payload.width;
      height = payload.height;
      
      // Set physical size
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      
      ctx = canvas.getContext('2d');
      if (ctx) {
          ctx.scale(dpr, dpr);
      }
      
      lastTime = performance.now();
      loop();
      break;

    case 'RESIZE':
      width = payload.width;
      height = payload.height;
      dpr = payload.dpr || dpr;
      
      if (ctx && ctx.canvas) {
        ctx.canvas.width = width * dpr;
        ctx.canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }
      break;

    case 'SPAWN':
      // Payload: { x, y, color, count, size, speed }
      spawnParticles(payload);
      break;

    case 'UPDATE_ENTITIES':
      // Payload: { entities: ExternalEntity[] }
      if (payload.entities) {
        externalEntities = payload.entities;
      }
      break;
  }
};

function spawnParticles(data: any) {
  const { x, y, color, count = 10, size = 4, speed = 1, lifetime = 1000 } = data;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * speed;

    particles.push({
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      life: lifetime,
      maxLife: lifetime,
      color,
      size: Math.random() * size + 2,
    });
  }

  // Limit particles for performance in the worker too
  if (particles.length > 200) {
    particles = particles.slice(particles.length - 200);
  }
}

function loop() {
  const now = performance.now();
  // Cap delta time to avoid huge jumps if tab is inactive
  const dt = Math.min(now - lastTime, 50);
  lastTime = now;

  update(dt);
  render();

  animationFrameId = requestAnimationFrame(loop);
}

function update(dt: number) {
  // Filter out dead particles
  particles = particles.filter((p) => p.life > 0);

  // Update positions
  for (const p of particles) {
    p.x += p.vx * (dt / 16); // Normalize to ~60fps
    p.y += p.vy * (dt / 16);
    p.life -= dt;
  }
}

function render() {
  if (!ctx) return;

  // Clear canvas (using logical dimensions because context is scaled)
  // But usually clearRect needs to cover everything.
  // Since we scaled, 0,0 to width,height covers the logical area which maps to physical.
  ctx.clearRect(0, 0, width, height);

  // 1. Draw External Entities
  for (const entity of externalEntities) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = entity.color;

    if (entity.glow) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = entity.color;
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    if (entity.type === 'circle') {
      ctx.arc(entity.x, entity.y, entity.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(
        entity.x - entity.size / 2,
        entity.y - entity.size / 2,
        entity.size,
        entity.size,
      );
    }
  }

  // Reset shadow
  ctx.shadowBlur = 0;

  // 2. Draw particles
  for (const p of particles) {
    const opacity = Math.max(0, p.life / p.maxLife);

    ctx.globalAlpha = opacity;
    ctx.fillStyle = p.color;

    ctx.beginPath();
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
}
