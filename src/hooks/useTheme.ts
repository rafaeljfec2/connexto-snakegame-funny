import { useState, useEffect } from "react";
import { Theme } from "@/types/theme";
import { getStoredTheme, saveTheme, getEffectiveTheme } from "@/utils/theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());
  const [effectiveTheme, setEffectiveTheme] = useState<"dark" | "light">(() =>
    getEffectiveTheme(getStoredTheme())
  );

  useEffect(() => {
    saveTheme(theme);
    setEffectiveTheme(getEffectiveTheme(theme));

    // Listen for system theme changes if auto mode
    if (theme === "auto") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        setEffectiveTheme(getEffectiveTheme(theme));
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      if (prev === "dark") return "light";
      if (prev === "light") return "auto";
      return "dark";
    });
  };

  return {
    theme,
    effectiveTheme,
    setTheme,
    toggleTheme,
  };
}


