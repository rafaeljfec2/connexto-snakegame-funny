import {
  Position,
  PoisonShot,
  Food as FoodType,
  FoodType as FoodTypeEnum,
  Obstacle,
  Portal,
} from '@/types/game';
import { type SkinPalette } from '@/types/skin';
import { POWER_UP_CONFIG } from '@/constants/powerUps';
import { adjustColor } from './renderUtils';
import { getPulseAnimation } from './renderAnimations';

const FOOD_GLYPHS: Partial<Record<FoodTypeEnum, string>> = {
  [FoodTypeEnum.EXTRA_LIFE]: '♥',
  [FoodTypeEnum.POISON]: '☠',
  [FoodTypeEnum.SPEED_BOOST]: '⚡',
  [FoodTypeEnum.BONUS_POINTS]: '$',
  [FoodTypeEnum.PHASE_THROUGH]: '◌',
  [FoodTypeEnum.JOKER]: '?',
  [FoodTypeEnum.PORTAL]: '◎',
  [FoodTypeEnum.REVERSE_CONTROLS]: '↺',
  [FoodTypeEnum.SLOW_DOWN]: '🐌',
  [FoodTypeEnum.EXTRA_GROWTH]: '+',
};

export interface RenderContext {
  ctx: OffscreenCanvasRenderingContext2D;
  width: number;
  height: number;
  isMobile: boolean;
}

export interface ActiveBoss {
  color: string;
  icon?: string;
  name?: string;
}

export interface SnakeSegmentParams {
  x: number;
  y: number;
  cellSize: number;
  isHead: boolean;
  isBoss: boolean;
  activeBoss: ActiveBoss | null;
  tongueProgress: number;
  skin: SkinPalette;
  scale?: number;
  angle?: number;
}

function createSnakeGradient(
  ctx: OffscreenCanvasRenderingContext2D,
  radius: number,
  isBoss: boolean,
  isHead: boolean,
  activeBoss: ActiveBoss | null,
  skin: SkinPalette,
): CanvasGradient {
  const lightOff = -radius * 0.3;
  const gradient = ctx.createRadialGradient(lightOff, lightOff, radius * 0.1, 0, 0, radius);

  if (isBoss) {
    gradient.addColorStop(0, activeBoss?.color || '#f87171');
    gradient.addColorStop(0.4, activeBoss?.color ? adjustColor(activeBoss.color, -20) : '#dc2626');
    gradient.addColorStop(1, activeBoss?.color ? adjustColor(activeBoss.color, -40) : '#991b1b');
    return gradient;
  }

  const palette = isHead ? skin.head : skin.body;
  gradient.addColorStop(0, palette.highlight);
  gradient.addColorStop(0.4, palette.mid);
  gradient.addColorStop(1, palette.shadow);
  return gradient;
}

/**
 * Draw boss name and icon above segment
 */
function drawBossLabel(
  ctx: OffscreenCanvasRenderingContext2D,
  radius: number,
  angle: number,
  activeBoss: ActiveBoss,
): void {
  ctx.save();
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

/**
 * Draw tongue animation
 */
function drawTongue(
  ctx: OffscreenCanvasRenderingContext2D,
  radius: number,
  tongueProgress: number,
): void {
  if (tongueProgress <= 0.1) return;

  ctx.save();
  const tLength = radius * 1.2 * tongueProgress;
  const tWidth = radius * 0.15;

  ctx.beginPath();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = tWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.moveTo(radius * 0.5, 0);
  ctx.lineTo(radius + tLength, 0);

  const forkLen = radius * 0.4 * tongueProgress;
  const forkSpread = radius * 0.3 * tongueProgress;

  ctx.moveTo(radius + tLength, 0);
  ctx.lineTo(radius + tLength + forkLen, -forkSpread);

  ctx.moveTo(radius + tLength, 0);
  ctx.lineTo(radius + tLength + forkLen, forkSpread);

  ctx.stroke();
  ctx.restore();
}

/**
 * Draw eyes for snake head
 */
function drawEyes(ctx: OffscreenCanvasRenderingContext2D, radius: number): void {
  ctx.shadowColor = 'transparent';
  const eyeRadius = radius * 0.35;
  const eyeOffset = radius * 0.4;

  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(eyeOffset, -eyeRadius * 0.8, eyeRadius, 0, Math.PI * 2);
  ctx.arc(eyeOffset, eyeRadius * 0.8, eyeRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'black';
  const pupilRadius = eyeRadius * 0.5;
  ctx.beginPath();
  ctx.arc(eyeOffset + 2, -eyeRadius * 0.8, pupilRadius, 0, Math.PI * 2);
  ctx.arc(eyeOffset + 2, eyeRadius * 0.8, pupilRadius, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw a snake segment (head or body)
 */
export function drawSnakeSegment(context: RenderContext, params: SnakeSegmentParams): void {
  const {
    x,
    y,
    cellSize,
    isHead,
    isBoss,
    activeBoss,
    tongueProgress,
    skin,
    scale = 1,
    angle = 0,
  } = params;
  const { ctx, isMobile } = context;

  const cx = x + cellSize / 2;
  const cy = y + cellSize / 2;
  const radius = cellSize / 2;

  ctx.save();
  ctx.translate(cx, cy);
  if (isHead) ctx.rotate(angle);
  ctx.scale(scale, scale);

  const gradient = createSnakeGradient(ctx, radius, isBoss, isHead, activeBoss, skin);
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

  if (isBoss) {
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = skin.bossContrast.mid;
    ctx.lineWidth = Math.max(1.5, radius * 0.12);
    ctx.beginPath();
    ctx.arc(0, 0, radius - ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (isBoss && isHead && activeBoss) {
    drawBossLabel(ctx, radius, angle, activeBoss);
  }

  if (isHead && !isBoss) {
    drawTongue(ctx, radius, tongueProgress);
    drawEyes(ctx, radius);
  }

  ctx.restore();
}

/**
 * Draw food with pulse animation
 */
export function drawFood(
  context: RenderContext,
  food: FoodType,
  cellSize: number,
  now: number,
): void {
  const { ctx, isMobile } = context;
  const { x, y } = food.position;
  const cx = x * cellSize + cellSize / 2;
  const cy = y * cellSize + cellSize / 2;
  const r = cellSize * 0.4;

  ctx.save();
  ctx.translate(cx, cy);

  const pulse = getPulseAnimation(now, 200);
  ctx.scale(pulse, pulse);

  const palette =
    POWER_UP_CONFIG.colors[food.type as FoodTypeEnum] ??
    POWER_UP_CONFIG.colors[FoodTypeEnum.NORMAL];
  const color1 = palette.primary;
  const color2 = palette.secondary;

  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  grad.addColorStop(0, color1);
  grad.addColorStop(1, color2);

  ctx.fillStyle = grad;

  if (!isMobile) {
    ctx.shadowColor = color1;
    ctx.shadowBlur = 10;
  }

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;

  const glyph = FOOD_GLYPHS[food.type as FoodTypeEnum];
  if (glyph) {
    ctx.fillStyle = '#0a0d1a';
    ctx.font = `bold ${Math.max(8, cellSize * 0.45)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(glyph, 0, 1);
  }

  ctx.restore();
}

/**
 * Draw obstacle (static or moving)
 */
export function drawObstacle(context: RenderContext, obs: Obstacle, cellSize: number): void {
  const { ctx } = context;
  const { x, y } = obs.position;
  const px = x * cellSize;
  const py = y * cellSize;
  const s = cellSize;

  ctx.save();
  ctx.translate(px, py);

  const isMoving = obs.type === 'moving';

  const grad = ctx.createLinearGradient(0, 0, s, s);
  if (isMoving) {
    grad.addColorStop(0, '#fecaca');
    grad.addColorStop(1, '#ef4444');
    ctx.strokeStyle = '#b91c1c';
  } else {
    // REF-10: static hazards read as danger (red-slate), distinct from cyan target snake
    grad.addColorStop(0, '#fca5a5');
    grad.addColorStop(1, '#991b1b');
    ctx.strokeStyle = '#7f1d1d';
  }

  ctx.fillStyle = grad;
  ctx.lineWidth = 2;

  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(2, 2, s - 4, s - 4, 4);
  } else {
    ctx.rect(2, 2, s - 4, s - 4);
  }
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = isMoving ? 'rgba(127, 29, 29, 0.5)' : 'rgba(71, 85, 105, 0.5)';
  ctx.lineWidth = 2;

  const pad = s * 0.25;
  ctx.moveTo(pad, pad);
  ctx.lineTo(s - pad, s - pad);
  ctx.moveTo(s - pad, pad);
  ctx.lineTo(pad, s - pad);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw portal with pulse animation
 */
export function drawPortal(
  context: RenderContext,
  portal: Portal,
  cellSize: number,
  now: number,
): void {
  const { ctx, isMobile } = context;
  const { x, y } = portal.position;
  const cx = x * cellSize + cellSize / 2;
  const cy = y * cellSize + cellSize / 2;
  const r = cellSize * 0.45;

  ctx.save();
  ctx.translate(cx, cy);

  const pulse = getPulseAnimation(now, 500);
  ctx.scale(pulse, pulse);

  const grad = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
  grad.addColorStop(0, '#d8b4fe');
  grad.addColorStop(1, '#6b21a8');

  ctx.fillStyle = grad;
  if (!isMobile) {
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 15;
  }

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1;
  ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw poison shot
 */
export function drawShot(context: RenderContext, shot: PoisonShot, cellSize: number): void {
  const { ctx, isMobile } = context;

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
}

/**
 * Draw guardian flag
 */
export function drawGuardianFlag(
  context: RenderContext,
  flag: { position: Position; type: string },
  cellSize: number,
): void {
  const { ctx } = context;

  const cx = flag.position.x * cellSize + cellSize / 2;
  const cy = flag.position.y * cellSize + cellSize / 2;
  const size = cellSize * 0.8;

  ctx.save();
  ctx.translate(cx, cy);

  // Draw Flag Pole
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-size / 4, size / 2);
  ctx.lineTo(-size / 4, -size / 2);
  ctx.stroke();

  // Draw Flag Fabric
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.moveTo(-size / 4, -size / 2);
  ctx.lineTo(size / 2, -size / 4);
  ctx.lineTo(-size / 4, 0);
  ctx.fill();

  // Draw Heart Icon
  ctx.font = `${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('❤️', 0, -size / 4);

  ctx.restore();
}
