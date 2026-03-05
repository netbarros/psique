# AGENTS.md — PSIQUE Stitch-First Governance v3.0 (Canônico)
# Multi-AI Operating Contract: Codex · Claude · Gemini · GPT-4o · Qualquer IA

> **ESTE ARQUIVO É LEI.** Leia em totalidade antes de tocar em qualquer arquivo do projeto.
> Toda IA que trabalhar neste repositório, independente do modelo ou contexto de uso, **obedece este contrato.**

---

## SEÇÃO 0 — LEITURA OBRIGATÓRIA

Antes de qualquer implementação, qualquer IA **deve** ler nesta ordem:

```
1. AGENTS.md                              ← este arquivo (completo)
2. docs/stitch/SCREEN_REGISTRY.md         ← inventário de telas
3. docs/stitch/CANONICAL_MANIFEST.json    ← mapa machine-readable
4. docs/stitch/DESIGN_TOKENS.md           ← tokens visuais
5. docs/stitch/COMPONENT_LIBRARY.md       ← componentes canônicos
6. docs/stitch/LAYOUT_PATTERNS.md         ← padrões de layout
7. docs/stitch/IMPLEMENTATION_BACKLOG.md  ← fila priorizada
8. docs/implementation_plan.md            ← plano de fases
```

**Atalho proibido:** não pular etapas. Cada arquivo existe por uma razão.

---

## SEÇÃO 1 — PROPÓSITO E FILOSOFIA

### 1.1 O que é Stitch-First

Este repositório adota **Stitch como fonte visual primária**. Stitch é um conjunto de 14 telas
de referência (`stitch/Sxx/code.html` + `stitch/Sxx/screen.png`) que **definem o padrão visual
correto** para o PSIQUE. Toda implementação começa pelo Stitch correspondente.

Telas sem referência Stitch direta (S15..S28) derivam do **Design System Canônico** documentado
aqui e em `docs/stitch/DESIGN_TOKENS.md`. O sistema é completo, sem ambiguidade.

### 1.2 Hierarquia de Verdade

```
Prioridade 1  →  stitch/**               (code.html + screen.png) — S01..S14
Prioridade 2  →  CANONICAL_MANIFEST.json
Prioridade 3  →  SCREEN_REGISTRY.md
Prioridade 4  →  DESIGN_TOKENS.md
Prioridade 5  →  COMPONENT_LIBRARY.md
Prioridade 6  →  LAYOUT_PATTERNS.md
Prioridade 7  →  IMPLEMENTATION_BACKLOG.md
Prioridade 8  →  implementation_plan.md
Prioridade 9  →  Código existente (app/, components/) — somente se compatível com 1-8
```

**Em conflito: menor número ganha. Sem negociação.**

### 1.2.1 Regra de Espelho Documental (Obrigatória)

1. `docs/stitch/*` é a fonte canônica de contrato.
2. `files/*` é espelho automático para compatibilidade entre agentes/ferramentas.
3. É proibido editar manualmente arquivos em `files/*`.
4. Comandos oficiais:
   - `npm run docs:sync:write` para sincronizar espelho.
   - `npm run docs:sync:check` para bloquear drift.

### 1.3 Propriedade dos Domínios

| Domínio                | Telas                          | Tema Visual       |
|------------------------|--------------------------------|-------------------|
| Dashboard Terapeuta    | S01, S03-S07, S09, S19-S22     | dark_core         |
| Onboarding / Auth      | S08, S15-S18                   | dark_core + light |
| Portal Paciente        | S10, S23-S25                   | light_patient     |
| Público (Landing/Book) | S02, S11-S14, S26              | dark_core         |
| Sistema (Error/Load)   | S27, S28                       | dark_core         |

---

## SEÇÃO 2 — INVENTÁRIO COMPLETO DE TELAS

### 2A. Telas Stitch Canônicas (S01-S14)

| ID  | Rota                           | Título                        | Tema           | Arquivo Stitch   |
|-----|--------------------------------|-------------------------------|----------------|-----------------|
| S01 | /dashboard                     | Therapist Dashboard           | dark_core      | stitch/S01/     |
| S02 | /booking/[slug]                | Public Booking Page           | dark_core      | stitch/S02/     |
| S03 | /dashboard/consulta/[roomId]   | Clinical Session Video        | dark_theater   | stitch/S03/     |
| S04 | /dashboard/pacientes/[id]      | Patient Clinical Profile      | dark_core      | stitch/S04/     |
| S05 | /dashboard/ia                  | AI Clinical Assistant         | dark_core      | stitch/S05/     |
| S06 | /dashboard/financeiro          | Financial Intelligence        | dark_core      | stitch/S06/     |
| S07 | /dashboard/telegram            | Telegram Hub                  | dark_core      | stitch/S07/     |
| S08 | /dashboard/onboarding          | Therapist Onboarding Wizard   | light_onboard  | stitch/S08/     |
| S09 | /dashboard/configuracoes       | Segurança & LGPD              | dark_core      | stitch/S09/     |
| S10 | /portal + /portal/apoio        | Patient Reflection Portal     | light_patient  | stitch/S10/     |
| S11 | / (hero)                       | Landing — Hero AIDA           | dark_core      | stitch/S11/     |
| S12 | / (features)                   | Landing — Features & Value    | dark_core      | stitch/S12/     |
| S13 | /pricing                       | Pricing Plans                 | dark_core      | stitch/S13/     |
| S14 | /checkout/secure               | Secure Checkout               | dark_core      | stitch/S14/     |

### 2B. Telas Derivadas — psique-final.jsx (S15-S28)

> Sem referência Stitch direta. Seguem Design System Canônico + tela-irmã indicada.

| ID  | Rota                                   | Título                      | Tema          | Deriva de    |
|-----|----------------------------------------|-----------------------------|---------------|--------------|
| S15 | /auth/login                            | Login — Dual Role           | dark_core     | Design Sys.  |
| S16 | /auth/register                         | Register — Terapeuta        | light_onboard | S08          |
| S17 | /auth/register/patient                 | Register — Paciente         | light_patient | S10          |
| S18 | /auth/forgot-password                  | Forgot Password             | dark_core     | Design Sys.  |
| S19 | /dashboard/agenda                      | Agenda Semanal              | dark_core     | S01 + S04    |
| S20 | /dashboard/pacientes                   | Lista de Pacientes          | dark_core     | S04          |
| S21 | /dashboard/configuracoes/perfil        | Settings — Perfil           | dark_core     | S09          |
| S22 | /dashboard/configuracoes/integracoes   | Settings — Integrações      | dark_core     | S09          |
| S23 | /portal/agendar                        | Patient Self-Booking        | light_patient | S02 + S10    |
| S24 | /portal/sessoes                        | Patient Sessions History    | light_patient | S10          |
| S25 | /portal/chat                           | Patient AI Chat             | light_patient | S05 + S10    |
| S26 | /booking/[slug]/sucesso                | Booking Confirmation        | dark_core     | S14          |
| S27 | (loading global)                       | Loading State               | dark_core     | Design Sys.  |
| S28 | (not-found / global-error)             | 404 / 500 Error             | dark_core     | Design Sys.  |

---

## SEÇÃO 3 — TEMAS VISUAIS (CONTRATOS EXATOS)

### 3.1 TEMA: dark_core
**Aplicar em:** S01-S07, S09, S11-S15, S18-S22, S26-S28

```css
:root {
  /* Backgrounds */
  --bg:      #080F0B;   /* fundo base — o mais escuro */
  --bg2:     #0C1510;   /* headers, nav, seções alternadas */
  --card:    #121A14;   /* cards, inputs, painéis */
  --border:  #1C2E20;   /* bordas, divisores */

  /* Ação Principal */
  --mint:    #52B788;   /* cor primária — botões, ativo, glow */
  --mintl:   #74C9A0;   /* mint hover/light */

  /* Acento Premium */
  --gold:    #C4A35A;   /* IA, premium, seções de destaque */

  /* Texto */
  --ivory:   #EDE7D9;   /* texto principal */
  --ivoryD:  #C8BFA8;   /* texto secundário */
  --ivoryDD: #8A8070;   /* texto terciário / muted */

  /* Semânticas */
  --red:     #B85450;   /* erro, perigo, cancelar */
  --blue:    #4A8FA8;   /* informação, links, status */

  /* Tipografia */
  --ff: 'Cormorant Garamond', serif;
  --fs: 'Instrument Sans', sans-serif;
}
body {
  background-color: var(--bg);
  color: var(--ivory);
  font-family: var(--fs);
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3, h4, h5, h6, .serif {
  font-family: var(--ff);
}
```

### 3.2 TEMA: dark_theater
**Aplicar em:** S03 (video call) exclusivamente

```
Herda dark_core com as seguintes DIFERENÇAS:
- body background: #000000 (puro preto)
- vídeo paciente: object-cover full-bleed, opacity-70, mix-blend-luminosity
- overlay gradiente: from-[#080F0B]/80 via-transparent to-[#080F0B]/90
- pip view: absolute top-28 right-5, 100x140px, rounded-2xl, border-[#1C2E20]
            glow: box-shadow 0 0 15px rgba(82,183,136,0.15)
- painel inferior: bg-[#0C1510]/95 backdrop-blur-2xl, rounded-t-[32px]
- timer: pill bg-[#121A14]/60 blur + dot animate-pulse + text mint
- end button: gradient from-[#B85450] to-[#8a3f3c]
              glow: box-shadow 0 0 20px rgba(184,84,80,0.25)
```

### 3.3 TEMA: light_onboard
**Aplicar em:** S08 (onboarding wizard), S16 (register terapeuta)

```css
body { background: #FCFCFC; color: #1A1A1A; }
/* Variáveis internas deste tema */
--input-bg:      #FFFFFF;
--input-border:  #E5E7EB;   /* gray-200 */
--input-focus:   #52B788;   /* mint universal */
--label-color:   #374151;   /* gray-700 */
--text-sub:      #6B7280;   /* gray-500 */
--card-bg:       #FFFFFF;
--card-border:   #F9FAFB;   /* gray-50 */
--card-shadow:   0 10px 40px -10px rgba(82, 183, 136, 0.15);
--btn-primary:   #080F0B;   /* mesmo --bg do dark */
--btn-text:      #EDE7D9;   /* ivory */
--progress-bg:   #F3F4F6;
--progress-fill: #52B788;
--chip-active-bg:    rgba(82, 183, 136, 0.10);
--chip-active-border: #52B788;
--chip-active-text:  #52B788;
```

### 3.4 TEMA: light_patient
**Aplicar em:** S10 (portal apoio), S17 (register patient), S23-S25 (portal pages)

```css
body { background: #F8F9FA; color: #2D3748; }
--card:          #FFFFFF;
--border:        #E2E8F0;
--primary:       #4A8FA8;   /* = --blue do dark_core */
--primary-hover: #3B7489;
--text-main:     #2D3748;
--text-muted:    #718096;
--accent-bg:     #EBF4F7;   /* bg de chips do primary */
--shadow-card:   0 4px 20px rgba(74, 143, 168, 0.05);
--glass-bg:      rgba(255, 255, 255, 0.90);
--glass-blur:    backdrop-filter: blur(10px);
```

---

## SEÇÃO 4 — DESIGN TOKENS DETALHADOS

### 4.1 Fontes — IMUTÁVEL

```html
<!-- Obrigatório no <head> de TODA tela -->
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
```

**Mapeamento de uso:**
| Elemento                  | Fonte                        |
|---------------------------|------------------------------|
| h1-h6, headings           | Cormorant Garamond           |
| Números KPI grandes       | Cormorant Garamond           |
| Citações / insights IA    | Cormorant Garamond + italic  |
| Body, labels, botões, UI  | Instrument Sans              |
| Links técnicos, IDs       | font-mono (só p/ dados raw)  |

**❌ COMPLETAMENTE PROIBIDO:** Inter · Roboto · Arial · Outfit · Space Grotesk · system-ui · DM Sans · Plus Jakarta Sans

### 4.2 Escala Tipográfica (dark_core)

```
HERO / DISPLAY:    text-5xl → text-6xl  (48-60px) · font-medium  · --ff
H1 SEÇÃO:          text-4xl → text-5xl  (36-48px) · font-semibold· --ff
H2 CARD:           text-3xl → text-4xl  (30-36px) · font-semibold· --ff
H3 SUBCARD:        text-2xl             (24px)    · font-semibold· --ff
H4 ITEM:           text-xl              (20px)    · font-semibold· --ff
KPI NUMBER LG:     text-4xl → text-5xl  (36-48px) · font-bold    · --ff
KPI NUMBER SM:     text-2xl → text-3xl  (24-30px) · font-bold    · --ff
BODY LARGE:        text-base → text-lg  (16-18px) · --fs
BODY DEFAULT:      text-sm              (14px)    · --fs
CAPTION:           text-xs              (12px)    · --fs
MICRO / BADGE:     text-[10px]-[11px]             · --fs · uppercase · tracking-widest
```

### 4.3 Bordas e Raios

```
rounded-xl    → inputs, slots, tags, time chips
rounded-2xl   → cards standard, seções, painéis, booking cards
rounded-3xl   → modals, drawers grandes
rounded-[18px]→ controles de sessão (botões de vídeo call, S03)
rounded-[32px]→ painel deslizante de baixo para cima (S03)
rounded-[40px]→ device mockup (simulação celular, S03)
rounded-full  → avatares, dots, badges pill, botões circulares
```

### 4.4 Sombras Canônicas

```css
/* Mint glow small */
box-shadow: 0 0 15px rgba(82, 183, 136, 0.15);

/* Mint glow large */
box-shadow: 0 0 30px rgba(82, 183, 136, 0.10);

/* CTA button shadow */
box-shadow: 0 4px 20px rgba(82, 183, 136, 0.25);

/* Button shadow inline */
box-shadow: 0 4px 10px rgba(82, 183, 136, 0.20);

/* Gold glow */
box-shadow: 0 0 20px rgba(196, 163, 90, 0.10);

/* Red danger glow */
box-shadow: 0 0 20px rgba(184, 84, 80, 0.25);

/* Card elevation */
box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.50), 0 0 20px -5px rgba(82, 183, 136, 0.05);

/* Onboard card */
box-shadow: 0 10px 40px -10px rgba(82, 183, 136, 0.15);

/* Patient card */
box-shadow: 0 4px 20px rgba(74, 143, 168, 0.05);
```

### 4.5 Compostos de Cor (usar como classes utilitárias)

```
Mint 5%:   rgba(82, 183, 136, 0.05)   → subtle tint nos cards principais
Mint 10%:  rgba(82, 183, 136, 0.10)   → bg de badges/chips mint
Mint 20%:  rgba(82, 183, 136, 0.20)   → borders ativos mint
Mint 30%:  rgba(82, 183, 136, 0.30)   → borders hover / cards destacados
Mint 50%:  rgba(82, 183, 136, 0.50)   → barra lateral em AI response
Gold 10%:  rgba(196, 163, 90, 0.10)   → bg badges gold
Gold 30%:  rgba(196, 163, 90, 0.30)   → borders gold
Red 10%:   rgba(184, 84, 80, 0.10)    → bg badges error
Red 30%:   rgba(184, 84, 80, 0.30)    → borders error
Blue 10%:  rgba(74, 143, 168, 0.10)   → bg badges info
Telegram:  #2481CC / #2AABEE          → SOMENTE no Telegram Hub (S07)
```

### 4.6 Espaçamento

```
Padding de tela mobile:   px-4
Padding de tela tablet:   px-6
Padding de tela desktop:  px-8

Gap card grid 2-col:      gap-3
Gap card grid standard:   gap-4
Gap card grid largo:      gap-6

Padding interno de card:  p-4 (sm) | p-5 (md) | p-6 (lg)
Padding seção:            py-6 (sm) | py-8 (md) | py-12 (hero)

Max width conteúdo:       max-w-md (430px) mobile modals/booking
                          max-w-2xl (672px) dashboard sections
                          max-w-7xl desktop full-width
```

### 4.7 Animações e Transições

```css
/* Transição padrão */
transition-all duration-200 ease-out

/* Hover de card */
hover:-translate-y-0.5
hover:border-[var(--mint)]/30
hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5),0_0_20px_-5px_rgba(82,183,136,0.05)]
transition-all duration-300 cubic-bezier(.22,1,.36,1)

/* Botão primary active */
active:scale-[0.98]

/* Botão primary hover */
hover:bg-[var(--mintl)] hover:scale-[1.02]

/* Landing mockup card tilt */
transform: rotate(-2deg); hover:rotate(0deg); transition-transform duration-500

/* Pulse dot de status ativo */
animate-pulse

/* Loading spinner */
animate-spin

/* Waveform listening (3 barras) */
animate-[ping_1s_infinite_0ms]   /* barra 1 */
animate-[ping_1s_infinite_200ms] /* barra 2 */
animate-[ping_1s_infinite_400ms] /* barra 3 */

/* Keyframes recomendados */
fadeUp:  from { opacity:0; transform: translateY(16px) } to { opacity:1; transform: translateY(0) }
fadeIn:  from { opacity:0 } to { opacity:1 }
```

---

## SEÇÃO 5 — COMPONENT LIBRARY CANÔNICA

> Cada padrão abaixo foi **extraído diretamente dos stitch HTML**. Use exatamente como especificado.

### 5.1 Sticky Header (dark_core)

```tsx
<header className="sticky top-0 z-50 bg-[var(--bg2)]/80 backdrop-blur-md
  border-b border-[var(--border)] px-4 py-4 flex items-center justify-between">
  {/* Logo + back button OU menu + bell + avatar */}
</header>
```

### 5.2 Button — 5 variantes

```tsx
// PRIMARY — CTA principal
className="bg-[var(--mint)] hover:bg-[var(--mintl)] text-[var(--bg)]
  font-semibold py-3.5 px-4 rounded-xl transition-all active:scale-[0.98]
  shadow-[0_4px_20px_rgba(82,183,136,0.25)] flex items-center justify-center gap-2"

// GHOST — secundário/neutro
className="bg-[var(--card)] hover:bg-[var(--border)] border border-[var(--border)]
  text-[var(--ivory)] py-3 px-4 rounded-xl transition-colors"

// DANGER — encerrar/cancelar (S03)
className="flex-1 rounded-[18px] bg-gradient-to-br from-[var(--red)] to-[#8a3f3c]
  border border-[#d66a65]/30 text-white font-medium text-[15px]
  flex items-center justify-center gap-2
  shadow-[0_0_20px_rgba(184,84,80,0.25)] active:scale-95"

// ICON-ONLY — ações terciárias
className="w-10 h-10 rounded-full bg-[var(--card)] border border-[var(--border)]
  flex items-center justify-center text-[var(--ivory)]
  hover:border-[var(--mint)] transition-colors"

// PILL TEXT — links inline
className="text-sm text-[var(--mint)] font-medium hover:text-[var(--mintl)]"

// GOLD ACTION — "AI Suggest" etc
className="text-xs text-[var(--gold)] hover:text-[var(--ivory)] font-medium
  bg-[var(--gold)]/10 px-2.5 py-1 rounded-full border border-[var(--gold)]/20
  flex items-center gap-1 transition-colors"
```

### 5.3 Card — 4 variantes

```tsx
// CARD BASE
className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4
  hover:-translate-y-0.5 hover:border-[var(--mint)]/30
  transition-all duration-300 cubic-bezier(.22,1,.36,1)"

// CARD HIGHLIGHT (Up Next, AI section)
className="bg-gradient-to-br from-[var(--bg2)] to-[var(--card)]
  border border-[var(--mint)]/30 rounded-2xl
  shadow-[0_0_15px_rgba(82,183,136,0.05)]"

// CARD GLASS (header pills, tooltips)
className="bg-[var(--card)]/60 backdrop-blur-md border border-[var(--border)] rounded-2xl"

// CARD GOLD GRADIENT (pricing featured, AI)
className="bg-[var(--bg2)] border border-[var(--mint)]/50 rounded-2xl
  shadow-[0_0_30px_rgba(82,183,136,0.10)]"
```

### 5.4 Input (dark_core)

```tsx
// campo padrão
<div>
  <label className="block text-xs text-[var(--ivoryDD)] mb-1 ml-1">Label</label>
  <input
    className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl
      px-4 py-3 text-sm text-[var(--ivory)] placeholder:text-[var(--border)]
      focus:outline-none focus:border-[var(--mint)] focus:ring-1 focus:ring-[var(--mint)]
      transition-colors"
  />
</div>

// textarea (notas clínicas, mensagem bot)
<textarea
  className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl
    p-4 text-sm text-[var(--ivory)] placeholder:text-[var(--ivoryDD)]
    focus:outline-none focus:border-[var(--mint)]/40 focus:ring-1 focus:ring-[var(--mint)]/20
    transition-all resize-none leading-relaxed"
/>
```

### 5.5 Badge — semânticas

```tsx
// SUCCESS / ATIVO (mint)
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
  bg-[var(--mint)]/10 text-[var(--mint)] text-[10px] font-semibold
  border border-[var(--mint)]/20 uppercase tracking-wider">
  <span className="w-1.5 h-1.5 rounded-full bg-[var(--mint)]"/>
  Ativo
</span>

// ALERT / RISCO (red)
<span className="bg-[var(--red)]/10 border border-[var(--red)]/30 text-[var(--red)]
  px-2.5 py-1 rounded-md text-[0.65rem] uppercase tracking-wider font-semibold
  flex items-center gap-1">
  <span className="material-symbols-outlined text-[10px]">warning</span>
  Risco Relacional
</span>

// GOLD / PREMIUM
<span className="bg-[var(--gold)]/10 border border-[var(--gold)]/30 text-[var(--gold)]
  text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-widest uppercase">
  Premium
</span>

// NEUTRAL / CATEGORIA
<span className="bg-[var(--border)]/60 border border-[var(--border)]
  text-[var(--ivoryD)] px-2.5 py-1 rounded-md text-[0.65rem]
  uppercase tracking-wider font-semibold">
  Ansiedade
</span>

// INFO (blue)
<span className="text-[10px] text-[var(--blue)] bg-[var(--blue)]/10
  px-1.5 py-0.5 rounded">Online</span>
```

### 5.6 Status Live Indicator

```tsx
// dot pulsante (sessão ativa)
<span className="w-2 h-2 rounded-full bg-[var(--mint)] animate-pulse
  shadow-[0_0_8px_var(--mint)]"/>

// badge "Up Next"
<span className="inline-flex items-center gap-1 text-[10px] font-semibold
  text-[var(--mint)] bg-[var(--mint)]/10 px-2 py-1 rounded-full uppercase tracking-widest">
  <span className="w-1.5 h-1.5 rounded-full bg-[var(--mint)] animate-pulse"/>
  Up Next
</span>

// badge "Bot Online" (header Telegram)
<p className="text-[11px] text-[var(--mint)] font-medium uppercase tracking-wider
  flex items-center gap-1">
  <span className="w-1.5 h-1.5 rounded-full bg-[var(--mint)] animate-pulse"/>
  Bot Online
</p>
```

### 5.7 KPI Card

```tsx
<div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4
  flex flex-col justify-between relative overflow-hidden">
  {/* Header */}
  <div className="flex items-center justify-between mb-2">
    <span className="text-xs font-medium text-[var(--ivoryDD)] uppercase tracking-wider">
      MRR
    </span>
    <span className="material-symbols-outlined text-[16px] text-[var(--mint)]">
      trending_up
    </span>
  </div>
  {/* Valor */}
  <span className="font-[family-name:var(--ff)] text-2xl font-bold text-[var(--ivory)]">
    R$ 12.4k
  </span>
  {/* Delta */}
  <span className="text-[10px] text-[var(--mint)] bg-[var(--mint)]/10
    px-1.5 py-0.5 rounded flex items-center gap-0.5 w-fit mt-1">
    <span className="material-symbols-outlined text-[10px]">arrow_upward</span>
    8%
  </span>
</div>
```

### 5.8 Timeline Item (Agenda / Auditoria)

```tsx
// ATIVO
<div className="flex gap-4 relative">
  <div className="w-12 text-right pt-1">
    <span className="text-xs font-medium text-[var(--mint)]">10:00</span>
  </div>
  <div className="flex-1 bg-[var(--card)] border border-[var(--mint)]/30
    rounded-xl p-3 flex justify-between items-center">
    <div>
      <p className="font-medium text-[var(--ivory)] text-sm">Marina Costa</p>
      <p className="text-xs text-[var(--mint)]">Em andamento</p>
    </div>
    <div className="w-8 h-8 rounded-full bg-[var(--mint)]/10 flex items-center justify-center">
      <span className="material-symbols-outlined text-[16px] text-[var(--mint)]">videocam</span>
    </div>
  </div>
</div>

// PASSADO (opacity-50)
<div className="flex gap-4 opacity-50">
  <div className="w-12 text-right pt-1">
    <span className="text-xs font-medium text-[var(--ivoryDD)]">09:00</span>
  </div>
  <div className="flex-1 bg-[var(--bg2)] border border-[var(--border)]
    rounded-xl p-3 flex justify-between items-center">
    <div>
      <p className="font-medium text-[var(--ivory)] text-sm">Ricardo Mendes</p>
      <p className="text-xs text-[var(--ivoryDD)]">Concluído</p>
    </div>
    <span className="material-symbols-outlined text-[var(--ivoryDD)]">check</span>
  </div>
</div>
```

### 5.9 Toggle Switch

```tsx
<label className="relative inline-flex items-center cursor-pointer">
  <input type="checkbox" className="sr-only peer" defaultChecked/>
  <div className="w-11 h-6 bg-[var(--border)] peer-checked:bg-[var(--mint)]
    rounded-full transition-colors duration-300 relative">
    <div className="absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full
      transition-transform duration-300 peer-checked:translate-x-5"/>
  </div>
</label>
```

### 5.10 Sticky Footer CTA (mobile)

```tsx
<div className="sticky bottom-0 w-full bg-[var(--bg2)]/90 backdrop-blur-md
  border-t border-[var(--border)] p-4 z-20">
  <button className="w-full bg-[var(--mint)] hover:bg-[var(--mintl)]
    text-[var(--bg)] font-semibold py-4 rounded-xl
    shadow-[0_4px_20px_rgba(82,183,136,0.25)]
    transition-all active:scale-[0.98] flex items-center justify-center gap-2">
    Ação Principal
    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
  </button>
</div>
```

### 5.11 AI Response Message (S05)

```tsx
<div className="flex justify-start">
  <div className="max-w-[90%] space-y-3">
    {/* Sender label */}
    <div className="flex items-center gap-2 mb-1">
      <div className="w-6 h-6 rounded-full bg-[var(--mint)]/20
        border border-[var(--mint)]/40 flex items-center justify-center">
        <span className="material-symbols-outlined text-[14px] text-[var(--mint)]">smart_toy</span>
      </div>
      <span className="text-xs font-medium text-[var(--mintl)]">PSIQUE AI</span>
    </div>
    {/* Message bubble */}
    <div className="bg-transparent border border-[var(--mint)]/30 rounded-2xl rounded-tl-sm
      px-5 py-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-[var(--mint)]/50"/>
      <p className="text-sm text-[var(--ivoryD)] leading-relaxed">{content}</p>
      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between">
        <span className="text-xs text-[var(--ivoryDD)] flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">lock</span>
          Criptografado ponta a ponta
        </span>
        <div className="flex gap-2">
          <button className="text-[var(--ivoryDD)] hover:text-[var(--ivory)] transition-colors">
            <span className="material-symbols-outlined text-[18px]">content_copy</span>
          </button>
          <button className="text-[var(--ivoryDD)] hover:text-[var(--mint)] transition-colors">
            <span className="material-symbols-outlined text-[18px]">thumb_up</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
```

### 5.12 User Message (S05)

```tsx
<div className="flex justify-end">
  <div className="max-w-[85%] bg-[var(--card)] border border-[var(--border)]
    rounded-2xl rounded-tr-sm px-5 py-4 shadow-sm">
    <p className="text-sm text-[var(--ivory)] leading-relaxed">{content}</p>
    <span className="text-[10px] text-[var(--ivoryDD)] mt-2 block text-right">{time}</span>
  </div>
</div>
```

### 5.13 AI Chat Input (S05)

```tsx
<div className="p-4 bg-[var(--bg)] border-t border-[var(--border)]">
  <div className="relative flex items-end gap-3 bg-[var(--card)]
    border border-[var(--border)] rounded-2xl p-2
    focus-within:border-[var(--mint)]/60 transition-colors shadow-lg">
    <button className="p-2.5 text-[var(--ivoryDD)] hover:text-[var(--ivory)]
      transition-colors shrink-0">
      <span className="material-symbols-outlined text-[22px]">attach_file</span>
    </button>
    <textarea
      className="w-full bg-transparent border-none focus:ring-0
        text-[var(--ivory)] placeholder:text-[var(--ivoryDD)]/60
        text-sm resize-none py-3 max-h-32 min-h-[44px]"
      placeholder="Pergunte sobre um paciente, solicite análise ou resuma notas..."
      rows={1}
    />
    <button className="p-2.5 bg-[var(--mint)] text-[var(--bg)] rounded-xl
      hover:bg-[var(--mintl)] transition-colors shrink-0
      shadow-[0_4px_12px_rgba(82,183,136,0.30)]">
      <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
    </button>
  </div>
  <div className="text-center mt-3">
    <span className="text-[10px] text-[var(--ivoryDD)]/70 uppercase tracking-widest font-medium">
      Confidencial & HIPAA / LGPD Compliant
    </span>
  </div>
</div>
```

### 5.14 Section Header

```tsx
<div className="flex items-center justify-between mb-4">
  <h3 className="font-[family-name:var(--ff)] text-xl font-semibold text-[var(--ivory)]">
    Título da Seção
  </h3>
  <button className="text-sm text-[var(--mint)] font-medium hover:text-[var(--mintl)]">
    Ver todos
  </button>
</div>
```

### 5.15 Calendar Date Chip (S02/S23)

```tsx
{/* SELECIONADO */}
<button className="snap-center flex-shrink-0 w-16 h-20 rounded-2xl
  bg-[var(--mint)] text-[var(--bg)] flex flex-col items-center justify-center
  shadow-[0_0_15px_rgba(82,183,136,0.30)]">
  <span className="text-xs font-medium uppercase mb-1">Ter</span>
  <span className="text-2xl font-semibold">17</span>
</button>

{/* DISPONÍVEL */}
<button className="snap-center flex-shrink-0 w-16 h-20 rounded-2xl
  bg-[var(--card)] border border-[var(--border)]
  text-[var(--ivoryD)] flex flex-col items-center justify-center">
  <span className="text-xs font-medium uppercase mb-1 text-[var(--ivoryDD)]">Qua</span>
  <span className="text-2xl font-semibold">18</span>
</button>

{/* INDISPONÍVEL */}
<div className="snap-center flex-shrink-0 w-16 h-20 rounded-2xl
  bg-[var(--bg)] border border-[var(--border)]/50
  text-[var(--border)] flex flex-col items-center justify-center opacity-50">
  <span className="text-xs font-medium uppercase mb-1">Sex</span>
  <span className="text-2xl font-semibold">20</span>
</div>
```

### 5.16 Time Slot Button (S02/S23)

```tsx
{/* DISPONÍVEL */}
<button className="py-3 rounded-xl bg-[var(--card)] border border-[var(--border)]
  text-[var(--ivory)] font-medium text-sm
  hover:border-[var(--mint)] hover:text-[var(--mint)]">
  09:00
</button>

{/* SELECIONADO */}
<button className="py-3 rounded-xl bg-[var(--mint)] border border-[var(--mint)]
  text-[var(--bg)] font-medium text-sm
  shadow-[0_0_10px_rgba(82,183,136,0.20)]">
  14:00
</button>

{/* INDISPONÍVEL */}
<button className="py-3 rounded-xl bg-[var(--bg)] border border-[var(--border)]/50
  text-[var(--border)] font-medium text-sm
  cursor-not-allowed line-through decoration-[var(--border)]">
  18:00
</button>
```

### 5.17 Bottom Navigation (mobile)

```tsx
{/* dark_core nav */}
<nav className="fixed bottom-0 w-full bg-[var(--bg2)]/95 backdrop-blur-md
  border-t border-[var(--border)] pb-safe pt-2 px-6
  flex justify-between items-center z-50">
  <NavItem icon="home" label="Início" href="/dashboard" active/>
  <NavItem icon="calendar_month" label="Agenda" href="/dashboard/agenda"/>
  <NavItem icon="group" label="Pacientes" href="/dashboard/pacientes"/>
  <NavItem icon="smart_toy" label="IA" href="/dashboard/ia"/>
  <NavItem icon="settings" label="Config" href="/dashboard/configuracoes"/>
</nav>

{/* light_patient nav */}
<nav className="fixed bottom-0 w-full bg-white/90 backdrop-blur-md
  border-t border-[var(--border)] pb-safe pt-2 px-6
  flex justify-between items-center z-50 pb-4">
  {/* ativo: text-[var(--primary)] | inativo: text-[var(--text-muted)] */}
</nav>
```

### 5.18 Profile Header (S02 — Booking)

```tsx
<header className="relative pt-12 pb-8 px-6 flex flex-col items-center text-center">
  {/* gradient decorativo */}
  <div className="absolute top-0 left-0 w-full h-[250px]
    bg-gradient-to-b from-[var(--border)]/30 to-transparent pointer-events-none"/>
  {/* avatar com borda gold */}
  <div className="w-24 h-24 rounded-full overflow-hidden
    border-2 border-[var(--gold)]/30 mb-6 relative z-10">
    <img className="w-full h-full object-cover" src={photo} alt={name}/>
  </div>
  <h1 className="font-[family-name:var(--ff)] text-3xl font-semibold text-[var(--ivory)] mb-2">
    Dra. {name}
  </h1>
  <p className="text-[var(--ivoryD)] text-sm mb-4 tracking-wide uppercase">
    {specialty} • CRP {crp}
  </p>
  {/* quote em mint italic serif */}
  <p className="font-[family-name:var(--ff)] text-[var(--mint)] text-xl italic mb-6 leading-snug">
    "{quote}"
  </p>
</header>
```

### 5.19 Trust Badges (S02/S14)

```tsx
<div className="flex items-center justify-center gap-6 py-4">
  {[
    { icon: 'shield_lock', label: 'LGPD' },
    { icon: 'lock', label: 'Criptografado' },
    { icon: 'verified', label: 'Pagamento Seguro' },
  ].map(({ icon, label }) => (
    <div key={label} className="flex flex-col items-center gap-1">
      <span className="material-symbols-outlined text-[var(--ivoryDD)] text-[20px]">
        {icon}
      </span>
      <span className="text-[10px] text-[var(--ivoryDD)] uppercase tracking-wider">
        {label}
      </span>
    </div>
  ))}
</div>
```

### 5.20 Mini Bar Chart (S06)

```tsx
<div className="flex justify-between items-end h-16 gap-2 mt-6 pt-4
  border-t border-[var(--border)]">
  {/* barras com opacidade crescente → atual = 100% */}
  {[40, 55, 45, 70, 60, 100].map((h, i) => (
    <div key={i}
      className={`w-full rounded-t-sm ${i === 5 ? 'bg-[var(--mint)]' : 'bg-[var(--mint)]'}`}
      style={{ height: `${h}%`, opacity: 0.20 + i * 0.16 }}
    />
  ))}
</div>
<div className="flex justify-between text-[10px] text-[var(--ivoryDD)] mt-2">
  {['Mai','Jun','Jul','Ago','Set','Out'].map((m, i) => (
    <span key={m} className={i === 5 ? 'text-[var(--mint)] font-medium' : ''}>{m}</span>
  ))}
</div>
```

### 5.21 Specialty Chip Selector (S08/S16)

```tsx
<label className="cursor-pointer">
  <input type="checkbox" className="peer sr-only" value="psicanalise" defaultChecked/>
  <div className="rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-600
    transition-all
    peer-checked:border-[var(--mint)] peer-checked:bg-[var(--mint)]/10
    peer-checked:text-[var(--mint)]
    hover:border-gray-300">
    Psicanálise
  </div>
</label>
```

### 5.22 Progress Bar (onboarding S08)

```tsx
<div className="space-y-2">
  <div className="flex justify-between text-xs font-medium text-gray-500 uppercase tracking-widest">
    <span>Step {step} of 6</span>
    <span>Professional Identity</span>
  </div>
  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
    <div
      className="h-full bg-[var(--mint)] rounded-full transition-all duration-500"
      style={{ width: `${(step / 6) * 100}%` }}
    />
  </div>
</div>
```

### 5.23 Payment Method Radio (S14)

```tsx
<label className="block relative cursor-pointer">
  <input type="radio" name="payment" value="card" className="peer sr-only" defaultChecked/>
  <div className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl p-4
    flex items-center justify-between transition-all
    peer-checked:border-[var(--mint)] peer-checked:bg-[var(--mint)]/5
    hover:border-[var(--mintl)]/50">
    <div className="flex items-center gap-4">
      <div className="w-5 h-5 rounded-full border-2 border-[var(--ivoryDD)]
        peer-checked:border-[var(--mint)] flex items-center justify-center relative">
        <div className="w-2.5 h-2.5 rounded-full bg-[var(--mint)] opacity-0
          peer-checked:opacity-100 transition-opacity"/>
      </div>
      <div>
        <span className="text-[var(--ivory)] font-medium">Cartão de Crédito</span>
        <span className="text-[var(--ivoryDD)] text-xs block">Powered by Stripe</span>
      </div>
    </div>
    <span className="material-symbols-outlined text-[24px] opacity-60">credit_card</span>
  </div>
</label>
```

### 5.24 Patient Card (S20 — Lista)

```tsx
<div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4
  hover:-translate-y-0.5 hover:border-[var(--mint)]/20 transition-all cursor-pointer">
  <div className="flex items-start gap-3 mb-3">
    {/* avatar */}
    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
      <img className="w-full h-full object-cover" src={photo} alt={name}/>
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-start">
        <p className="font-medium text-[var(--ivory)] text-sm">{name}</p>
        <StatusBadge status={status}/>
      </div>
      <p className="text-xs text-[var(--ivoryDD)] mt-0.5">{age} anos • {profession}</p>
    </div>
  </div>
  {/* mood bar */}
  <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
    <div
      className="h-full bg-[var(--mint)] rounded-full"
      style={{ width: `${moodScore}%` }}
    />
  </div>
  {/* tags */}
  <div className="flex flex-wrap gap-1.5 mt-2">
    {tags.map(tag => <NeutralBadge key={tag}>{tag}</NeutralBadge>)}
  </div>
</div>
```

### 5.25 Glass Card (light_patient — S10)

```tsx
<div className="glass-card rounded-2xl overflow-hidden relative">
  {/* barra superior colorida */}
  <div className="absolute top-0 left-0 w-full h-1
    bg-gradient-to-r from-[var(--primary)] to-blue-300"/>
  <div className="p-6">
    {/* conteúdo */}
  </div>
</div>

/* CSS necessário */
.glass-card {
  background: rgba(255, 255, 255, 0.90);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border);
  box-shadow: 0 4px 20px rgba(74, 143, 168, 0.05);
}
```

---

## SEÇÃO 6 — LAYOUT PATTERNS

### 6.1 Breakpoints e Política

```
Mobile canônico: 390 × 844px  → Stitch é lei. Pixel fidelity obrigatória.
Tablet:          768 × 1024px → 2-col grids, sidebar ícone-only (64px)
Desktop:         1440 × 900px → sidebar 240px, max-w-7xl, 3-4 col grids
```

### 6.2 Shell — Dashboard Terapeuta (app/dashboard/layout.tsx)

```
MOBILE (< 768px):
  Layout: flex flex-col min-h-screen
  Header: sticky top-0 z-50 (logo + bell + avatar)
  Main:   flex-1 overflow-y-auto pb-20 (espaço para bottom nav)
  Nav:    fixed bottom-0 z-50 (5 ícones)

TABLET (768px+):
  Layout: flex flex-row
  Sidebar: w-16 sticky left-0 top-0 h-screen (ícones apenas)
  Main:   flex-1 overflow-y-auto

DESKTOP (1024px+):
  Sidebar: w-60 sticky left-0 h-screen (logo + nav labels)
  Main:   flex-1 px-8 py-6
```

### 6.3 Shell — Portal Paciente (app/(patient)/layout.tsx)

```
MOBILE (< 768px):
  Header: light sticky (logo + avatar)
  Main:   flex-1 max-w-md mx-auto px-6 overflow-y-auto pb-20
  Nav:    fixed bottom-0 (4 ícones: Início, Agenda, Diário, Pagamentos)

DESKTOP (768px+):
  Sidebar: w-56 light sticky
  Main:   flex-1
```

### 6.4 Video Call (S03) — Tela Completa

```
Body:         background #000, flex, justify-center, align-center
Container:    w-[390px] h-[844px], rounded-[40px], border-[8px] border-[#111]
              overflow-hidden, flex flex-col, shadow-2xl

Camadas (z-index):
  z-0: vídeo paciente (absolute inset-0, object-cover)
  z-0: gradients de overlay
  z-10: header (timer + signal + lock)
  z-10: PiP terapeuta (absolute top-28 right-5)
  z-20: painel clínico (absolute bottom-0)
  z-30: espaçador de fundo
```

### 6.5 Booking Público (S02/S23)

```
Container:    max-w-[430px] mx-auto min-h-screen bg-[var(--bg2)] flex flex-col
Calendar:     overflow-x-auto pb-4, snap-x, flex gap-3 (date chips)
Time slots:   grid grid-cols-3 gap-3
Form fields:  space-y-4 (vertical stack)
Footer CTA:   sticky bottom-0 (bg blur + data + preço + botão)
```

### 6.6 Landing Page (S11/S12)

```
Navbar:       fixed top-0, z-50, w-full, blur + border-b
Main:         flex-grow, flex flex-col, pt-24 pb-12 px-5
Trust pill:   inline-flex, centered, rounded-full, card bg
Hero headline: text-center, max-w-md mx-auto
CTA:          w-full max-w-xs mx-auto
Mock device:  aspect-square max-w-sm mx-auto mt-16, rounded-2xl card

Desktop (768px+):
  Main:       grid grid-cols-2 items-center
  Hero:       text-left
  Mock:       right column
```

### 6.7 Checkout (S14)

```
Container:    flex flex-col, max-w-md mx-auto, pt-8 px-4
Header:       flex justify-between (back + title + spacer)
Order summary: bg-card rounded-2xl p-6 (avatar + data + total)
Payment:      space-y-4 (radio labels com expand)
Footer CTA:   fixed bottom-0
```

---

## SEÇÃO 7 — REGRAS POR TELA (28 TELAS)

### S01 — /dashboard

```
Grid KPIs: grid-cols-2 gap-3 (mobile) | grid-cols-4 (desktop)
Card "Up Next": border-[mint]/30, gradient bg, glow
Timeline: w-12 time-col à esquerda + flex-1 card à direita
Sessão passada: opacity-50
Sessão ativa: border-[mint]/30, bg-card (destaca)
Sessão futura: border-[border], bg-card (normal)
Connector line: absolute gradient from-mint/50 to-transparent
Greeting: --ff text-3xl font-semibold
Subtext: text-sm text-[var(--ivoryDD)]
```

### S02 — /booking/[slug]

```
Avatar: w-24 h-24 border-2 border-[gold]/30
Quote: --ff italic text-xl text-[mint]
Calendar: horizontal scroll snap-x no-scrollbar
Slots: grid-cols-3 gap-3
Form: 3 campos (nome, email, whatsapp) label + input
Trust: 3 ícones centralizados (LGPD, Criptografado, Pagamento)
CTA footer: data+preço à esquerda | "Alterar" link | botão full-width
```

### S03 — /consulta/[roomId] (dark_theater)

```
Body: bg-black
Video: absolute inset-0 object-cover opacity-70 mix-blend-luminosity brightness-110
Overlay: gradient from-bg/80 via-transparent to-bg/90
Timer pill: bg-card/60 blur pill + dot pulse + text-mintl tracking-widest
PiP self: absolute top-28 right-5, w-[100px] h-[140px], rounded-2xl
Panel: absolute bottom-0, bg2/95 blur-2xl, rounded-t-[32px], pt-3 pb-8 px-5
Panel drag bar: w-10 h-1.5 bg-border rounded-full mx-auto mb-5
Panel title: --ff text-gold text-2xl "Clinical Intelligence"
Notes: textarea h-28, resize-none, placeholder "Capture clinical observations..."
Waveform: 3 barras animate-ping com delay 0/200/400ms + "Listening" text
Buttons: w-[52px] h-[52px] rounded-[18px] (mic + video) | flex-1 danger (end)
End text: "End & Generate Summary" com stop_circle icon
```

### S04 — /pacientes/[id]

```
Header nav: back arrow + nome + "Active Patient" dot verde
Profile card: p-5, avatar w-16 + nome + badges (Ansiedade/Burnout/Risco)
Stats 3-col: border-l border-r internos (Sessões|Última|Status Pag.)
Quick actions: grid-cols-2 (Iniciar Sessão + Nova Nota)
Tabs: Visão Geral | Prontuário | Financeiro (border-b ativo = mint, 2px)
AI card: gradiente de bg mint/gold tênue + ícone auto_awesome gold
Risk badge: vermelho com ícone warning
```

### S05 — /ia

```
Header: "Therapeutic AI" + dot status verde + modelo badge
Quick templates: overflow-x-auto hide-scrollbar, chips rounded-full
Empty state: ícone psychiatry em círculo border-mint/30, glow
Chat scroll: flex-1 overflow-y-auto hide-scrollbar
User msg: justify-end, rounded-tr-sm
AI msg: justify-start, borda esquerda mint/50, rounded-tl-sm
Input: sticky bottom-0, card container com focus-within:border-mint/60
```

### S06 — /financeiro

```
MRR hero card: relative overflow-hidden, blurred gold circle topo-direito
MRR valor: --ff text-5xl font-bold
Delta badge: bg-mint/10 border border-mint/20
Bar chart: 6 barras, opacidade crescente, última = mint puro
2-col grid: Pendente (gold icon) | Imposto (red icon)
Transactions: divide-y border, icon circle 40px, badge status no final
```

### S07 — /telegram

```
Bot status card: bg-card com Telegram watermark opacity-5
Badge "Active": bg-mint/10 border border-mint/20
Link público: font-mono text-sm bg-bg2 rounded-lg border
Toggles: pares title+description+switch
Welcome textarea: h-32 group focus-within:border-gold/50
Quick reply chips: scroll-x no-scrollbar, chips com ícone + texto
"AI Suggest" btn: gold text + gold bg/10 border rounded-full
Test CTA: sticky bottom, mint full-width
```

### S08 — /onboarding (light_onboard)

```
Body: bg-[#FCFCFC] text-[#1A1A1A]
Header: back arrow + PSIQUE serif centered + spacer
Step indicator: "Step X of 6" + barra progresso mint
Form card: bg-white shadow-mint rounded-2xl p-6 border-gray-50
Input: bg-white border-gray-200 focus:border-mint focus:ring-mint/20
Input icon: absolute left-4 top-1/2 -translate-y-1/2 text-gray-400
Specialty chips: rounded-full, peer-checked mint pattern
"+ Outra": border-dashed border-gray-300
Footer: CTA dark bg (#080F0B) + LGPD note com lock icon gray
```

### S09 — /configuracoes (Segurança)

```
Header section gold: "text-lg font-semibold text-gold flex items-center gap-2"
2FA card: badge "Ativado" mint + btn "Gerenciar" ghost
Privacy toggles: lista vertical, description + switch
Export buttons: p-4 rounded-xl card + ícone 40px + texto + chevron_right
Audit timeline: relative before: (linha vertical) + dots coloridos
Timeline dot: w-4 h-4 rounded-full border-2 (blue/border/mint)
```

### S10 — /portal (light_patient)

```
Header: bg/80 blur, logo esquerdo, avatar direito
Greeting: --ff text-3xl text-text-main
Quote: text-base text-muted italic
Próxima sessão: glass-card, barra topo gradient primary, botão primary
Diário textarea: min-h-[120px] focus:ring-primary/20 focus:border-primary
Toolbar: bg-gray-50 border-t (mood + mic + save)
Entry preview: text-sm leading-relaxed line-clamp-3
Quick actions grid-2: bg-white rounded-2xl border hover:border-primary
Nav light: 4 ícones (home/calendar/book/credit_card)
```

### S11 — / (hero section)

```
Navbar: fixed, logo com spa icon mint + "Psique" serif uppercase
Trust pill: inline-flex, avatares sobrepostos -space-x-2, texto xs
Hero h1: text-5xl font-medium, italic mint span
Subtext: text-lg ivoryD leading-relaxed max-w-md
CTA: w-full max-w-xs, shadow mint, hover scale-[1.02]
Note: text-xs ivoryDD "Sem cartão de crédito • Configure em 5 minutos"
Device mockup: rounded-2xl, card bg, browser chrome (3 dots + URL bar)
Clinical insight card: rotate-[-2deg] hover:rotate-0 duration-500
Telegram card: rotate-[1deg] hover:rotate-0 duration-500, bg-[#2481cc]/10
```

### S12 — / (features section)

```
Section label: text-gold tracking-widest uppercase font-medium
H1: italic mint span na segunda linha
Glass cards: backdrop-blur-[12px], border rgba(28,46,32,0.5)
Feature icon container: w-12 h-12 rounded-full border bg-bg2
Mockup inline: rounded-xl bg-gradient border, dot pulsante mint
Risk/Insight badges: px-2 py-1 text-[10px] rounded-full bg-bg border
Compare blocks: bg-bg2 rounded-xl border (problema vermelho | solução mint)
Bottom CTA: rounded-full (pill), fixed bottom, shadow mint
```

### S13 — /pricing

```
Section label: rounded-full border-gold/30 bg-gold/10 text-gold
H1: text-4xl leading-tight
Plano 1 (Solo): card base, opacity-10 icon decorativo topo-direito
Plano 2 (Clínica Pro): border-mint/50 + linha topo gradient + badge "Recomendado"
Feature list: check_circle mint text-lg + texto ivoryD
CTA solo: bg-border text-ivory
CTA pro: bg-mint text-bg shadow-[0_4px_14px_rgba(82,183,136,0.30)]
FAQ: cards rounded-xl p-5, expand_more icon
```

### S14 — /checkout/secure

```
Header: back (rounded-full icon btn) + lock icon + "SECURE CHECKOUT" uppercase
Order card: bg-card rounded-2xl p-6 border, avatar terapeuta w-14
Detail pills: p-3 rounded-xl bg-bg2 border (data + hora)
Total: serif text-2xl text-ivory
Payment methods: radio peer-checked pattern
Card form: hidden, peer-checked:block, bg-bg2 rounded-xl p-4 border
PIX: qr_code_scanner icon text-mint
Trust row: flex gap-6 opacity-50 (lock + verified_user)
Footer: fixed bottom-0, gradient from-bg, CTA mint
```

### S15 — /auth/login

```
Tema: dark_core (fundo --bg puro, sem sidebar/nav)
Centrado verticalmente: min-h-screen flex items-center justify-center
Card: bg-card border-border rounded-2xl p-8 max-w-sm w-full mx-4
Logo: PSIQUE --ff bold uppercase tracking-widest, centralizado, mb-8
Tabs: Terapeuta | Paciente (underline ativo mint, tab-inactive ivoryDD)
Campos: email + senha (pattern 5.4)
Links: "Esqueceu a senha?" (pill text mint), "Criar conta" (pill text mint)
OAuth: botão ghost com ícone Google + texto "Entrar com Google"
Magic link: botão ghost com ícone email + texto "Link por email"
Divisor: "ou" em ivoryDD entre opções
```

### S16 — /auth/register

```
Igual S08 (light_onboard), mas sem wizard progress
Campos: Nome, Email, CRP, Senha, Confirmar Senha
Especialidades: chips (pattern 5.21)
CTA: dark button (#080F0B)
Link: "Já tem conta? Entrar" (mint, abaixo do CTA)
```

### S17 — /auth/register/patient

```
Tema: light_patient
Campos: Nome, Email, Telefone, Como soube de nós? (select)
CTA: bg-[var(--primary)] text-white
Sem CRP, sem especialidades
Link: "Já tem conta? Entrar" (primary, abaixo do CTA)
```

### S18 — /auth/forgot-password

```
Tema: dark_core
Card centrado max-w-sm
Back arrow btn no topo
H2: --ff text-2xl "Recuperar Acesso"
Subtext: ivoryD text-sm
Campo email (pattern 5.4)
CTA mint: "Enviar Link"
Nota: text-xs ivoryDD "Verifique também a pasta de spam"
```

### S19 — /dashboard/agenda

```
Tema: dark_core
Day selector: grid-cols-7 (ou scroll), chip dia/data, selected=mint
Time column: 08:00-18:00, slots de 30min
Session block: bg-mint/10 border-mint/20 rounded-xl (quando ocupado)
Empty slot: border-dashed border-border opacity-30 hover:opacity-60
FAB: fixed bottom-20 right-4, rounded-full bg-mint text-bg w-12 h-12
Block btn: ghost, top-right
```

### S20 — /dashboard/pacientes

```
Tema: dark_core
Search: input com search icon, bg-card rounded-xl
Filter chips: scroll-x, Todos|Ativos|Novos|Leads (pill, selected=mint)
Grid: grid-cols-1 (mobile) grid-cols-2 (tablet) grid-cols-3 (desktop)
Patient cards: pattern 5.24
Mood bar: barra horizontal colorida por score
```

### S21-S22 — /configuracoes/perfil e /integracoes

```
Tema: dark_core, herda S09
Tabs internos: Perfil | Integrações | Segurança | Notificações | Plano
Perfil: campos + foto upload + link público com copy
Integrações: lista de serviços com status + botão reconectar
```

### S23 — /portal/agendar

```
Tema: light_patient
Herda layout S02 com primary (#4A8FA8) ao invés de mint
Calendar chips: selected = primary
Time slots: selected = primary
Form: Nome, Email, Telefone (light inputs)
CTA: primary button
```

### S24 — /portal/sessoes

```
Tema: light_patient
Lista cronológica: Próximas + Histórico (seções separadas)
Session card: bg-white border rounded-2xl p-4 shadow-sm
Status:
  - Confirmada: badge primary/10 border primary/20
  - Concluída: badge gray
  - Cancelada: badge red/10 strikethrough date
Botão "Entrar": primary, apenas se status=in_progress/upcoming
```

### S25 — /portal/chat

```
Tema: light_patient
Header: "Assistente IA" + dot status (primary)
Chat bubbles:
  User: right, bg-primary/10 border-primary/20 rounded-tr-none
  Bot:  left, bg-white border shadow-sm rounded-tl-none
Input: bg-white border focus:ring-primary/20 + send btn primary
Disclaimer: text-xs text-muted LGPD
```

### S26 — /booking/sucesso

```
Tema: dark_core
Ícone: check_circle, w-20 h-20, rounded-full bg-mint/10 border-mint/30, glow mint
H2: --ff text-3xl "Sessão Confirmada!"
Detalhes: card bg2 border rounded-2xl (data + hora + terapeuta + link acesso)
CTA primário: mint "Ver meu Portal"
CTA secundário: ghost "Adicionar ao Calendário"
Nota: text-xs ivoryDD "Email de confirmação enviado para..."
```

### S27 — loading

```
Tema: dark_core
min-h-screen flex-col items-center justify-center
Logo PSIQUE: --ff text-2xl text-ivory/50 mb-8
Spinner: w-8 h-8 rounded-full border-2 border-border border-t-mint animate-spin
```

### S28 — not-found / global-error

```
Tema: dark_core
min-h-screen flex-col items-center justify-center text-center px-4
Número: --ff text-[120px] font-bold text-gold/20 leading-none
H2: --ff text-3xl text-ivory "Página não encontrada"
Text: text-ivoryD text-sm leading-relaxed max-w-xs
CTA: mint button "Voltar ao Início"
Link: text-[var(--blue)] "Reportar problema" (footer)
```

---

## SEÇÃO 8 — PROIBIÇÕES HARD

```
❌ style={{...}} em qualquer arquivo de app/ ou components/
❌ Tokens legados em TSX: --ff, --fs, --ivory, --mint, --gold, --card, --bg
❌ Fontes: Inter · Roboto · Arial · Outfit · Space Grotesk · system-ui
❌ Cores inventadas fora da paleta desta seção
❌ Roxos, violetas, gradientes não especificados
❌ Gradiente de bg purple → usar SOMENTE bg gradient dark (#080F0B→#0C1510)
❌ TODO / FIXME / HACK em código de produção
❌ any implícito TypeScript
❌ console.log em produção
❌ Invenção de telas fora de S01-S28
❌ Framer-motion obrigatório — CSS Tailwind puro por padrão
❌ Misturar temas (ex: dark_core em portal paciente)
❌ #FFFFFF como fundo em dark_core
❌ #000000 como fundo em dark_core (usar #080F0B)
❌ Marcar "done" sem evidência de gate executado
❌ Comentar TODO em webhook/API routes
❌ Alterar tokens sem atualizar DESIGN_TOKENS.md
```

---

## SEÇÃO 9 — FLUXO DE EXECUÇÃO PADRÃO

```
Toda IA, em toda sessão:

1. Ler AGENTS.md completo (esta seção em especial)
2. Identificar ID de tela alvo (S01..S28)
3. Se S01..S14: ler stitch/Sxx/code.html antes de qualquer código
4. Se S15..S28: ler regra específica na SEÇÃO 7
5. Mapear componentes necessários em SEÇÃO 5
6. Aplicar tokens de SEÇÃO 4
7. Aplicar breakpoints de SEÇÃO 6
8. Implementar SOMENTE o escopo declarado
9. Rodar gates de qualidade (SEÇÃO 10)
10. Atualizar handoff em docs/handoffs/
```

---

## SEÇÃO 9.1 — MELHORES PRÁTICAS OPERACIONAIS

```
P1) Documentação:
    - editar primeiro docs/stitch/*
    - sincronizar files/* com npm run docs:sync:write
    - validar sem drift com npm run docs:sync:check

P2) Contratos:
    - manifesto canônico (v4) é a fonte para catálogo E2E
    - toda mudança de rota/tela exige regenerar catálogo e validar schema

P3) Rotas paciente:
    - canônicas somente em /portal/*
    - rotas curtas (/agendar, /apoio, /chat, /sessoes) são legado com 308
    - manter consistência em app/*/route.ts + proxy.ts + next.config.ts

P4) Segurança operacional:
    - nenhuma rota protegida sem enforcement em proxy.ts
    - handlers críticos com validação explícita de auth/erro
    - webhooks sempre fail-closed

P5) Qualidade contínua:
    - usar scripts oficiais de gate (não checks ad-hoc) antes de declarar done
    - bloquear merge com workflows obrigatórios

P6) Evidência:
    - registrar saída resumida de verify/e2e/visual no handoff
    - manter checksums de artefatos canônicos quando aplicável
```

### 9.2 Matriz de Correlatos (Prática → Artefato → Gate)

| Prática | Correlatos obrigatórios | Gate principal |
|---|---|---|
| Fonte canônica + espelho | `docs/stitch/*`, `files/*`, `scripts/sync-stitch-mirror.mjs` | `npm run docs:sync:check` |
| Manifesto v4 + schema | `docs/stitch/CANONICAL_MANIFEST.json`, `docs/stitch/schema/canonical-manifest.schema.json`, `scripts/check-canonical-manifest.mjs` | `npm run contract:manifest:check` |
| Catálogo de rotas não-visuais | `docs/stitch/NON_SCREEN_ROUTES.json`, `scripts/check-non-screen-routes.mjs` | `npm run contract:non-screen:check` |
| Catálogo E2E derivado | `scripts/generate-screen-catalog.mjs`, `e2e/contracts/screen-catalog.generated.ts` | `npm run contract:manifest:check` |
| Canonicalização `/portal/*` | `app/portal/*`, `app/agendar/route.ts`, `app/apoio/route.ts`, `app/chat/route.ts`, `app/sessoes/route.ts`, `proxy.ts` | `npm run test:e2e` |
| Hardening visual por tokens | `app/globals.css`, `scripts/check-no-hardcoded-colors.mjs` | `npm run lint:colors` |
| Cobertura unit/api | `vitest*.config.ts`, `test/unit/*`, `test/api/*` | `npm run test:unit` + `npm run test:api` |
| Fluxo e visual E2E | `playwright.config.ts`, `e2e/*`, snapshots | `npm run test:e2e` + `npm run test:visual` |
| Bloqueio de regressão em CI | `.github/workflows/*.yml` | checks obrigatórios no PR |

---

## SEÇÃO 10 — GATES DE QUALIDADE

```bash
# G1 — Lint de código
npm run lint

# G2 — TypeScript estrito
npm run typecheck

# G3 — Contrato canônico v4
npm run contract:manifest:check

# G4 — Inventário não-visual
npm run contract:non-screen:check

# G5 — Espelho docs/stitch ↔ files sem drift
npm run docs:sync:check

# G6 — Hardcoded colors (fora allowlist)
npm run lint:colors

# G7 — Build de produção
npm run build

# G8 — Unit tests (inclui cobertura mínima)
npm run test:unit

# G9 — API tests + contratos críticos
npm run test:api

# G10 — E2E de fluxo/contrato de rotas
npm run test:e2e

# G11 — Visual regression (390/768/1440)
npm run test:visual

# Atalhos oficiais
npm run verify      # G1..G9
npm run verify:ci   # G1..G11

# EVIDÊNCIAS OBRIGATÓRIAS (E2E/visual):
# - trace.zip
# - video.webm
# - screenshots (baseline/failed)
```

### 10.1 Workflows bloqueantes (CI)

```
lint
typecheck
build
unit
api
e2e
visual
docs-sync-check
```

Sem todos verdes, merge é proibido.

---

## SEÇÃO 11 — CHANGE MANAGEMENT

```
Ao adicionar tela nova (S29+):
  1. Atribuir ID em docs/stitch/SCREEN_REGISTRY.md
  2. Adicionar entrada em docs/stitch/CANONICAL_MANIFEST.json
  3. Definir tema (dark_core / light_onboard / light_patient / custom)
  4. Documentar regra em SEÇÃO 7 deste arquivo
  5. Adicionar ao backlog em docs/stitch/IMPLEMENTATION_BACKLOG.md
  6. Se tela visual nova, adicionar HTML de referência em stitch/Sxx/

Ao alterar token visual:
  1. Atualizar SEÇÃO 4 deste arquivo
  2. Atualizar docs/stitch/DESIGN_TOKENS.md
  3. Registrar motivo e data no histórico de mudanças (docs/handoffs/)

Ao adicionar componente:
  1. Extrair pattern da SEÇÃO 5 ou do stitch HTML
  2. Não inventar sem base visual documentada
  3. Adicionar em docs/stitch/COMPONENT_LIBRARY.md

Ao alterar gate/pipeline:
  1. Atualizar package.json (scripts oficiais)
  2. Atualizar .github/workflows correspondentes
  3. Atualizar SEÇÃO 10 deste arquivo
  4. Registrar evidência no handoff da fase
```

---

## SEÇÃO 12 — RESUMO EXECUTIVO (EN)

This repository uses Stitch-first governance. `stitch/**` (S01-S14) is the visual source of truth for mapped screens. Screens S15-S28 from psique-final.jsx follow the Canonical Design System documented in this file. All 28 screens are covered with explicit rules for theme, components, and layout. No `style={{...}}` in TSX, no legacy CSS tokens, no font substitution (Cormorant Garamond + Instrument Sans only), no screen invention outside S01-S28. Completion requires quality gates G1-G7 all passing with traceable evidence.

---

*AGENTS.md v3.1 · PSIQUE · Software Lotus · Fase 22 · Sistema 6 Compliant*
*Cobertura: S01-S28 (14 Stitch canônicas + 14 derivadas psique-final.jsx)*
*Temas: dark_core · dark_theater · light_onboard · light_patient*
