# Snake Game 🐍

Um jogo Snake moderno e completo desenvolvido com React, TypeScript e Vite. Interface moderna, responsiva, totalmente internacionalizada e com sistema de progressão complexo incluindo fases, bosses, power-ups, efeitos climáticos visuais e muito mais.

**Agora com arquitetura multi-thread de alta performance (60 FPS no Mobile)!**

## 🚀 Tecnologias

- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool rápido
- **Web Workers** - Processamento paralelo (Lógica, Renderização, Clima, Partículas)
- **OffscreenCanvas** - Renderização gráfica fora da thread principal
- **CSS Modules** - Estilização escopada
- **i18next & react-i18next** - Sistema de internacionalização
- **Pino** - Sistema de logging estruturado
- **pnpm** - Gerenciador de pacotes

## 📦 Instalação

```bash
# Instalar dependências
pnpm install

# Ou usando npm
npm install
```

## 🎮 Como Jogar

1. Inicie o servidor de desenvolvimento:

   ```bash
   pnpm dev
   # ou
   npm run dev
   ```

2. **Controles Desktop:**
   - Use as **setas do teclado** ou **WASD** para mover a cobra
   - Pressione **ESPAÇO** para iniciar/pausar o jogo
   - **F1** ou **Ctrl+D**: Abrir painel de debug de bosses
   - **F3** ou **Ctrl+F**: Abrir painel de debug de fases

3. **Controles Mobile:**
   - **Joystick Analógico** (esquerda): Controle preciso de direção
   - **Botão FIRE** (direita): Dispara veneno para destruir obstáculos e bosses
   - **Feedback Tátil**: Vibração ao interagir
   - Controles sempre visíveis e otimizados para touch

4. **Objetivo:**
   - Coma a comida para crescer e ganhar pontos
   - Complete 5 níveis em cada fase para enfrentar o boss
   - Derrote os 10 bosses para completar o jogo!

## 🎯 Funcionalidades Principais

### 🎲 Sistema de Progressão

- **10 Fases** únicas com 5 níveis cada (50 níveis totais)
- **10 Bosses Únicos** - Um chefe especial no final de cada fase
- Sistema de dificuldade progressiva
- Níveis dinâmicos com mecânicas diferentes por fase
- Sistema de debug para testar fases e bosses específicos

### 🌍 Internacionalização (i18n)

- Suporte completo para **Português (Brasil)** e **English (US)**
- Detecção automática do idioma do navegador
- Persistência da preferência de idioma no localStorage
- Seletor de idioma na interface (oculto no mobile)
- Todas as strings do jogo traduzidas

### 🌦️ Sistema de Efeitos Climáticos

Cada fase possui seu próprio clima visual único que reflete o tema do boss:

1. **Fase 1 - Clima Limpo/Estrelado** - Céu estrelado brilhante
2. **Fase 2 - Névoa Azul Mística** - Névoa flutuante e luzes protetoras
3. **Fase 3 - Deserto com Areia** - Partículas de areia e ondas de calor
4. **Fase 4 - Clima Cósmico/Espacial** - Partículas cósmicas e nebulosa roxa
5. **Fase 5 - Fogo e Velocidade** - Chamas e rastros de velocidade
6. **Fase 6 - Psicodélico/Caótico** - Partículas multicoloridas e ondas caóticas
7. **Fase 7 - Neblina e Geometria** - Névoa índigo e formas geométricas flutuantes
8. **Fase 8 - Apocalíptico/Lava** - Cinzas caindo e pontos de lava pulsantes
9. **Fase 9 - Tempestade** - Relâmpagos, chuva, nuvens escuras e vento
10. **Fase 10 - Celestial/Divino** - Partículas douradas, aurora e luz divina

### ⚡ Power-Ups

- **⚡ Velocidade** - Move mais rápido por 5s
- **💰 Pontos Bônus** - Ganhe +30 pontos
- **📈 Crescimento Extra** - Cresça 2 segmentos
- **👻 Fantasma** - Passe por obstáculos por 6s
- **🎴 Coringa** - Efeito positivo aleatório
- **❤️ Vida Extra** - Adiciona uma vida
- **🌀 Portal** - Ativa um par de portais
- **☠️ Veneno** - Perde 2 segmentos, -5 pts
- **🔄 Controles Revertidos** - Controles invertidos por 4s
- **🐌 Desaceleração** - Movimento mais lento por 3s

### 🏗️ Mecânicas de Jogo

- **Obstáculos** - Estáticos e móveis que aparecem nas fases
- **Portais** - Teletransporte entre dois pontos do grid
- **Sistema de Combos** - Ganhe multiplicadores ao comer comida rapidamente
- **Sistema de Vidas** - Continue após morrer (até 3 vidas)
- **Tiro de Veneno** - Destrua obstáculos e derrote bosses
- **Partículas Visuais** - Efeitos visuais para ações do jogo
- **Animações de Transição** - Transições suaves entre fases e bosses
- **Comida Temporizada** - Alguns alimentos desaparecem se não forem coletados a tempo

### 👾 Sistema de Bosses

Cada fase possui um boss único com habilidades especiais:

1. **O Clássico** (Fase 1) - Boss básico, padrão tradicional
2. **O Guardião** (Fase 2) - Defende um power-up de vida (flag verde)
3. **O Desafiador** (Fase 3) - Move obstáculos em direção à cobra
4. **O Portal** (Fase 4) - Mestre dos portais, cria portais dinâmicos
5. **O Veloz** (Fase 5) - Acelera drasticamente o jogo
6. **O Caos** (Fase 6) - Altera tipos de power-ups aleatoriamente
7. **O Arquiteto** (Fase 7) - Controla labirintos e cria/remove paredes
8. **O Sobrevivente** (Fase 8) - Remove vidas periodicamente
9. **O Vortex** (Fase 9) - Combina múltiplas habilidades com clima tempestuoso
10. **O Supremo** (Fase 10) - Boss final com todas as habilidades em máxima intensidade

### 📊 Sistema de Estatísticas

- Pontuação final e recorde
- Tempo de jogo
- Nível alcançado
- Fase alcançada
- Estatísticas detalhadas ao final do jogo

### 🎨 Interface

- **Design Moderno** - Interface dark mode com gradientes e efeitos visuais
- **Totalmente Responsiva** - Otimizado para desktop, tablet e mobile
- **Controles Touch Avançados** - Joystick analógico e botão de fogo para mobile
- **Animações Suaves** - Transições e animações em todos os elementos
- **Layout Game-Like** - Interface estilo jogo com HUD integrado
- **Efeitos Visuais Dinâmicos** - Backgrounds e efeitos que mudam por fase

### 🔧 Funcionalidades Técnicas

- **Arquitetura Multi-Thread (Web Workers)**:
  - `game.worker.ts`: Processa toda a lógica do jogo (movimento, colisões, IA) em uma thread separada para não bloquear a UI.
  - `render.worker.ts`: Renderiza o tabuleiro do jogo (Snake, Comida, Obstáculos, Portais) usando `OffscreenCanvas` em outra thread, garantindo gráficos fluidos.
  - `weather.worker.ts`: Gerencia os efeitos climáticos de fundo.
  - `particle.worker.ts`: Gerencia o sistema de partículas e explosões.
- **Performance Mobile**:
  - Otimizações para 60 FPS estáveis.
  - Remoção de sombras pesadas em mobile.
  - Batching de atualizações de estado.
- Sistema de salvamento automático (high score e conquistas)
- Sistema de logging estruturado com Pino para debugging
- Grid responsivo que se adapta ao tamanho da tela

### 📝 Sistema de Logging

O jogo possui um sistema completo de logging para debugging e observabilidade, categorizado por contextos (GAME_LOOP, BOSS, PHASE, etc.) e níveis de log.

## 🧪 Testes

Execute os testes unitários:

```bash
pnpm test
```

## 🏗️ Build

Para criar uma build de produção:

```bash
pnpm build
```

## 📁 Estrutura do Projeto

```
src/
├── workers/            # Web Workers (Lógica, Render, Clima, Partículas)
├── components/         # Componentes React (UI)
├── hooks/              # Custom Hooks
├── types/              # Definições de tipos
├── utils/              # Funções utilitárias
├── constants/          # Constantes do jogo
├── i18n/               # Internacionalização
└── test/               # Setup de testes
```

## 🎨 Customização

### Configurações do Jogo

Ajuste as configurações em `src/constants/game.ts`:

- `gridSize`: Número de células no grid
- `cellSize`: Tamanho base da célula (adaptativo no mobile)
- `gameSpeed`: Velocidade base do jogo

## 📱 Suporte Mobile

O jogo é totalmente responsivo e otimizado para dispositivos móveis:

- **Performance 60 FPS**: Graças à arquitetura de Workers e OffscreenCanvas.
- **Grid Adaptativo**: Ajusta-se perfeitamente a qualquer tamanho de tela.
- **Controles Touch Nativos**: Joystick e botões otimizados.
- **Prevenção de Gestos**: Bloqueio de zoom e pull-to-refresh acidentais.

## 🐛 Debug Mode

- **F1 / Ctrl+D**: Painel de Debug de Bosses
- **F3 / Ctrl+F**: Painel de Debug de Fases

## 🔒 Segurança

- Headers de Segurança (CSP, X-Frame-Options)
- Validação de Entrada
- Proteção de Estado

## 📊 Performance

- **Web Workers**: Separação total de lógica e renderização da thread principal.
- **OffscreenCanvas**: Gráficos complexos sem custo para a UI thread.
- **Memoização**: Uso eficiente de React.memo e useMemo.

## 📚 Documentação Adicional

Consulte os documentos em `docs/` para mais detalhes:

- `I18N_SYSTEM.md`
- `LOGGING_SYSTEM.md`
- `PERFORMANCE_OPTIMIZATION_PLAN.md`
- `SISTEMA_COMBATE_BOSS.md`

## 📝 Licença

Este projeto foi criado para fins educacionais e de entretenimento.

## 🙏 Agradecimentos

Desenvolvido com ❤️ usando as melhores práticas de desenvolvimento React e TypeScript.
