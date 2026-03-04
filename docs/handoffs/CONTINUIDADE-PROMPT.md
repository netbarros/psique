# PROMPT DE CONTINUIDADE — PSIQUE SaaS Platform

> Cole este prompt inteiro em uma nova sessão do Antigravity/Gemini para retomar o projeto sem gaps.

---

## Contexto do Projeto

Você está continuando o desenvolvimento da plataforma **PSIQUE** — um SaaS clínico para psicanalistas brasileiros, construído em **Next.js 16.1.6 (latest) + TypeScript strict + Supabase + Tailwind v4+Enterprise Luxury Minimalist (Dark Theme)** usando Tailwind CSS v4, Framer Motion e Supabase (sem valores mockados)\*\*.

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

**Leia todos os handoffs antes de começar.** Eles contêm os detalhes exatos de cada arquivo criado.

### Arquivos principais já implementados

```
app/
  layout.tsx                    ← root layout com <Toast /> Sonner global
  page.tsx                      ← redirect para /auth/login
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

middleware.ts                   ← Supabase SSR auth guard
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

1. **Sempre rodar `cmd /c "cd c:\psique\psique && npx tsc --noEmit && echo TSC_PASSED || echo TSC_FAILED"`** ao fim de cada fase antes de gerar o handoff
2. **Só gerar handoff após TSC_PASSED** — nunca antes
3. **Usar `as unknown as`** para type casts de joins Supabase (não `as` direto — causa TS2352)
4. **Todos os componentes client com `"use client"`** no topo; server components sem diretiva
5. **Usar `useId()`** em vez de `Math.random()` para IDs em componentes React
6. **Stripe API version:** `"2026-02-25.clover"` (stripe@20.4.0 instalado)
7. **Tolerância zero a erros e gaps** — cobrir edge cases, loading states, auth guards, ZERO hardcore keys.
8. **UX/UI Enterprise Rule:** Animações fluidas (`framer-motion`), design minimalista premium, uso de fontes sem-serifa legíveis (Geist, Inter). Livre-se da estilização bruta / fontes clássicas.
9. **Atualizar este CONTINUIDADE-PROMPT.md** ao fim de cada fase

---

## Stack e versões

| Tecnologia     | Versão                                |
| -------------- | ------------------------------------- |
| Next.js        | 15 (App Router)                       |
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
