# Plano de Refatoração do useGameLoop.ts

## Status Atual

- **Tamanho**: 1268 linhas
- **Complexidade**: Muito alta - função `updateGame` com ~880 linhas
- **Problemas identificados**:
  - Código duplicado removido (flag capture)
  - Função `updateGame` muito grande e complexa
  - Lógica de múltiplos sistemas misturada

## Estrutura Proposta

### 1. Extrair funções auxiliares por responsabilidade

#### Direção e Movimento (`handleDirection`)

- Processamento de mudança de direção
- Verificação de segurança
- Aplicação de controles reversos

#### Colisões e Teleporte (`handleCollisions`)

- Detecção de colisões (obstáculos, self-collision)
- Teleporte através de portais
- Verificação de flag capture

#### Comida e Power-ups (`handleFood`)

- Processamento de comida
- Aplicação de efeitos de power-ups
- Crescimento/redução da snake
- Ativação de power-ups temporários

#### Obstáculos (`handleObstacles`)

- Geração de obstáculos
- Atualização de spawn timer
- Limpeza de obstáculos expirados

#### Boss (`handleBoss`)

- Inicialização do boss
- Movimento do boss
- Processamento de habilidades
- Colisões com boss
- Derrota do boss

#### Poison Shots (`handlePoisonShots`)

- Movimento de shots
- Colisões com obstáculos
- Colisões com boss

#### Fase e Nível (`handlePhase`)

- Detecção de mudança de fase
- Configuração de fase
- Geração de comida baseada em fase

## Implementação

### Fase 1: Criar funções auxiliares (dentro do arquivo)

- Manter tudo no mesmo arquivo inicialmente
- Facilita a refatoração gradual
- Permite testar cada parte isoladamente

### Fase 2: Organizar em módulos separados (futuro)

- `utils/gameUpdates/` - funções de atualização
- `utils/gameUpdates/direction.ts`
- `utils/gameUpdates/food.ts`
- `utils/gameUpdates/boss.ts`
- etc.

## Benefícios

1. **Legibilidade**: Código mais fácil de ler e entender
2. **Manutenibilidade**: Funções menores são mais fáceis de manter
3. **Testabilidade**: Funções isoladas são mais fáceis de testar
4. **Reutilização**: Funções podem ser reutilizadas
5. **Debugging**: Mais fácil encontrar e corrigir bugs

## Próximos Passos

1. ✅ Remover código duplicado
2. ✅ Corrigir warnings do linter
3. ✅ Extrair função de direção (`handleDirection`)
4. ✅ Extrair função de comida (`handleFoodAndPowerUps`)
5. ✅ Extrair função de portal/teleporte (`handlePortalTeleport`)
6. ✅ Extrair função de obstáculos (`handleObstacles`)
7. ✅ Extrair função de poison shots (`handlePoisonShotsObstacles`)
8. ⏳ Extrair função de boss (lógica complexa - ~400 linhas)

## Progresso Atual

- **Tamanho atual**: 1461 linhas
- **Funções extraídas**: 5 de 7 planejadas
- **Redução na função updateGame**: ~280 linhas extraídas
- **Status**: Código muito mais organizado e manutenível
