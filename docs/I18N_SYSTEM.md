# Sistema de Internacionalização (i18n)

## Visão Geral

O sistema de internacionalização foi implementado usando **react-i18next**, permitindo que o jogo seja traduzido para múltiplos idiomas. Atualmente, os idiomas suportados são:

- **Português (Brasil)** - `pt-BR` (padrão)
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
│   └── LanguageSelector.tsx         # Componente seletor de idioma (oculto no mobile)
└── main.tsx                         # Importação da configuração i18n
```

## Configuração

### Arquivo de Configuração (`src/i18n/config.ts`)

O sistema de i18n é configurado para:

- Detectar automaticamente o idioma do navegador
- Salvar a preferência do usuário no `localStorage` (chave: `i18nextLng`)
- Usar `pt-BR` como idioma padrão (fallback)
- Suportar React sem Suspense
- Recarregar recursos quando o idioma muda

### Detecção de Idioma

O sistema detecta o idioma na seguinte ordem:

1. **localStorage** - Idioma salvo pelo usuário (`i18nextLng`)
2. **Navegador** - Idioma do navegador (`navigator.language`)
3. **Fallback** - `pt-BR` como padrão

### Persistência

A preferência de idioma é automaticamente salva no `localStorage` quando o usuário muda o idioma usando o seletor.

## Arquivos de Tradução

Os arquivos de tradução estão organizados por contexto e seguem uma estrutura hierárquica.

### Estrutura de Chaves

```json
{
  "common": {
    "play": "Jogar",
    "pause": "Pausar",
    "gameOver": "Game Over"
  },
  "phases": {
    "phase1": {
      "name": "Cobra Clássica",
      "description": "..."
    }
  },
  "bosses": {
    "classic": {
      "name": "O Clássico",
      "description": "...",
      "behavior": "..."
    }
  },
  "powerUps": {
    "speedBoost": {
      "name": "Velocidade Aumentada",
      "description": "..."
    }
  }
}
```

## Componentes Traduzidos

### Componentes Principais

- ✅ `App.tsx` - Interface principal
- ✅ `GameInfo.tsx` - Informações do jogo
- ✅ `StatusBar.tsx` - Barra de status
- ✅ `GameControls.tsx` - Controles
- ✅ `PhaseIntroScreen.tsx` - Tela de introdução
- ✅ `PhaseCompleteScreen.tsx` - Tela de conclusão
- ✅ `BossDefeatTransition.tsx` - Animação de derrota do boss
- ✅ `DeathTransition.tsx` - Animação de morte
- ✅ `GameStatistics.tsx` - Estatísticas
- ✅ `BossDebugPanel.tsx` - Painel de debug de bosses
- ✅ `PhaseDebugPanel.tsx` - Painel de debug de fases

### Componentes de Power-Ups

- ✅ `ActivePowerUps.tsx` - Power-ups ativos
- ✅ `MobileFloatingInfo.tsx` - Informações mobile
- ✅ `PowerUpToast.tsx` - Toasts de power-ups

### Componentes de Sistema

- ✅ `LanguageSelector.tsx` - Seletor de idioma (oculto no mobile)
- ✅ Todas as mensagens de erro e validação

## Uso nos Componentes

### Hook useTranslation

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return <div>{t('common.play')}</div>;
}
```

### Interpolação

```typescript
// Tradução
{
  "welcome": "Bem-vindo, {{name}}!"
}

// Uso
t('welcome', { name: 'Jogador' })
```

### Pluralização

```typescript
// Tradução
{
  "items_one": "{{count}} item",
  "items_other": "{{count}} itens"
}

// Uso
t('items', { count: 5 })
```

## Contextos de Tradução

### Fases

Todas as 10 fases têm traduções completas:

- Nome da fase
- Descrição
- Tipo de nível

### Bosses

Todos os 10 bosses têm traduções completas:

- Nome do boss
- Descrição
- Comportamento/táticas

### Power-Ups

Todos os 10 power-ups têm traduções:

- Nome do power-up
- Descrição do efeito

### UI e Mensagens

- Botões e ações
- Mensagens de status
- Mensagens de transição
- Estatísticas
- Conquistas
- Mensagens de erro

## Características Especiais

### Seletor de Idioma

O componente `LanguageSelector` permite ao usuário escolher o idioma:

- Disponível no header (desktop)
- Oculto no mobile para economizar espaço
- Persiste a escolha automaticamente

### Tradução Dinâmica

Algumas strings são geradas dinamicamente:

- Nomes de fases e bosses são traduzidos via funções helper
- Estatísticas usam interpolação para números
- Mensagens de transição incluem informações dinâmicas

## Exemplos de Tradução

### Português (pt-BR)

```json
{
  "phases": {
    "phase1": {
      "name": "Cobra Clássica",
      "description": "O jogo clássico sem obstáculos"
    }
  },
  "bosses": {
    "classic": {
      "name": "O Clássico",
      "description": "Um boss básico que segue padrões simples",
      "behavior": "Move-se de forma previsível"
    }
  },
  "powerUps": {
    "speedBoost": {
      "name": "Velocidade Aumentada",
      "description": "Move mais rápido por 5 segundos"
    }
  }
}
```

### Inglês (en-US)

```json
{
  "phases": {
    "phase1": {
      "name": "Classic Snake",
      "description": "The classic game without obstacles"
    }
  },
  "bosses": {
    "classic": {
      "name": "The Classic",
      "description": "A basic boss that follows simple patterns",
      "behavior": "Moves predictably"
    }
  },
  "powerUps": {
    "speedBoost": {
      "name": "Speed Boost",
      "description": "Move faster for 5 seconds"
    }
  }
}
```

## Adicionar Novo Idioma

Para adicionar um novo idioma:

1. Criar arquivo `src/i18n/locales/[codigo-idioma].json`
2. Copiar estrutura de `pt-BR.json` ou `en-US.json`
3. Traduzir todas as strings
4. Adicionar o código do idioma em `src/i18n/config.ts`:

```typescript
resources: {
  'pt-BR': { translation: ptBR },
  'en-US': { translation: enUS },
  'es-ES': { translation: esES }, // Novo idioma
}
```

## Boas Práticas

1. **Chaves Descritivas**: Use chaves que descrevam o contexto
   - ✅ `phases.phase1.name`
   - ❌ `p1n`

2. **Interpolação**: Use interpolação para valores dinâmicos
   - ✅ `t('score', { value: score })`
   - ❌ `t('score') + ' ' + score`

3. **Namespace**: Organize por contexto (phases, bosses, powerUps, etc.)

4. **Consistência**: Mantenha a mesma estrutura em todos os arquivos de idioma

## Troubleshooting

### Idioma não muda

- Verifique se o arquivo de tradução está importado em `config.ts`
- Verifique se a chave existe no arquivo JSON
- Limpe o `localStorage` e recarregue

### Tradução não aparece

- Verifique se está usando a chave correta
- Verifique se há erros no console
- Use `t('chave', { defaultValue: 'Fallback' })` para debug

## Status

✅ Sistema completamente implementado e funcional
✅ Todas as strings do jogo traduzidas
✅ Suporte para 2 idiomas (pt-BR, en-US)
✅ Seletor de idioma funcional
✅ Persistência de preferência
✅ Detecção automática de idioma
