import { STORAGE_KEYS, type Theme } from '@/types/theme';

type EffectiveTheme = 'dark' | 'light';

export interface BootThemeDeps {
  readonly readStored: () => string | null;
  readonly prefersDark: () => boolean;
}

export function parseStoredTheme(raw: string | null): Theme {
  if (raw === 'dark' || raw === 'light' || raw === 'auto') return raw;
  return 'dark';
}

export function resolveEffectiveTheme(theme: Theme, prefersDark: boolean): EffectiveTheme {
  if (theme === 'auto') return prefersDark ? 'dark' : 'light';
  return theme;
}

export function resolveBootTheme(deps: BootThemeDeps): EffectiveTheme {
  let raw: string | null = null;
  try {
    raw = deps.readStored();
  } catch {
    raw = null;
  }
  const theme = parseStoredTheme(raw);

  let prefers = false;
  try {
    prefers = deps.prefersDark();
  } catch {
    prefers = false;
  }
  return resolveEffectiveTheme(theme, prefers);
}

export function applyBootTheme(): EffectiveTheme {
  const effective = resolveBootTheme({
    readStored: () => globalThis.localStorage?.getItem(STORAGE_KEYS.THEME) ?? null,
    prefersDark: () =>
      globalThis.window?.matchMedia('(prefers-color-scheme: dark)').matches ?? false,
  });
  globalThis.document?.documentElement.setAttribute('data-theme', effective);
  return effective;
}
