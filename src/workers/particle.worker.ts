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

let particles: Particle[] = [];
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let width = 0;
let height = 0;
let lastTime = 0;
let animationFrameId: number;

const selfWorker = self as unknown as Worker;

selfWorker.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'INIT':
      const canvas = payload.canvas as OffscreenCanvas;
      width = payload.width;
      height = payload.height;
      ctx = canvas.getContext('2d');
      lastTime = performance.now();
      loop();
      break;

    case 'RESIZE':
      width = payload.width;
      height = payload.height;
      if (ctx && ctx.canvas) {
        ctx.canvas.width = width;
        ctx.canvas.height = height;
      }
      break;

    case 'SPAWN':
      // Payload: { x, y, color, count, size, speed }
      spawnParticles(payload);
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

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw particles
  for (const p of particles) {
    const opacity = Math.max(0, p.life / p.maxLife);

    ctx.globalAlpha = opacity;
    ctx.fillStyle = p.color;

    ctx.beginPath();
    // Draw squares instead of circles for raw performance
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
}
