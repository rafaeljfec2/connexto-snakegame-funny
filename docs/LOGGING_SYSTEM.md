# Sistema de Logging e Observabilidade

## Visão Geral

Foi implementado um sistema completo de logging usando **Pino** para registrar todos os eventos importantes do ciclo de vida do jogo. O sistema foi projetado para ser não-intrusivo e não interferir com a lógica existente do jogo.

## Arquitetura

### Utilitário de Logging (`src/utils/logger.ts`)

- **Pino**: Biblioteca de logging estruturado
- **Níveis de Log**: TRACE, DEBUG, INFO, WARN, ERROR, FATAL
- **Contextos**: Organização por área do jogo (game-state, game-loop, boss, phase, etc.)
- **Saída**: Console do browser com cores e formatação

### Contextos de Log

- `GAME_STATE`: Mudanças de estado do jogo (IDLE, PLAYING, PAUSED, etc.)
- `GAME_LOOP`: Eventos do loop principal
- `COLLISION`: Colisões (obstáculos, self, boss)
- `BOSS`: Eventos relacionados a bosses
- `PHASE`: Mudanças de fase
- `POWER_UP`: Power-ups ativados
- `FOOD`: Comida consumida
- `STATISTICS`: Estatísticas do jogo
- `TRANSITION`: Transições de tela
- `USER_INPUT`: Entrada do usuário
- `PERFORMANCE`: Métricas de performance
- `ERROR`: Erros e exceções
- `ACHIEVEMENT`: Conquistas desbloqueadas
- `POISON`: Tiros de veneno
- `PORTAL`: Teleportação por portais
- `OBSTACLE`: Obstáculos gerados/destruídos

## Eventos Registrados

### useGameState

- ✅ Inicialização do estado
- ✅ Reset do jogo
- ✅ Mudanças de status (IDLE → PHASE_INTRO → PLAYING)
- ✅ Pause/Resume
- ✅ Mudanças de direção (validação)

### useGameLoop (Pendente)

Os seguintes eventos devem ser adicionados:

- [ ] Colisões (obstáculo, self, boss)
- [ ] Comida consumida
- [ ] Level up
- [ ] Boss spawn/defeat
- [ ] Power-ups ativados
- [ ] Mudanças de fase
- [ ] Portal teleport
- [ ] Poison shots
- [ ] Conquistas desbloqueadas
- [ ] Game over

### Componentes de Transição (Pendente)

- [ ] PhaseTransition
- [ ] BossDefeatTransition
- [ ] PhaseCompleteScreen
- [ ] DeathTransition

## Como Usar

### Exemplo Básico

```typescript
import { logGameEvent, createLogger, LogContext } from '@/utils/logger';

// Logger com contexto
const logger = createLogger(LogContext.GAME_LOOP);

// Log de evento
logGameEvent('food-eaten', {
  foodType: 'NORMAL',
  score: 100,
  level: 5,
});

// Log customizado
logger.info({ score: 100, level: 5 }, 'Score updated');
```

### Funções Auxiliares

```typescript
// Mudança de estado
logGameStateChange('PLAYING', 'PAUSED', { reason: 'user-pause' });

// Evento do jogo
logGameEvent('boss-defeated', { bossName: 'Guardian', score: 500 });

// Erro
logError(new Error('Something went wrong'), LogContext.ERROR, { context: 'game-loop' });

// Performance
logPerformance('game-update', 16.5, { frameCount: 1000 });
```

## Configuração

O nível de log é configurado automaticamente baseado no ambiente:

- **Development**: `debug` (mostra todos os logs)
- **Production**: `warn` (apenas warnings e erros)

## Próximos Passos

1. Adicionar logs no `useGameLoop` para todos os eventos principais
2. Adicionar logs nos componentes de transição
3. Adicionar logs nos sistemas de colisão e combate
4. Adicionar logs no sistema de bosses e fases
5. Implementar coleta de métricas de performance

## Observações

- Os logs são não-intrusivos e não alteram a lógica do jogo
- Todos os logs são formatados de forma estruturada para fácil análise
- O sistema é facilmente extensível para novos contextos

