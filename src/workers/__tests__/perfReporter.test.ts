import { describe, it, expect, vi } from 'vitest';
import { createPerfReporter } from '@/workers/perfReporter';
import type { PerfBatchMessage } from '@/types/perf';

function makePoster() {
  const messages: PerfBatchMessage[] = [];
  const postMessage = (m: PerfBatchMessage): void => {
    messages.push(m);
  };
  return { messages, postMessage };
}

describe('createPerfReporter', () => {
  it('flushes after the configured interval has elapsed', () => {
    let now = 0;
    const { messages, postMessage } = makePoster();
    const reporter = createPerfReporter({
      source: 'render',
      flushIntervalMs: 250,
      postMessage,
      now: () => now,
    });

    reporter.recordWorkTime(16);
    reporter.recordInterval(17);
    expect(messages).toHaveLength(0);

    now = 300;
    reporter.recordWorkTime(18);

    expect(messages).toHaveLength(1);
    expect(messages[0]?.source).toBe('render');
    expect(messages[0]?.workTimes).toEqual([16, 18]);
    expect(messages[0]?.intervals).toEqual([17]);
  });

  it('flushes early when the work-time buffer reaches its max size', () => {
    const now = 0;
    const { messages, postMessage } = makePoster();
    const reporter = createPerfReporter({
      source: 'game',
      flushIntervalMs: 1_000,
      maxBufferSize: 4,
      postMessage,
      now: () => now,
    });

    reporter.recordWorkTime(10);
    reporter.recordWorkTime(11);
    reporter.recordWorkTime(12);
    reporter.recordWorkTime(13);

    expect(messages).toHaveLength(1);
    expect(messages[0]?.workTimes).toHaveLength(4);
    expect(messages[0]?.intervals).toHaveLength(0);
  });

  it('flushes early when the interval buffer reaches its max size', () => {
    const now = 0;
    const { messages, postMessage } = makePoster();
    const reporter = createPerfReporter({
      source: 'render',
      flushIntervalMs: 1_000,
      maxBufferSize: 3,
      postMessage,
      now: () => now,
    });

    reporter.recordInterval(16);
    reporter.recordInterval(17);
    reporter.recordInterval(18);

    expect(messages).toHaveLength(1);
    expect(messages[0]?.intervals).toEqual([16, 17, 18]);
  });

  it('drops invalid samples without sending them', () => {
    let now = 0;
    const { messages, postMessage } = makePoster();
    const reporter = createPerfReporter({
      source: 'main',
      flushIntervalMs: 100,
      postMessage,
      now: () => now,
    });

    reporter.recordWorkTime(Number.NaN);
    reporter.recordWorkTime(-5);
    reporter.recordInterval(Number.NaN);
    reporter.recordInterval(-1);

    now = 500;
    reporter.flush(true);

    expect(messages).toHaveLength(0);
  });

  it('flush(true) sends pending samples regardless of interval', () => {
    const now = 0;
    const poster = makePoster();
    const reporter = createPerfReporter({
      source: 'render',
      flushIntervalMs: 999_999,
      postMessage: poster.postMessage,
      now: () => now,
    });

    reporter.recordWorkTime(20);
    reporter.recordInterval(16);
    reporter.flush(true);

    expect(poster.messages).toHaveLength(1);
    expect(poster.messages[0]?.workTimes).toEqual([20]);
    expect(poster.messages[0]?.intervals).toEqual([16]);
  });

  it('uses performance.now by default', () => {
    const spy = vi.spyOn(performance, 'now');
    const { postMessage } = makePoster();
    const reporter = createPerfReporter({ source: 'render', postMessage });

    reporter.recordWorkTime(16);
    reporter.flush(true);

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
