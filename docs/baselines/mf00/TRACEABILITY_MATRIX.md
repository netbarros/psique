# MF-00 Traceability Matrix

- Source lock: `docs/baselines/mf00/route-scope.json`
- Purpose: map each locked route/component to Stitch ID (when applicable), implementation file and current E2E coverage.

| Entry | Stitch | Route/Component | Actor | Source File | Capturable | Current E2E Specs |
|---|---|---|---|---|---|---|
| S01 | S01 | `/dashboard` | therapist | `app/dashboard/page.tsx` | true | e2e/stitch.coverage.spec.ts, e2e/navigation.spec.ts, e2e/layout.enterprise.spec.ts |
| S02 | S02 | `/booking/test-terapeuta` | public | `app/booking/[slug]/page.tsx` | true | e2e/booking.spec.ts, e2e/stitch.coverage.spec.ts |
| S03 | S03 | `/dashboard/consulta/room-stitch-check` | therapist | `app/dashboard/consulta/[roomId]/page.tsx` | true | e2e/stitch.coverage.spec.ts, e2e/navigation.spec.ts |
| S04 | S04 | `/dashboard/pacientes/11111111-1111-1111-1111-111111111111` | therapist | `app/dashboard/pacientes/[id]/page.tsx` | true | e2e/stitch.coverage.spec.ts, e2e/navigation.spec.ts |
| S05 | S05 | `/dashboard/ia` | therapist | `app/dashboard/ia/page.tsx` | true | e2e/stitch.coverage.spec.ts, e2e/navigation.spec.ts |
| S06 | S06 | `/dashboard/financeiro` | therapist | `app/dashboard/financeiro/page.tsx` | true | e2e/stitch.coverage.spec.ts, e2e/navigation.spec.ts |
| S07 | S07 | `/dashboard/telegram` | therapist | `app/dashboard/telegram/page.tsx` | true | e2e/stitch.coverage.spec.ts, e2e/navigation.spec.ts |
| S08 | S08 | `/dashboard/onboarding` | therapist | `app/dashboard/onboarding/page.tsx` | true | e2e/stitch.coverage.spec.ts, e2e/navigation.spec.ts |
| S09 | S09 | `/dashboard/configuracoes` | therapist | `app/dashboard/configuracoes/page.tsx` | true | e2e/stitch.coverage.spec.ts, e2e/navigation.spec.ts, e2e/layout.enterprise.spec.ts |
| S10A | S10 | `/portal` | patient | `app/portal/page.tsx` | true | e2e/stitch.coverage.spec.ts, e2e/navigation.spec.ts |
| S10B | S10 | `/portal/apoio` | patient | `app/portal/apoio/page.tsx` | true | e2e/stitch.coverage.spec.ts, e2e/navigation.spec.ts |
| S11S12 | S11/S12 | `/` | public | `app/page.tsx` | true | e2e/navigation.spec.ts, e2e/stitch.coverage.spec.ts, e2e/layout.enterprise.spec.ts |
| S13 | S13 | `/pricing` | public | `app/pricing/page.tsx` | true | e2e/navigation.spec.ts, e2e/stitch.coverage.spec.ts |
| S14 | S14 | `/checkout/secure` | public | `app/checkout/secure/page.tsx` | true | e2e/navigation.spec.ts, e2e/stitch.coverage.spec.ts |
| L01 | — | `/dashboard/agenda` | therapist | `app/dashboard/agenda/page.tsx` | true | e2e/navigation.spec.ts, e2e/layout.enterprise.spec.ts |
| L02 | — | `/dashboard/pacientes` | therapist | `app/dashboard/pacientes/page.tsx` | true | e2e/navigation.spec.ts |
| L03 | — | `/portal/agendar` | patient | `app/portal/agendar/page.tsx` | true | e2e/navigation.spec.ts |
| L04 | — | `/portal/sessoes` | patient | `app/portal/sessoes/page.tsx` | true | e2e/navigation.spec.ts |
| L05 | — | `/portal/chat` | patient | `app/portal/chat/page.tsx` | true | e2e/navigation.spec.ts |
| L06 | — | `/auth/login` | public | `app/auth/login/page.tsx` | true | e2e/auth.spec.ts, e2e/navigation.spec.ts, e2e/layout.enterprise.spec.ts |
| L07 | — | `/booking/test-terapeuta/sucesso` | public | `app/booking/[slug]/sucesso/page.tsx` | true | e2e/booking.spec.ts |
| L08 | — | `/_mf00_not_found_probe_route` | public | `app/not-found.tsx` | true | e2e/navigation.spec.ts |
| L09 | — | `__component__:app/loading.tsx` | public | `app/loading.tsx` | false | — |
| L10 | — | `__component__:app/global-error.tsx` | public | `app/global-error.tsx` | false | — |
