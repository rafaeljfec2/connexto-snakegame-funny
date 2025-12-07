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

interface ParticleSystemProps {
  gridSize?: number;
}

export const ParticleSystem = memo(function ParticleSystem({ gridSize = GAME_CONFIG.gridSize }: ParticleSystemProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (!GAME_CONFIG.enableParticles || !containerRef.current) return;

    const container = containerRef.current;

    // Dynamic canvas creation to avoid Strict Mode issues
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '200';
    canvas.style.opacity = '0.8';
    container.appendChild(canvas);

    // Initialize Worker
    workerRef.current = new Worker(new URL('../workers/particle.worker.ts', import.meta.url), {
      type: 'module',
    });

    if (!canvas.transferControlToOffscreen) {
      console.warn('OffscreenCanvas not supported, particles disabled');
      return;
    }

    const updateSize = () => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      workerRef.current?.postMessage({
        type: 'RESIZE',
        payload: { width: rect.width, height: rect.height, dpr },
      });
    };

    try {
      const offscreen = canvas.transferControlToOffscreen();
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      workerRef.current.postMessage(
        {
          type: 'INIT',
          payload: { canvas: offscreen, width: rect.width, height: rect.height, dpr },
        },
        [offscreen],
      );

      window.addEventListener('resize', updateSize);
      // No need for setTimeout updateSize here since we pass dimensions in INIT
    } catch (err) {
      console.error('Particle worker init error:', err);
    }

    const handleSpawn = (e: CustomEvent) => {
      if (!container) return;

      const { x, y, color, count, size, lifetime } = e.detail;
      const rect = container.getBoundingClientRect();
      
      // Safety check for rect dimensions
      if (rect.width === 0 || rect.height === 0) return;

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
          speed: cellSize * 0.2,
        },
      });
    };

    window.addEventListener('game-spawn-particles', handleSpawn);

    const resizeObserver = new ResizeObserver(() => updateSize());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('game-spawn-particles', handleSpawn);
      workerRef.current?.terminate();
      if (container.contains(canvas)) {
        container.removeChild(canvas);
      }
    };
  }, [gridSize]);

  if (!GAME_CONFIG.enableParticles) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 200,
      }}
    />
  );
});
