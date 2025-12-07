# Sistema de Combate Estratégico - Todos os Bosses

## Visão Geral

Todos os bosses (10 bosses no total) usam o **mesmo sistema de combate estratégico** padronizado. O sistema funciona de forma idêntica para todos os bosses, garantindo consistência e previsibilidade.

## Regras de Combate (Aplicadas a TODOS os Bosses)

### 1. Colisão com Corpo do Boss

- **Ação**: Enfraquece o boss
- **Efeito**: Remove 2 segmentos do boss
- **Pontos**: 20 pontos (10 pontos por segmento)
- **Partículas**: Cria partículas de enfraquecimento

### 2. Colisão com Cabeça do Boss (Quando Fraco)

- **Condição**: Boss deve ter ≤3 segmentos
- **Ação**: Derrota o boss
- **Efeito**: Boss é removido, recompensas aplicadas
- **Partículas**: Cria partículas de derrota (30 partículas, 1500ms)

### 3. Colisão com Cabeça do Boss (Quando Forte)

- **Condição**: Boss tem >3 segmentos
- **Ação**: Player perde vida/game over
- **Efeito**:
  - Se tiver vidas: entra em estado DYING
  - Se não tiver vidas: Game Over

## Sistema de Enfraquecimento

### Função: `canDefeatBoss(bossSnake)`

- Retorna `true` se o boss tem ≤3 segmentos
- Retorna `false` se o boss tem >3 segmentos
- **Aplicado a TODOS os bosses sem exceção**

### Função: `weakenBossSnake(bossSnake, segmentsToRemove)`

- Remove segmentos da cauda do boss
- Por padrão remove 2 segmentos por colisão no corpo
- Calcula pontos: `segmentsToRemove * 10`
- **Aplicado a TODOS os bosses sem exceção**

## Poison Shots vs Boss

### Cabeça do Boss (Poison Shot)

- **Se boss fraco (≤3 segmentos)**: Derrota imediata
- **Se boss forte (>3 segmentos)**: Enfraquece 1 segmento

### Corpo do Boss (Poison Shot)

- **Sempre**: Enfraquece 1 segmento
- **Pontos**: 10 pontos por segmento

## Bosses com o Sistema Padronizado

1. **O Clássico** (Fase 1) - ✅ Sistema aplicado
2. **O Guardião** (Fase 2) - ✅ Sistema aplicado (+ mecânica de flag)
3. **O Desafiador** (Fase 3) - ✅ Sistema aplicado
4. **O Portal** (Fase 4) - ✅ Sistema aplicado
5. **O Veloz** (Fase 5) - ✅ Sistema aplicado
6. **O Caos** (Fase 6) - ✅ Sistema aplicado
7. **O Arquiteto** (Fase 7) - ✅ Sistema aplicado
8. **O Sobrevivente** (Fase 8) - ✅ Sistema aplicado
9. **O Vortex** (Fase 9) - ✅ Sistema aplicado
10. **O Supremo** (Fase 10) - ✅ Sistema aplicado

## Diferenças Permitidas

### Mecânica Especial do Guardian

- O Guardian tem uma mecânica adicional: **captura de flag**
- Se você capturar a flag, o boss é derrotado instantaneamente
- **MAS** o sistema de combate normal ainda funciona normalmente
- Você pode escolher: capturar a flag OU enfraquecer/derrotar pelo combate normal

### Comprimento Inicial dos Bosses

- Diferentes bosses começam com diferentes comprimentos:
  - Classic: 3 segmentos
  - Guardian: 4 segmentos
  - Challenger: 5 segmentos
  - Portal: 5 segmentos
  - Speed: 6 segmentos
  - Chaos: 6 segmentos
  - Architect: 7 segmentos
  - Survivor: 7 segmentos
  - Vortex: 8 segmentos
  - Supreme: 10 segmentos

**IMPORTANTE**: Independente do comprimento inicial, todos usam as mesmas regras:

- ≤3 segmentos = pode ser derrotado
- > 3 segmentos = muito forte, causa dano ao player

## Garantias

✅ Todos os bosses usam `getBossHitPart()` para detectar colisão
✅ Todos os bosses usam `canDefeatBoss()` para verificar se podem ser derrotados
✅ Todos os bosses usam `weakenBossSnake()` para enfraquecimento
✅ Todos os bosses usam `handleBossDefeat()` para recompensas de derrota
✅ Poison shots funcionam igual para todos os bosses
✅ Partículas de combate funcionam igual para todos os bosses

## Código de Combate

O sistema de combate está implementado em:

- `src/workers/game.worker.ts` - Lógica principal (dentro do game loop)
- `src/utils/bossSnake.ts` - Funções auxiliares de combate

Todas as verificações são **genéricas** e não dependem do tipo de boss. O sistema funciona automaticamente para todos os bosses através do `bossSnake` e `activeBoss`.
