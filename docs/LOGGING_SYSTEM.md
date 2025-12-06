# Sistema de Logging e Observabilidade

## Visão Geral

O sistema de logging foi implementado usando **Pino**, uma biblioteca de logging estruturado de alta performance para Node.js e browsers. O sistema é completamente não intrusivo e permite rastrear todos os eventos importantes do jogo sem impactar a performance.

## Arquitetura

### Estrutura de Arquivos

```
src/
├── utils/
│   └── logger.ts                    # Configuração e funções de logging
└── hooks/
    └── useGameLoop.ts               # Uso de logs no game loop
```

### Configuração (`src/utils/logger.ts`)

O sistema usa Pino configurado para:

- **Nível de Log**: Configurável via `LOG_LEVEL` (padrão: `debug`)
- **Output**: Console do navegador formatado
- **Contextos**: Categorização de logs por área do jogo
- **Formatação**: Logs estruturados com metadados

## Níveis de Log

O sistema suporta os seguintes níveis (em ordem de prioridade):

1. **TRACE** - Logs muito detalhados (menor prioridade)
2. **DEBUG** - Informações de debug
3. **INFO** - Informações gerais
4. **WARN** - Avisos
5. **ERROR** - Erros
6. **FATAL** - Erros críticos (maior prioridade)

## Contextos de Log

Os logs são organizados por contexto para facilitar a filtragem e análise:

- **GAME_STATE** - Mudanças de estado do jogo
- **GAME_LOOP** - Loop principal do jogo
- **BOSS** - Eventos relacionados a bosses
- **PHASE** - Eventos relacionados a fases
- **COLLISION** - Detecção de colisões
- **TRANSITION** - Transições de tela
- **POWER_UP** - Ativação de power-ups
- **COMBAT** - Sistema de combate
- **FOOD** - Sistema de comida
- **POISON** - Sistema de disparos de veneno

## Uso

### Criar Logger para um Contexto

```typescript
import { createLogger } from '@/utils/logger';
import { LogContext } from '@/utils/logger';

const logger = createLogger(LogContext.GAME_LOOP);
logger.info('Game loop started');
```

### Logs Estruturados

```typescript
logger.info(
  {
    score: 100,
    level: 5,
    phase: 1,
  },
  'Level completed',
);
```

### Funções Helper

#### logGameStateChange

Registra mudanças de estado do jogo:

```typescript
import { logGameStateChange } from '@/utils/logger';

logGameStateChange(GameStatus.PLAYING, GameStatus.PAUSED, { reason: 'user_action' });
```

#### logGameEvent

Registra eventos do jogo:

```typescript
import { logGameEvent } from '@/utils/logger';

logGameEvent('food-eaten', {
  foodType: FoodType.NORMAL,
  score: 50,
  combo: 2,
});
```

## Eventos Registrados

### Game Loop

- ✅ Início e fim de cada frame
- ✅ Movimento da cobra (throttled)
- ✅ Mudanças de direção
- ✅ Colisões detectadas
- ✅ Comida comida
- ✅ Power-ups ativados

### Bosses

- ✅ Spawn de boss
- ✅ Colisões com boss
- ✅ Enfraquecimento de boss
- ✅ Derrota de boss
- ✅ Habilidades de boss ativadas

### Fases

- ✅ Mudança de fase
- ✅ Início de fase
- ✅ Conclusão de fase
- ✅ Aplicação de mecânicas de fase

### Power-Ups

- ✅ Ativação de power-up
- ✅ Expiração de power-up
- ✅ Efeitos aplicados

### Combate

- ✅ Disparos de veneno
- ✅ Colisões com obstáculos
- ✅ Destruição de obstáculos
- ✅ Colisões com bosses

### Transições

- ✅ Tela de introdução de fase
- ✅ Tela de derrota de boss
- ✅ Tela de morte
- ✅ Tela de conclusão de fase

## Otimizações de Performance

### Throttling de Logs

Logs que podem ser muito frequentes são throttled:

```typescript
// Log de movimento a cada 500ms ou em mudança de direção
if (now - lastMoveLogTime > 500 || directionChanged) {
  logger.debug({ position, direction }, 'Snake moved');
}
```

### Batching de Logs

Logs relacionados são agrupados:

```typescript
// Log de disparos agrupados
logger.debug(
  {
    shotsAdded: 5,
    totalActive: 10,
  },
  'Poison shots batch',
);
```

### Níveis Condicionais

Logs detalhados só são gerados em desenvolvimento:

```typescript
if (import.meta.env.DEV) {
  logger.trace('Very detailed information');
}
```

## Estrutura dos Logs

### Formato Padrão

```json
{
  "level": 30,
  "time": 1234567890123,
  "context": "GAME_LOOP",
  "msg": "Event description",
  "data": {
    "key": "value"
  }
}
```

### Exemplo Real

```json
{
  "level": 30,
  "time": 1703123456789,
  "context": "BOSS",
  "msg": "Boss defeated",
  "data": {
    "bossId": "guardian",
    "phase": 2,
    "score": 1500,
    "duration": 45000
  }
}
```

## Filtragem e Análise

### No Console do Navegador

1. Abra DevTools (F12)
2. Vá para a aba Console
3. Use filtros para buscar por contexto:
   - `context:GAME_LOOP`
   - `context:BOSS`
   - `level:ERROR`

### Exportar Logs

Para análise externa, você pode:

1. Copiar logs do console
2. Salvar em arquivo JSON
3. Processar com ferramentas de análise

## Boas Práticas

1. **Use o Contexto Correto**: Sempre especifique o contexto apropriado
2. **Logs Estruturados**: Use objetos para dados, não strings concatenadas
3. **Níveis Apropriados**:
   - DEBUG para desenvolvimento
   - INFO para eventos importantes
   - WARN para problemas recuperáveis
   - ERROR para erros
4. **Não Logue em Hot Paths**: Evite logs em loops muito rápidos
5. **Metadados Úteis**: Inclua informações relevantes nos logs

## Configuração

### Alterar Nível de Log

Modifique `LOG_LEVEL` em `src/utils/logger.ts`:

```typescript
const LOG_LEVEL = 'info'; // Apenas INFO e acima
```

### Desabilitar Logs

Para desabilitar completamente (não recomendado):

```typescript
const LOG_LEVEL = 'silent';
```

## Integração com Ferramentas Externas

### Sentry (Futuro)

O sistema está preparado para integração com Sentry:

```typescript
if (import.meta.env.PROD) {
  logger.error = (obj, msg) => {
    Sentry.captureException(new Error(msg), { extra: obj });
  };
}
```

### Analytics (Futuro)

Logs podem ser enviados para serviços de analytics:

```typescript
logger.info = (obj, msg) => {
  analytics.track(msg, obj);
};
```

## Troubleshooting

### Logs não aparecem

- Verifique o nível de log configurado
- Verifique se há filtros no console
- Verifique se está em modo de desenvolvimento

### Performance degradada

- Verifique se há logs em hot paths
- Ajuste o nível de log para menos verboso
- Verifique se há throttling adequado

## Status

✅ Sistema completamente implementado
✅ Todos os contextos principais cobertos
✅ Logs não intrusivos
✅ Otimizado para performance
✅ Estruturado para análise

## Próximos Passos

- [ ] Integração com serviço de logging remoto
- [ ] Dashboard de análise de logs
- [ ] Alertas automáticos para erros críticos
- [ ] Métricas de performance baseadas em logs
