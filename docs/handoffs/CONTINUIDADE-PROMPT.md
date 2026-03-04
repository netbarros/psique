# PROMPT DE CONTINUIDADE — PSIQUE SaaS Platform

> Cole este prompt inteiro em uma nova sessão do Antigravity/Gemini para retomar o projeto sem gaps.

---

## Contexto do Projeto

Você está continuando o desenvolvimento da plataforma **PSIQUE** — um SaaS clínico para psicanalistas brasileiros, construído em **Next.js 15 + TypeScript strict + Supabase + Tailwind v4**.

**Projeto localizado em:** `c:\psique\psique`  
**Documentação master:** `c:\psique\psique\docs\PSIQUE_CURSOR_MASTER_PROMPT.md`  
**Protótipo de referência UI:** `c:\psique\psique\docs\psique-final.jsx`

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
  booking/
    [slug]/page.tsx             ← perfil terapeuta público + availability
    [slug]/BookingClient.tsx    ← 3-step: horário → dados → Stripe checkout
    [slug]/sucesso/page.tsx     ← confirmação pós-pagamento
  api/
    ai/summarize/route.ts       ← auth + rate limit + OpenRouter + persistência
    ai/insights/route.ts        ← análise de carteira IA
    ai/chat/route.ts            ← chat IA paciente + rate limit + context
    booking/checkout/route.ts   ← anti-double-booking + find/create patient + Stripe
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

lib/
  supabase/client.ts  server.ts  admin.ts
  openrouter.ts  telegram.ts  daily.ts  stripe.ts  resend.ts
  utils.ts  logger.ts  ratelimit.ts

middleware.ts                   ← Supabase SSR auth guard
supabase/migrations/
  20240301000001_initial.sql    ← 11 tabelas + 13 RLS policies + rollback
types/
  database.ts  domain.ts
```

---

## O que falta implementar

### Prioridade ALTA — Fase 10 (Segurança)

- 2FA TOTP via Supabase Auth (obrigatório terapeutas)
- Validação CPF no front de cadastro de paciente
- Session token expiration settings

### Prioridade MÉDIA — Fase 11 (Gaps de Produto)

- Cancelamento configurável
- Reagendamento pelo paciente
- Cobrança recorrente (Stripe Subscriptions)
- Emissão de NF
- PDF de relatórios para planos de saúde
- Modo offline (PWA)

### Prioridade BAIXA — Fase 12 (Polish & Deploy)

- Error pages (404, 500) com design system
- Loading states e Suspense boundaries
- Testes E2E Playwright
- Sentry monitoring
- Deploy Vercel + DNS

---

## Regras INVIOLÁVEIS

1. **Sempre rodar `cmd /c "cd c:\psique\psique && npx tsc --noEmit && echo TSC_PASSED || echo TSC_FAILED"`** ao fim de cada fase antes de gerar o handoff
2. **Só gerar handoff após TSC_PASSED** — nunca antes
3. **Usar `as unknown as`** para type casts de joins Supabase (não `as` direto — causa TS2352)
4. **Todos os componentes client com `"use client"`** no topo; server components sem diretiva
5. **Usar `useId()`** em vez de `Math.random()` para IDs em componentes React
6. **Stripe API version:** `"2026-02-25.clover"` (stripe@20.4.0 instalado)
7. **Tolerância zero a erros e gaps** — cobrir edge cases, loading states, auth guards
8. **Atualizar este CONTINUIDADE-PROMPT.md** ao fim de cada fase

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

## Design System — Tokens CSS

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
--ff: "Cormorant Garant", serif; /* headings */
--fs: "Instrument Sans", sans; /* body */
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
2. Começar pela **Fase 10** → Segurança (2FA, CPF, session expiry)
3. Sequência: Fase 10 (segurança) → Fase 11 (produto) → Fase 12 (polish + deploy)
4. A cada fase: `TSC_PASSED` → `HANDOFF-FASEXX.md` → atualizar `CONTINUIDADE-PROMPT.md`

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

- Fase 10: Tentar acessar prontuário de outro terapeuta → deve 403
- Fase 11: Cancelar sessão → verificar reembolso + notificações
- Fase 12: Navegar todas as rotas → verificar loading states + error pages

---

## Rastreabilidade de Sessões de IA

| Sessão | Data       | Fases Implementadas | Validação  | Conversation ID                        |
| ------ | ---------- | ------------------- | ---------- | -------------------------------------- |
| 1      | 2026-02-XX | Fase 1              | TSC_PASSED | (ver handoff)                          |
| 2      | 2026-02-XX | Fases 2-3           | TSC_PASSED | (ver handoff)                          |
| 3      | 2026-02-XX | Fase 4              | TSC_PASSED | (ver handoff)                          |
| 4      | 2026-02-XX | Fases 5-6           | TSC_PASSED | (ver handoff)                          |
| 5      | 2026-02-XX | Fase 7 (parcial)    | TSC_PASSED | (ver handoff)                          |
| 6      | 2026-03-03 | Fase 7 completa     | TSC_PASSED | `1eb08240-d43c-4638-9cce-bba035725d3e` |
| 7      | 2026-03-03 | Fases 8 + 9         | TSC_PASSED | `1c85a903-5286-4afe-aed1-4c5d520c4e0d` |

### Detalhamento da Sessão 7 (Atual)

**Fase 8 — Portal do Paciente:**

- `app/(patient)/layout.tsx` — auth guard paciente + sidebar com therapist badge
- `app/(patient)/page.tsx` — home com greeting, stats, appointments, ações rápidas
- `app/(patient)/agendar/page.tsx` — grade 14 dias com time slots disponíveis
- `app/(patient)/sessoes/page.tsx` — histórico com NPS, mood tracking, AI summary
- `app/(patient)/chat/page.tsx` — chat IA com sugestões, typing indicator, CVV
- `app/(patient)/apoio/page.tsx` — diário, 4 técnicas guiadas, recursos emergenciais
- `app/api/ai/chat/route.ts` — rate limit + patient context + chatWithContext()
- Login redirect: patient → `/portal`, therapist → `/dashboard`

**Fase 9 — Booking Público:**

- `app/booking/[slug]/page.tsx` — perfil terapeuta público, SEO dinâmico
- `app/booking/[slug]/BookingClient.tsx` — 3-step: horário (21 dias) → dados → Stripe
- `app/booking/[slug]/sucesso/page.tsx` — confirmação pós-pagamento
- `app/api/booking/checkout/route.ts` — anti-double-booking, find/create patient, Stripe checkout
- Fluxo E2E: visitante → horário → dados → Stripe → webhook → Daily + email + Telegram → sucesso
