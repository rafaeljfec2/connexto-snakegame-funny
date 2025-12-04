import styles from "./DynamicBackground.module.css";

// Tema Dark - Cor original do jogo (roxo gradiente)
const DARK_BG = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

export function DynamicBackground() {
  return <div className={styles.background} style={{ background: DARK_BG }} />;
}
