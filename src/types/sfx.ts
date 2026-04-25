export type SfxId =
  | 'food.eat'
  | 'food.timed.expire'
  | 'damage.hit'
  | 'damage.death'
  | 'powerup.collect'
  | 'powerup.expire'
  | 'poison.shoot'
  | 'poison.hit'
  | 'boss.spawn'
  | 'boss.hit'
  | 'boss.defeat'
  | 'phase.intro'
  | 'phase.complete'
  | 'ui.click'
  | 'ui.toggle';

export const SFX_IDS: readonly SfxId[] = [
  'food.eat',
  'food.timed.expire',
  'damage.hit',
  'damage.death',
  'powerup.collect',
  'powerup.expire',
  'poison.shoot',
  'poison.hit',
  'boss.spawn',
  'boss.hit',
  'boss.defeat',
  'phase.intro',
  'phase.complete',
  'ui.click',
  'ui.toggle',
] as const;

export interface SfxPlayOptions {
  rateJitter?: number;
  volume?: number;
}

export interface SfxApi {
  play(id: SfxId, opts?: SfxPlayOptions): void;
  setMuted(muted: boolean): void;
  setVolume(v: number): void;
  readonly isMuted: boolean;
  readonly volume: number;
  readonly isReady: boolean;
}

export interface SfxWorkerMessage {
  type: 'SFX';
  id: SfxId;
}

export interface SfxManifestEntry {
  start: number;
  end: number;
}

export interface SfxManifest {
  src: string[];
  sprite: Partial<Record<SfxId, [start: number, durationMs: number]>>;
}
