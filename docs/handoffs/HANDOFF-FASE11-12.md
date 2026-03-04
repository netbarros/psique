# HANDOFF — FASES 11-12: Produto + Polish + Subscriptions + PDF (COMPLETAS)

**Data:** 2026-03-03  
**Status:** ✅ Fases completas e validadas (TSC_PASSED — 0 erros TypeScript)

---

## Fase 11 — Gaps de Produto

### Cancelamento com Política Configurável

| Arquivo                                     | Descrição                                 |
| ------------------------------------------- | ----------------------------------------- |
| `app/api/appointments/[id]/cancel/route.ts` | POST — cancelamento com política de horas |

**Funcionalidades:**

- Auth + role detection (therapist/patient)
- `cancellation_policy_hours` configurável por terapeuta (default: 24h)
- Terapeuta cancela → refund automático sempre
- Paciente cancela com antecedência ≥ policy → refund automático
- Paciente cancela dentro do prazo → sem refund (com aviso)
- Email de cancelamento ao paciente (Resend)
- Notificação Telegram ao paciente
- Update: `status: cancelled`, `cancelled_by`, `cancelled_at`, `cancellation_reason`
- Refund via `createRefund()` de `lib/stripe.ts`

### Reagendamento pelo Paciente

| Arquivo                                         | Descrição           |
| ----------------------------------------------- | ------------------- |
| `app/api/appointments/[id]/reschedule/route.ts` | PUT — reagendamento |

**Funcionalidades:**

- Auth + role detection (therapist/patient)
- Só para status `pending` ou `confirmed`
- Detecção de conflito no novo horário
- Reset de flags de lembrete (`reminder_24h_sent`, `reminder_1h_sent`)
- Email com antigo/novo horário (Resend)
- Log completo

---

## Fase 12 (parcial) — Error Pages + Loading

| Arquivo                | Descrição                                        |
| ---------------------- | ------------------------------------------------ |
| `app/not-found.tsx`    | 404 — design PSIQUE (gold accent, serif heading) |
| `app/global-error.tsx` | 500 — error boundary com digest + retry          |
| `app/loading.tsx`      | Root loading com spinner mint                    |

---

## Stripe Subscriptions (Cobrança Recorrente)

| Arquivo                          | Descrição                                                                         |
| -------------------------------- | --------------------------------------------------------------------------------- |
| `lib/stripe.ts` (atualizado)     | +3 funções: `createSubscriptionCheckout`, `cancelSubscription`, `getSubscription` |
| `app/api/subscriptions/route.ts` | POST → criar checkout subscription / DELETE → cancelar                            |

**Funcionalidades:**

- Pacotes de sessões mensais (ex: 4x/mês)
- Stripe Checkout `mode: "subscription"` com `recurring: { interval: "month" }`
- Metadata: `therapistId`, `patientName`, `sessionsPerMonth`, `type: "subscription"`
- Cancelamento via `stripe.subscriptions.cancel()`
- Auth guard em ambas as rotas

---

## PDF Relatórios para Planos de Saúde

| Arquivo                             | Descrição                              |
| ----------------------------------- | -------------------------------------- |
| `lib/pdf/session-report.tsx`        | React-PDF document template A4         |
| `app/api/reports/sessions/route.ts` | GET → gera PDF e retorna como download |

**Conteúdo do PDF:**

- Header: Ψ Relatório Terapêutico + CRP + período
- Dados paciente: nome, email, CPF
- Estatísticas: total sessões, humor médio (antes/após), NPS médio
- Cards por sessão: número, data, duração, mood, resumo IA
- Tabela financeira: pagamentos + total
- Footer: data geração + LGPD Art. 7, §5
- Suporta filtro por data range (`?from=&to=`)

**Dependência:** `@react-pdf/renderer` (instalado)

---

## Validação

```
✅ npx tsc --noEmit → TSC_PASSED (0 erros)
✅ Cancelamento com política configurável
✅ Reagendamento com anti-conflito
✅ Error pages 404/500 com design system
✅ Loading state global
✅ Stripe Subscriptions (session packs)
✅ PDF relatórios com React-PDF
```
