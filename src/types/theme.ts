export type Theme = "dark" | "light" | "auto";

export interface ThemeConfig {
  theme: Theme;
}

export const STORAGE_KEYS = {
  THEME: "snake-game-theme",
} as const;


