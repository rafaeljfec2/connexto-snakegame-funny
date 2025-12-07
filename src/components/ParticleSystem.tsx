import { useEffect, useRef, memo } from 'react';
import { GAME_CONFIG } from '@/constants/game';

// Define the event type for TypeScript
declare global {
  interface WindowEventMap {
    'game-spawn-particles': CustomEvent<{
      x: number;
      y: number;
      color: string;
      count?: number;
      size?: number;
      lifetime?: number;
    }>;
  }
}

export const ParticleSystem = memo(function ParticleSystem() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (!GAME_CONFIG.enableParticles || !canvasRef.current) return;

    // Initialize Worker
    workerRef.current = new Worker(new URL('../workers/particle.worker.ts', import.meta.url), {
      type: 'module',
    });

    const canvas = canvasRef.current;
    const container = canvas.parentElement;

    // Support for OffscreenCanvas is required for this optimization
    if (!canvas.transferControlToOffscreen) {
      console.warn('OffscreenCanvas not supported, particles disabled');
      return;
    }

    // Function to update size (defined here to be available for resize listener and cleanup)
    const updateSize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;

      // We don't set canvas.width/height here because control is transferred
      workerRef.current?.postMessage({
        type: 'RESIZE',
        payload: { width, height },
      });
    };

    try {
      const offscreen = canvas.transferControlToOffscreen();

      // Initial Setup - Send Init message
      const width = container?.clientWidth || window.innerWidth;
      const height = container?.clientHeight || window.innerHeight;

      workerRef.current.postMessage(
        {
          type: 'INIT',
          payload: { canvas: offscreen, width, height },
        },
        [offscreen],
      );

      // Only add resize listener if initialization was successful
      window.addEventListener('resize', updateSize);
    } catch (err) {
      // In React Strict Mode or during HMR, this effect might run twice on the same canvas
      // We ignore the error if the control has already been transferred
      console.debug('Canvas control already transferred:', err);
    }

    // Event Listener for spawning particles from anywhere in the game
    const handleSpawn = (e: CustomEvent) => {
      if (!container) return;

      const { x, y, color, count, size, lifetime } = e.detail;

      // Convert Grid Coordinates to Pixel Coordinates
      const rect = container.getBoundingClientRect();
      const cellSize = rect.width / GAME_CONFIG.gridSize;

      const pixelX = x * cellSize + cellSize / 2;
      const pixelY = y * cellSize + cellSize / 2;

      workerRef.current?.postMessage({
        type: 'SPAWN',
        payload: {
          x: pixelX,
          y: pixelY,
          color,
          count,
          size,
          lifetime,
          speed: cellSize * 0.2, // Scale speed relative to cell size
        },
      });
    };

    window.addEventListener('game-spawn-particles', handleSpawn);

    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('game-spawn-particles', handleSpawn);
      workerRef.current?.terminate();
    };
  }, []);

  if (!GAME_CONFIG.enableParticles) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 200,
        opacity: 0.8, // Global opacity for effect
      }}
    />
  );
});
