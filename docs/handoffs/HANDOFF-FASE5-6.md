# HANDOFF — FASES 5 & 6: Libs de Integração + API Routes

**Data:** 2026-03-03  
**Status:** ✅ Fases concluídas e validadas (TSC_PASSED — 0 erros TypeScript)

> Atualização 2026-03-04 (Fase 21 v3.0): gaps históricos de `api/ai/transcribe` e `api/webhooks/supabase` foram resolvidos.

---

## O que foi entregue

### FASE 5 — Libs de Integração

| Arquivo             | Funções                                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `lib/openrouter.ts` | `openrouter` (client), `CLINICAL_SYSTEM_PROMPT`, `generateSessionSummary()`, `generatePatientInsights()`, `chatWithContext()`                                      |
| `lib/telegram.ts`   | `sendMessage()`, `editMessage()`, `answerCallbackQuery()`, `inlineKeyboard()`, `setWebhook()`, `buildReminderMessage()`, `buildNPSMessage()`, `buildNPSKeyboard()` |
| `lib/daily.ts`      | `createRoom()`, `createMeetingToken()` (owner/guest), `deleteRoom()`, `getRoom()`                                                                                  |
| `lib/stripe.ts`     | `stripe` (client v20.4.0 / `2026-02-25.clover`), `createCheckoutSession()`, `constructWebhookEvent()`, `createRefund()`                                            |
| `lib/resend.ts`     | `sendBookingConfirmation()`, `sendSessionReminder()` com HTML templates PSIQUE-themed                                                                              |
| `lib/utils.ts`      | `cn()`, `formatBRL()`, `formatDate/Time/DateTime/Relative()`, `slugify()`, `initials()`, `validateCRP()`, `validateCPF()` (algoritmo completo), `formatDelta()`    |
| `lib/logger.ts`     | Structured logger com prefixo `[PSIQUE]`, níveis info/warn/error/debug, sem `console.log` em produção                                                              |
| `lib/ratelimit.ts`  | `getAIRatelimiter()` (10/min), `getAuthRatelimiter()` (5/min), `getApiRatelimiter()` (60/min) — Upstash Redis sliding window                                       |

---

### FASE 6 — API Routes

| Rota                    | Método | Proteção                                         | Descrição                                                                                                                                            |
| ----------------------- | ------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/ai/summarize`     | POST   | Auth + Rate limit 10/min + Ownership             | Gera resumo clínico da sessão via OpenRouter, salva no banco                                                                                         |
| `/api/ai/insights`      | POST   | Auth + Rate limit 10/min                         | Análise de carteira completa do terapeuta                                                                                                            |
| `/api/video/room`       | POST   | Auth + Ownership                                 | Cria sala Daily.co + token de owner, atualiza appointment                                                                                            |
| `/api/telegram/webhook` | POST   | `X-Telegram-Bot-Api-Secret-Token` + Idempotência | Bot completo: `/start`, `/agendar`, `/sessoes`, `/cancelar`, `/pagar`, `/falar` (IA), `/ajuda` + NPS callback + intent detection em mensagens livres |
| `/api/webhooks/stripe`  | POST   | Stripe signature                                 | `checkout.session.completed` → confirmar appointment + criar Daily room + email (Resend) + Telegram. `payment_intent.payment_failed` → log           |
| `/api/cron/reminders`   | GET    | `Bearer CRON_SECRET`                             | Lembretes 24h (Telegram + email), 1h (Telegram + email + link), NPS pós-sessão (Telegram inline keyboard)                                            |

---

## Variáveis de ambiente necessárias (Fases 5-6)

```env
OPENROUTER_API_KEY=sk-or-v1-...

TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=...      # gerar: openssl rand -hex 32

DAILY_API_KEY=...
DAILY_API_URL=https://api.daily.co/v1

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@psique.app

CRON_SECRET=...                  # gerar: openssl rand -hex 32

UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

---

## Configuração do Telegram Bot

```bash
# 1. Criar bot no @BotFather → obter TOKEN
# 2. Definir webhook (executar uma vez):
curl -X POST "https://api.telegram.org/bot{TOKEN}/setWebhook" \
  -d "url=https://psique.app/api/telegram/webhook" \
  -d "secret_token={TELEGRAM_WEBHOOK_SECRET}"

# 3. Verificar:
curl "https://api.telegram.org/bot{TOKEN}/getWebhookInfo"
```

## Configuração do Stripe Webhook

```bash
# Desenvolvimento local:
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Produção: configurar no Stripe Dashboard
# Event: checkout.session.completed
# URL: https://psique.app/api/webhooks/stripe
```

---

## Validação realizada

```
✅ npx tsc --noEmit → TSC_PASSED (0 erros)
✅ lib/openrouter.ts — CLINICAL_SYSTEM_PROMPT com diretrizes éticas
✅ lib/telegram.ts — todos os helpers de mensagem
✅ lib/daily.ts — DailyHeaders com index signature (HeadersInit compatível)
✅ lib/stripe.ts — API version 2026-02-25.clover (stripe@20.4.0)
✅ lib/ratelimit.ts — Upstash sliding window (sem analyticsEnabled)
✅ api/ai/summarize — auth + rate limit + ownership check
✅ api/telegram/webhook — PatientRef unificado, todos os comandos
✅ api/webhooks/stripe — signature verification + Daily room + Resend + Telegram
✅ api/cron/reminders — 24h/1h (email+Telegram) + NPS keyboard
✅ vercel.json — cron a cada 30min configurado
```

---

## Gaps conhecidos

- `api/ai/transcribe` não implementado (Gemini multimodal para transcrição de áudio)
- `api/webhooks/supabase` não implementado (realtime triggers)
- Booking slot via Telegram ainda tem `TODO` (redirect Stripe checkout)

---

## Próxima fase

**FASE 4 — Design System** (components/ui/)  
12 componentes UI idênticos ao protótipo `psique-final.jsx`.
