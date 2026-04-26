import { PERF_SNAPSHOT_VERSION, type PerfSnapshot } from '@/types/perf';
import { perfBus } from '@/utils/perfBus';
import type { PerfWebVitalsEvent } from '@/types/perf';

export interface SnapshotContext {
  phaseId: number;
  bossId?: string;
}

export function buildPerfSnapshot(context: SnapshotContext): PerfSnapshot {
  const metrics = perfBus.getMetrics();
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  const viewport = {
    w: typeof window !== 'undefined' ? window.innerWidth : 0,
    h: typeof window !== 'undefined' ? window.innerHeight : 0,
    dpr,
  };
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';

  return {
    version: PERF_SNAPSHOT_VERSION,
    fps: metrics.fps,
    frameIntervalMs: metrics.frameIntervalMs,
    frameIntervalP1: metrics.frameIntervalP1,
    frameIntervalP5: metrics.frameIntervalP5,
    frameIntervalP50: metrics.frameIntervalP50,
    frameIntervalP95: metrics.frameIntervalP95,
    frameWorkTimeMs: metrics.frameWorkTimeMs,
    frameWorkTimeP50: metrics.frameWorkTimeP50,
    frameWorkTimeP95: metrics.frameWorkTimeP95,
    longTasksPerMinute: metrics.longTasksPerMinute,
    longTasksTotalMsPerMinute: metrics.longTasksTotalMsPerMinute,
    heapMB: metrics.heapMB,
    phaseId: context.phaseId,
    bossId: context.bossId,
    ua,
    viewport,
    capturedAt: new Date().toISOString(),
    webVitals: dedupeLatestPerMetric(perfBus.getWebVitals()),
  };
}

/*
 * REF-06 Phase F: with `reportAllChanges: true`, CLS + INP callbacks fire many
 * times per session (each layout shift / each interaction). The bus keeps the
 * full history (push-only, historical), but the exported snapshot only needs
 * the most recent value per metric — that's what perf tooling and the spec
 * consume. Last wins, stable across repeated exports.
 */
export function dedupeLatestPerMetric(events: readonly PerfWebVitalsEvent[]): PerfWebVitalsEvent[] {
  const latest = new Map<PerfWebVitalsEvent['metric'], PerfWebVitalsEvent>();
  for (const event of events) {
    latest.set(event.metric, event);
  }
  return Array.from(latest.values());
}

export function downloadPerfSnapshot(snapshot: PerfSnapshot): void {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const filename = `perf-snapshot-${Date.now()}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
