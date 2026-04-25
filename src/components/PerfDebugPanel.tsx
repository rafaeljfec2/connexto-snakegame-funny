import { useEffect, useRef, useState, memo } from 'react';
import { perfBus } from '@/utils/perfBus';
import type { PerfMetricsView } from '@/types/perf';
import styles from './PerfDebugPanel.module.css';

interface PerfDebugPanelProps {
  readonly visible: boolean;
  readonly refreshIntervalMs?: number;
}

const DEFAULT_REFRESH_MS = 250;
const EMPTY_METRICS: PerfMetricsView = {
  fps: 0,
  frameTime: 0,
  p1: 0,
  p5: 0,
  p50: 0,
  p95: 0,
  longTasksPerMinute: 0,
  longTasksLastMinute: 0,
  sampleCount: 0,
};

export const PerfDebugPanel = memo(function PerfDebugPanel({
  visible,
  refreshIntervalMs = DEFAULT_REFRESH_MS,
}: PerfDebugPanelProps) {
  const [metrics, setMetrics] = useState<PerfMetricsView>(EMPTY_METRICS);
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    if (!visible) return;

    let rafId = 0;
    const tick = (): void => {
      const now = performance.now();
      if (now - lastTickRef.current >= refreshIntervalMs) {
        lastTickRef.current = now;
        setMetrics(perfBus.getMetrics());
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [visible, refreshIntervalMs]);

  if (!visible) return null;

  return (
    <aside
      className={styles.panel}
      aria-label='Performance debug panel'
      data-testid='perf-debug-panel'
    >
      <h2 className={styles.title}>perf F4</h2>

      <div className={styles.row}>
        <span className={styles.label}>fps</span>
        <span className={`${styles.value} ${classifyFps(metrics.fps)}`}>{fmt(metrics.fps, 1)}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>frame</span>
        <span className={`${styles.value} ${classifyFrame(metrics.frameTime)}`}>
          {fmt(metrics.frameTime, 2)} ms
        </span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>p50</span>
        <span className={styles.value}>{fmt(metrics.p50, 2)} ms</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>p5</span>
        <span className={`${styles.value} ${classifyFrame(metrics.p5)}`}>
          {fmt(metrics.p5, 2)} ms
        </span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>p1</span>
        <span className={`${styles.value} ${classifyFrame(metrics.p1)}`}>
          {fmt(metrics.p1, 2)} ms
        </span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>longT/min</span>
        <span className={`${styles.value} ${metrics.longTasksLastMinute > 0 ? styles.warn : ''}`}>
          {metrics.longTasksLastMinute}
        </span>
      </div>
      {metrics.heapMB !== undefined && (
        <div className={styles.row}>
          <span className={styles.label}>heap</span>
          <span className={styles.value}>{fmt(metrics.heapMB, 1)} MB</span>
        </div>
      )}

      <p className={styles.hint}>Shift+F4 to export</p>
    </aside>
  );
});

function fmt(value: number, digits: number): string {
  if (!Number.isFinite(value)) return '—';
  return value.toFixed(digits);
}

function classifyFps(fps: number): string {
  if (fps === 0) return '';
  if (fps < 30) return styles.bad ?? '';
  if (fps < 50) return styles.warn ?? '';
  return '';
}

function classifyFrame(frameTimeMs: number): string {
  if (frameTimeMs === 0) return '';
  if (frameTimeMs > 33) return styles.bad ?? '';
  if (frameTimeMs > 20) return styles.warn ?? '';
  return '';
}
