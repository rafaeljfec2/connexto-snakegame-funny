import { useEffect, useState } from "react";
import styles from "./DynamicBackground.module.css";

interface DynamicBackgroundProps {
  level: number;
  theme: "dark" | "light";
}

// Definindo as cores diretamente no componente
const DARK_BACKGROUNDS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", // Base
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", // Level 1
  "linear-gradient(135deg, #4a5568 0%, #2d3748 100%)", // Level 2
  "linear-gradient(135deg, #553c9a 0%, #7c3aed 100%)", // Level 3
  "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)", // Level 4
];

const LIGHT_BACKGROUNDS = [
  "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)", // Base
  "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)", // Level 1
  "linear-gradient(135deg, #fef3f2 0%, #fee2e2 100%)", // Level 2
  "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)", // Level 3
  "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)", // Level 4
];

export function DynamicBackground({ level, theme }: DynamicBackgroundProps) {
  const [backgroundIndex, setBackgroundIndex] = useState(0);

  useEffect(() => {
    // Change background style every 5 levels
    const newIndex = Math.floor(level / 5) % 4;
    setBackgroundIndex(newIndex);
  }, [level]);

  const backgrounds = theme === "dark" ? DARK_BACKGROUNDS : LIGHT_BACKGROUNDS;
  const backgroundStyle = backgrounds[backgroundIndex] || backgrounds[0];

  return (
    <div
      className={styles.background}
      style={{ background: backgroundStyle }}
    />
  );
}
