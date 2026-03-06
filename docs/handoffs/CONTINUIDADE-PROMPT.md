# PROMPT DE CONTINUIDADE — PSIQUE SaaS Platform

> Cole este prompt inteiro em uma nova sessão do Antigravity/Gemini para retomar o projeto sem gaps.

---

## 🔄 Atualização de Continuidade — Fase 22 v3.3 (2026-03-06)

### Status consolidado
- Reconciliação enterprise MF-00..MF-11 permanece concluída.
- `docs/stitch/*` segue fonte canônica; `files/*` segue espelho automático sem edição manual.
- Runtime Next 16 consolidado com `proxy.ts`.
- Superfície backend auditada em `73` APIs sem falhas críticas de contrato.
- Sessão 2026-03-06 saneou warnings de lint, gaps de observabilidade backend e falhas E2E/visual.

### Gates atuais (evidência fresca da sessão)
1. `npm run lint` → **PASS** (0 warnings)
2. `npm run typecheck` → **PASS**
3. `npm run contract:manifest:check` → **PASS** (`32 screens`)
4. `npm run contract:non-screen:check` → **PASS** (`73 api paths`)
5. `npm run docs:sync:check` → **PASS** (`0 drift`)
6. `npm run lint:colors` → **PASS** (`12 allowlisted occurrences`)
7. `npm run backend:audit:write` → **PASS** (`293/293`, `criticalFailed=0`)
8. `npm run verify` → **PASS** (build + unit + api + contratos)
9. `npm run test:e2e` → **PASS** (`237 passed`, `9 skipped`, `0 failed`)

### Reconciliações concluídas (E2E/visual)
1. `admin-integrations.real.spec.ts`: espera de inicialização robusta para o botão `Inicializar stack padrão`.
2. `booking.spec.ts`: asserts alinhados ao contrato atual de copy/step indicator.
3. `integrations.authenticated.spec.ts`: seletor de senha ambíguo removido e fluxo read-only validado.
4. `screen-contract.spec.ts`: overflow S16 mobile estabilizado com hardening global de ícones (`material-symbols-outlined`).
5. `visual-regression.spec.ts`: snapshots atualizados para `landing`, `pricing`, `auth-login` em 390/768/1440.

### Skips atuais (esperados)
1. `admin-integrations.real.spec.ts` conectores reais Telegram/Stripe/Asaas (dependem de secrets reais de provider; 3 casos x 3 viewports = 9 skips).

### Correlatos obrigatórios (resumo)
- Governança de espelho: `scripts/sync-stitch-mirror.mjs` + `npm run docs:sync:*`
- Contrato canônico: `docs/stitch/CANONICAL_MANIFEST.json` + schema em `docs/stitch/schema/`
- Catálogo não-visual: `docs/stitch/NON_SCREEN_ROUTES.json`
- Catálogo E2E gerado: `e2e/contracts/screen-catalog.generated.ts`
- Contrato backend↔frontend: `docs/handoffs/BACKEND-CONTRACT-FRONTEND-AGENT.md`
- Checklist de PR para layout/backend: `docs/handoffs/PR-CHECKLIST-LAYOUT-AGENT.md`
- Orquestrador de auditoria backend: `scripts/backend-audit-orchestrator.mjs`
- Baseline de auditoria backend: `docs/baselines/mf23_backend_audit/report.json`

### Artefatos-chave da Fase 22
- Plano atualizado: `docs/implementation_plan.md` (Fase 22)
- Handoff consolidado: `docs/handoffs/HANDOFF-FASE22-RECONCILIACAO-E2E.md`
- Contrato backend↔frontend: `docs/handoffs/BACKEND-CONTRACT-FRONTEND-AGENT.md`
- Checklist operacional de integração: `docs/handoffs/PR-CHECKLIST-LAYOUT-AGENT.md`

---

## Contexto do Projeto

Você está continuando o desenvolvimento da plataforma **PSIQUE** — um SaaS clínico para psicanalistas brasileiros, construído em **Next.js 16.1.6 (latest) + TypeScript strict + Supabase + Tailwind v4+Enterprise Luxury Minimalist (Dark Theme)** usando Tailwind CSS v4, motion preferencialmente via CSS/Tailwind (Framer Motion opcional) e Supabase (sem valores mockados)\*\*.

**Projeto localizado em:** `c:\psique\psique`
**Documentação master:** `c:\psique\psique\docs\PSIQUE_CURSOR_MASTER_PROMPT.md`
**Protótipo de referência UI:** `c:\psique\psique\docs\psique-final.jsx`
**Implementation Plan Pendente:** `c:\psique\psique\docs\implementation_plan.md`

---

## Estado Atual — O que já foi feito (VALIDADO com TSC_PASSED)

### ✅ Fases Concluídas

| Fase                                       | Status        | Handoff                                                        |
| ------------------------------------------ | ------------- | -------------------------------------------------------------- |
| Fase 1 — Fundação Next.js 15               | ✅ TSC_PASSED | `docs/handoffs/HANDOFF-FASE1.md`                               |
| Fase 2-3 — Supabase Schema + Auth          | ✅ TSC_PASSED | `docs/handoffs/HANDOFF-FASE2-3.md`                             |
| Fase 4 — Design System (12 componentes)    | ✅ TSC_PASSED | `docs/handoffs/HANDOFF-FASE4.md`                               |
| Fase 5-6 — Libs de Integração + API Routes | ✅ TSC_PASSED | `docs/handoffs/HANDOFF-FASE5-6.md`                             |
| Fase 7 — Dashboard Terapeuta (completo)    | ✅ TSC_PASSED | `docs/handoffs/HANDOFF-FASE7.md` + `HANDOFF-FASE7-COMPLETE.md` |
| Fase 8 — Portal do Paciente (6 páginas)    | ✅ TSC_PASSED | `docs/handoffs/HANDOFF-FASE8.md`                               |
| Fase 9 — Booking Público + Stripe          | ✅ TSC_PASSED | `docs/handoffs/HANDOFF-FASE9.md`                               |
| Fase 10 — Segurança (2FA + CPF)            | ✅ TSC_PASSED | `docs/handoffs/HANDOFF-FASE10.md`                              |
| Fase 11-12 — Produto + Polish              | ✅ TSC_PASSED | `docs/handoffs/HANDOFF-FASE11-12.md`                           |
| Fase 12 — Playwright + Sentry + Deploy     | ✅ TSC_PASSED | `docs/handoffs/HANDOFF-FASE12.md`                              |
| Fase 13 — Enterprise Design System Setup   | ✅ TSC_PASSED | `docs/handoffs/HANDOFF-FASE13.md`                              |
| Fase 14 — Therapist UI Redesign            | ✅ TSC_PASSED | `docs/handoffs/HANDOFF-FASE14.md`                              |
| Fase 15 — Patient UI Redesign              | ✅ TSC_PASSED | `docs/handoffs/HANDOFF-FASE15.md`                              |
| Fase 16 — Public Booking UI Redesign       | ✅ TSC_PASSED | `docs/handoffs/HANDOFF-FASE16.md`                              |
| Fase 17 — Audits & E2E Validation          | ✅ TSC_PASSED | `docs/handoffs/HANDOFF-FASE17.md`                              |
| Fase 18 — Layout Standardization Zero Gaps | ✅ TSC_PASSED | `docs/handoffs/HANDOFF-FASE18.md`                              |
| Fase 19 — Governança Stitch-First          | ✅ TSC_PASSED | `docs/handoffs/HANDOFF-FASE19.md`                              |
| Fase 20 — Stitch Rollout + E2E 3 Viewports | ✅ TSC_PASSED | `docs/handoffs/HANDOFF-FASE20.md`                              |

**Leia todos os handoffs antes de começar.** Eles contêm os detalhes exatos de cada arquivo criado.

### 🔎 Rastreabilidade — Fase 18

- Plano anexado: `docs/implementation_plan.md` (seção **Fase 18** no final).
- Handoff da fase: `docs/handoffs/HANDOFF-FASE18.md`.
- Escopo técnico executado:
  - remoção de `style={{...}}` em `app/` + `components/`,
  - eliminação de tokens legados em TSX (`--ff`, `--fs`, `--ivory`, `--mint`, `--gold`, `--card`, `--bg`),
  - implementação do checkout Stripe real no webhook Telegram (`book_slot_*`) com botão URL.
- Resultado do gate:
  - `TSC_PASSED`,
  - `npm run build` OK,
  - Playwright (`auth/navigation/booking`) OK,
  - auditoria UI desktop/mobile com `trace + video + screenshot` e HTML report dedicado (`playwright-report/fase18-ui/index.html`),
  - resíduos `e2e_` = 0.

### Resumo técnico da execução (Fase 18)

1. **Telegram checkout real em produção**
   - `lib/telegram.ts` agora aceita botões inline com `url` e `callback_data`.
   - `app/api/telegram/webhook/route.ts` deixou de usar placeholder e passou a:
     - resolver appointment/patient/therapist,
     - reusar sessão Stripe válida quando aplicável,
     - criar sessão nova quando necessário,
     - persistir `stripe_session_id`,
     - responder no Telegram com URL navegável de pagamento.

2. **Padronização visual enterprise sem inline object styles**
   - ondas A/B/C executadas nos arquivos críticos do dashboard, patient portal, shell e componentes base.
   - estilos dinâmicos migrados para classes Tailwind + mapeamentos por estado.

3. **Governança de qualidade**
   - lacunas estáticas zeradas:
     - `style={{...}}` = 0
     - tokens legados em TSX = 0
     - `TODO|FIXME|HACK` em `app/components/lib` = 0

4. **Remediação visual enterprise pós-auditoria**
   - reforço sistêmico de UX/UI aplicado em:
     - `app/globals.css`
     - `components/ui/EnterpriseCard.tsx`
     - `components/dashboard/DashboardShell.tsx`
     - `app/dashboard/page.tsx`
     - `app/dashboard/agenda/page.tsx`
     - `app/dashboard/configuracoes/page.tsx`
     - `app/auth/login/page.tsx`
   - novo contrato E2E de layout:
     - `e2e/layout.enterprise.spec.ts`
     - checks autenticados ativáveis via `E2E_THERAPIST_EMAIL` + `E2E_THERAPIST_PASSWORD`

### Arquivos principais já implementados

```
app/
  layout.tsx                    ← root layout com <Toast /> Sonner global
  page.tsx                      ← landing pública Stitch (S11 + S12)
  globals.css                   ← design tokens PSIQUE (mint/gold/ivory/dark)
  auth/
    login/page.tsx              ← login + register + magic link + OAuth + CRP + role toggle (therapist/patient)
    callback/route.ts           ← OAuth callback + auto-criação de perfil terapeuta
  dashboard/
    layout.tsx                  ← auth guard + DashboardShell
    page.tsx                    ← KPIs reais: MRR, sessões, NPS, agenda do dia
    onboarding/page.tsx         ← wizard 6 passos (salva no Supabase)
    agenda/page.tsx             ← calendário semanal Seg-Dom com status badges
    pacientes/page.tsx          ← lista: avatar, status, sessions, mood, telegram
    pacientes/[id]/page.tsx     ← detalhe com 4 abas: Prontuário, Sessões, IA, Financeiro
    consulta/[roomId]/page.tsx  ← videochamada Daily.co + timer + notas + IA summarize
    ia/page.tsx                 ← análise de carteira IA completa
    telegram/page.tsx           ← painel bot: status, 6 automações, 7 comandos
    financeiro/page.tsx         ← MRR, pagamentos, KPIs financeiros
    configuracoes/page.tsx      ← perfil, integrações, segurança
  (patient)/
    layout.tsx                  ← auth guard paciente (patients.user_id) + sidebar
    page.tsx                    ← home: próximas sessões, stats, ações rápidas
    agendar/page.tsx            ← grade 14 dias + time slots
    sessoes/page.tsx            ← histórico: NPS, mood, resumo IA
    chat/page.tsx               ← chat IA completo com sugestões e CVV
    apoio/page.tsx              ← diário + mood tracker + 4 técnicas + recursos
  portal/
    layout.tsx                  ← wrapper explícito das rotas do paciente em /portal
    page.tsx                    ← wrapper da home do paciente
    agendar/page.tsx            ← wrapper da agenda do paciente
    sessoes/page.tsx            ← wrapper de histórico do paciente
    chat/page.tsx               ← wrapper do concierge AI
    apoio/page.tsx              ← wrapper de apoio diário
  booking/
    [slug]/page.tsx             ← perfil terapeuta público + availability
    [slug]/BookingClient.tsx    ← 3-step: horário → dados → Stripe checkout
    [slug]/sucesso/page.tsx     ← confirmação pós-pagamento
  api/
    ai/summarize/route.ts       ← auth + rate limit + OpenRouter + persistência
    ai/insights/route.ts        ← análise de carteira IA
    ai/chat/route.ts            ← chat IA paciente + rate limit + context
    booking/checkout/route.ts   ← anti-double-booking + find/create patient + Stripe + CPF
    auth/mfa/enroll/route.ts    ← TOTP enroll via Supabase MFA
    auth/mfa/verify/route.ts    ← challenge + verify TOTP code
    auth/mfa/unenroll/route.ts  ← remove TOTP factor
    appointments/[id]/cancel/route.ts  ← cancelamento com política + refund + email
    appointments/[id]/reschedule/route.ts ← reagendamento anti-conflito + email
    subscriptions/route.ts      ← POST criar subscription / DELETE cancelar
    reports/sessions/route.ts   ← GET → PDF relatório terapêutico
    video/room/route.ts         ← criar sala Daily.co + token owner
    telegram/webhook/route.ts   ← bot completo (7 cmds + NPS + intent detection)
    webhooks/stripe/route.ts    ← checkout.session.completed + Daily + email + TG
    cron/reminders/route.ts     ← 24h/1h lembretes + NPS pós-sessão

components/
  ui/
    Button.tsx    Card.tsx    Input.tsx    Select.tsx    Modal.tsx
    Toast.tsx     Avatar.tsx  Badge.tsx    Spinner.tsx
    Counter.tsx   LineChart.tsx  BarChart.tsx
  dashboard/
    DashboardShell.tsx          ← sidebar com nav ativa + AI/Telegram badges
    PatientDetailTabs.tsx       ← abas paciente (client component)
    ConsultaClient.tsx          ← videochamada (client component)
    TwoFactorSetup.tsx          ← 2FA TOTP: enroll + verify + unenroll

lib/
  supabase/client.ts  server.ts  admin.ts
  openrouter.ts  telegram.ts  daily.ts  stripe.ts  resend.ts
  utils.ts  logger.ts  ratelimit.ts
  pdf/session-report.tsx      ← React-PDF template A4 com stats + sessões + financeiro

proxy.ts                        ← auth guard e canonicalização de rotas legadas
supabase/migrations/
  20240301000001_initial.sql    ← 11 tabelas + 13 RLS policies + rollback
  20260304000002_patient_profile_policy.sql ← policy RLS patient_own_profile (SELECT próprio perfil)
types/
  database.ts  domain.ts

# Error pages & loading
app/not-found.tsx               ← 404 design PSIQUE
app/global-error.tsx            ← 500 error boundary + retry
app/loading.tsx                 ← root loading spinner
```

---

## 🎯 PSIQUE PLATFORM — TODAS AS FASES CONCLUÍDAS

### Para futura evolução:

- Emissão de NF (Nuvemfiscal)
- PWA modo offline
- Novos idiomas (i18n)

---

## Regras INVIOLÁVEIS

1. **Sempre rodar `npm run verify:ci` antes de declarar conclusão** (sem sucesso completo, sem “done”).
2. **`docs/stitch/*` é canônico e `files/*` é espelho**: nunca editar manualmente `files/*`.
3. **Toda mudança em docs canônicas exige `npm run docs:sync:write` + `npm run docs:sync:check`.**
4. **Paciente canônico em `/portal/*`**; manter legado curto com `308` (`/agendar`, `/apoio`, `/chat`, `/sessoes`).
5. **Manter enforcement em `proxy.ts`** para auth/roteamento crítico.
6. **Usar scripts oficiais de gate** (`lint`, `typecheck`, contratos, testes), sem validação parcial ad-hoc.
7. **Respeitar contrato visual/tokens do AGENTS v3.1** e linter de cores (`npm run lint:colors`).
8. **Só gerar handoff com evidência fresca** (resumo de saída dos comandos principais).
9. **Atualizar este CONTINUIDADE-PROMPT.md e o handoff da fase** a cada mudança de governança.

---

## Stack e versões

| Tecnologia     | Versão                                |
| -------------- | ------------------------------------- |
| Next.js        | 16.1.6 (App Router)                   |
| TypeScript     | strict: true                          |
| Tailwind       | v4                                    |
| Supabase       | @supabase/supabase-js + @supabase/ssr |
| Stripe         | 20.4.0 (API: `2026-02-25.clover`)     |
| Sonner (toast) | instalado                             |
| Lucide React   | instalado                             |
| date-fns       | instalado                             |
| Upstash Redis  | @upstash/ratelimit + @upstash/redis   |

---

## Design System — Tokens CSS (Redesign Pendente)

Os tokens clássicos abaixo (Cormorant, cores escuras de bronze) serão completamente refatorados nas Fases 13+.

```css
--bg: #0e0e0b;
--bg2: #131310;
--bg3: #181815;
--card: #1a1a17;
--card2: #1f1f1c;
--mint: #52b788;
--mintl: #6bcba0;
--gold: #c4a35a;
--ivory: #ede7d9;
--ivoryD: #c8bfb0;
--ivoryDD: #8a8070;
--red: #b85450;
--blue: #4a8fa8;
--purple: #7b5ea7;
--ff: "Cormorant Garant", serif; /* A SER SUBSTITUÍDO */
--fs: "Instrument Sans", sans; /* A SER SUBSTITUÍDO */
```

---

## Padrão de código — exemplos

### Server Component com auth guard

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  // ...
}
```

### Type cast seguro para joins Supabase

```tsx
const patient = row.patient as unknown as { name: string; email: string };
```

### Chamar API route com rate limit

```tsx
const limiter = getAIRatelimiter();
const { success } = await limiter.limit(user.id);
if (!success)
  return NextResponse.json({ error: "Rate limit" }, { status: 429 });
```

### Toast

```tsx
import { toast } from "@/components/ui/Toast";
toast.success("Salvo!");
toast.error("Erro ao salvar");
```

---

## Sequência recomendada

1. Ler todos os handoffs em `c:\psique\psique\docs\handoffs\`
2. Itens restantes são **opcionais** — Stripe Subscriptions, PDF, E2E tests, deploy
3. A cada mudança: `TSC_PASSED` → `HANDOFF` → atualizar `CONTINUIDADE-PROMPT.md`

---

## Verificação obrigatória

```bash
# TSC (OBRIGATÓRIO antes de handoff)
cmd /c "cd c:\psique\psique && npx tsc --noEmit && echo TSC_PASSED || echo TSC_FAILED"

# Build (recomendado)
npm run build

# Supabase local
npx supabase db reset && npx supabase db push
```

### Verificação manual por fase

- Navegar todas as rotas → verificar loading states + error pages
- Teste de cancelamento → verificar refund + notificações
- Teste de reagendamento → verificar anti-conflito + reset de lembretes

---

## Rastreabilidade de Sessões de IA

| Sessão | Data       | Fases Implementadas  | Validação  | Conversation ID                        |
| ------ | ---------- | -------------------- | ---------- | -------------------------------------- |
| 1      | 2026-02-XX | Fase 1               | TSC_PASSED | (ver handoff)                          |
| 2      | 2026-02-XX | Fases 2-3            | TSC_PASSED | (ver handoff)                          |
| 3      | 2026-02-XX | Fase 4               | TSC_PASSED | (ver handoff)                          |
| 4      | 2026-02-XX | Fases 5-6            | TSC_PASSED | (ver handoff)                          |
| 5      | 2026-02-XX | Fase 7 (parcial)     | TSC_PASSED | (ver handoff)                          |
| 6      | 2026-03-03 | Fase 7 completa      | TSC_PASSED | `1eb08240-d43c-4638-9cce-bba035725d3e` |
| 7      | 2026-03-03 | Fases 8–12           | TSC_PASSED | `1c85a903-5286-4afe-aed1-4c5d520c4e0d` |
| 8      | 2026-03-04 | Fases 13, 14, 15, 16 | TSC_PASSED | `1c85a903-5286-4afe-aed1-4c5d520c4e0d` |
| 9      | 2026-03-04 | Fase 17              | TSC_PASSED | (ver handoff Fase 17)                  |

### Detalhamento da Sessão 9 (Atual)

**Fase 17 — Audits & E2E Validation (Concluída - 100% E2E Verificado):**

- Criadas rotas explícitas em `app/portal/*` reexportando `app/(patient)/*` para alinhar login/nav com `/portal`.
- Refatorado `app/booking/[slug]/page.tsx` com `getPublicBookingClient()` (fallback service-role server-side) para leitura pública determinística de terapeuta/disponibilidade.
- Ajustadas consultas de perfil do paciente com fallback server-side em:
  - `app/(patient)/layout.tsx`
  - `app/(patient)/page.tsx`
  - `app/(patient)/agendar/page.tsx`
  - `app/(patient)/sessoes/page.tsx`
- Criada migration `20260304000002_patient_profile_policy.sql` com policy `patient_own_profile`.
- **Validação E2E completa:** auditoria de UI em Desktop + Mobile com `36/36` passos `OK`.
- **Validação Playwright da suíte do repositório:** `22 passed`, `4 skipped`.
- **Validação de tipagem obrigatória:** `TSC_PASSED`.
- **Cleanup de seed temporária:** resíduos `therapists=0`, `patients=0`.

**Fase 15 — Patient UI Redesign (Concluída - 100% E2E Verificado):**

- `app/(patient)/layout.tsx` — Glassmorphic sidebar and header enterprise redesign. Adherence to new root layout CSS variables.
- `app/(patient)/page.tsx` — Patient home dashboard redesigned with asymmetrical grids and Framer Motion stagger animations.
- `app/(patient)/sessoes/page.tsx` — Sessions list redesigned with rigorous typography and hover scales.
- `app/(patient)/agendar/page.tsx` — Booking scheduling redesigned using grid selections and strict real-data dependencies.
- `app/(patient)/chat/page.tsx` — Chat AI UI redesigned into a premium concierge interface with system prompts and typing animations.
- `app/(patient)/apoio/page.tsx` — Support sections redesigned with segmented controls, stagger fade-ups, and interactive mood trackers.
- Refatorado de acordo com a stack: Tailwind v4 (`@theme`), Framer Motion, e componentes nativos da stack do PSQIUE corporativo.
- **Validação:** Rodado `npm run build` com sucesso absoluto e verificação visual validada pelo usuário sem hardcoded values.

**Fase 13 — Enterprise Design System Setup (Concluída - 100% Verificado):**

- `components/ui/Button.tsx` — Implementados hover states luminescentes e uso de variáveis de marca e text-primary.
- `components/ui/Input.tsx` & `Select.tsx` — Migrados para Tailwind puro com glassmorphism em error e focus states.
- `components/ui/Modal.tsx` & `EnterpriseCard.tsx` — Componentes containers portados para Tailwind v4 dark-mode estrito com tipografia renovada.
- `components/dashboard/DashboardShell.tsx` — Sidebar e Auth Layout Container refatorados para o ambient-glow e Tailwind components matching a Fase 15.
- **Validação:** Submetido a `npm run build` garantindo zero erros de tipagem/css.

**Fase 14 — Therapist UI Redesign (Concluída - 100% Verificado):**

- Transição completa dos painéis do terapeuta para as Variáveis Globais de UI (dark mode estrito).
- Refatorado `financeiro/page.tsx` para suporte a gráficos com glows dinâmicos.
- Refatorado `ia/page.tsx` com novo design de cards para ressonância e alertas de inteligência artificial.
- Refatorado `telegram/page.tsx`, `configuracoes/page.tsx` e tela de vídeo em `consulta/[roomId]/page.tsx` removendo inline styles antigos.
- Substituída a classe `var(--ff)` espalhada em inline styles por classes Tailwind adequadas.
- Criado `docs/handoffs/HANDOFF-FASE14.md` para arquivar a progressão.

**Fase 16 — Public Booking UI Redesign (Concluída - 100% Verificado):**

- Transição completa das páginas de agendamento públicas (`/booking/[slug]`, `BookingClient`, e `sucesso`) para o visual Luxury estrito.
- Formulários padronizados com o uso de `bg-[var(--color-surface)]`, brilhos sutis (`shadow-[0_4px_24px...]`) e inputs dark com focus da marca.
- Limpeza integral de style maps obsoletos nas landing pages dos terapeutas.
- Criado `docs/handoffs/HANDOFF-FASE16.md`.

---

## 🔎 Rastreabilidade — Fase 19 (Governança Stitch-First)

### Status
- Fase 19 concluída como fase de documentação/governança.
- Sem alterações de runtime/API/UI nesta fase.

### Artefatos criados
- Raiz:
  - `AGENTS.md` (canônico)
  - `Agent.md` (ponte)
  - `CLAUDE.md`
  - `GEMINI.md`
- `docs/stitch/`:
  - `README.md`
  - `SCREEN_REGISTRY.md`
  - `CANONICAL_MANIFEST.json`
  - `DESIGN_TOKENS.md`
  - `COMPONENT_LIBRARY.md`
  - `LAYOUT_PATTERNS.md`
  - `IMPLEMENTATION_BACKLOG.md`
  - `NEXT_SESSION_E2E_INPUT.md`

### Ordem de leitura automática (qualquer IA)
1. `docs/stitch/README.md`
2. `docs/stitch/SCREEN_REGISTRY.md`
3. `docs/stitch/DESIGN_TOKENS.md`
4. `docs/stitch/COMPONENT_LIBRARY.md`
5. `docs/stitch/IMPLEMENTATION_BACKLOG.md`
6. `docs/implementation_plan.md`

### Regras de governança (trava anti-regressão)
1. `stitch/**` é fonte visual primária.
2. Fidelidade mobile obrigatória.
3. Desktop derivado de forma sistematizada.
4. Proibido em TSX:
   - `style={{...}}`
   - tokens legados `--ff`, `--fs`, `--ivory`, `--mint`, `--gold`, `--card`, `--bg`.
5. Proibido inventar tela fora do Stitch quando houver referência.

### Resumo técnico
- Catálogo Stitch 14/14 consolidado em dois formatos:
  - humano (`SCREEN_REGISTRY.md`)
  - machine-readable (`CANONICAL_MANIFEST.json`).
- Contratos de tokens, componentes e layout definidos para execução futura sem decisões abertas.
- Input de E2E microvalidado pronto para próxima sessão.

---

## 🔎 Rastreabilidade — Fase 20 (Implementação Stitch + E2E)

### Status
- Fase 20 concluída.
- Implementação de runtime/UI executada para rotas públicas Stitch faltantes.

### Entregas de implementação
1. Novas rotas públicas:
   - `/` (S11 + S12)
   - `/pricing` (S13)
   - `/checkout/secure` (S14)
2. Tipografia canônica no layout raiz:
   - Display: `Cormorant Garamond`
   - Body: `Instrument Sans`
3. E2E ampliado com cobertura Stitch e micro-gates:
   - `e2e/stitch.coverage.spec.ts`
   - ajustes em `e2e/navigation.spec.ts` e `e2e/layout.enterprise.spec.ts`
4. Matriz de viewport ativa no Playwright:
   - `mobile-390x844`
   - `tablet-768x1024`
   - `desktop-1440x900`

### Validação final da fase
1. `npx tsc --noEmit` ✅
2. `npm run build` ✅
3. Playwright (auth/navigation/booking/layout/stitch) ✅
   - `81 passed`
   - `0 skipped`
   - `0 failed`

### Artefatos
- `playwright-report/index.html`
- `test-results/**` com `trace.zip`, `video.webm` e screenshot por cenário.
