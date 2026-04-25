import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { perfBus } from '@/utils/perfBus';
import { createLogger, LogContext } from '@/utils/logger';
import type { PerfWebVitalsEvent } from '@/types/perf';

const log = createLogger(LogContext.PERFORMANCE);

const SUPPORTED_OBSERVER_TYPES: ReadonlyArray<{ type: string; eager: boolean }> = [
  { type: 'long-animation-frame', eager: true },
  { type: 'longtask', eager: false },
];

interface PerformanceEntryWithDuration extends PerformanceEntry {
  duration: number;
}

interface BootstrapResult {
  longTasksObserver?: PerformanceObserver;
  laftObserver?: PerformanceObserver;
}

let booted = false;

export function bootstrapPerfObservability(): BootstrapResult {
  if (booted) return {};
  booted = true;

  const result: BootstrapResult = {};

  for (const { type, eager } of SUPPORTED_OBSERVER_TYPES) {
    const observer = tryCreateObserver(type);
    if (!observer) continue;
    if (type === 'long-animation-frame') {
      result.laftObserver = observer;
      if (eager) break;
    } else if (type === 'longtask') {
      result.longTasksObserver = observer;
    }
  }

  registerWebVitals();
  return result;
}

function tryCreateObserver(entryType: string): PerformanceObserver | undefined {
  if (typeof PerformanceObserver === 'undefined') return undefined;
  const supported = (PerformanceObserver as unknown as { supportedEntryTypes?: readonly string[] })
    .supportedEntryTypes;
  if (supported && !supported.includes(entryType)) return undefined;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        const duration = (entry as PerformanceEntryWithDuration).duration ?? 0;
        if (duration > 0) {
          perfBus.recordLongTask(duration);
        }
      }
    });
    observer.observe({ type: entryType, buffered: true });
    log.debug({ entryType }, 'PerformanceObserver registered');
    return observer;
  } catch (err) {
    log.warn(
      { entryType, error: err instanceof Error ? err.message : String(err) },
      'PerformanceObserver registration failed',
    );
    return undefined;
  }
}

function registerWebVitals(): void {
  const handler = (metric: Metric): void => {
    const event: PerfWebVitalsEvent = {
      metric: metric.name as PerfWebVitalsEvent['metric'],
      value: metric.value,
      rating: metric.rating,
    };
    perfBus.recordWebVital(event);
    log.info({ event: 'web-vitals', ...event }, `web-vitals:${event.metric}`);
  };

  onCLS(handler);
  onFCP(handler);
  onINP(handler);
  onLCP(handler);
  onTTFB(handler);
}
