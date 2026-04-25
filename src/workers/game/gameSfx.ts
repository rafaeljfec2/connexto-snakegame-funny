import type { SfxId, SfxWorkerMessage } from '@/types/sfx';

export function emitSfx(id: SfxId): void {
  const message: SfxWorkerMessage = { type: 'SFX', id };
  if (typeof self !== 'undefined' && typeof self.postMessage === 'function') {
    self.postMessage(message);
  }
}
