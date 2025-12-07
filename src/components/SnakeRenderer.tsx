import { useEffect, useRef, memo } from 'react';
import { Position } from '@/types/game';

interface SnakeRendererProps {
  snake: Position[];
  cellSize: number;
  isMobile: boolean;
  gridSize: number;
  isEating: boolean;
  speed?: number; // Interval in ms per tick
}

export const SnakeRenderer = memo(function SnakeRenderer({
  snake,
  cellSize,
  isMobile,
  gridSize,
  isEating,
  speed = 150,
}: SnakeRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Refs for animation loop
  const snakeRef = useRef(snake);
  const prevSnakeRef = useRef<Position[]>(snake);
  const lastUpdateRef = useRef<number>(0);

  const cellSizeRef = useRef(cellSize);
  const isMobileRef = useRef(isMobile);
  const isEatingRef = useRef(isEating);
  const prevLengthRef = useRef(snake.length);

  // Track growth animations: map of index -> progress (0 to 1)
  const growthAnimsRef = useRef<Map<number, number>>(new Map());
  // Track eating animation for head: progress (0 to 1)
  const headPulseAnimRef = useRef(0);

  // Sync props to refs
  useEffect(() => {
    const now = performance.now();

    // Detect growth
    if (snake.length > prevLengthRef.current) {
      // Start animation for the NEW tail segment
      const newIndex = snake.length - 1;
      growthAnimsRef.current.set(newIndex, 0);
    }

    if (isEating && !isEatingRef.current) {
      // Trigger head pulse
      headPulseAnimRef.current = 1;
    }

    // Update motion state only if snake positions actually changed (tick)
    // Simple check on head position or length
    const headChanged =
      snake.length > 0 &&
      snakeRef.current.length > 0 &&
      (snake[0].x !== snakeRef.current[0].x || snake[0].y !== snakeRef.current[0].y);

    if (headChanged || snake.length !== snakeRef.current.length) {
      prevSnakeRef.current = snakeRef.current;
      snakeRef.current = snake;
      lastUpdateRef.current = now;
    } else {
      // Just props update (e.g. resize), keep refs but update snakeRef for render
      // Do not reset prevSnakeRef or timer to avoid jitter
      snakeRef.current = snake;
    }

    prevLengthRef.current = snake.length;
    cellSizeRef.current = cellSize;
    isMobileRef.current = isMobile;
    isEatingRef.current = isEating;
  }, [snake, cellSize, isMobile, isEating]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const currentSnake = snakeRef.current;
      const prevSnake = prevSnakeRef.current;
      const currentCellSize = cellSizeRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // Time calculation for interpolation
      const now = performance.now();
      const elapsed = now - lastUpdateRef.current;
      // Clamp t to [0, 1]
      // Using speed from props which matches game tick rate
      // Add small buffer to speed to ensure smoothness (e.g. 1.0)
      const t = Math.min(Math.max(elapsed / speed, 0), 1);

      ctx.clearRect(0, 0, width, height);

      if (currentSnake.length === 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // 3D Style Configuration
      const gap = 0; // No gap for fuller look
      const segmentRadius = currentCellSize / 2;

      // Update growth animations (Slower speed: 0.05 per frame)
      growthAnimsRef.current.forEach((progress, index) => {
        const newProgress = Math.min(1, progress + 0.05);
        if (newProgress >= 1) {
          growthAnimsRef.current.delete(index);
        } else {
          growthAnimsRef.current.set(index, newProgress);
        }
      });

      // Update head pulse animation
      if (headPulseAnimRef.current > 0) {
        headPulseAnimRef.current = Math.max(0, headPulseAnimRef.current - 0.05);
      }

      const getInterpolatedPosition = (index: number, currPos: Position) => {
        // Handle new segment (growth) or index mismatch
        // If wrapping (game reset or teleport), snap to current
        if (index >= prevSnake.length && prevSnake.length > 0) {
          // New tail segment spawns from the old tail
          const oldTail = prevSnake[prevSnake.length - 1];
          // Interpolate from old tail to current pos (which is same as old tail visually usually?)
          // Actually, new tail takes position of what was previously empty?
          // Standard snake: new tail stays in place of old tail for 1 tick?
          // Simplified: spawn from old tail
          return lerpPosition(oldTail, currPos, t);
        }

        const prevPos = prevSnake[index] || currPos;

        // If distance is large (wrap/teleport), snap
        if (Math.abs(currPos.x - prevPos.x) > 1 || Math.abs(currPos.y - prevPos.y) > 1) {
          return { x: currPos.x * currentCellSize, y: currPos.y * currentCellSize };
        }

        return lerpPosition(prevPos, currPos, t);
      };

      const lerpPosition = (p1: Position, p2: Position, time: number) => {
        const x = p1.x + (p2.x - p1.x) * time;
        const y = p1.y + (p2.y - p1.y) * time;
        return { x: x * currentCellSize, y: y * currentCellSize };
      };

      const drawSegment = (
        index: number,
        pixelPos: { x: number; y: number },
        isHead: boolean,
        direction?: string,
      ) => {
        const px = pixelPos.x;
        const py = pixelPos.y;
        const cx = px + currentCellSize / 2;
        const cy = py + currentCellSize / 2;

        // Base scale > 1 to make snake look "thick" and connected
        let scale = 1.15;

        // Tapering tail effect
        if (index === currentSnake.length - 1 && currentSnake.length > 3) {
          scale = 0.85; // Tail is smaller but still substantial
        } else if (index === currentSnake.length - 2 && currentSnake.length > 3) {
          scale = 1.0;
        }

        // Apply Growth Animation (Tail)
        if (growthAnimsRef.current.has(index)) {
          const progress = growthAnimsRef.current.get(index)!;
          // Pop-in effect
          const easeOutBack = (t: number) => {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
          };
          scale *= 0.2 + 0.8 * easeOutBack(progress);
        }

        // Apply Head Pulse (Eating)
        if (isHead && headPulseAnimRef.current > 0) {
          const p = headPulseAnimRef.current;
          scale *= 1 + 0.15 * Math.sin(p * Math.PI);
        }

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);

        // Draw 3D Sphere (Radial Gradient)
        const lightOffsetX = -segmentRadius * 0.3;
        const lightOffsetY = -segmentRadius * 0.3;

        const gradient = ctx.createRadialGradient(
          cx + lightOffsetX,
          cy + lightOffsetY,
          segmentRadius * 0.1, // Highlight
          cx,
          cy,
          segmentRadius, // Base
        );

        if (isHead) {
          // Brighter head
          gradient.addColorStop(0, '#86efac'); // Highlight (light green)
          gradient.addColorStop(0.4, '#22c55e'); // Base
          gradient.addColorStop(1, '#15803d'); // Shadow
        } else {
          // Body
          gradient.addColorStop(0, '#4ade80');
          gradient.addColorStop(0.4, '#16a34a');
          gradient.addColorStop(1, '#14532d');
        }

        ctx.fillStyle = gradient;

        // Shadow for depth
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        ctx.beginPath();
        ctx.arc(cx, cy, segmentRadius, 0, Math.PI * 2);
        ctx.fill();

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Draw Eyes (Head only)
        if (isHead) {
          const eyeRadius = segmentRadius * 0.35; // Large eyes
          const eyeOffset = segmentRadius * 0.4;

          let leftEyeX, leftEyeY, rightEyeX, rightEyeY;

          // Determine eye position based on direction
          // Default to RIGHT if undefined
          const currentDir = direction || 'RIGHT';

          if (currentDir === 'RIGHT') {
            leftEyeX = cx + eyeOffset * 0.5;
            leftEyeY = cy - eyeOffset;
            rightEyeX = cx + eyeOffset * 0.5;
            rightEyeY = cy + eyeOffset;
          } else if (currentDir === 'LEFT') {
            leftEyeX = cx - eyeOffset * 0.5;
            leftEyeY = cy - eyeOffset;
            rightEyeX = cx - eyeOffset * 0.5;
            rightEyeY = cy + eyeOffset;
          } else if (currentDir === 'UP') {
            leftEyeX = cx - eyeOffset;
            leftEyeY = cy - eyeOffset * 0.5;
            rightEyeX = cx + eyeOffset;
            rightEyeY = cy - eyeOffset * 0.5;
          } else {
            // DOWN
            leftEyeX = cx - eyeOffset;
            leftEyeY = cy + eyeOffset * 0.5;
            rightEyeX = cx + eyeOffset;
            rightEyeY = cy + eyeOffset * 0.5;
          }

          // Draw Sclera (White)
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(leftEyeX, leftEyeY, eyeRadius, 0, Math.PI * 2);
          ctx.arc(rightEyeX, rightEyeY, eyeRadius, 0, Math.PI * 2);
          ctx.fill();

          // Draw Pupils (Black)
          const pupilRadius = eyeRadius * 0.5;
          // Offset pupils slightly in direction of movement
          const pupilOffsetX = currentDir === 'RIGHT' ? 2 : currentDir === 'LEFT' ? -2 : 0;
          const pupilOffsetY = currentDir === 'DOWN' ? 2 : currentDir === 'UP' ? -2 : 0;

          ctx.fillStyle = 'black';
          ctx.beginPath();
          ctx.arc(leftEyeX + pupilOffsetX, leftEyeY + pupilOffsetY, pupilRadius, 0, Math.PI * 2);
          ctx.arc(rightEyeX + pupilOffsetX, rightEyeY + pupilOffsetY, pupilRadius, 0, Math.PI * 2);
          ctx.fill();

          // Draw Shine (White dot in pupil)
          const shineRadius = pupilRadius * 0.3;
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(
            leftEyeX + pupilOffsetX - shineRadius,
            leftEyeY + pupilOffsetY - shineRadius,
            shineRadius,
            0,
            Math.PI * 2,
          );
          ctx.arc(
            rightEyeX + pupilOffsetX - shineRadius,
            rightEyeY + pupilOffsetY - shineRadius,
            shineRadius,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }

        ctx.restore();
      };

      // Draw body (reverse order so head is on top if overlapping)
      for (let i = currentSnake.length - 1; i > 0; i--) {
        const pos = getInterpolatedPosition(i, currentSnake[i]);
        drawSegment(i, pos, false);
      }

      // Head Direction Logic
      let dir = 'RIGHT';
      if (currentSnake.length > 1) {
        const head = currentSnake[0];
        const next = currentSnake[1];
        const dx = head.x - next.x;
        const dy = head.y - next.y;
        if (dx > 0) dir = 'RIGHT';
        else if (dx < 0) dir = 'LEFT';
        else if (dy > 0) dir = 'DOWN';
        else if (dy < 0) dir = 'UP';
      }

      // Draw head last
      if (currentSnake.length > 0) {
        const pos = getInterpolatedPosition(0, currentSnake[0]);
        drawSegment(0, pos, true, dir);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [speed]); // Re-bind if speed changes (though refs handle updates mostly)

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
        zIndex: 20,
      }}
    />
  );
});
