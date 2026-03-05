# IMPLEMENTATION_BACKLOG.md — PSIQUE Implementation Backlog v3.0

## Backlog técnico priorizado · MF-00 a MF-10 · 28 telas

---

## STATUS LEGEND

```
🔴 TODO       — não iniciado
🟡 IN PROGRESS — em andamento
🟢 DONE       — gate completo aprovado
⚫ BLOCKED     — aguardando dependência
```

---

## MF-00 — Baseline e Rastreabilidade

| #   | Tarefa                                                               | Status | Gate                    |
| --- | -------------------------------------------------------------------- | ------ | ----------------------- |
| 0.1 | Congelar inventário de TODAS as rotas e subrotas, cobrir e2e (A/B/C) | 🔴     | inventário fechado      |
| 0.2 | Gerar screenshots baseline 390/768/1440 por rota                     | 🔴     | screenshots versionados |
| 0.3 | Registrar tsc + build + playwright no estado atual                   | 🔴     | baseline técnico salvo  |
| 0.4 | Criar `docs/handoffs/HANDOFF-MF00.md`                                | 🔴     | handoff criado          |

---

## MF-01 — Fundação Visual Única

| #   | Tarefa                                                                          | Arquivo              | Status |
| --- | ------------------------------------------------------------------------------- | -------------------- | ------ |
| 1.1 | Substituir Outfit/Inter por Cormorant Garamond + Instrument Sans no layout root | `app/layout.tsx`     | 🔴     |
| 1.2 | Consolidar todos os tokens dark_core em globals.css                             | `app/globals.css`    | 🔴     |
| 1.3 | Adicionar variáveis light_patient e light_onboard como data-theme               | `app/globals.css`    | 🔴     |
| 1.4 | Adicionar utilitários glass, glow, hide-scrollbar, pb-safe                      | `app/globals.css`    | 🔴     |
| 1.5 | Remover qualquer @import de fontes não-canônicas                                | `app/globals.css`    | 🔴     |
| 1.6 | Verificar Tailwind config: garantir CSS vars mapeadas                           | `tailwind.config.ts` | 🔴     |
| 1.7 | Auditoria: zero tokens legados em TSX                                           | todos os arquivos    | 🔴     |

**Gate MF-01:** zero legacy tokens, build passa, fontes corretas em todas as rotas.

---

## MF-02 — Shells e Navegação

| #   | Tarefa                                                                        | Arquivo                                   | Status |
| --- | ----------------------------------------------------------------------------- | ----------------------------------------- | ------ |
| 2.1 | Reconstruir DashboardShell: mobile header + sidebar md+ + bottom nav          | `components/dashboard/DashboardShell.tsx` | 🔴     |
| 2.2 | Implementar sidebar colapsada (64px) no tablet e expandida (240px) no desktop | `components/dashboard/DashboardShell.tsx` | 🔴     |
| 2.3 | Implementar active state via usePathname em todos os nav items                | `components/dashboard/DashboardShell.tsx` | 🔴     |
| 2.4 | Reconstruir PatientLayout: light header + bottom nav 4 itens + main max-w-md  | `app/(patient)/layout.tsx`                | 🔴     |
| 2.5 | Garantir sem overflow horizontal em ambos os shells                           | ambos                                     | 🔴     |
| 2.6 | Implementar focus-visible ring canônico em todos os nav links                 | ambos                                     | 🔴     |
| 2.7 | Testar navegação funcional em todas as rotas do menu                          | E2E                                       | 🔴     |

**Gate MF-02:** sem overflow horizontal, navegação funcional, ambos os shells responsive.

---

## MF-03 — Telas S01-S04 (Núcleo Clínico)

### S01 — /dashboard

| #     | Tarefa                                                                       | Arquivo                  | Status |
| ----- | ---------------------------------------------------------------------------- | ------------------------ | ------ |
| 3.1.1 | Implementar greeting com Cormorant + data dinâmica                           | `app/dashboard/page.tsx` | 🔴     |
| 3.1.2 | KPI grid: grid-cols-2 (mobile) → grid-cols-4 (desktop), dados reais Supabase | `app/dashboard/page.tsx` | 🔴     |
| 3.1.3 | UpNext card: border-mint/30, glow, logo do paciente, botão Iniciar           | `app/dashboard/page.tsx` | 🔴     |
| 3.1.4 | Timeline de agenda: time-col esquerda, session-card direita, connector line  | `app/dashboard/page.tsx` | 🔴     |
| 3.1.5 | Estados: loading skeleton, empty state, live session pulsante                | `app/dashboard/page.tsx` | 🔴     |
| 3.1.6 | Remover todos style={{}}                                                     | `app/dashboard/page.tsx` | 🔴     |

### S02 — /booking/[slug]

| #     | Tarefa                                                                               | Arquivo                                | Status |
| ----- | ------------------------------------------------------------------------------------ | -------------------------------------- | ------ |
| 3.2.1 | Therapist profile header: avatar w-24 border-gold, nome Cormorant, quote italic mint | `app/booking/[slug]/BookingClient.tsx` | 🔴     |
| 3.2.2 | Calendar horizontal scroll: snap-x, date chips canônicos (CL-13)                     | `app/booking/[slug]/BookingClient.tsx` | 🔴     |
| 3.2.3 | Time slot grid-cols-3: selected/available/unavailable (CL-14)                        | `app/booking/[slug]/BookingClient.tsx` | 🔴     |
| 3.2.4 | Form: 3 campos, label + input padrão, validação                                      | `app/booking/[slug]/BookingClient.tsx` | 🔴     |
| 3.2.5 | Trust badges: LGPD + Criptografado + Pagamento Seguro                                | `app/booking/[slug]/BookingClient.tsx` | 🔴     |
| 3.2.6 | Sticky footer: data/preço/alterar + CTA lock                                         | `app/booking/[slug]/BookingClient.tsx` | 🔴     |

### S03 — /consulta/[roomId]

| #     | Tarefa                                                        | Arquivo                                    | Status |
| ----- | ------------------------------------------------------------- | ------------------------------------------ | ------ |
| 3.3.1 | Fullscreen theater: bg-black, device frame no desktop         | `app/dashboard/consulta/[roomId]/page.tsx` | 🔴     |
| 3.3.2 | Video background: Daily.co embed, opacity-70                  | `components/dashboard/ConsultaClient.tsx`  | 🔴     |
| 3.3.3 | PiP self-view: top-28 right-5, rounded-2xl, border+glow       | `components/dashboard/ConsultaClient.tsx`  | 🔴     |
| 3.3.4 | Timer pill: glass, dot pulse, format MM:SS                    | `components/dashboard/ConsultaClient.tsx`  | 🔴     |
| 3.3.5 | Painel clínico: slide-up, rounded-t-[32px], textarea notas    | `components/dashboard/ConsultaClient.tsx`  | 🔴     |
| 3.3.6 | Waveform listening: 3 barras mint animate-ping delay          | `components/dashboard/ConsultaClient.tsx`  | 🔴     |
| 3.3.7 | Controles: mic + video (rounded-[18px]) + End danger (flex-1) | `components/dashboard/ConsultaClient.tsx`  | 🔴     |

### S04 — /pacientes/[id]

| #     | Tarefa                                                               | Arquivo                                      | Status |
| ----- | -------------------------------------------------------------------- | -------------------------------------------- | ------ |
| 3.4.1 | Profile card: avatar w-16, nome, status dot, badges diagnóstico      | `app/dashboard/pacientes/[id]/page.tsx`      | 🔴     |
| 3.4.2 | Stats 3-col: Sessões / Última / Status Pag, bordas divisórias        | `app/dashboard/pacientes/[id]/page.tsx`      | 🔴     |
| 3.4.3 | Quick actions grid-cols-2: Iniciar Sessão + Nova Nota                | `app/dashboard/pacientes/[id]/page.tsx`      | 🔴     |
| 3.4.4 | Tabs: Visão Geral/Prontuário/Financeiro, underline mint 2px          | `components/dashboard/PatientDetailTabs.tsx` | 🔴     |
| 3.4.5 | AI Insights card: gradiente mint/gold tênue, ícone auto_awesome gold | `components/dashboard/PatientDetailTabs.tsx` | 🔴     |
| 3.4.6 | Risk badges: vermelho com warning icon                               | `app/dashboard/pacientes/[id]/page.tsx`      | 🔴     |

**Gate MF-03:** S01-S04 visual fiel ao Stitch, sem style={{}}, dados reais, estados completos.

---

## MF-04 — Telas S05-S09 (Workspace Operacional)

### S05 — /ia

| #     | Tarefa                                                                       | Arquivo                     | Status |
| ----- | ---------------------------------------------------------------------------- | --------------------------- | ------ |
| 4.5.1 | Header: "Therapeutic AI" + status dot verde + modelo badge                   | `app/dashboard/ia/page.tsx` | 🔴     |
| 4.5.2 | Quick template chips: scroll horizontal, rounded-full                        | `app/dashboard/ia/page.tsx` | 🔴     |
| 4.5.3 | Empty state: ícone psychiatry glow, texto Cormorant centrado                 | `app/dashboard/ia/page.tsx` | 🔴     |
| 4.5.4 | AI response card: borda esquerda mint/50, rounded-tl-sm, footer LGPD (CL-17) | `app/dashboard/ia/page.tsx` | 🔴     |
| 4.5.5 | User message: right-aligned, rounded-tr-sm (CL-18)                           | `app/dashboard/ia/page.tsx` | 🔴     |
| 4.5.6 | Chat input: focus-within:border-mint/60, attach + send (CL-19)               | `app/dashboard/ia/page.tsx` | 🔴     |
| 4.5.7 | Integrar OpenRouter API real                                                 | `app/dashboard/ia/page.tsx` | 🔴     |

### S06 — /financeiro

| #     | Tarefa                                                                   | Arquivo                             | Status |
| ----- | ------------------------------------------------------------------------ | ----------------------------------- | ------ |
| 4.6.1 | MRR hero: Cormorant text-5xl, blurred gold circle decorativo             | `app/dashboard/financeiro/page.tsx` | 🔴     |
| 4.6.2 | Mini bar chart: 6 barras opacidade crescente (CL-20)                     | `app/dashboard/financeiro/page.tsx` | 🔴     |
| 4.6.3 | KPI duo grid-cols-2: Pendente (gold) + Imposto (red)                     | `app/dashboard/financeiro/page.tsx` | 🔴     |
| 4.6.4 | Transaction list: divide-y, avatar-icon psychology, badge status (CL-21) | `app/dashboard/financeiro/page.tsx` | 🔴     |
| 4.6.5 | Integrar Stripe invoices + Supabase payments                             | `app/dashboard/financeiro/page.tsx` | 🔴     |

### S07 — /telegram

| #     | Tarefa                                                                | Arquivo                                        | Status |
| ----- | --------------------------------------------------------------------- | ---------------------------------------------- | ------ |
| 4.7.1 | Bot status card: Telegram watermark opacity-5, badge "Active"         | `app/dashboard/telegram/page.tsx`              | 🔴     |
| 4.7.2 | Link público: font-mono, bg-bg2, botão copy                           | `app/dashboard/telegram/page.tsx`              | 🔴     |
| 4.7.3 | Toggles de automação: 24h + 1h + custom (CL-10)                       | `app/dashboard/telegram/page.tsx`              | 🔴     |
| 4.7.4 | Welcome textarea: h-32, focus-within border-gold/50                   | `components/dashboard/TelegramAutomations.tsx` | 🔴     |
| 4.7.5 | Quick reply chips scroll-x (CL-22 pattern)                            | `components/dashboard/TelegramAutomations.tsx` | 🔴     |
| 4.7.6 | AI Suggest button: gold style (CL-03 gold-action)                     | `components/dashboard/TelegramAutomations.tsx` | 🔴     |
| 4.7.7 | **CRÍTICO**: Fechar TODO webhook → Stripe checkout real (ver Fase 18) | `app/api/telegram/webhook/route.ts`            | 🔴     |
| 4.7.8 | Test bot CTA: sticky bottom (CL-12)                                   | `app/dashboard/telegram/page.tsx`              | 🔴     |

### S08 — /onboarding

| #     | Tarefa                                                      | Arquivo                             | Status |
| ----- | ----------------------------------------------------------- | ----------------------------------- | ------ |
| 4.8.1 | Aplicar light_onboard: bg #FCFCFC, não dark                 | `app/dashboard/onboarding/page.tsx` | 🔴     |
| 4.8.2 | Step progress bar: "Step X of 6" + barra mint (CL-23)       | `app/dashboard/onboarding/page.tsx` | 🔴     |
| 4.8.3 | Form card: bg-white shadow-mint rounded-2xl (CL-04 variant) | `app/dashboard/onboarding/page.tsx` | 🔴     |
| 4.8.4 | Specialty chips: peer-checked mint pattern (CL-22)          | `app/dashboard/onboarding/page.tsx` | 🔴     |
| 4.8.5 | CTA dark button: bg #080F0B text ivory (CL-03 dark)         | `app/dashboard/onboarding/page.tsx` | 🔴     |
| 4.8.6 | Remover todos style={{}}                                    | `app/dashboard/onboarding/page.tsx` | 🔴     |

### S09 — /configuracoes

| #     | Tarefa                                                        | Arquivo                                   | Status |
| ----- | ------------------------------------------------------------- | ----------------------------------------- | ------ |
| 4.9.1 | Gold section headers: ícone + texto gold (CL-11 gold variant) | `app/dashboard/configuracoes/page.tsx`    | 🔴     |
| 4.9.2 | 2FA card: badge "Ativado" mint + btn "Gerenciar"              | `components/dashboard/TwoFactorSetup.tsx` | 🔴     |
| 4.9.3 | Privacy toggles: lista vertical (CL-10)                       | `app/dashboard/configuracoes/page.tsx`    | 🔴     |
| 4.9.4 | Export buttons: ícone + descrição + chevron_right             | `app/dashboard/configuracoes/page.tsx`    | 🔴     |
| 4.9.5 | Audit timeline: connector line + dots coloridos (CL-09 audit) | `app/dashboard/configuracoes/page.tsx`    | 🔴     |
| 4.9.6 | Remover todos style={{}}                                      | todos                                     | 🔴     |

**Gate MF-04:** S05-S09 aderentes ao Stitch, estados interativos completos.

---

## MF-05 — Telas S10-S14 (Portal + Público)

### S10 — /portal

| #      | Tarefa                                                       | Arquivo                        | Status |
| ------ | ------------------------------------------------------------ | ------------------------------ | ------ |
| 5.10.1 | Aplicar light_patient: bg #F8F9FA, data-theme="patient"      | `app/(patient)/page.tsx`       | 🔴     |
| 5.10.2 | Greeting: Cormorant text-3xl + quote italic text-muted       | `app/(patient)/page.tsx`       | 🔴     |
| 5.10.3 | Next session glass card: barra topo gradient primary (CL-31) | `app/(patient)/page.tsx`       | 🔴     |
| 5.10.4 | Diary textarea: min-h-120, toolbar emoji+mic+save (CL-32)    | `app/(patient)/apoio/page.tsx` | 🔴     |
| 5.10.5 | Entry cards: text-sm line-clamp-3                            | `app/(patient)/apoio/page.tsx` | 🔴     |
| 5.10.6 | Quick actions grid-cols-2: CL-30                             | `app/(patient)/page.tsx`       | 🔴     |

### S11-S12 — / (Landing)

| #      | Tarefa                                                         | Arquivo        | Status |
| ------ | -------------------------------------------------------------- | -------------- | ------ |
| 5.11.1 | Navbar fixa: logo spa+PSIQUE, links, CTA                       | `app/page.tsx` | 🔴     |
| 5.11.2 | Trust pill: avatares sobrepostos -space-x-2 + texto            | `app/page.tsx` | 🔴     |
| 5.11.3 | Hero h1: Cormorant text-5xl, italic mint span                  | `app/page.tsx` | 🔴     |
| 5.11.4 | CTA: max-w-xs mx-auto, shadow mint, hover scale-[1.02]         | `app/page.tsx` | 🔴     |
| 5.11.5 | Device mockup: rounded-2xl card bg, rotate tilt hover:rotate-0 | `app/page.tsx` | 🔴     |
| 5.12.1 | Feature cards glass: backdrop-blur border rgba                 | `app/page.tsx` | 🔴     |
| 5.12.2 | Compare blocks: problema (red) vs solução (mint)               | `app/page.tsx` | 🔴     |
| 5.12.3 | Section gold label: tracking-widest uppercase gold             | `app/page.tsx` | 🔴     |

### S13 — /pricing

| #      | Tarefa                                                            | Arquivo                | Status |
| ------ | ----------------------------------------------------------------- | ---------------------- | ------ |
| 5.13.1 | Gold section label + h1 centered                                  | `app/pricing/page.tsx` | 🔴     |
| 5.13.2 | Plano Solo: card base, preço Cormorant text-5xl                   | `app/pricing/page.tsx` | 🔴     |
| 5.13.3 | Plano Pro: border-mint/50, linha topo gradient, badge recomendado | `app/pricing/page.tsx` | 🔴     |
| 5.13.4 | Feature lists: check_circle mint (CL-37)                          | `app/pricing/page.tsx` | 🔴     |
| 5.13.5 | FAQ accordion: expand_more animado (CL-38)                        | `app/pricing/page.tsx` | 🔴     |

### S14 — /checkout/secure

| #      | Tarefa                                                   | Arquivo                        | Status |
| ------ | -------------------------------------------------------- | ------------------------------ | ------ |
| 5.14.1 | Header: back btn + lock icon + "SECURE CHECKOUT"         | `app/checkout/secure/page.tsx` | 🔴     |
| 5.14.2 | Order summary: avatar terapeuta + data/hora pills bg-bg2 | `app/checkout/secure/page.tsx` | 🔴     |
| 5.14.3 | Payment radio: card + PIX peer-checked pattern (CL-26)   | `app/checkout/secure/page.tsx` | 🔴     |
| 5.14.4 | Card form expandable: peer-checked:block                 | `app/checkout/secure/page.tsx` | 🔴     |
| 5.14.5 | Trust row: lock + verified-user opacity-50               | `app/checkout/secure/page.tsx` | 🔴     |
| 5.14.6 | Fixed pay CTA: gradient from-bg, lock icon               | `app/checkout/secure/page.tsx` | 🔴     |
| 5.14.7 | Integrar Stripe Checkout Embedded real                   | `app/checkout/secure/page.tsx` | 🔴     |

**Gate MF-05:** S10-S14 fiel ao Stitch, navegação pública completa.

---

## MF-06 — Telas Derivadas S15-S28

| #    | ID  | Tarefa                                                      | Arquivo                                            | Status |
| ---- | --- | ----------------------------------------------------------- | -------------------------------------------------- | ------ |
| 6.1  | S15 | Login dual-role: role tabs, dark card centrado (CL-42)      | `app/auth/login/page.tsx`                          | 🔴     |
| 6.2  | S16 | Register terapeuta: light_onboard, specialty chips (CL-22)  | `app/auth/register/page.tsx`                       | 🔴     |
| 6.3  | S17 | Register paciente: light_patient, form simples              | `app/auth/register/patient/page.tsx`               | 🔴     |
| 6.4  | S18 | Forgot password: dark card centrado, back arrow             | `app/auth/forgot-password/page.tsx`                | 🔴     |
| 6.5  | S19 | Agenda semanal: day selector + time grid + FAB (ver LP)     | `app/dashboard/agenda/page.tsx`                    | 🔴     |
| 6.6  | S20 | Lista pacientes: search + filter chips + patient cards grid | `app/dashboard/pacientes/page.tsx`                 | 🔴     |
| 6.7  | S21 | Settings perfil: tabs internas + form + foto upload         | `app/dashboard/configuracoes/perfil/page.tsx`      | 🔴     |
| 6.8  | S22 | Settings integrações: integration items (CL-44)             | `app/dashboard/configuracoes/integracoes/page.tsx` | 🔴     |
| 6.9  | S23 | Portal agendar: S02 em light_patient com primary            | `app/(patient)/agendar/page.tsx`                   | 🔴     |
| 6.10 | S24 | Portal sessões: upcoming + histórico session cards (CL-28)  | `app/(patient)/sessoes/page.tsx`                   | 🔴     |
| 6.11 | S25 | Portal chat: light chat bubbles (CL-29) + light input       | `app/(patient)/chat/page.tsx`                      | 🔴     |
| 6.12 | S26 | Booking sucesso: check icon glow + card detalhes (CL-39)    | `app/booking/[slug]/sucesso/page.tsx`              | 🔴     |
| 6.13 | S27 | Loading screen: spinner mint + logo faint (CL-40)           | `app/loading.tsx`                                  | 🔴     |
| 6.14 | S28 | Not-found + global-error: 404 gold giant + CTA (CL-41)      | `app/not-found.tsx` + `global-error.tsx`           | 🔴     |

**Gate MF-06:** todas as 14 telas derivadas visualmente coerentes com domínio visual.

---

## MF-07 — E2E Nível 1 (Saúde de Rotas)

| #   | Teste                                          | Cobertura       | Status |
| --- | ---------------------------------------------- | --------------- | ------ |
| 7.1 | Todas as 28 rotas respondem sem 5xx            | 390/768/1440    | 🔴     |
| 7.2 | Rotas protegidas redirecionam para /auth/login | todos viewports | 🔴     |
| 7.3 | Rotas públicas acessíveis sem auth             | todos viewports | 🔴     |
| 7.4 | Zero console.error crítico em todas as rotas   | todos viewports | 🔴     |
| 7.5 | Zero pageerror em todas as rotas               | todos viewports | 🔴     |
| 7.6 | Zero overflow horizontal em todas as rotas     | todos viewports | 🔴     |

---

## MF-08 — E2E Nível 2 (Fluxos Críticos)

| #    | Fluxo                                                    | Spec                     | Status |
| ---- | -------------------------------------------------------- | ------------------------ | ------ |
| 8.1  | Login terapeuta → redirect /dashboard                    | `e2e/auth.spec.ts`       | 🔴     |
| 8.2  | Login paciente → redirect /portal                        | `e2e/auth.spec.ts`       | 🔴     |
| 8.3  | Logout → redirect /auth/login                            | `e2e/auth.spec.ts`       | 🔴     |
| 8.4  | Booking público: selecionar data + slot + form + submit  | `e2e/booking.spec.ts`    | 🔴     |
| 8.5  | Dashboard: KPIs carregam, agenda carrega, UpNext visível | `e2e/dashboard.spec.ts`  | 🔴     |
| 8.6  | Consulta: sala conecta, painel abre, notas editáveis     | `e2e/consulta.spec.ts`   | 🔴     |
| 8.7  | Portal paciente: greeting, próxima sessão, diário salva  | `e2e/portal.spec.ts`     | 🔴     |
| 8.8  | Configurações: toggle 2FA, export data click             | `e2e/security.spec.ts`   | 🔴     |
| 8.9  | AI Chat: enviar mensagem, receber resposta               | `e2e/ia.spec.ts`         | 🔴     |
| 8.10 | Financeiro: MRR carrega, transações listadas             | `e2e/financeiro.spec.ts` | 🔴     |

---

## MF-09 — E2E Nível 3 (Visual Regressivo)

| #   | Tarefa                                                         | Status |
| --- | -------------------------------------------------------------- | ------ |
| 9.1 | Screenshots comparáveis em 390/768/1440 para todas as 28 rotas | 🔴     |
| 9.2 | Threshold visual definido por rota (±1%)                       | 🔴     |
| 9.3 | Verificação de clipping, desalinhamento, fontes, contraste     | 🔴     |
| 9.4 | Relatório HTML de regressão visual gerado                      | 🔴     |

---

## MF-10 — Hardening Final

| #    | Gate                              | Comando                                                      | Status |
| ---- | --------------------------------- | ------------------------------------------------------------ | ------ |
| 10.1 | Zero inline styles                | `grep -r "style={{" app/ components/` → 0                    | 🔴     |
| 10.2 | Zero tokens legados TSX           | `grep -rE "(--ff\|--fs\|--ivory\|...)" app/ components/` → 0 | 🔴     |
| 10.3 | Zero TODOs                        | `grep -rn "TODO\|FIXME\|HACK" app/ components/ lib/` → 0     | 🔴     |
| 10.4 | TypeScript                        | `npx tsc --noEmit` → success                                 | 🔴     |
| 10.5 | Build                             | `npm run build` → success                                    | 🔴     |
| 10.6 | Playwright                        | `npx playwright test` → all green                            | 🔴     |
| 10.7 | Relatório HTML consolidado criado | `playwright-report/index.html`                               | 🔴     |
| 10.8 | Handoff FASE21 criado             | `docs/handoffs/HANDOFF-FASE21.md`                            | 🔴     |
| 10.9 | CONTINUIDADE-PROMPT.md atualizado | `docs/handoffs/CONTINUIDADE-PROMPT.md`                       | 🔴     |

---

## BACKLOG CRÍTICO PENDENTE (Técnico)

### TELEGRAM WEBHOOK → STRIPE (Fase 18 — TODO aberto)

```
Arquivo: app/api/telegram/webhook/route.ts
Callback: book_slot_<appointmentId>

Implementação pendente:
1. Carregar appointment/patient/therapist do Supabase
2. Verificar se stripe_session_id já existe e ainda é válida
3. SE válida: reusar sessão (retornar URL existente)
4. SE expirada/nula: criar nova sessão Stripe Checkout
5. Persistir stripe_session_id no appointment
6. Responder no Telegram com botão inline URL de pagamento
7. Tratar casos: já pago / email ausente / erro Stripe
8. Remover placeholder TODO definitivamente

Arquivo lib/telegram.ts:
- Adicionar tipo InlineKeyboardButton com suporte a url
  { text: string; url: string } | { text: string; callback_data: string }
- Atualizar InlineKeyboardMarkup e inlineKeyboard() retrocompatível
```

### SUPABASE RLS — VERIFICAR (Fase 21)

```
Verificar se todas as tabelas têm RLS habilitado:
- therapists: leitura própria somente
- patients: leitura somente pelo terapeuta vinculado
- appointments: leitura pelo terapeuta ou paciente vinculado
- diary_entries: leitura somente pelo paciente
- audit_logs: leitura somente pelo terapeuta
- telegram_configs: leitura somente pelo terapeuta
```

---

## ORDEM RECOMENDADA

```
MF-00 → MF-01 → MF-02 → MF-03 → MF-04 → MF-05 → MF-06 → MF-07 → MF-08 → MF-09 → MF-10
```

**Regra:** não avançar de fase sem gate aprovado da fase anterior.

---

_IMPLEMENTATION_BACKLOG.md v3.0 · PSIQUE · 28 telas · Sistema 6 Compliant_
