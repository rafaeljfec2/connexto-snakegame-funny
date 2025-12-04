import { useTheme } from "@/contexts/ThemeContext";
import styles from "./ThemeToggle.module.css";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const getIcon = () => {
    switch (theme) {
      case "dark":
        return "🌙";
      case "light":
        return "☀️";
      case "auto":
        return "🔄";
      default:
        return "🔄";
    }
  };

  return (
    <button
      className={styles.themeToggle}
      onClick={toggleTheme}
      aria-label={`Switch theme (current: ${theme})`}
      title={`Current theme: ${theme}. Click to toggle.`}
    >
      <span className={styles.icon}>{getIcon()}</span>
      <span className={styles.label}>{theme}</span>
    </button>
  );
}

