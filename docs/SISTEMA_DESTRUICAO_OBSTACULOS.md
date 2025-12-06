# Sistema Genérico de Destruição de Obstáculos

## Visão Geral

O sistema de física de destruição de obstáculos é **genérico e padronizado** para todo o jogo. Todos os mecanismos que destroem obstáculos usam o mesmo sistema, garantindo consistência física e visual.

## Arquitetura

### Arquivo: `src/utils/obstacleDestruction.ts`

Contém todas as funções genéricas para destruição de obstáculos:

1. **`destroyObstacles()`** - Função principal genérica
2. **`destroyObstaclesAtPositions()`** - Destruição por posição
3. **`canDestroyObstacle()`** - Validação de destruibilidade

## Configuração Padronizada

```typescript
OBSTACLE_DESTRUCTION_CONFIG = {
  particles: {
    count: 8, // Número de partículas
    color: '#ef4444', // Cor vermelha
    lifetime: 400, // Tempo de vida em ms
  },
};
```

**IMPORTANTE**: Esta configuração é a mesma para **TODOS** os tipos de destruição no jogo.

## Física de Destruição

### Processo Padronizado

1. **Identificação**: Obstáculos a serem destruídos são identificados
2. **Remoção**: Obstáculos são removidos da lista
3. **Partículas**: Partículas de destruição são criadas na posição de cada obstáculo
4. **Resultado**: Retorna lista atualizada de obstáculos e partículas

### Efeitos Visuais

- **Cor**: Vermelho (`#ef4444`)
- **Quantidade**: 8 partículas por obstáculo
- **Duração**: 400ms por partícula
- **Posição**: Partículas aparecem na posição do obstáculo destruído

## Usos no Jogo

### 1. Poison Shots (Tiro de Veneno)

**Localização**: `src/hooks/useGameLoop.ts` - função `handlePoisonShotsObstacles()`

```typescript
const destructionResult = destroyObstacles(
  newObstacles,
  poisonUpdateResult.hitObstacles,
  newParticles,
);
```

**Comportamento**:

- Poison shot atinge obstáculo
- Obstáculo é destruído usando sistema genérico
- Partículas de destruição são criadas

### 2. Futuros Mecanismos

O sistema genérico permite facilmente adicionar novos mecanismos de destruição:

- Explosões
- Outros tipos de tiros
- Habilidades especiais
- Power-ups de destruição

Todos usarão o mesmo sistema físico e visual.

## Garantias do Sistema

✅ **Física Consistente**: Mesmo comportamento em todas as situações
✅ **Visual Padronizado**: Mesmas partículas e efeitos
✅ **Código Reutilizável**: Funções genéricas para qualquer uso
✅ **Fácil Manutenção**: Mudanças centralizadas no arquivo de destruição
✅ **Extensível**: Fácil adicionar novos mecanismos

## Interface de Uso

### Função Principal

```typescript
destroyObstacles(
  obstacles: Obstacle[],
  obstaclesToDestroy: Obstacle[] | string[],
  existingParticles: Particle[] = [],
): ObstacleDestructionResult
```

### Exemplo de Uso

```typescript
// Destruir obstáculos por referência
const result = destroyObstacles(currentObstacles, [obstacle1, obstacle2], currentParticles);

// Destruir obstáculos por ID
const result = destroyObstacles(
  currentObstacles,
  ['obstacle-id-1', 'obstacle-id-2'],
  currentParticles,
);

// Usar resultado
newObstacles = result.remainingObstacles;
newParticles = result.particles;
```

### Destruição por Posição

```typescript
const result = destroyObstaclesAtPositions(
  currentObstacles,
  [
    { x: 10, y: 15 },
    { x: 11, y: 15 },
  ],
  currentParticles,
);
```

## Validações

### `canDestroyObstacle(obstacle: Obstacle): boolean`

Atualmente retorna `true` para todos os obstáculos. Futuramente pode ser estendido para:

- Obstáculos invencíveis
- Obstáculos que requerem múltiplos hits
- Obstáculos especiais

## Integração no Game Loop

O sistema está integrado no game loop em:

```
src/hooks/useGameLoop.ts
  └─ handlePoisonShotsObstacles()
      └─ destroyObstacles() [SISTEMA GENÉRICO]
```

## Estrutura de Dados

### ObstacleDestructionResult

```typescript
{
  remainingObstacles: Obstacle[],  // Obstáculos restantes
  destroyedObstacles: Obstacle[],  // Obstáculos destruídos
  particles: Particle[]            // Partículas criadas
}
```

## Considerações de Performance

- Partículas são limitadas globalmente (`PERFORMANCE_CONFIG.maxParticles`)
- Obstáculos são limitados (`OBSTACLE_CONFIG.maxObstacles`)
- Sistema é otimizado para processar múltiplos obstáculos simultaneamente

## Futuras Expansões

O sistema genérico permite fácil expansão para:

- Diferentes tipos de destruição (explosão, laser, etc.)
- Obstáculos com diferentes resistências
- Efeitos visuais customizados por tipo
- Sons de destruição
- Pontuação por destruição

## Conclusão

O sistema de destruição de obstáculos é **completamente genérico e padronizado**. Qualquer mecanismo que destrua obstáculos deve usar as funções em `src/utils/obstacleDestruction.ts` para garantir consistência física e visual em todo o jogo.
