# Internationalization (i18n) System

## Overview

Internationalization uses **react-i18next**, supporting multiple languages. Currently supported:

- **Portuguese (Brazil)** — `pt-BR` (default)
- **English (US)** — `en-US`

## File Structure

```
src/
├── i18n/
│   ├── config.ts                    # i18next configuration
│   └── locales/
│       ├── pt-BR.json              # Portuguese strings
│       └── en-US.json              # English strings
├── components/
│   └── LanguageSelector.tsx         # Language selector (hidden on mobile)
└── main.tsx                         # i18n config import
```

## Configuration

### Config File (`src/i18n/config.ts`)

The i18n setup:

- Detects browser language automatically
- Saves user preference in `localStorage` (key: `i18nextLng`)
- Uses `pt-BR` as fallback
- Works with React without Suspense
- Reloads resources when language changes

### Language Detection Order

1. **localStorage** — Saved preference (`i18nextLng`)
2. **Browser** — `navigator.language`
3. **Fallback** — `pt-BR`

### Persistence

Changing language via the selector saves to `localStorage` automatically.

## Translation Files

Files are organized by context in a hierarchical key structure.

### Key Structure

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

## Translated Components

### Main UI

- ✅ `App.tsx` — Main shell
- ✅ `GameInfo.tsx` — Game info
- ✅ `StatusBar.tsx` — Status bar
- ✅ `GameControls.tsx` — Controls
- ✅ `PhaseIntroScreen.tsx` — Phase intro
- ✅ `PhaseCompleteScreen.tsx` — Phase complete
- ✅ `BossDefeatTransition.tsx` — Boss defeat animation
- ✅ `DeathTransition.tsx` — Death animation
- ✅ `GameStatistics.tsx` — Statistics
- ✅ `BossDebugPanel.tsx` — Boss debug panel
- ✅ `PhaseDebugPanel.tsx` — Phase debug panel

### Power-Ups

- ✅ `ActivePowerUps.tsx` — Active power-ups
- ✅ `MobileFloatingInfo.tsx` — Mobile info
- ✅ `PowerUpToast.tsx` — Power-up toasts

### System

- ✅ `LanguageSelector.tsx` — Language selector (hidden on mobile)
- ✅ Error and validation messages

## Usage in Components

### useTranslation Hook

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return <div>{t('common.play')}</div>;
}
```

### Interpolation

```typescript
// Translation
{
  "welcome": "Welcome, {{name}}!"
}

// Usage
t('welcome', { name: 'Player' })
```

### Pluralization

```typescript
// Translation
{
  "items_one": "{{count}} item",
  "items_other": "{{count}} items"
}

// Usage
t('items', { count: 5 })
```

## Translation Contexts

### Phases

All 10 phases include:

- Phase name
- Description
- Level type

### Bosses

All 10 bosses include:

- Boss name
- Description
- Behavior/tactics

### Power-Ups

All 10 power-ups include:

- Name
- Effect description

### UI and Messages

- Buttons and actions
- Status messages
- Transition copy
- Statistics
- Achievements
- Errors

## Special Behavior

### Language Selector

`LanguageSelector` lets users pick a language:

- Available in the header (desktop)
- Hidden on mobile to save space
- Persists choice automatically

### Dynamic Strings

Some strings are built at runtime:

- Phase and boss names via helper functions
- Statistics use numeric interpolation
- Transition messages include dynamic data

## Translation Examples

### Portuguese (pt-BR)

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

### English (en-US)

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

## Adding a New Language

1. Create `src/i18n/locales/[locale-code].json`
2. Copy structure from `pt-BR.json` or `en-US.json`
3. Translate all strings
4. Register in `src/i18n/config.ts`:

```typescript
resources: {
  'pt-BR': { translation: ptBR },
  'en-US': { translation: enUS },
  'es-ES': { translation: esES }, // New locale
}
```

## Best Practices

1. **Descriptive keys:** Context in the key path
   - ✅ `phases.phase1.name`
   - ❌ `p1n`

2. **Interpolation:** Dynamic values via placeholders
   - ✅ `t('score', { value: score })`
   - ❌ `t('score') + ' ' + score`

3. **Namespaces:** Group by domain (phases, bosses, powerUps, etc.)

4. **Consistency:** Same structure in every locale file

## Troubleshooting

### Language does not change

- Confirm locale is imported in `config.ts`
- Confirm key exists in JSON
- Clear `localStorage` and reload

### Missing translation

- Verify key path
- Check console errors
- Use `t('key', { defaultValue: 'Fallback' })` for debugging

## Status

✅ Fully implemented  
✅ All game strings translated  
✅ Two locales (pt-BR, en-US)  
✅ Working language selector  
✅ Preference persistence  
✅ Automatic language detection  
