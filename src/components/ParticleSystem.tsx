import { useEffect, useRef, memo } from 'react';
import { GAME_CONFIG } from '@/constants/game';
import { PoisonShot } from '@/types/game';

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

interface ParticleSystemProps {
  poisonShots?: PoisonShot[];
  gridSize?: number;
}

export const ParticleSystem = memo(function ParticleSystem({ poisonShots, gridSize = GAME_CONFIG.gridSize }: ParticleSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    console.log('[ParticleSystem] Mounting...');
    // Remove check for GAME_CONFIG.enableParticles here to allow poison shots rendering
    // We still need the canvas ref though
    if (!canvasRef.current) {
      console.error('[ParticleSystem] No canvas ref!');
      return;
    }

    console.log('[ParticleSystem] Initializing Worker...');
    // Initialize Worker
    workerRef.current = new Worker(new URL('../workers/particle.worker.ts', import.meta.url), {
      type: 'module',
    });

    workerRef.current.onerror = (e) => {
        console.error('[ParticleSystem] Worker Error:', e);
    };

    const canvas = canvasRef.current;
    const container = canvas.parentElement;
    containerRef.current = container;

    // Support for OffscreenCanvas is required for this optimization
    if (!canvas.transferControlToOffscreen) {
      console.warn('[ParticleSystem] OffscreenCanvas not supported, particles disabled');
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
      
      // Force an update after a short delay to ensure layout is settled
      setTimeout(updateSize, 100);
    } catch (err) {
      // In React Strict Mode or during HMR, this effect might run twice on the same canvas
      // We ignore the error if the control has already been transferred
      console.debug('Canvas control already transferred:', err);
    }

    // Event Listener for spawning particles from anywhere in the game
    const handleSpawn = (e: CustomEvent) => {
      // ONLY spawn particles if enabled in config
      if (!GAME_CONFIG.enableParticles) return;
      
      if (!container) return;

      const { x, y, color, count, size, lifetime } = e.detail;

      // Convert Grid Coordinates to Pixel Coordinates
      const rect = container.getBoundingClientRect();
      const cellSize = rect.width / gridSize;

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
  }, [gridSize]);

  // Sync external entities (like poison shots) with the worker
  useEffect(() => {
    if (!poisonShots || !containerRef.current || !workerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const cellSize = rect.width / gridSize;

    // DEBUG LOG
    if (poisonShots.length > 0) {
        console.log(`[ParticleSystem] Syncing ${poisonShots.length} shots. CellSize: ${cellSize}, Container W: ${rect.width}`);
        console.log(`[ParticleSystem] First shot pos:`, poisonShots[0].position);
    }

    // Transform game entities to renderable format
    const entities = poisonShots.map(shot => ({
      x: shot.position.x * cellSize + cellSize / 2,
      y: shot.position.y * cellSize + cellSize / 2,
      color: '#10b981', // Poison Green
      size: cellSize * 0.6, // Slightly smaller than grid cell
      type: 'circle',
      glow: true
    }));

    workerRef.current.postMessage({
      type: 'UPDATE_ENTITIES',
      payload: { entities }
    });

  }, [poisonShots, gridSize]);

  // Removed the early return based on enableParticles
  // if (!GAME_CONFIG.enableParticles) return null;

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
