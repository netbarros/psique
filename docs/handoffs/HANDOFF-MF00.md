# HANDOFF-MF00 — Baseline e Rastreabilidade

> **Data:** 2026-03-05
> **Gate:** PASS (tsc ✅ build ✅)

---

## Objetivo

Congelar o estado técnico e visual antes da execução do plano de elevação UI/UX (MF-01 → MF-10).

---

## Inventário de Rotas (28 Telas Visuais)

### Categoria A — Telas Stitch Canônicas (S01–S14)

| ID  | Rota                         | Tipo    | Tema          | Stitch Ref |
| --- | ---------------------------- | ------- | ------------- | ---------- |
| S01 | /dashboard                   | dynamic | dark_core     | stitch/S01 |
| S02 | /booking/[slug]              | dynamic | dark_core     | stitch/S02 |
| S03 | /dashboard/consulta/[roomId] | dynamic | dark_theater  | stitch/S03 |
| S04 | /dashboard/pacientes/[id]    | dynamic | dark_core     | stitch/S04 |
| S05 | /dashboard/ia                | dynamic | dark_core     | stitch/S05 |
| S06 | /dashboard/financeiro        | dynamic | dark_core     | stitch/S06 |
| S07 | /dashboard/telegram          | dynamic | dark_core     | stitch/S07 |
| S08 | /dashboard/onboarding        | dynamic | light_onboard | stitch/S08 |
| S09 | /dashboard/configuracoes     | dynamic | dark_core     | stitch/S09 |
| S10 | /portal                      | dynamic | light_patient | stitch/S10 |
| S11 | / (hero)                     | static  | dark_core     | stitch/S11 |
| S12 | / (features)                 | static  | dark_core     | stitch/S12 |
| S13 | /pricing                     | static  | dark_core     | stitch/S13 |
| S14 | /checkout/secure             | dynamic | dark_core     | stitch/S14 |

### Categoria B — Telas Derivadas (S15–S28)

| ID  | Rota                                 | Tipo    | Tema          | Deriva de   |
| --- | ------------------------------------ | ------- | ------------- | ----------- |
| S15 | /auth/login                          | static  | dark_core     | Design Sys. |
| S16 | /auth/register                       | static  | light_onboard | S08         |
| S17 | /auth/register/patient               | static  | light_patient | S10         |
| S18 | /auth/forgot-password                | static  | dark_core     | Design Sys. |
| S19 | /dashboard/agenda                    | dynamic | dark_core     | S01+S04     |
| S20 | /dashboard/pacientes                 | dynamic | dark_core     | S04         |
| S21 | /dashboard/configuracoes/perfil      | dynamic | dark_core     | S09         |
| S22 | /dashboard/configuracoes/integracoes | dynamic | dark_core     | S09         |
| S23 | /portal/agendar                      | dynamic | light_patient | S02+S10     |
| S24 | /portal/sessoes                      | dynamic | light_patient | S10         |
| S25 | /portal/chat                         | dynamic | light_patient | S05+S10     |
| S26 | /booking/[slug]/sucesso              | dynamic | dark_core     | S14         |
| S27 | (loading global)                     | static  | dark_core     | Design Sys. |
| S28 | (not-found / global-error)           | static  | dark_core     | Design Sys. |

### Categoria C — Rotas Legadas (redirect 308)

| Rota     | Redirect        |
| -------- | --------------- |
| /agendar | /portal/agendar |
| /apoio   | /portal/apoio   |
| /chat    | /portal/chat    |
| /sessoes | /portal/sessoes |

### API Routes (28 paths — nenhuma alteração planejada)

```
/api/ai/chat
/api/ai/insights
/api/ai/summarize
/api/ai/transcribe
/api/appointments/[id]/cancel
/api/appointments/[id]/reschedule
/api/audit/events
/api/auth/mfa/enroll
/api/auth/mfa/unenroll
/api/auth/mfa/verify
/api/auth/patient/bootstrap
/api/booking/checkout
/api/cron/reminders
/api/patient/appointments/checkout
/api/patient/chat/messages
/api/patient/chat/threads
/api/patient/chat/threads/[id]/messages
/api/patient/journal
/api/patient/mood
/api/reports/sessions
/api/sessions/[id]/close
/api/settings/profile
/api/settings/security
/api/subscriptions
/api/telegram/webhook
/api/video/room
/api/webhooks/stripe
/api/webhooks/supabase
```

---

## Gates Baseline (Estado Atual)

| Gate  | Resultado | Evidência                             |
| ----- | --------- | ------------------------------------- |
| tsc   | ✅ PASS   | `npx tsc --noEmit` → exit 0           |
| build | ✅ PASS   | `npm run build` → exit 0, 55/55 pages |

---

## Próxima Fase

MF-01 — Fundação Visual Única (tokens, fontes, utilitários CSS).
