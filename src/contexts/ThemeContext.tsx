import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { type Theme } from '@/types/theme';
import { getStoredTheme, saveTheme, getEffectiveTheme } from '@/utils/theme';

type EffectiveTheme = 'dark' | 'light';

interface ThemeContextValue {
  readonly theme: Theme;
  readonly effectiveTheme: EffectiveTheme;
  readonly setTheme: (theme: Theme) => void;
  readonly toggleTheme: () => void;
}

interface ThemeProviderProps {
  readonly children: ReactNode;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function writeDomTheme(effective: EffectiveTheme): void {
  globalThis.document?.documentElement.setAttribute('data-theme', effective);
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(() =>
    getEffectiveTheme(getStoredTheme()),
  );

  useEffect(() => {
    saveTheme(theme);
    const next = getEffectiveTheme(theme);
    setEffectiveTheme(next);
    writeDomTheme(next);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'auto') return;
    const mediaQuery = globalThis.window?.matchMedia('(prefers-color-scheme: dark)');
    if (!mediaQuery) return;
    const handleChange = (): void => {
      const next = getEffectiveTheme('auto');
      setEffectiveTheme(next);
      writeDomTheme(next);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme): void => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback((): void => {
    setThemeState((prev) => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'auto';
      return 'dark';
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      effectiveTheme,
      setTheme,
      toggleTheme,
    }),
    [theme, effectiveTheme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
