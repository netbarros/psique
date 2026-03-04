# HANDOFF — FASE 1: Fundação Next.js 15

**Data:** 2026-03-03  
**Status:** ✅ Fase concluída e validada (TSC_PASSED — 0 erros TypeScript)

---

## O que foi entregue

### Projeto

- Next.js 15 com App Router, TypeScript `strict: true`, Tailwind v4
- Movido `psique-final.jsx` para `docs/psique-final.jsx` (referência de design preservada)

### Arquivos criados

| Arquivo              | Descrição                                                                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `next.config.ts`     | Security headers: CSP, HSTS, X-Frame-Options, Permissions-Policy, Referrer-Policy                                                                           |
| `middleware.ts`      | Auth guard Supabase SSR, refresh de sessão, whitelist de rotas públicas (booking, telegram, stripe, cron)                                                   |
| `app/globals.css`    | Design tokens completos: `--bg`, `--mint`, `--gold`, `--ivory`, Google Fonts, 15 keyframes, reveal-on-scroll, glassmorphism, gradient-text, focus ring ARIA |
| `app/layout.tsx`     | Root layout com SEO metadata, Open Graph, Twitter card (pt-BR)                                                                                              |
| `.env.local.example` | 19 variáveis documentadas                                                                                                                                   |

### Dependências instaladas

```
@supabase/supabase-js @supabase/ssr openai stripe @stripe/stripe-js
resend react-hook-form @hookform/resolvers zod clsx tailwind-merge
lucide-react date-fns date-fns-tz @upstash/ratelimit @upstash/redis
nanoid sonner
```

---

## Variáveis de ambiente necessárias (Fase 1)

Configurar `.env.local` baseado no `.env.local.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=         # obrigatório para middleware
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # obrigatório para middleware
NEXT_PUBLIC_APP_URL=              # obrigatório para redirects
```

> As demais variáveis são necessárias nas fases seguintes.

---

## Como executar localmente

```bash
cd c:\psique\psique
cp .env.local.example .env.local   # preencher variáveis
npm run dev                        # → http://localhost:3000
```

---

## Validação realizada

```
✅ npx tsc --noEmit → TSC_PASSED (0 erros)
✅ next.config.ts com security headers corretos
✅ middleware.ts com Supabase SSR auth guard
✅ globals.css com design tokens idênticos ao psique-final.jsx
```

---

## Gaps conhecidos nesta fase

- Nenhum gap crítico. Todos os arquivos da fase foram criados e validados.

---

## Próxima fase

**FASE 2 — Supabase Schema & Auth**  
Configurar projeto Supabase, executar migration, configurar env vars e testar RLS.
