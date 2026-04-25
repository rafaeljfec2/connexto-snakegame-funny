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
  frameIntervalMs: 0,
  frameIntervalP1: 0,
  frameIntervalP5: 0,
  frameIntervalP50: 0,
  frameIntervalP95: 0,
  frameWorkTimeMs: 0,
  frameWorkTimeP50: 0,
  frameWorkTimeP95: 0,
  longTasksPerMinute: 0,
  longTasksLastMinute: 0,
  longTasksTotalMsLastMinute: 0,
  longTasksTotalMsPerMinute: 0,
  intervalSampleCount: 0,
  workTimeSampleCount: 0,
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
        <span className={`${styles.value} ${classifyFrame(metrics.frameIntervalMs)}`}>
          {fmt(metrics.frameIntervalMs, 2)} ms
        </span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>p50 frame</span>
        <span className={styles.value}>{fmt(metrics.frameIntervalP50, 2)} ms</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>p95 frame</span>
        <span className={`${styles.value} ${classifyFrame(metrics.frameIntervalP95)}`}>
          {fmt(metrics.frameIntervalP95, 2)} ms
        </span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>work avg</span>
        <span className={`${styles.value} ${classifyWork(metrics.frameWorkTimeMs)}`}>
          {fmt(metrics.frameWorkTimeMs, 2)} ms
        </span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>work p95</span>
        <span className={`${styles.value} ${classifyWork(metrics.frameWorkTimeP95)}`}>
          {fmt(metrics.frameWorkTimeP95, 2)} ms
        </span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>longT/min</span>
        <span className={`${styles.value} ${classifyLongTaskCount(metrics.longTasksLastMinute)}`}>
          {metrics.longTasksLastMinute}
        </span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>longT ms/min</span>
        <span
          className={`${styles.value} ${classifyLongTaskMs(metrics.longTasksTotalMsLastMinute)}`}
        >
          {fmt(metrics.longTasksTotalMsLastMinute, 0)}
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

function classifyFrame(frameIntervalMs: number): string {
  if (frameIntervalMs === 0) return '';
  if (frameIntervalMs > 33) return styles.bad ?? '';
  if (frameIntervalMs > 20) return styles.warn ?? '';
  return '';
}

function classifyWork(workTimeMs: number): string {
  if (workTimeMs === 0) return '';
  if (workTimeMs > 16) return styles.bad ?? '';
  if (workTimeMs > 8) return styles.warn ?? '';
  return '';
}

function classifyLongTaskCount(count: number): string {
  if (count === 0) return '';
  if (count > 100) return styles.bad ?? '';
  if (count > 30) return styles.warn ?? '';
  return '';
}

function classifyLongTaskMs(totalMs: number): string {
  if (totalMs === 0) return '';
  if (totalMs > 1500) return styles.bad ?? '';
  if (totalMs > 500) return styles.warn ?? '';
  return '';
}
