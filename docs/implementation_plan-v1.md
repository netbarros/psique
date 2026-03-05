# Plano Microfaseado — Elevação UI/UX E2E do PSIQUE

Plano para elevar **layout, UX e UI** em todas as 28 telas (S01–S28), respeitando integralmente os contratos visuais de `stitch/**` e `AGENTS.md v3.1`. Nenhum contrato de API/Supabase/Stripe será alterado — apenas layout/design/UX. Contratos visuais quebrados ou com gap serão corrigidos; lacunas serão preenchidas.

> [!IMPORTANT]
> Este plano é 100% alinhado com [IMPLEMENTATION_BACKLOG.md](file:///c:/psique/psique/docs/IMPLEMENTATION_BACKLOG.md) (MF-00 → MF-10). Cada micro-fase aqui mapeia 1:1 a uma MF do backlog. Não inventa nada. Executa fielmente os contratos existentes de `stitch/**`, [DESIGN_TOKENS.md](file:///c:/psique/psique/docs/stitch/DESIGN_TOKENS.md), [COMPONENT_LIBRARY.md](file:///c:/psique/psique/docs/stitch/COMPONENT_LIBRARY.md) e [LAYOUT_PATTERNS.md](file:///c:/psique/psique/docs/stitch/LAYOUT_PATTERNS.md).

---

## MF-00 — Baseline e Rastreabilidade

**Objetivo:** Congelar o estado atual antes de qualquer mudança visual.

#### [MODIFY] [globals.css](file:///c:/psique/psique/app/globals.css)
- Nenhuma mudança — snapshot do estado atual.

**Entregas:**
1. Congelar inventário de todas as rotas e subrotas (28 telas), gerar lista A/B/C.
2. Gerar screenshots baseline em 3 viewports (390×844 / 768×1024 / 1440×900) para cada rota.
3. Registrar `tsc + build + playwright` no estado atual (evidência no handoff).
4. Criar `docs/handoffs/HANDOFF-MF00.md`.

**Gate:** Inventário fechado, screenshots versionados, baseline técnico salvo.

---

## MF-01 — Fundação Visual Única

**Objetivo:** Consolidar tokens visuais, fontes canônicas, e eliminar tokens legados de todo o codebase.

#### [MODIFY] [layout.tsx](file:///c:/psique/psique/app/layout.tsx)
- Garantir que `Cormorant Garamond` + `Instrument Sans` são as únicas fontes carregadas (nenhuma Outfit/Inter/Roboto).
- Confirmar Google Fonts link correto no `<head>`.

#### [MODIFY] [globals.css](file:///c:/psique/psique/app/globals.css)
- Consolidar todos os tokens `dark_core` conforme AGENTS.md §3.1.
- Adicionar variáveis `light_patient` e `light_onboard` como `[data-theme="patient"]` / `[data-theme="onboard"]`.
- Adicionar utilitários: `.glass`, `.glow-mint`, `.glow-gold`, `.hide-scrollbar`, `.pb-safe`.
- Remover qualquer `@import` de fontes não-canônicas.

#### [MODIFY] Auditoria em `app/` e `components/`
- `grep -r` para tokens legados em TSX (`--ff`, `--fs`, `--ivory`, `--mint`, `--gold`, `--card`, `--bg`) → zerar.
- Substituir por classes Tailwind mapeadas no `@theme` existente.

**Gate:** Zero legacy tokens, build passa, fontes corretas em todas as rotas.

---

## MF-02 — Shells e Navegação

**Objetivo:** Reconstruir os dois shells (Dashboard Terapeuta + Portal Paciente) fielmente ao contrato.

#### [MODIFY] [DashboardShell.tsx](file:///c:/psique/psique/components/dashboard/DashboardShell.tsx)
- **Mobile (<768px):** Header sticky (logo + bell + avatar) + bottom nav 5 ícones (home, calendar_month, group, smart_toy, settings) conforme CL-15.
- **Tablet (768px+):** Sidebar 64px icon-only com hover tooltip.
- **Desktop (1024px+):** Sidebar 240px completa com logo PSIQUE, nav labels, avatar, logout.
- Implementar `usePathname` para active state preciso em todos os nav items.
- Focus-visible ring canônico em todos os nav links.
- Zero overflow horizontal.

#### [MODIFY] [layout.tsx (patient)](file:///c:/psique/psique/app/(patient)/layout.tsx)
- **Mobile:** Light header sticky (logo + avatar) + bottom nav 4 ícones (Início, Agenda, Diário, Pagamentos).
- **Desktop (768px+):** Sidebar light 224px.
- `main` com `max-w-md mx-auto px-6` (mobile).
- Aplicar `data-theme="patient"` ao wrapper `<div>`, trigando os tokens `light_patient`.

**Gate:** Sem overflow horizontal, navegação funcional, ambos os shells responsive em 3 viewports.

---

## MF-03 — Telas S01–S04 (Núcleo Clínico)

### S01 — /dashboard
#### [MODIFY] [page.tsx](file:///c:/psique/psique/app/dashboard/page.tsx)
- Greeting: `font-display text-3xl font-semibold` + data dinâmica.
- KPI grid: `grid-cols-2` (mobile) → `grid-cols-4` (desktop), dados reais Supabase, padrão `KPI Card` (CL-08).
- UpNext card: `border-brand/30`, gradient bg, glow, botão "Iniciar Sessão".
- Timeline de agenda: time-col (w-12) esquerda + session-card direita + connector line.
- Estados: loading skeleton, empty state, live session pulsante (`animate-pulse`).
- Zero `style={{...}}`.

### S02 — /booking/[slug]
#### [MODIFY] [BookingClient.tsx](file:///c:/psique/psique/app/booking/[slug]/BookingClient.tsx)
- Profile header: avatar `w-24 border-2 border-gold/30`, nome `font-display text-3xl`, quote italic mint.
- Calendar horizontal scroll: snap-x, date chips canônicos (CL-13) — selected/available/unavailable.
- Time slot grid: `grid-cols-3 gap-3`, 3 states (CL-14).
- Form: 3 campos com label+input padrão (CL-05), validação visual.
- Trust badges: LGPD + Criptografado + Pagamento Seguro (CL-16).
- Sticky footer: data/preço/alterar + CTA lock.

### S03 — /consulta/[roomId]
#### [MODIFY] [page.tsx](file:///c:/psique/psique/app/dashboard/consulta/[roomId]/page.tsx) + [ConsultaClient.tsx](file:///c:/psique/psique/components/dashboard/ConsultaClient.tsx)
- Fullscreen theater: bg-black, device frame 390×844 no desktop.
- Video overlay: opacity-70, mix-blend-luminosity.
- PiP self-view: `top-28 right-5`, `rounded-2xl`, border+glow mint.
- Timer pill: glass + dot pulse + MM:SS format.
- Painel clínico: slide-up, `rounded-t-[32px]`, textarea notas h-28.
- Waveform: 3 barras mint animate-ping com delay staggered.
- Controles: mic+video `rounded-[18px]` + End danger `flex-1`.

### S04 — /pacientes/[id]
#### [MODIFY] [page.tsx](file:///c:/psique/psique/app/dashboard/pacientes/[id]/page.tsx) + [PatientDetailTabs.tsx](file:///c:/psique/psique/components/dashboard/PatientDetailTabs.tsx)
- Profile card: avatar `w-16`, nome, status dot, badges diagnóstico.
- Stats 3-col: Sessões | Última | Status Pag (borders divisórias).
- Quick actions: `grid-cols-2` — "Iniciar Sessão" + "Nova Nota".
- Tabs: underline mint 2px no ativo.
- AI Insights card: gradiente mint/gold tênue, ícone `auto_awesome` gold.
- Risk badges: vermelho com warning icon.

**Gate:** S01–S04 visual fiel ao Stitch, zero `style={{}}`, dados reais, estados completos.

---

## MF-04 — Telas S05–S09 (Workspace Operacional)

### S05 — /ia
#### [MODIFY] [page.tsx](file:///c:/psique/psique/app/dashboard/ia/page.tsx)
- Header: "Therapeutic AI" + dot status verde + modelo badge.
- Quick template chips: scroll horizontal `rounded-full`.
- Empty state: ícone `psychiatry` em círculo `border-brand/30`, glow.
- AI response: borda esquerda `mint/50`, `rounded-tl-sm`, footer LGPD (CL-17).
- User message: right-aligned, `rounded-tr-sm` (CL-18).
- Chat input: `focus-within:border-mint/60`, attach + send (CL-19).

### S06 — /financeiro
#### [MODIFY] [page.tsx](file:///c:/psique/psique/app/dashboard/financeiro/page.tsx)
- MRR hero: `font-display text-5xl`, blurred gold circle decorativo.
- Mini bar chart: 6 barras opacidade crescente (CL-20).
- KPI duo: `grid-cols-2` — Pendente (gold) + Imposto (red).
- Transaction list: `divide-y`, avatar-icon, badge status (CL-21).

### S07 — /telegram
#### [MODIFY] [page.tsx](file:///c:/psique/psique/app/dashboard/telegram/page.tsx)
- Bot status card com Telegram watermark `opacity-5`, badge "Active".
- Link público: `font-mono`, `bg-bg2`, botão copy.
- Toggles de automação: 24h+1h+custom (CL-10).
- Welcome textarea: h-32, `focus-within:border-gold/50`.
- Quick reply chips: scroll-x (CL-22).
- AI Suggest: gold style (CL-03 gold-action).
- Test bot CTA: sticky bottom.

### S08 — /onboarding
#### [MODIFY] [page.tsx](file:///c:/psique/psique/app/dashboard/onboarding/page.tsx)
- Aplicar `light_onboard`: bg `#FCFCFC`.
- Step progress bar: "Step X of 6" + barra mint (CL-23).
- Form card: bg-white, shadow-mint, `rounded-2xl` (CL-04 variant).
- Specialty chips: `peer-checked` mint pattern (CL-22).
- CTA dark: bg `#080F0B` text ivory.
- Zero `style={{...}}`.

### S09 — /configuracoes
#### [MODIFY] [page.tsx](file:///c:/psique/psique/app/dashboard/configuracoes/page.tsx) + [TwoFactorSetup.tsx](file:///c:/psique/psique/components/dashboard/TwoFactorSetup.tsx)
- Gold section headers: ícone + texto gold (CL-11 gold variant).
- 2FA card: badge "Ativado" mint + btn "Gerenciar".
- Privacy toggles: lista vertical (CL-10).
- Export buttons: ícone + descrição + `chevron_right`.
- Audit timeline: connector line + dots coloridos.

**Gate:** S05–S09 aderentes ao Stitch, estados interativos completos.

---

## MF-05 — Telas S10–S14 (Portal + Público)

### S10 — /portal
#### [MODIFY] [page.tsx (patient)](file:///c:/psique/psique/app/(patient)/page.tsx)
- Aplicar `light_patient`: bg `#F8F9FA`, `data-theme="patient"`.
- Greeting: `font-display text-3xl` + quote italic `text-muted`.
- Next session glass card: barra topo gradient primary (CL-31).
- Quick actions: `grid-cols-2` (CL-30).

#### [MODIFY] [apoio/page.tsx](file:///c:/psique/psique/app/(patient)/apoio/page.tsx)
- Diary textarea: `min-h-[120px]`, toolbar emoji+mic+save (CL-32).
- Entry cards: `text-sm line-clamp-3`.

### S11–S12 — / (Landing)
#### [MODIFY] [page.tsx](file:///c:/psique/psique/app/page.tsx)
- Navbar fixa: logo `spa+PSIQUE`, links, CTA.
- Trust pill: avatares sobrepostos `-space-x-2` + texto.
- Hero h1: `font-display text-5xl`, italic mint span.
- CTA: `max-w-xs mx-auto`, shadow mint, `hover:scale-[1.02]`.
- Device mockup: `rounded-2xl`, card bg, rotate tilt `hover:rotate-0`.
- Feature cards glass: `backdrop-blur`, border rgba.
- Compare blocks: problema (red) vs solução (mint).
- Section gold label: `tracking-widest uppercase` gold.

### S13 — /pricing
#### [MODIFY] [page.tsx](file:///c:/psique/psique/app/pricing/page.tsx)
- Gold section label + h1 centered.
- Plano Solo: card base, preço `font-display text-5xl`.
- Plano Pro: `border-mint/50`, linha topo gradient, badge recomendado.
- Feature lists: `check_circle` mint (CL-37).
- FAQ accordion: `expand_more` animado (CL-38).

### S14 — /checkout/secure
#### [MODIFY] [page.tsx](file:///c:/psique/psique/app/checkout/secure/page.tsx)
- Header: back btn + lock icon + "SECURE CHECKOUT".
- Order summary: avatar terapeuta + data/hora pills `bg-bg2`.
- Payment radio: card + PIX `peer-checked` pattern (CL-26).
- Card form expandable: `peer-checked:block`.
- Trust row: lock + verified-user `opacity-50`.
- Fixed pay CTA: gradient from-bg, lock icon.
- Integrar Stripe Checkout Embedded (se já existir — caso contrário, marcar stub com placeholder correto).

**Gate:** S10–S14 fiel ao Stitch, navegação pública completa.

---

## MF-06 — Telas Derivadas S15–S28

| S   | Rota                                    | Arquivo                                            | Ação                                                      |
|-----|-----------------------------------------|----------------------------------------------------|------------------------------------------------------------|
| S15 | `/auth/login`                           | [app/auth/login/page.tsx](file:///c:/psique/psique/app/auth/login/page.tsx)                          | Login dual-role: role tabs, dark card centrado             |
| S16 | `/auth/register`                        | [app/auth/register/page.tsx](file:///c:/psique/psique/app/auth/register/page.tsx)                       | Register terapeuta: light_onboard, specialty chips         |
| S17 | `/auth/register/patient`                | [app/auth/register/patient/page.tsx](file:///c:/psique/psique/app/auth/register/patient/page.tsx)               | Register paciente: light_patient, form simples             |
| S18 | `/auth/forgot-password`                 | [app/auth/forgot-password/page.tsx](file:///c:/psique/psique/app/auth/forgot-password/page.tsx)                | Forgot password: dark card centrado, back arrow            |
| S19 | `/dashboard/agenda`                     | [app/dashboard/agenda/page.tsx](file:///c:/psique/psique/app/dashboard/agenda/page.tsx)                    | Agenda semanal: day selector + time grid + FAB             |
| S20 | `/dashboard/pacientes`                  | [app/dashboard/pacientes/page.tsx](file:///c:/psique/psique/app/dashboard/pacientes/page.tsx)                 | Lista pacientes: search + filter chips + patient cards     |
| S21 | `/dashboard/configuracoes/perfil`       | [app/dashboard/configuracoes/perfil/page.tsx](file:///c:/psique/psique/app/dashboard/configuracoes/perfil/page.tsx)      | Settings perfil: tabs internas + form + foto upload        |
| S22 | `/dashboard/configuracoes/integracoes`  | [app/dashboard/configuracoes/integracoes/page.tsx](file:///c:/psique/psique/app/dashboard/configuracoes/integracoes/page.tsx) | Settings integrações: integration items                    |
| S23 | `/portal/agendar`                       | `app/(patient)/agendar/page.tsx`                   | Patient self-booking: S02 em light_patient                 |
| S24 | `/portal/sessoes`                       | `app/(patient)/sessoes/page.tsx`                   | Patient sessions: upcoming + histórico                     |
| S25 | `/portal/chat`                          | `app/(patient)/chat/page.tsx`                      | Patient AI chat: light chat bubbles + input                |
| S26 | `/booking/[slug]/sucesso`               | [app/booking/[slug]/sucesso/page.tsx](file:///c:/psique/psique/app/booking/%5Bslug%5D/sucesso/page.tsx)              | Booking confirmation: check icon glow + card               |
| S27 | Loading global                          | [app/loading.tsx](file:///c:/psique/psique/app/loading.tsx)                                  | Loading: spinner mint + logo faint                         |
| S28 | Not-found / error                       | [app/not-found.tsx](file:///c:/psique/psique/app/not-found.tsx) + [app/global-error.tsx](file:///c:/psique/psique/app/global-error.tsx)       | 404 gold giant + CTA / 500 error boundary                  |

**Gate:** Todas as 14 telas derivadas visualmente coerentes com domínio visual.

---

## MF-07 — E2E Nível 1 (Saúde de Rotas)

#### [MODIFY] [navigation.spec.ts](file:///c:/psique/psique/e2e/navigation.spec.ts)
#### [MODIFY] [screen-contract.spec.ts](file:///c:/psique/psique/e2e/screen-contract.spec.ts)

- Todas as 28 rotas respondem sem 5xx em 3 viewports.
- Rotas protegidas redirecionam para `/auth/login`.
- Rotas públicas acessíveis sem auth.
- Zero `console.error` crítico.
- Zero overflow horizontal.

**Gate:** 100% de rotas saudáveis.

---

## MF-08 — E2E Nível 2 (Fluxos Críticos)

#### [NEW] ou [MODIFY] E2E specs
- Login terapeuta → redirect `/dashboard`.
- Login paciente → redirect `/portal`.
- Logout → redirect `/auth/login`.
- Booking público: data + slot + form + submit.
- Dashboard: KPIs carregam, agenda carrega, UpNext visível.
- Consulta: sala conecta, painel abre, notas editáveis.
- Portal: greeting, próxima sessão, diário salva.
- Configurações: toggle 2FA, export data click.
- AI Chat: enviar mensagem, receber resposta.
- Financeiro: MRR carrega, transações listadas.

**Gate:** Todos os fluxos críticos passam em 3 viewports.

---

## MF-09 — E2E Nível 3 (Visual Regressivo)

#### [MODIFY] [visual-regression.spec.ts](file:///c:/psique/psique/e2e/visual-regression.spec.ts)
- Screenshots comparáveis em 390/768/1440 para todas as 28 rotas.
- Threshold visual ±1% por rota.
- Verificação de clipping, desalinhamento, fontes, contraste.
- Relatório HTML de regressão visual gerado.

**Gate:** Visual regression passa sem delta > 1%.

---

## MF-10 — Hardening Final

- `grep -r "style={{" app/ components/` → **0 resultados**.
- `grep -rE "(--ff|--fs|--ivory|...)" app/ components/` → **0 em TSX**.
- `grep -rn "TODO|FIXME|HACK" app/ components/ lib/` → **0**.
- `npx tsc --noEmit` → **success**.
- `npm run build` → **success**.
- `npx playwright test` → **all green**.
- Relatório HTML consolidado: [playwright-report/index.html](file:///c:/psique/psique/playwright-report/index.html).
- Handoff criado: `docs/handoffs/HANDOFF-FASE23-MF-ELEVATION.md`.
- [CONTINUIDADE-PROMPT.md](file:///c:/psique/psique/docs/handoffs/CONTINUIDADE-PROMPT.md) atualizado.

---

## Princípios Transversais (aplicados em TODAS as MFs)

1. **Fontes:** Apenas `Cormorant Garamond` (display/headings/KPIs) + `Instrument Sans` (body/UI). Zero exceções.
2. **Temas:** `dark_core` (S01-S07, S09, S11-S15, S18-S22, S26-S28), `dark_theater` (S03), `light_onboard` (S08, S16), `light_patient` (S10, S17, S23-S25).
3. **Componentes:** Usar EXATAMENTE os patterns de `AGENTS.md §5` (Button 5 variantes, Card 4 variantes, Input, Badge, KPI Card, etc.).
4. **Proibições:** Zero `style={{}}`, zero tokens legados em TSX, zero fontes proibidas, zero cores fora da paleta.
5. **Dados reais:** Supabase queries existentes são mantidas; sem mock data.
6. **Contratos existentes:** API routes, webhook, Stripe, Telegram — não são tocados a menos que estejam quebrados.
7. **Responsividade:** Toda mudança testada em 3 viewports (390/768/1440).
8. **Material Symbols:** Ícone library principal para dark_core; Lucide React aceitável como complemento.

---

## Verificação

### Automated Tests (existentes)
```bash
# Lint + TypeScript (G1-G2)
npm run lint && npm run typecheck

# Contratos visuais (G3-G6)
npm run contract:manifest:check
npm run contract:non-screen:check
npm run docs:sync:check
npm run lint:colors

# Build (G7)
npm run build

# Unit + API (G8-G9)
npm run test:unit && npm run test:api

# E2E + Visual (G10-G11)
npm run test:e2e
npm run test:visual

# Pipeline completo
npm run verify:ci
```

### Manual Verification (ao final de cada MF)
1. `npm run dev` — abrir `http://localhost:3000` no browser.
2. Navegar cada rota da MF em 3 viewports (DevTools → responsive mode).
3. Verificar fontes via DevTools → Computed → `font-family` (deve ser Cormorant/Instrument Sans).
4. Verificar que não existe overflow horizontal em nenhuma viewport.
5. Screenshots comparativos antes/depois (MF-00 baseline vs estado atual).

---

## Ordem de Execução

```
MF-00 → MF-01 → MF-02 → MF-03 → MF-04 → MF-05 → MF-06 → MF-07 → MF-08 → MF-09 → MF-10
```

> [!CAUTION]
> **Não avançar de fase sem gate aprovado da fase anterior.**
> Cada MF deve ser verificada com `npm run verify` (mínimo) antes de prosseguir.
