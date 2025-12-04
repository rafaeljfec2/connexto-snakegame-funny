import { Theme, STORAGE_KEYS } from "@/types/theme";

export function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.THEME);
    if (stored === "dark" || stored === "light" || stored === "auto") {
      return stored;
    }
  } catch (error) {
    console.error("Error loading theme:", error);
  }
  return "auto";
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (error) {
    console.error("Error saving theme:", error);
  }
}

export function getEffectiveTheme(theme: Theme): "dark" | "light" {
  if (theme === "auto") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

