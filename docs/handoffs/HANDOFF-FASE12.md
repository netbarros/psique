# HANDOFF — FASE 12: Playwright, Sentry & Deploy (COMPLETA)

**Data:** 2026-03-03  
**Status:** ✅ Fase completa e validada (TSC_PASSED — 0 erros TypeScript)

---

## Playwright E2E Tests

| Arquivo                  | Cobertura                                                 |
| ------------------------ | --------------------------------------------------------- |
| `playwright.config.ts`   | Config: chromium + Mobile Chrome, HTML report, dev server |
| `e2e/auth.spec.ts`       | Login form, role toggle, form validation, redirect        |
| `e2e/booking.spec.ts`    | 404 slug inválido, elementos da página, step indicator    |
| `e2e/navigation.spec.ts` | Root redirect, 404 page, security headers, auth guards    |

**Como rodar:**

```bash
npx playwright test                # headless
npx playwright test --ui           # UI mode
npx playwright test e2e/auth.spec.ts  # arquivo específico
```

**Variáveis de ambiente para testes:**

```
PLAYWRIGHT_BASE_URL=http://localhost:3000
PLAYWRIGHT_TEST_SLUG=slug-de-terapeuta-seed  # para booking tests
```

---

## Sentry Monitoring

| Arquivo                   | Descrição                                            |
| ------------------------- | ---------------------------------------------------- |
| `sentry.server.config.ts` | Server: 10% tracing, scrub password/CPF/token/secret |
| `sentry.client.config.ts` | Client: replay 1% / 100% errors, maskAllInputs       |
| `sentry.edge.config.ts`   | Edge: 10% tracing minimal                            |
| `instrumentation.ts`      | Hook Next.js — inicializa Sentry no startup          |
| `next.config.ts`          | `withSentryConfig()` — source maps + Vercel monitors |

**Variáveis necessárias:**

```
SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_ORG=psique          (opcional, para source maps)
SENTRY_PROJECT=psique-web  (opcional, para source maps)
```

---

## Vercel Deploy

| Arquivo       | Descrição                                           |
| ------------- | --------------------------------------------------- |
| `vercel.json` | Region `gru1` (São Paulo), 25 env vars, cron hourly |

**Secrets Vercel a criar (`vercel env add`):**

```
supabase_url
supabase_anon_key
supabase_service_role_key
supabase_jwt_secret
openrouter_api_key
telegram_bot_token
telegram_bot_username
telegram_webhook_secret
daily_api_key
daily_api_url
stripe_secret_key
stripe_publishable_key
stripe_webhook_secret
resend_api_key
resend_from_email
resend_from_name
app_url
cron_secret
upstash_redis_url
upstash_redis_token
sentry_dsn
```

**Deploy:**

```bash
npm install -g vercel
vercel login
vercel link
# Adicionar todos os secrets acima via Vercel Dashboard ou CLI
vercel --prod
```

**Extras aplicados em `next.config.ts`:**

- `api.qrserver.com` adicionado a `remotePatterns` (QR Code do 2FA)
- `api.qrserver.com` adicionado ao CSP `img-src`
- `sentry.io` e `*.sentry.io` adicionados ao CSP `connect-src`

---

## Validação

```
✅ npx tsc --noEmit → TSC_PASSED (0 erros)
✅ Playwright config + 3 suites de testes
✅ Sentry server + client + edge + instrumentation
✅ next.config.ts com withSentryConfig
✅ vercel.json com region gru1 + cron + 25 env vars
✅ CSP atualizado para Sentry + QR Code
```
