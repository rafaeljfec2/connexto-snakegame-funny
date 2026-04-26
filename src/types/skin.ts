export type SkinId = 'neon-green' | 'retro-arcade' | 'frozen-ice' | 'magenta-blaze';

export interface SkinGradient {
  readonly highlight: string;
  readonly mid: string;
  readonly shadow: string;
}

export interface SkinPalette {
  readonly id: SkinId;
  readonly labelKey: string;
  readonly body: SkinGradient;
  readonly head: SkinGradient;
  readonly bossContrast: SkinGradient;
}

export const STORAGE_KEYS = {
  SKIN: 'snake-game-skin',
} as const;

export const SKIN_IDS = [
  'neon-green',
  'retro-arcade',
  'frozen-ice',
  'magenta-blaze',
] as const satisfies ReadonlyArray<SkinId>;

export function isSkinId(value: unknown): value is SkinId {
  return typeof value === 'string' && (SKIN_IDS as ReadonlyArray<string>).includes(value);
}
