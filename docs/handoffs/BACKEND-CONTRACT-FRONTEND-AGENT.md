# Backend Contract — Frontend/Layout Agent (CLAUDE Partner)

Data: 2026-03-05
Owner: Backend Architecture (Codex)
Status: Active / Blocking for integration quality

Checklist operacional de PR: `docs/handoffs/PR-CHECKLIST-LAYOUT-AGENT.md`

Escopo deste documento: subconjunto de contratos consumidos por frontend/layout.
Contrato backend completo (30 APIs canônicas): `docs/backend/BACKEND-API-SURFACE.md`.

## 1) Boundary of responsibilities

1. Frontend agent (layout) can change UI/UX, CSS, spacing, typography, components composition.
2. Frontend agent must NOT rename, move, or change backend route contracts.
3. Frontend agent must NOT bypass backend by writing clinical/business data directly from client components.
4. Any new data need must be requested as backend contract change (new endpoint or payload evolution).

## 2) Integration rules (mandatory)

1. Keep canonical patient navigation on `/portal/*`.
2. Use API routes below exactly as documented.
3. Handle `401`/`403` as auth/session issues (redirect/login flow), not generic errors.
4. Handle `409` as business conflict (slot race / duplicate) with user-facing retry message.
5. Handle `429` on AI endpoints with backoff and non-blocking UI fallback.
6. Never assume 200-only flow; always parse `{ error }` bodies.

## 3) Backend surface consumed by frontend

### Patient/Portal
- `POST /api/patient/appointments/checkout`
  - success: `{ success: true, data: { appointmentId, checkoutUrl } }`
  - conflict: `409` when slot was taken
- `GET|POST /api/patient/journal`
- `GET|POST /api/patient/mood`
- `GET /api/patient/chat/threads`
- `GET /api/patient/chat/threads/[id]/messages`
- `POST /api/patient/chat/messages`

### Public booking
- `POST /api/booking/checkout`
  - success: `{ success: true, data: { appointmentId, checkoutUrl } }`
  - conflict: `409` for race conditions

### Therapist dashboard actions
- `POST /api/auth/mfa/enroll`
- `POST /api/auth/mfa/verify`
- `POST /api/auth/mfa/unenroll`
- `POST /api/auth/patient/bootstrap`
- `POST /api/ai/summarize`
- `POST /api/ai/insights`
- `POST /api/appointments/[id]/cancel`
- `PUT /api/appointments/[id]/reschedule`
- `PATCH /api/sessions/[id]/close`
- `PATCH /api/settings/profile`
- `PATCH /api/settings/security`
- `PATCH /api/settings/integrations`
- `POST /api/settings/integrations/stripe/connect`
- `GET /api/audit/events`

## 4) Error semantics to preserve in UI

1. `400`: invalid input (show inline validation or toast).
2. `401`: unauthenticated (redirect/login CTA).
3. `403`: forbidden (permission copy, no retry loop).
4. `404`: entity not found / unavailable.
5. `409`: state conflict (slot already booked, stale state).
6. `429`: rate limited (cooldown UX).
7. `500`: internal error fallback.

## 5) Coordination protocol with backend owner

1. If layout requires extra data fields, send request with:
   - endpoint
   - required fields
   - fallback behavior
   - acceptance test
2. Backend owner returns contract update before frontend merge.
3. Frontend merges only after `test:api` is green.

## 6) Non-breaking change policy

1. Additive changes only (new optional fields/endpoints).
2. No removal/rename of existing response keys without versioning.
3. Keep route method and path stable.

## 7) Validation gates

Frontend agent must run before handoff:
1. `npm run test:api`
2. `npm run typecheck`
3. (when touching routing contracts) `npm run contract:non-screen:check`
4. `npm run backend:audit`

## 8) Backend release checklist

1. `npm run verify:backend` com sucesso (gate estático determinístico).
2. Quando houver acesso a ambiente Supabase real, executar também `npm run verify:backend:runtime`.
3. `docs/baselines/mf24_supabase_deep/preflight-report.json` atualizado (quando aplicável).
4. `criticalFailed === 0` em `supabase:preflight` (execução runtime).
5. `docs/backend/BACKEND-API-SURFACE.md` sincronizado com `NON_SCREEN_ROUTES.json`.
6. Sem mudanças breaking em path/method/shape de sucesso existente.
