import { useEffect, useRef, memo } from 'react';
import { getCurrentPhase } from '@/utils/phases';
import styles from './WeatherCanvas.module.css';

interface WeatherCanvasProps {
  level: number;
  isMobile: boolean;
}

export const WeatherCanvas = memo(function WeatherCanvas({ level, isMobile }: WeatherCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  
  const phase = getCurrentPhase(level);
  const phaseId = phase?.id ?? 1;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create a new canvas element explicitly to avoid "neutered" canvas issues with React Strict Mode
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '5'; // Match CSS
    container.appendChild(canvas);

    // Initialize Worker
    workerRef.current = new Worker(new URL('../workers/weather.worker.ts', import.meta.url), {
      type: 'module',
    });

    if (!canvas.transferControlToOffscreen) {
      console.warn('OffscreenCanvas not supported for weather effects');
      return;
    }

    try {
      const offscreen = canvas.transferControlToOffscreen();
      const dpr = window.devicePixelRatio || 1;
      
      const rect = container.getBoundingClientRect();
      const width = rect.width || 300;
      const height = rect.height || 300;
      
      workerRef.current.postMessage(
        {
          type: 'INIT',
          payload: { 
            canvas: offscreen, 
            width, 
            height,
            phaseId,
            isMobile,
            dpr 
          },
        },
        [offscreen]
      );
    } catch (err) {
      console.error('Weather worker init error:', err);
    }

    const handleResize = () => {
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        workerRef.current?.postMessage({
            type: 'RESIZE',
            payload: { 
                width: rect.width, 
                height: rect.height,
                dpr
            },
        });
    };

    const resizeObserver = new ResizeObserver(() => {
        handleResize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      workerRef.current?.terminate();
      if (container.contains(canvas)) {
        container.removeChild(canvas);
      }
    };
  }, []); // Run once on mount (re-creates canvas/worker on remount)

  // Update phase
  useEffect(() => {
    workerRef.current?.postMessage({
      type: 'UPDATE_PHASE',
      payload: { phaseId },
    });
  }, [phaseId]);

  return (
    <div
      ref={containerRef}
      className={styles.weatherCanvasContainer} // Renamed class for clarity
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5
      }}
    />
  );
});
