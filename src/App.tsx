import { useGameLoop } from '@/hooks/useGameLoop'
import { useKeyboard } from '@/hooks/useKeyboard'
import { GameBoard } from './components/GameBoard'
import { GameInfo } from './components/GameInfo'
import { GameControls } from './components/GameControls'
import { GameStatus } from '@/types/game'
import styles from './App.module.css'

function App() {
  const {
    gameState,
    resetGame,
    startGame,
    pauseGame,
    setDirection,
    handleKeyPress,
  } = useGameLoop()

  useKeyboard({
    onDirectionChange: setDirection,
    onKeyPress: handleKeyPress,
    enabled: true,
  })

  const handleStart = () => {
    if (gameState.status === GameStatus.IDLE) {
      startGame()
    }
  }

  const handlePause = () => {
    pauseGame()
  }

  const handleReset = () => {
    resetGame()
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Snake Game</h1>
      </header>

      <main className={styles.main}>
        <GameInfo
          score={gameState.score}
          highScore={gameState.highScore}
          level={gameState.level}
          status={gameState.status}
        />

        <div className={styles.gameContainer}>
          <GameBoard snake={gameState.snake} food={gameState.food} />
        </div>

        <GameControls
          onStart={handleStart}
          onPause={handlePause}
          onReset={handleReset}
          status={gameState.status}
        />

        <div className={styles.instructions}>
          <p>
            Use <kbd>Arrow Keys</kbd> or <kbd>WASD</kbd> to move
          </p>
          <p>
            Press <kbd>SPACE</kbd> to start/pause
          </p>
        </div>
      </main>
    </div>
  )
}

export default App
