/// <reference lib="webworker" />

import { Position, PoisonShot, BossSnake } from '@/types/game';
import { GAME_CONFIG } from '@/constants/game';

// State
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let width = 0;
let height = 0;
let dpr = 1;

// Game State
let snake: Position[] = [];
let prevSnake: Position[] = [];
let bossSnake: BossSnake | null = null;
let prevBossSnake: Position[] = []; // Track boss body
let activeBoss: { color: string; icon?: string; name?: string } | null = null;
let shots: PoisonShot[] = [];
let isEating = false;
let speed = 150;
let lastUpdate = 0;
let isMobile = false;

// Animation State
const growthAnims = new Map<number, number>(); // index -> progress
let headPulseAnim = 0;
let lastTongueFlick = 0;
let nextTongueFlick = 0;
let tongueProgress = 0;

// Helper to interpolate
// Helper to darken hex color
const adjustColor = (color: string, amount: number) => {
    return color; // Simplification, implementing true hex adjust is overkill here, default to input
};

const lerp = (start: number, end: number, t: number) => {
  return start + (end - start) * t;
};

const getInterpolatedPos = (
  curr: Position,
  prev: Position | undefined,
  cellSize: number,
  t: number
) => {
  if (!prev) return { x: curr.x * cellSize, y: curr.y * cellSize };

  // Snap if wrapping
  if (Math.abs(curr.x - prev.x) > 1 || Math.abs(curr.y - prev.y) > 1) {
    return { x: curr.x * cellSize, y: curr.y * cellSize };
  }

  const x = lerp(prev.x, curr.x, t);
  const y = lerp(prev.y, curr.y, t);
  return { x: x * cellSize, y: y * cellSize };
};

const drawSnakeSegment = (
  x: number,
  y: number,
  cellSize: number,
  isHead: boolean,
  isBoss: boolean,
  scale: number = 1,
  angle: number = 0
) => {
  if (!ctx) return;

  const cx = x + cellSize / 2;
  const cy = y + cellSize / 2;
  const radius = cellSize / 2;

  ctx.save();
  ctx.translate(cx, cy);
  if (isHead) ctx.rotate(angle);
  ctx.scale(scale, scale);

  // Gradient (relative to 0,0)
  const lightOff = -radius * 0.3;
  const gradient = ctx.createRadialGradient(
    lightOff,
    lightOff,
    radius * 0.1,
    0,
    0,
    radius
  );

  if (isBoss) {
    gradient.addColorStop(0, activeBoss?.color || '#f87171');
    gradient.addColorStop(0.4, activeBoss?.color ? adjustColor(activeBoss.color, -20) : '#dc2626');
    gradient.addColorStop(1, activeBoss?.color ? adjustColor(activeBoss.color, -40) : '#991b1b');
  } else if (isHead) {
    gradient.addColorStop(0, '#86efac');
    gradient.addColorStop(0.4, '#22c55e');
    gradient.addColorStop(1, '#15803d');
  } else {
    gradient.addColorStop(0, '#4ade80');
    gradient.addColorStop(0.4, '#16a34a');
    gradient.addColorStop(1, '#14532d');
  }

  ctx.fillStyle = gradient;

  if (!isMobile) {
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
  }

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // Boss Name & Icon
  if (isBoss && isHead && activeBoss) {
      ctx.save();
      // Rotate back to keep text upright? Or let it rotate with head?
      // Usually names stay upright.
      ctx.rotate(-angle); 
      
      ctx.fillStyle = 'white';
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 4;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      const text = `${activeBoss.icon || ''} ${activeBoss.name || ''}`.trim();
      if (text) {
          ctx.fillText(text, 0, -radius - 8);
      }
      ctx.restore();
  }

  // Eyes for Head
  if (isHead && !isBoss) {
    // Tongue Animation
    if (tongueProgress > 0.1) {
        ctx.save();
        const tLength = radius * 1.2 * tongueProgress;
        const tWidth = radius * 0.15;
        
        ctx.beginPath();
        ctx.strokeStyle = '#ef4444'; // Red
        ctx.lineWidth = tWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Main tongue stem
        ctx.moveTo(radius * 0.5, 0); // Start slightly inside head
        ctx.lineTo(radius + tLength, 0);
        
        // Fork
        const forkLen = radius * 0.4 * tongueProgress;
        const forkSpread = radius * 0.3 * tongueProgress;
        
        ctx.moveTo(radius + tLength, 0);
        ctx.lineTo(radius + tLength + forkLen, -forkSpread);
        
        ctx.moveTo(radius + tLength, 0);
        ctx.lineTo(radius + tLength + forkLen, forkSpread);
        
        ctx.stroke();
        ctx.restore();
    }

    ctx.shadowColor = 'transparent';
    const eyeRadius = radius * 0.35;
    const eyeOffset = radius * 0.4;
    
    // Draw relative to 0,0 facing Right (0 radians)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(eyeOffset, -eyeRadius * 0.8, eyeRadius, 0, Math.PI * 2); // Top eye (Left relative to forward?) No, y is down.
    // At 0 deg (Right), y- is Up. So -eyeRadius is Left Eye? 
    // Wait, screen coords: Y is Down.
    // 0 deg is X+.
    // Top of screen is Y-.
    // So Y- is "Left" of the snake if it's facing Right? Yes.
    
    ctx.arc(eyeOffset, eyeRadius * 0.8, eyeRadius, 0, Math.PI * 2); // Bottom eye
    ctx.fill();
    
    ctx.fillStyle = 'black';
    const pupilRadius = eyeRadius * 0.5;
    ctx.beginPath();
    // Look slightly forward
    ctx.arc(eyeOffset + 2, -eyeRadius * 0.8, pupilRadius, 0, Math.PI * 2);
    ctx.arc(eyeOffset + 2, eyeRadius * 0.8, pupilRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
};

const drawShot = (shot: PoisonShot, cellSize: number) => {
  if (!ctx) return;
  
  const x = shot.position.x * cellSize;
  const y = shot.position.y * cellSize;
  const size = cellSize * 0.6;
  const cx = x + cellSize / 2;
  const cy = y + cellSize / 2;

  ctx.fillStyle = '#10b981';
  
  if (!isMobile) {
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 10;
  }
  
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
  ctx.fill();
  
  if (!isMobile) {
      ctx.shadowBlur = 0;
  }
};

const render = () => {
  if (!ctx) return;

  // Time & Interpolation
  const now = performance.now();
  const elapsed = now - lastUpdate;
  const t = Math.min(Math.max(elapsed / speed, 0), 1);

  // Tongue Logic
  if (now > nextTongueFlick) {
      lastTongueFlick = now;
      nextTongueFlick = now + 500 + Math.random() * 1500;
  }
  const flickDur = 200;
  if (now - lastTongueFlick < flickDur) {
      tongueProgress = Math.sin(((now - lastTongueFlick) / flickDur) * Math.PI);
  } else {
      tongueProgress = 0;
  }

  // Clear
  ctx.clearRect(0, 0, width, height);
  
  // Calculate cell size
  // Grid size is fixed (20x20 usually), canvas size varies
  // We assume canvas fills the board area
  const cellSize = width / GAME_CONFIG.gridSize;

  // Draw Snake
  if (snake && snake.length > 0) {
    // Body
    for (let i = snake.length - 1; i > 0; i--) {
      const prev = prevSnake[i] || prevSnake[prevSnake.length - 1] || snake[i];
      const pos = getInterpolatedPos(snake[i], prev, cellSize, t);
      
      let scale = 1.15;
      // Tapering
      if (i >= snake.length - 2 && snake.length > 3) scale = 0.85;
      
      drawSnakeSegment(pos.x, pos.y, cellSize, false, false, scale);
    }
    // Head
    const headPrev = prevSnake[0] || snake[0];
    const headPos = getInterpolatedPos(snake[0], headPrev, cellSize, t);
    
    // Calculate Angle
    let angle = 0;
    if (snake.length > 1) {
        const next = snake[1];
        let dx = snake[0].x - next.x;
        let dy = snake[0].y - next.y;
        
        // Wrap handling
        if (dx > 1) dx = -1;
        else if (dx < -1) dx = 1;
        if (dy > 1) dy = -1;
        else if (dy < -1) dy = 1;
        
        angle = Math.atan2(dy, dx);
    }

    let headScale = 1.15;
    if (isEating) headScale = 1.3; // Simple pulse
    drawSnakeSegment(headPos.x, headPos.y, cellSize, true, false, headScale, angle);
  }

  // Draw Boss
  if (bossSnake) {
    bossSnake.positions.forEach((seg, i) => {
       const prev = prevBossSnake[i] || seg;
       const pos = getInterpolatedPos(seg, prev, cellSize, t);
       
       let bossAngle = 0;
       if (i === 0 && bossSnake!.positions.length > 1) {
           const next = bossSnake!.positions[1];
           let dx = seg.x - next.x;
           let dy = seg.y - next.y;
           // Wrap handling
           if (dx > 1) dx = -1; else if (dx < -1) dx = 1;
           if (dy > 1) dy = -1; else if (dy < -1) dy = 1;
           bossAngle = Math.atan2(dy, dx);
       }
       
       drawSnakeSegment(pos.x, pos.y, cellSize, i === 0, true, 1.2, bossAngle);
    });
  }

  // Draw Shots
  // Shots move linearly. Interpolation for shots?
  // Shots update every tick.
  shots.forEach(shot => {
     // Shot interpolation is harder without prev state tracking for shots
     // For now, draw at current pos (might jitter if low tick rate)
     // Or simplistic interpolation if we assume speed
     drawShot(shot, cellSize);
  });

  requestAnimationFrame(render);
};

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'INIT':
      const canvas = payload.canvas as OffscreenCanvas;
      width = payload.width || 100;
      height = payload.height || 100;
      dpr = payload.dpr || 1;
      isMobile = payload.isMobile;
      
      try {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.scale(dpr, dpr);
        }
      } catch (e) {
          console.error('Error setting up canvas', e);
      }
      
      // Start loop
      render();
      break;

    case 'RESIZE':
      width = payload.width;
      height = payload.height;
      dpr = payload.dpr || 1;
      if (ctx && ctx.canvas) {
        ctx.canvas.width = width * dpr;
        ctx.canvas.height = height * dpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0); 
        ctx.scale(dpr, dpr);
      }
      break;

    case 'UPDATE':
      // Check if actually changed
      if (payload.snake) {
         prevSnake = snake && snake.length > 0 ? snake : payload.snake;
         snake = payload.snake || [];
         
         if (payload.bossSnake) {
            prevBossSnake = bossSnake ? bossSnake.positions : payload.bossSnake.positions;
            bossSnake = payload.bossSnake;
         } else {
            bossSnake = null;
            prevBossSnake = [];
         }
         
         if (payload.activeBoss) {
             activeBoss = payload.activeBoss;
         }

         shots = payload.shots || [];
         isEating = payload.isEating;
         speed = payload.speed || 150;
         lastUpdate = performance.now();
      }
      break;
  }
};

