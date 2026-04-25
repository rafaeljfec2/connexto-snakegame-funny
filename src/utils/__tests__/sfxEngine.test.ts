import { describe, it, expect, beforeEach, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const playSpy = vi.fn(() => 1);
  const volumeSpy = vi.fn();
  const rateSpy = vi.fn();
  const unloadSpy = vi.fn();
  const onceSpy = vi.fn((event: string, cb: (id: number, err?: unknown) => void) => {
    if (event === 'load') queueMicrotask(() => cb(1));
  });
  const howlerMute = vi.fn();
  const howlerVolume = vi.fn();
  const fakeCtx = { state: 'suspended', resume: vi.fn().mockResolvedValue(undefined) };
  return {
    playSpy,
    volumeSpy,
    rateSpy,
    unloadSpy,
    onceSpy,
    howlerMute,
    howlerVolume,
    fakeCtx,
  };
});

vi.mock('howler', () => ({
  Howl: vi.fn().mockImplementation(() => ({
    play: mocks.playSpy,
    volume: mocks.volumeSpy,
    rate: mocks.rateSpy,
    unload: mocks.unloadSpy,
    once: mocks.onceSpy,
  })),
  Howler: {
    mute: mocks.howlerMute,
    volume: mocks.howlerVolume,
    ctx: mocks.fakeCtx,
  },
}));

import { sfxEngine } from '@/utils/sfxEngine';

const VALID_MANIFEST = {
  src: ['/audio/sfx.webm', '/audio/sfx.mp3'],
  sprite: {
    'food.eat': [0, 200],
    'damage.hit': [200, 240],
  },
};

function fetchOk(payload: unknown): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => payload,
  } as Response) as unknown as typeof fetch;
}

function fetchNotFound(): typeof fetch {
  return vi
    .fn()
    .mockResolvedValue({ ok: false, status: 404 } as Response) as unknown as typeof fetch;
}

async function bootEngine() {
  await sfxEngine.init({
    manifestUrl: '/x.json',
    fetcher: fetchOk(VALID_MANIFEST),
  });
}

describe('sfxEngine', () => {
  beforeEach(() => {
    localStorage.clear();
    sfxEngine.reset();
    mocks.playSpy.mockClear();
    mocks.volumeSpy.mockClear();
    mocks.rateSpy.mockClear();
    mocks.unloadSpy.mockClear();
    mocks.onceSpy.mockClear();
    mocks.howlerMute.mockClear();
    mocks.howlerVolume.mockClear();
    mocks.fakeCtx.resume.mockClear();
    mocks.fakeCtx.state = 'suspended';
  });

  describe('play()', () => {
    it('is a no-op when engine is not ready (no-audio mode)', () => {
      sfxEngine.play('food.eat');
      expect(mocks.playSpy).not.toHaveBeenCalled();
    });

    it('plays via Howler once initialized', async () => {
      await bootEngine();
      sfxEngine.play('food.eat');
      expect(mocks.playSpy).toHaveBeenCalledWith('food.eat');
    });

    it('is a no-op when muted even if ready', async () => {
      sfxEngine.setMuted(true);
      await bootEngine();
      sfxEngine.play('food.eat');
      expect(mocks.playSpy).not.toHaveBeenCalled();
    });

    it('handles 5 calls within < 50 ms (latency budget)', async () => {
      await bootEngine();
      const start = performance.now();
      for (let i = 0; i < 5; i++) sfxEngine.play('food.eat');
      const elapsed = performance.now() - start;
      expect(mocks.playSpy).toHaveBeenCalledTimes(5);
      expect(elapsed).toBeLessThan(50);
    });
  });

  describe('persistence', () => {
    it('stores muted preference in localStorage and reads it on reset', () => {
      sfxEngine.setMuted(true);
      expect(localStorage.getItem('snake.audio.muted')).toBe('true');

      sfxEngine.reset();
      expect(sfxEngine.getState().isMuted).toBe(true);
    });

    it('clamps and stores volume between 0 and 1', () => {
      sfxEngine.setVolume(2);
      expect(sfxEngine.getState().volume).toBe(1);
      expect(localStorage.getItem('snake.audio.volume')).toBe('1');

      sfxEngine.setVolume(-1);
      expect(sfxEngine.getState().volume).toBe(0);
    });
  });

  describe('init() graceful degradation', () => {
    it('keeps isReady=false when manifest is missing (no-audio mode, no throw)', async () => {
      await sfxEngine.init({ manifestUrl: '/missing.json', fetcher: fetchNotFound() });
      expect(sfxEngine.getState().isReady).toBe(false);

      sfxEngine.play('food.eat');
      expect(mocks.playSpy).not.toHaveBeenCalled();
    });

    it('init() is idempotent across concurrent calls', async () => {
      const fetcher = fetchOk(VALID_MANIFEST);
      const a = sfxEngine.init({ manifestUrl: '/x.json', fetcher });
      const b = sfxEngine.init({ manifestUrl: '/x.json', fetcher });
      await Promise.all([a, b]);
      expect(fetcher).toHaveBeenCalledTimes(1);
    });
  });

  describe('autoplay gate', () => {
    it('resumes a suspended AudioContext on the first pointerdown', () => {
      sfxEngine.armAutoplay();
      window.dispatchEvent(new Event('pointerdown'));
      expect(mocks.fakeCtx.resume).toHaveBeenCalled();
    });

    it('does not throw when called twice (idempotent arming)', () => {
      sfxEngine.armAutoplay();
      sfxEngine.armAutoplay();
      window.dispatchEvent(new Event('keydown'));
      expect(mocks.fakeCtx.resume).toHaveBeenCalled();
    });
  });

  describe('subscribe()', () => {
    it('notifies subscribers on mute changes', () => {
      const listener = vi.fn();
      const dispose = sfxEngine.subscribe(listener);

      sfxEngine.setMuted(true);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ isMuted: true }));

      dispose();
      sfxEngine.setMuted(false);
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});
