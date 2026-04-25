import { Howl, Howler } from 'howler';
import { createLogger, LogContext } from '@/utils/logger';
import type { SfxId, SfxManifest, SfxPlayOptions } from '@/types/sfx';

const log = createLogger(LogContext.PERFORMANCE, { module: 'sfxEngine' });

const STORAGE_KEY_MUTED = 'snake.audio.muted';
const STORAGE_KEY_VOLUME = 'snake.audio.volume';
const DEFAULT_VOLUME = 0.7;
const POOL_SIZE = 8;

export interface SfxEngineState {
  isMuted: boolean;
  volume: number;
  isReady: boolean;
}

export interface SfxEngineInitOptions {
  manifestUrl?: string;
  fetcher?: typeof fetch;
}

type Listener = (state: SfxEngineState) => void;

class SfxEngine {
  private howl: Howl | null = null;
  private state: SfxEngineState = {
    isMuted: readPersistedMuted(),
    volume: readPersistedVolume(),
    isReady: false,
  };
  private listeners = new Set<Listener>();
  private initPromise: Promise<void> | null = null;
  private autoplayArmed = false;
  private warnedMissing = false;

  getState(): SfxEngineState {
    return { ...this.state };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async init(options: SfxEngineInitOptions = {}): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.doInit(options).catch((err) => {
      this.warnMissing(err);
      this.initPromise = null;
    });
    return this.initPromise;
  }

  play(id: SfxId, opts: SfxPlayOptions = {}): void {
    if (!this.state.isReady || this.state.isMuted || !this.howl) return;
    try {
      const soundId = this.howl.play(id);
      if (typeof opts.volume === 'number') {
        this.howl.volume(clampVolume(opts.volume), soundId);
      }
      if (typeof opts.rateJitter === 'number' && opts.rateJitter > 0) {
        const jitter = 1 + (Math.random() * 2 - 1) * Math.min(opts.rateJitter, 0.5);
        this.howl.rate(jitter, soundId);
      }
    } catch (err) {
      log.warn({ id, error: err instanceof Error ? err.message : String(err) }, 'sfx play failed');
    }
  }

  setMuted(muted: boolean): void {
    if (this.state.isMuted === muted) return;
    this.state = { ...this.state, isMuted: muted };
    persist(STORAGE_KEY_MUTED, String(muted));
    Howler.mute(muted);
    this.emit();
  }

  setVolume(v: number): void {
    const clamped = clampVolume(v);
    if (this.state.volume === clamped) return;
    this.state = { ...this.state, volume: clamped };
    persist(STORAGE_KEY_VOLUME, String(clamped));
    Howler.volume(clamped);
    this.emit();
  }

  armAutoplay(): void {
    if (this.autoplayArmed || typeof window === 'undefined') return;
    this.autoplayArmed = true;

    const resume = (): void => {
      const ctx = Howler.ctx as (AudioContext & { state: string }) | null;
      if (ctx && ctx.state === 'suspended') {
        void ctx.resume();
      }
    };

    const events: ReadonlyArray<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart'];
    const handler = (): void => {
      resume();
      for (const evt of events) window.removeEventListener(evt, handler);
      window.removeEventListener('visibilitychange', resumeOnVisibility);
    };
    const resumeOnVisibility = (): void => {
      if (document.visibilityState === 'visible') resume();
    };
    for (const evt of events) window.addEventListener(evt, handler, { once: false });
    window.addEventListener('visibilitychange', resumeOnVisibility);
  }

  reset(): void {
    this.howl?.unload();
    this.howl = null;
    this.initPromise = null;
    this.autoplayArmed = false;
    this.warnedMissing = false;
    this.state = {
      isMuted: readPersistedMuted(),
      volume: readPersistedVolume(),
      isReady: false,
    };
    this.listeners.clear();
  }

  private async doInit(options: SfxEngineInitOptions): Promise<void> {
    const manifestUrl = options.manifestUrl ?? '/audio/sfx.json';
    const fetcher = options.fetcher ?? fetch;

    const response = await fetcher(manifestUrl, { cache: 'force-cache' });
    if (!response.ok) {
      throw new Error(`manifest http ${response.status}`);
    }
    const manifest = (await response.json()) as SfxManifest;
    if (!manifest?.src?.length || !manifest?.sprite) {
      throw new Error('invalid manifest');
    }

    const sprite = toHowlerSprite(manifest.sprite);

    this.howl = new Howl({
      src: manifest.src,
      sprite,
      preload: true,
      pool: POOL_SIZE,
      volume: this.state.volume,
      mute: this.state.isMuted,
    });

    Howler.volume(this.state.volume);
    Howler.mute(this.state.isMuted);

    await new Promise<void>((resolve, reject) => {
      this.howl?.once('load', () => resolve());
      this.howl?.once('loaderror', (_id, err) =>
        reject(new Error(`howl loaderror: ${String(err)}`)),
      );
    });

    this.state = { ...this.state, isReady: true };
    this.emit();
    log.info({ event: 'sfx-ready', sprites: Object.keys(sprite).length }, 'sfx ready');
  }

  private emit(): void {
    const snapshot = this.getState();
    for (const listener of this.listeners) listener(snapshot);
  }

  private warnMissing(err: unknown): void {
    if (this.warnedMissing) return;
    this.warnedMissing = true;
    log.warn(
      { error: err instanceof Error ? err.message : String(err) },
      'sfx manifest unavailable; engine running in no-audio mode',
    );
  }
}

export const sfxEngine = new SfxEngine();

export type { SfxEngine };

function toHowlerSprite(manifestSprite: SfxManifest['sprite']): Record<string, [number, number]> {
  const result: Record<string, [number, number]> = {};
  for (const [key, value] of Object.entries(manifestSprite)) {
    if (Array.isArray(value) && value.length === 2) {
      result[key] = [value[0], value[1]];
    }
  }
  return result;
}

function readPersistedMuted(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY_MUTED) === 'true';
}

function readPersistedVolume(): number {
  if (typeof localStorage === 'undefined') return DEFAULT_VOLUME;
  const raw = localStorage.getItem(STORAGE_KEY_VOLUME);
  if (raw === null) return DEFAULT_VOLUME;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_VOLUME;
  return clampVolume(parsed);
}

function persist(key: string, value: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage may be full or disabled; ignore */
  }
}

function clampVolume(v: number): number {
  if (!Number.isFinite(v)) return DEFAULT_VOLUME;
  return Math.max(0, Math.min(1, v));
}
