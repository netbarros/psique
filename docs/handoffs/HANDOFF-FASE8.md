# HANDOFF — FASE 8: Portal do Paciente (COMPLETA)

**Data:** 2026-03-03  
**Status:** ✅ Fase completa e validada (TSC_PASSED — 0 erros TypeScript)

---

## O que foi entregue

### Páginas criadas (route group `(patient)`)

| Rota               | Arquivo                          | Descrição                                    |
| ------------------ | -------------------------------- | -------------------------------------------- |
| `/portal` (layout) | `app/(patient)/layout.tsx`       | Layout paciente: auth guard + sidebar + nav  |
| `/portal`          | `app/(patient)/page.tsx`         | Home: próximas sessões, stats, ações rápidas |
| `/portal/agendar`  | `app/(patient)/agendar/page.tsx` | Autoagendamento: grade 14 dias + time slots  |
| `/portal/sessoes`  | `app/(patient)/sessoes/page.tsx` | Histórico: NPS, mood, resumo IA              |
| `/portal/chat`     | `app/(patient)/chat/page.tsx`    | Chat IA: interface completa com sugestões    |
| `/portal/apoio`    | `app/(patient)/apoio/page.tsx`   | Diário, técnicas (4), recursos (CVV/SAMU)    |

### API criada

| Rota                | Arquivo                    | Descrição                                      |
| ------------------- | -------------------------- | ---------------------------------------------- |
| `POST /api/ai/chat` | `app/api/ai/chat/route.ts` | Chat IA para paciente com rate limit + context |

### Arquivo modificado

| Arquivo                   | Mudança                                 |
| ------------------------- | --------------------------------------- |
| `app/auth/login/page.tsx` | Patient-role login → redirect `/portal` |

---

## Detalhe de cada página

### Layout (`layout.tsx`)

- Auth guard via `patients.user_id = auth.uid()`
- Redirect para `/dashboard` se não for paciente
- Sidebar: logo, user info, therapist badge, 5 nav links, sign out

### Home (`page.tsx`)

- Greeting contextual (Bom dia/Boa tarde/Boa noite) + first name
- Stats: próximas sessões, sessões realizadas, humor
- Lista de appointments próximos com botão "Entrar" (se video_room_url)
- Sessões recentes com mood/NPS
- Quick actions: Agendar, Chat IA, Apoio

### Agendar (`agendar/page.tsx`)

- Info cards: duração, valor, modalidade
- Grade de 14 dias com time slots gerados por `generateTimeSlots()`
- Detecção de slots já ocupados (cross-reference com appointments existentes)
- Link para página pública de booking

### Sessões (`sessoes/page.tsx`)

- Stats: total, NPS médio, melhora de humor
- Cards por sessão: session_number, data, duração, mood before→after, NPS stars
- Preview de AI summary (max 200 chars)

### Chat IA (`chat/page.tsx`)

- Interface de chat completa com message bubbles
- Suggestion chips (ansiedade, respiração, tristeza, grounding)
- Typing indicator (dot animation)
- Enter/Shift+Enter handling
- CVV emergency notice no footer
- Chama `POST /api/ai/chat`

### Apoio (`apoio/page.tsx`)

- 3 abas: Diário, Técnicas, Recursos
- **Diário**: mood emoji tracker (5 níveis) + textarea + save
- **Técnicas**: 4 exercícios guiados (Respiração 4-7-8, Grounding 5-4-3-2-1, Body Scan, Journaling)
- **Recursos**: CVV (188), CAPS, SAMU (192), info sobre psicanálise, benefícios, dicas

### API Chat (`/api/ai/chat/route.ts`)

- Auth + rate limit (10 req/min via Upstash Redis)
- Patient context injection (nome + prompt de apoio emocional)
- Usa modelo configurado pelo terapeuta (`therapists.ai_model`)
- Chama `chatWithContext()` de `lib/openrouter.ts`

---

## Validação

```
✅ npx tsc --noEmit → TSC_PASSED (0 erros)
✅ Auth guard em todas as páginas
✅ Login redirect atualizado (patient → /portal)
✅ Rate limit funcional (getAIRatelimiter)
✅ Lints corrigidos (unused param, import)
```

---

## Próxima fase

**FASE 9 — Página Pública de Booking (`/booking/[slug]`)**  
Agendamento público com escolha de horário, pagamento via Stripe, e criação automática de appointment.
