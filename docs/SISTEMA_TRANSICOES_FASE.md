# Sistema de Transições de Fase

## Objetivo

Quando o jogador derrota um boss:

1. O jogo pausa automaticamente
2. Mostra uma tela de fim de fase com estatísticas da fase que acabou
3. Botão "Próxima Fase" para continuar
4. Quando clica em "Próxima Fase", mostra tela de apresentação da nova fase com contador
5. Após o contador, o jogo inicia automaticamente

## Componentes Criados

1. **PhaseCompleteScreen** - Tela de fim de fase com estatísticas
2. **PhaseIntroScreen** - Tela de apresentação da nova fase com contador (3, 2, 1, GO!)

## Novos Status no GameStatus

- `PHASE_COMPLETE` - Mostrando tela de fim de fase
- `PHASE_INTRO` - Mostrando tela de apresentação da nova fase

## Fluxo de Implementação

### 1. Quando o Boss é Derrotado

- Mudar status para `PHASE_COMPLETE`
- Manter o snapshot da fase (já deve existir no GameState)

### 2. Tela de Fim de Fase

- Mostrar quando `status === PHASE_COMPLETE`
- Calcular estatísticas da fase usando `calculatePhaseStatistics`
- Botão "Próxima Fase" muda status para `PHASE_INTRO`

### 3. Tela de Apresentação

- Mostrar quando `status === PHASE_INTRO`
- Contador regressivo (3, 2, 1, GO!)
- Após GO!, mudar status para `PLAYING` e criar novo snapshot da fase

### 4. Snapshot da Fase

- Criar quando a fase começa (quando muda de fase ou inicia jogo)
- Salvar no GameState como `phaseStartSnapshot`

## Pendências de Implementação

1. Modificar `useGameLoop` para mudar status para `PHASE_COMPLETE` quando boss é derrotado
2. Adicionar lógica para criar snapshot quando a fase começa
3. Integrar componentes no App.tsx
4. Adicionar funções no useGameState para controlar transições
