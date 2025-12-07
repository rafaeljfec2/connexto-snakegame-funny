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

      const gap = 1;
      const segmentSize = Math.max(0, currentCellSize - gap * 2);
      
      // Colors
      const bodyGradientStart = '#4ade80';
      const bodyGradientEnd = '#22c55e';
      const headGradientStart = '#22c55e';
      const headGradientEnd = '#16a34a';

      // Update growth animations (Slower speed: 0.03 per frame)
      growthAnimsRef.current.forEach((progress, index) => {
        const newProgress = Math.min(1, progress + 0.03);
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

        let scale = 1;
        let brightness = 1; // 1 is normal, >1 is brighter

        // Apply Growth Animation (Tail)
        if (growthAnimsRef.current.has(index)) {
          const progress = growthAnimsRef.current.get(index)!;
          // Elastic pop-in effect: overshoot slightly then settle
          // t=0 -> scale=0.2
          // t=1 -> scale=1
          // const elastic = (t: number) => {
          //   const p = 0.3;
          //   return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
          // };
          // Use easeOutBack for a nice pop without too much wobble
          const easeOutBack = (t: number) => {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
          };
          
          scale = 0.2 + (0.8 * easeOutBack(progress));
          
          // Flash effect at start of growth
          if (progress < 0.3) {
             brightness = 1.5;
          }
        }

        // Apply Head Pulse (Eating)
        if (isHead && headPulseAnimRef.current > 0) {
          const p = headPulseAnimRef.current;
          // Pulse up to 1.2x scale
          scale = 1 + (0.2 * Math.sin(p * Math.PI)); 
          brightness = 1 + (0.3 * p);
        }

        // Setup Context for Transform/Filters
        ctx.save();
        
        // Scale from center
        const cx = px + currentCellSize / 2;
        const cy = py + currentCellSize / 2;
        
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);

        // Brightness/Color
        let gradStart = isHead ? headGradientStart : bodyGradientStart;
        let gradEnd = isHead ? headGradientEnd : bodyGradientEnd;
        
        if (brightness > 1) {
           ctx.filter = `brightness(${brightness * 100}%)`;
        }

        const gradient = ctx.createLinearGradient(px, py, px + currentCellSize, py + currentCellSize);
        gradient.addColorStop(0, gradStart);
        gradient.addColorStop(1, gradEnd);
        ctx.fillStyle = gradient;

        // Shadows
        if (isHead && !currentIsMobile) {
          ctx.shadowColor = 'rgba(34, 197, 94, 0.6)';
          ctx.shadowBlur = 10;
        } else if (brightness > 1.2) {
          // Glow for growing segment
          ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
          ctx.shadowBlur = 10;
        } else {
          ctx.shadowBlur = 0;
        }

        // Draw Rect
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(px + gap, py + gap, segmentSize, segmentSize, isHead ? 6 : 3);
        } else {
          ctx.fillRect(px + gap, py + gap, segmentSize, segmentSize);
        }
        ctx.fill();
        
        // Reset shadow for details
        ctx.shadowBlur = 0;

        // Draw Eyes (Head only)
        if (isHead) {
          const eyeSize = segmentSize * 0.2;
          const eyeOffset = segmentSize * 0.25;
          
          ctx.fillStyle = 'white';
          
          let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
          
          if (!direction || direction === 'RIGHT') {
            leftEyeX = cx + eyeOffset; leftEyeY = cy - eyeOffset;
            rightEyeX = cx + eyeOffset; rightEyeY = cy + eyeOffset;
          } else if (direction === 'LEFT') {
            leftEyeX = cx - eyeOffset; leftEyeY = cy - eyeOffset;
            rightEyeX = cx - eyeOffset; rightEyeY = cy + eyeOffset;
          } else if (direction === 'UP') {
            leftEyeX = cx - eyeOffset; leftEyeY = cy - eyeOffset;
            rightEyeX = cx + eyeOffset; rightEyeY = cy - eyeOffset;
          } else if (direction === 'DOWN') {
            leftEyeX = cx - eyeOffset; leftEyeY = cy + eyeOffset;
            rightEyeX = cx + eyeOffset; rightEyeY = cy + eyeOffset;
          }

          if (leftEyeX && leftEyeY && rightEyeX && rightEyeY) {
              ctx.beginPath();
              ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
              ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = 'black';
              const pupilSize = eyeSize * 0.5;
              ctx.beginPath();
              ctx.arc(leftEyeX + (direction === 'RIGHT' ? 1 : direction === 'LEFT' ? -1 : 0), leftEyeY + (direction === 'DOWN' ? 1 : direction === 'UP' ? -1 : 0), pupilSize, 0, Math.PI * 2);
              ctx.arc(rightEyeX + (direction === 'RIGHT' ? 1 : direction === 'LEFT' ? -1 : 0), rightEyeY + (direction === 'DOWN' ? 1 : direction === 'UP' ? -1 : 0), pupilSize, 0, Math.PI * 2);
              ctx.fill();
          }
        }

        ctx.restore();
      };

      // Draw body
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
        if (dx > 1) dir = 'LEFT';
        else if (dx < -1) dir = 'RIGHT';
        else if (dx === 1) dir = 'RIGHT';
        else if (dx === -1) dir = 'LEFT';
        else if (dy > 1) dir = 'UP';
        else if (dy < -1) dir = 'DOWN';
        else if (dy === 1) dir = 'DOWN';
        else if (dy === -1) dir = 'UP';
      }

      // Draw head
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
