# Sistema de Internacionalização (i18n)

## Visão Geral

O sistema de internacionalização foi implementado usando **react-i18next**, permitindo que o jogo seja traduzido para múltiplos idiomas. Atualmente, os idiomas suportados são:

- **Português (Brasil)** - `pt-BR`
- **Inglês (US)** - `en-US`

## Estrutura de Arquivos

```
src/
├── i18n/
│   ├── config.ts                    # Configuração do i18next
│   └── locales/
│       ├── pt-BR.json              # Traduções em Português
│       └── en-US.json              # Traduções em Inglês
├── components/
│   └── LanguageSelector.tsx         # Componente seletor de idioma
└── main.tsx                         # Importação da configuração i18n
```

## Configuração

### Arquivo de Configuração (`src/i18n/config.ts`)

O sistema de i18n é configurado para:

- Detectar automaticamente o idioma do navegador
- Salvar a preferência do usuário no `localStorage`
- Usar `en-US` como idioma padrão (fallback)
- Suportar React sem Suspense

### Detecção de Idioma

O sistema detecta o idioma na seguinte ordem:

1. **localStorage** - Idioma salvo pelo usuário
2. **Navegador** - Idioma do navegador (`navigator.language`)
3. **Fallback** - `en-US` como padrão

## Arquivos de Tradução

Os arquivos de tradução estão organizados por contexto:

### Estrutura de Chaves

```json
{
  "common": {
    "phase": "Fase",
    "level": "Nível",
    "score": "Pontuação",
    ...
  },
  "gameStatus": {
    "pressSpaceToStart": "Pressione ESPAÇO para iniciar",
    "playing": "Jogando...",
    ...
  },
  "statusBar": {
    "length": "Tamanho",
    "lives": "Vidas",
    ...
  },
  "controls": {
    "instructions": "..."
  },
  "phase": {
    "phase": "FASE",
    "complete": "COMPLETA!",
    ...
  },
  "phaseComplete": {
    "title": "FASE {{phaseNumber}} COMPLETA!",
    "scoreGained": "Pontuação",
    ...
  },
  "bossDefeat": {
    "victory": "VITÓRIA!",
    ...
  },
  "death": {
    "lifeLost": "Vida Perdida!",
    "continuingIn": "Continuing in {{seconds}} seconds...",
    "livesRemaining": "{{count}} vida restante",
    "livesRemaining_plural": "{{count}} vidas restantes"
  },
  "powerUps": {
    "speedBoost": "Speed Boost",
    ...
  },
  "powerUpDescriptions": {
    "speedBoost": "Mova-se mais rápido por 5s",
    ...
  },
  "phases": {
    "classicSnake": {
      "name": "Classic Snake",
      "description": "..."
    },
    ...
  },
  "statistics": {
    "title": "Estatísticas do Jogo",
    ...
  },
  "language": {
    "title": "Idioma",
    "ptBR": "Português (Brasil)",
    "enUS": "English (US)"
  },
  "panels": {
    "powerUps": "Power-Ups",
    "combo": "Combo"
  },
  "phaseDisplay": {
    "phase": "Fase",
    "levelInPhase": "Nível {{current}}/5 da Fase"
  },
  "debug": {
    "selectBoss": "Selecione um boss para testar:",
    ...
  }
}
```

### Interpolação

O sistema suporta interpolação de variáveis:

```typescript
t('phaseComplete.title', { phaseNumber: 5 });
// Resultado: "FASE 5 COMPLETA!"
```

### Pluralização

O sistema suporta pluralização automática:

```typescript
t('death.livesRemaining', { count: 1 });
// Resultado: "1 vida restante"

t('death.livesRemaining', { count: 3 });
// Resultado: "3 vidas restantes"
```

## Componentes Atualizados

Os seguintes componentes foram atualizados para usar o sistema de i18n:

### Componentes Principais

1. **StatusMessage** - Mensagens de status do jogo
2. **GameControls** - Botões de controle (Start, Pause, Resume, etc.)
3. **StatusBar** - Barra de status (Length, Lives, Phase)
4. **PhaseTransition** - Transições de fase
5. **PhaseIntroScreen** - Tela de introdução da fase
6. **PhaseCompleteScreen** - Tela de fase completa
7. **DeathTransition** - Transição de morte
8. **BossDefeatTransition** - Transição de derrota do boss
9. **PhaseDisplay** - Exibição da fase atual
10. **LanguageSelector** - Seletor de idioma

### Componente App

O componente principal (`App.tsx`) foi atualizado para:

- Importar o hook `useTranslation`
- Usar traduções em instruções e textos do painel
- Incluir o seletor de idioma no header

## Uso nos Componentes

### Hook `useTranslation`

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return <div>{t('common.phase')}</div>;
}
```

### Interpolação com Variáveis

```typescript
const { t } = useTranslation();
const phaseNumber = 5;

return <div>{t('phaseComplete.title', { phaseNumber })}</div>;
```

### Pluralização

```typescript
const { t } = useTranslation();
const lives = 3;

return <div>{t('death.livesRemaining', { count: lives - 1 })}</div>;
```

### HTML com Interpolação

Para textos com HTML (como instruções com `<kbd>`):

```typescript
<p dangerouslySetInnerHTML={{ __html: t('controls.instructions') }} />
```

## Seletor de Idioma

O componente `LanguageSelector` foi criado e adicionado ao header do jogo. Ele permite:

- Selecionar entre os idiomas disponíveis
- Salvar a preferência no `localStorage`
- Atualizar a interface automaticamente ao mudar o idioma

### Localização

O seletor de idioma está localizado no header, no canto superior direito.

## Adicionar Novos Idiomas

Para adicionar um novo idioma:

1. **Criar arquivo de tradução** em `src/i18n/locales/`:

   ```json
   // src/i18n/locales/es-ES.json
   {
     "common": {
       "phase": "Fase",
       ...
     }
   }
   ```

2. **Atualizar configuração** em `src/i18n/config.ts`:

   ```typescript
   import esES from './locales/es-ES.json';

   i18n.init({
     resources: {
       'pt-BR': { translation: ptBR },
       'en-US': { translation: enUS },
       'es-ES': { translation: esES }, // Novo idioma
     },
     // ...
   });
   ```

3. **Adicionar opção no seletor** em `src/components/LanguageSelector.tsx`:

   ```typescript
   <option value="es-ES">{t('language.esES')}</option>
   ```

4. **Adicionar tradução do nome** nos arquivos de tradução:
   ```json
   "language": {
     "esES": "Español (España)"
   }
   ```

## Melhores Práticas

1. **Organização**: Mantenha as chaves organizadas por contexto (common, gameStatus, phase, etc.)

2. **Nomes Descritivos**: Use nomes de chaves descritivos e hierárquicos:
   - ✅ `phaseComplete.title`
   - ❌ `title1`

3. **Reutilização**: Use chaves comuns para textos repetidos:
   - ✅ `common.start`, `common.pause`
   - ❌ Duplicar textos

4. **Interpolação**: Use interpolação para valores dinâmicos:
   - ✅ `t('phaseComplete.title', { phaseNumber })`
   - ❌ `t('phaseComplete.title') + ' ' + phaseNumber`

5. **Pluralização**: Use pluralização para textos com números:
   - ✅ `t('death.livesRemaining', { count })`
   - ❌ `count === 1 ? 'vida' : 'vidas'`

## Manutenção

### Atualizar Traduções

1. Edite os arquivos JSON em `src/i18n/locales/`
2. Mantenha a estrutura consistente entre idiomas
3. Teste todas as traduções no jogo

### Adicionar Novas Chaves

1. Adicione a chave em todos os arquivos de tradução
2. Use a tradução nos componentes
3. Verifique se não há textos hardcoded restantes

## Status da Implementação

### ✅ Componentes Completos

- StatusMessage
- GameControls
- StatusBar
- PhaseTransition
- PhaseIntroScreen
- PhaseCompleteScreen
- DeathTransition
- BossDefeatTransition
- PhaseDisplay
- LanguageSelector
- App (instruções e painéis)

### 🔄 Componentes Parciais

Alguns componentes ainda podem ter textos hardcoded. Verifique:

- GameStatistics
- ActivePowerUps
- MobileFloatingInfo
- BossDebugPanel
- AchievementNotification

## Conclusão

O sistema de internacionalização está funcional e permite traduzir o jogo para múltiplos idiomas. O sistema é extensível e fácil de manter, seguindo as melhores práticas do react-i18next.
