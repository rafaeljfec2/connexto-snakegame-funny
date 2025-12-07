import { useEffect, useRef, memo } from 'react';
import { Position } from '@/types/game';

interface SnakeRendererProps {
  snake: Position[];
  cellSize: number;
  isMobile: boolean;
  gridSize: number;
}

export const SnakeRenderer = memo(function SnakeRenderer({
  snake,
  cellSize,
  isMobile,
  gridSize,
}: SnakeRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || snake.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas based on logical size
    // The canvas size is set by width/height attributes which match the pixel size
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Drawing constants
    const gap = 1; // Gap between segments
    const segmentSize = Math.max(0, cellSize - gap * 2);

    // Colors
    const bodyGradientStart = '#4ade80';
    const bodyGradientEnd = '#22c55e';
    const headGradientStart = '#22c55e';
    const headGradientEnd = '#16a34a';

    // Helper to draw a rounded rect manually if needed, or simple rect for perf
    const drawSegment = (x: number, y: number, isHead: boolean) => {
      const px = x * cellSize;
      const py = y * cellSize;

      // Create gradient
      const gradient = ctx.createLinearGradient(px, py, px + cellSize, py + cellSize);
      if (isHead) {
        gradient.addColorStop(0, headGradientStart);
        gradient.addColorStop(1, headGradientEnd);
      } else {
        gradient.addColorStop(0, bodyGradientStart);
        gradient.addColorStop(1, bodyGradientEnd);
      }

      ctx.fillStyle = gradient;

      // Draw
      // Using fillRect is faster. Rounding via canvas API can be added if needed.
      if (isHead && !isMobile) {
        // Add glow for head on desktop
        ctx.shadowColor = 'rgba(34, 197, 94, 0.6)';
        ctx.shadowBlur = 10;
      } else {
        ctx.shadowBlur = 0;
      }

      // Simple rect with gap
      ctx.fillRect(px + gap, py + gap, segmentSize, segmentSize);

      // Reset shadow
      ctx.shadowBlur = 0;

      // Optional: Border for head
      if (isHead) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + gap, py + gap, segmentSize, segmentSize);
      }
    };

    // Draw body first
    for (let i = snake.length - 1; i > 0; i--) {
      drawSegment(snake[i].x, snake[i].y, false);
    }

    // Draw head last (on top)
    if (snake.length > 0) {
      drawSegment(snake[0].x, snake[0].y, true);
    }
  }, [snake, cellSize, isMobile, gridSize]);

  return (
    <canvas
      ref={canvasRef}
      width={cellSize * gridSize}
      height={cellSize * gridSize}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 20, // Snake z-index
      }}
    />
  );
});
