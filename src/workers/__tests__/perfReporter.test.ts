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

    reporter.record(16);
    reporter.record(17);
    expect(messages).toHaveLength(0);

    now = 300;
    reporter.record(18);

    expect(messages).toHaveLength(1);
    expect(messages[0]?.source).toBe('render');
    expect(messages[0]?.samples).toEqual([16, 17, 18]);
  });

  it('flushes early when the buffer reaches its max size', () => {
    const now = 0;
    const { messages, postMessage } = makePoster();
    const reporter = createPerfReporter({
      source: 'game',
      flushIntervalMs: 1_000,
      maxBufferSize: 4,
      postMessage,
      now: () => now,
    });

    reporter.record(10);
    reporter.record(11);
    reporter.record(12);
    reporter.record(13);

    expect(messages).toHaveLength(1);
    expect(messages[0]?.samples).toHaveLength(4);
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

    reporter.record(Number.NaN);
    reporter.record(-5);

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

    reporter.record(20);
    reporter.flush(true);

    expect(poster.messages).toHaveLength(1);
    expect(poster.messages[0]?.samples).toEqual([20]);
  });

  it('uses performance.now by default', () => {
    const spy = vi.spyOn(performance, 'now');
    const { postMessage } = makePoster();
    const reporter = createPerfReporter({ source: 'render', postMessage });

    reporter.record(16);
    reporter.flush(true);

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
