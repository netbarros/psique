# MF-00R Traceability Matrix (S01-S28)

- Source lock: `docs/baselines/mf00r/route-scope-v3.json`
- Evidence bundle: `docs/baselines/mf00r/baseline-visual.json` + `docs/baselines/mf00r/screenshots/**`

| ID | Rota/Componente | Arquivo | E2E alvo | Evidência | Status |
|---|---|---|---|---|---|
| S01 | `/dashboard` | `app/dashboard/page.tsx` | `e2e/screen-contract.spec.ts` | `screenshots/*/therapist/S01__dashboard.png` | PASS |
| S02 | `/booking/test-terapeuta` | `app/booking/[slug]/page.tsx` | `e2e/screen-contract.spec.ts`, `e2e/booking.spec.ts` | `screenshots/*/public/S02__booking__test-terapeuta.png` | PASS |
| S03 | `/dashboard/consulta/room-stitch-check` | `app/dashboard/consulta/[roomId]/page.tsx` | `e2e/screen-contract.spec.ts` | `screenshots/*/therapist/S03__dashboard__consulta__room-stitch-check.png` | PASS* |
| S04 | `/dashboard/pacientes/11111111-1111-1111-1111-111111111111` | `app/dashboard/pacientes/[id]/page.tsx` | `e2e/screen-contract.spec.ts` | `screenshots/*/therapist/S04__dashboard__pacientes__11111111-1111-1111-1111-111111111111.png` | PASS |
| S05 | `/dashboard/ia` | `app/dashboard/ia/page.tsx` | `e2e/screen-contract.spec.ts` | `screenshots/*/therapist/S05__dashboard__ia.png` | PASS |
| S06 | `/dashboard/financeiro` | `app/dashboard/financeiro/page.tsx` | `e2e/screen-contract.spec.ts` | `screenshots/*/therapist/S06__dashboard__financeiro.png` | PASS |
| S07 | `/dashboard/telegram` | `app/dashboard/telegram/page.tsx` | `e2e/screen-contract.spec.ts` | `screenshots/*/therapist/S07__dashboard__telegram.png` | PASS |
| S08 | `/dashboard/onboarding` | `app/dashboard/onboarding/page.tsx` | `e2e/screen-contract.spec.ts` | `screenshots/*/therapist/S08__dashboard__onboarding.png` | PASS |
| S09 | `/dashboard/configuracoes` | `app/dashboard/configuracoes/page.tsx` | `e2e/screen-contract.spec.ts` | `screenshots/*/therapist/S09__dashboard__configuracoes.png` | PASS |
| S10 | `/portal` | `app/(patient)/page.tsx` | `e2e/screen-contract.spec.ts` | `screenshots/*/patient/S10__portal.png` | PASS |
| S11 | `/` | `app/page.tsx` | `e2e/screen-contract.spec.ts` | `screenshots/*/public/S11__root.png` | PASS |
| S12 | `/` (features) | `app/page.tsx` | `e2e/screen-contract.spec.ts` | `screenshots/*/public/S12__root.png` | PASS |
| S13 | `/pricing` | `app/pricing/page.tsx` | `e2e/screen-contract.spec.ts` | `screenshots/*/public/S13__pricing.png` | PASS |
| S14 | `/checkout/secure` | `app/checkout/secure/page.tsx` | `e2e/screen-contract.spec.ts` | `screenshots/*/public/S14__checkout__secure.png` | PASS |
| S15 | `/auth/login` | `app/auth/login/page.tsx` | `e2e/auth.spec.ts` | `screenshots/*/public/S15__auth__login.png` | PASS |
| S16 | `/auth/register` | `app/auth/register/page.tsx` | `e2e/auth.spec.ts` | `screenshots/*/public/S16__auth__register.png` | PASS |
| S17 | `/auth/register/patient` | `app/auth/register/patient/page.tsx` | `e2e/auth.spec.ts` | `screenshots/*/public/S17__auth__register__patient.png` | PASS |
| S18 | `/auth/forgot-password` | `app/auth/forgot-password/page.tsx` | `e2e/auth.spec.ts` | `screenshots/*/public/S18__auth__forgot-password.png` | PASS |
| S19 | `/dashboard/agenda` | `app/dashboard/agenda/page.tsx` | `e2e/screen-contract.spec.ts` | `screenshots/*/therapist/S19__dashboard__agenda.png` | PASS |
| S20 | `/dashboard/pacientes` | `app/dashboard/pacientes/page.tsx` | `e2e/screen-contract.spec.ts` | `screenshots/*/therapist/S20__dashboard__pacientes.png` | PASS |
| S21 | `/dashboard/configuracoes/perfil` | `app/dashboard/configuracoes/perfil/page.tsx` | `e2e/screen-contract.spec.ts` | `screenshots/*/therapist/S21__dashboard__configuracoes__perfil.png` | PASS |
| S22 | `/dashboard/configuracoes/integracoes` | `app/dashboard/configuracoes/integracoes/page.tsx` | `e2e/screen-contract.spec.ts` | `screenshots/*/therapist/S22__dashboard__configuracoes__integracoes.png` | PASS |
| S23 | `/portal/agendar` | `app/(patient)/agendar/page.tsx` | `e2e/screen-contract.spec.ts` | `screenshots/*/patient/S23__portal__agendar.png` | PASS |
| S24 | `/portal/sessoes` | `app/(patient)/sessoes/page.tsx` | `e2e/screen-contract.spec.ts` | `screenshots/*/patient/S24__portal__sessoes.png` | PASS |
| S25 | `/portal/chat` | `app/(patient)/chat/page.tsx` | `e2e/screen-contract.spec.ts` | `screenshots/*/patient/S25__portal__chat.png` | PASS |
| S26 | `/booking/test-terapeuta/sucesso` | `app/booking/[slug]/sucesso/page.tsx` | `e2e/booking.spec.ts` | `screenshots/*/public/S26__booking__test-terapeuta__sucesso.png` | PASS |
| S27 | `__component__:app/loading.tsx` | `app/loading.tsx` | `e2e/screen-contract.spec.ts` | `screen-contract assertion (non-capturable)` | PASS |
| S28 | `/_mf00r_not_found_probe` | `app/not-found.tsx`, `app/global-error.tsx` | `e2e/navigation.spec.ts`, `e2e/screen-contract.spec.ts` | `screenshots/*/public/S28___mf00r_not_found_probe.png` | PASS* |

\* `S03` e `S28` possuem ruído de console esperado no baseline (`CSP frame placeholder` e `404 probe`), já documentado em `BASELINE_VISUAL.md`.
