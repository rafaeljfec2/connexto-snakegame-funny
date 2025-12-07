import { useEffect, useRef, memo } from 'react';
import { Position } from '@/types/game';

interface SnakeRendererProps {
  snake: Position[];
  cellSize: number;
  isMobile: boolean;
  gridSize: number;
  isEating: boolean;
}

export const SnakeRenderer = memo(function SnakeRenderer({
  snake,
  cellSize,
  isMobile,
  gridSize,
  isEating,
}: SnakeRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Refs for animation loop
  const snakeRef = useRef(snake);
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
    
    snakeRef.current = snake;
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
      const currentCellSize = cellSizeRef.current;
      const currentIsMobile = isMobileRef.current;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (currentSnake.length === 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // 3D Style Configuration
      const gap = 0.5; // Very small gap for bead-like effect
      const segmentRadius = (currentCellSize - gap * 2) / 2;
      
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

      const drawSegment = (index: number, x: number, y: number, isHead: boolean, direction?: string) => {
        const px = x * currentCellSize;
        const py = y * currentCellSize;
        const cx = px + currentCellSize / 2;
        const cy = py + currentCellSize / 2;

        let scale = 1;

        // Tapering tail effect
        if (index === currentSnake.length - 1 && currentSnake.length > 3) {
           scale = 0.7; // Tail is smaller
        } else if (index === currentSnake.length - 2 && currentSnake.length > 3) {
           scale = 0.85;
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
          scale *= 0.2 + (0.8 * easeOutBack(progress));
        }

        // Apply Head Pulse (Eating)
        if (isHead && headPulseAnimRef.current > 0) {
          const p = headPulseAnimRef.current;
          scale *= 1 + (0.15 * Math.sin(p * Math.PI)); 
        }

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);

        // Draw 3D Sphere (Radial Gradient)
        const lightOffsetX = -segmentRadius * 0.3;
        const lightOffsetY = -segmentRadius * 0.3;
        
        const gradient = ctx.createRadialGradient(
          cx + lightOffsetX, cy + lightOffsetY, segmentRadius * 0.1, // Highlight
          cx, cy, segmentRadius // Base
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
            leftEyeX = cx + eyeOffset * 0.5; leftEyeY = cy - eyeOffset;
            rightEyeX = cx + eyeOffset * 0.5; rightEyeY = cy + eyeOffset;
          } else if (currentDir === 'LEFT') {
            leftEyeX = cx - eyeOffset * 0.5; leftEyeY = cy - eyeOffset;
            rightEyeX = cx - eyeOffset * 0.5; rightEyeY = cy + eyeOffset;
          } else if (currentDir === 'UP') {
            leftEyeX = cx - eyeOffset; leftEyeY = cy - eyeOffset * 0.5;
            rightEyeX = cx + eyeOffset; rightEyeY = cy - eyeOffset * 0.5;
          } else { // DOWN
            leftEyeX = cx - eyeOffset; leftEyeY = cy + eyeOffset * 0.5;
            rightEyeX = cx + eyeOffset; rightEyeY = cy + eyeOffset * 0.5;
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
          const pupilOffsetX = (currentDir === 'RIGHT' ? 2 : currentDir === 'LEFT' ? -2 : 0);
          const pupilOffsetY = (currentDir === 'DOWN' ? 2 : currentDir === 'UP' ? -2 : 0);

          ctx.fillStyle = 'black';
          ctx.beginPath();
          ctx.arc(leftEyeX + pupilOffsetX, leftEyeY + pupilOffsetY, pupilRadius, 0, Math.PI * 2);
          ctx.arc(rightEyeX + pupilOffsetX, rightEyeY + pupilOffsetY, pupilRadius, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw Shine (White dot in pupil)
          const shineRadius = pupilRadius * 0.3;
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(leftEyeX + pupilOffsetX - shineRadius, leftEyeY + pupilOffsetY - shineRadius, shineRadius, 0, Math.PI * 2);
          ctx.arc(rightEyeX + pupilOffsetX - shineRadius, rightEyeY + pupilOffsetY - shineRadius, shineRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      };

      // Draw body (reverse order so head is on top if overlapping)
      for (let i = currentSnake.length - 1; i > 0; i--) {
        drawSegment(i, currentSnake[i].x, currentSnake[i].y, false);
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
        drawSegment(0, currentSnake[0].x, currentSnake[0].y, true, dir);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []); // Deps empty, using refs

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
