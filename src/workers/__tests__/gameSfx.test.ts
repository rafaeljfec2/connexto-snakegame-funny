import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emitSfx } from '@/workers/game/gameSfx';

describe('gameSfx.emitSfx', () => {
  let postSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    postSpy = vi.fn();
    (globalThis as unknown as { self: { postMessage: typeof postSpy } }).self = {
      postMessage: postSpy,
    };
  });

  it('posts the SFX envelope with the given id', () => {
    emitSfx('food.eat');
    expect(postSpy).toHaveBeenCalledWith({ type: 'SFX', id: 'food.eat' });
  });

  it('is a no-op when self.postMessage is unavailable', () => {
    type GlobalSelf = { self: { postMessage?: unknown } };
    (globalThis as unknown as GlobalSelf).self = { postMessage: undefined };
    expect(() => emitSfx('damage.hit')).not.toThrow();
  });
});
