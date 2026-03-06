# SCREEN_REGISTRY (S01-S32)

## Convenções
- `source_type`
  - `stitch`: tela com referência direta em `stitch/**`.
  - `derived`: tela derivada pelo Design System canônico.
- `status`
  - `mapped`: rota definida e mapeada para implementação/teste.
- Temas válidos: `dark_core`, `dark_theater`, `light_onboard`, `light_patient`.

## Registro Canônico

| ID | source_type | Título | Tema | Rota(s) | Fonte visual | Deriva de | Status |
|---|---|---|---|---|---|---|---|
| S01 | stitch | Therapist Dashboard | dark_core | `/dashboard` | `stitch/psique_cursor_master_prompt.md_1` | — | mapped |
| S02 | stitch | Public Booking Page | dark_core | `/booking/[slug]` | `stitch/psique_cursor_master_prompt.md_2` | — | mapped |
| S03 | stitch | Clinical Session Video | dark_theater | `/dashboard/consulta/[roomId]` | `stitch/psique_cursor_master_prompt.md_3` | — | mapped |
| S04 | stitch | Patient Clinical Profile | dark_core | `/dashboard/pacientes/[id]` | `stitch/psique_cursor_master_prompt.md_4` | — | mapped |
| S05 | stitch | AI Clinical Assistant | dark_core | `/dashboard/ia` | `stitch/psique_cursor_master_prompt.md_5` | — | mapped |
| S06 | stitch | Financial Intelligence | dark_core | `/dashboard/financeiro` | `stitch/psique_cursor_master_prompt.md_6` | — | mapped |
| S07 | stitch | Telegram Hub | dark_core | `/dashboard/telegram` | `stitch/psique_cursor_master_prompt.md_7` | — | mapped |
| S08 | stitch | Therapist Onboarding Wizard | light_onboard | `/dashboard/onboarding` | `stitch/psique_cursor_master_prompt.md_8` | — | mapped |
| S09 | stitch | Segurança & LGPD | dark_core | `/dashboard/configuracoes` | `stitch/psique_cursor_master_prompt.md_9` | — | mapped |
| S10 | stitch | Patient Reflection Portal | light_patient | `/portal`, `/portal/apoio` | `stitch/psique_cursor_master_prompt.md_10` | — | mapped |
| S11 | stitch | Landing Hero | dark_core | `/` | `stitch/psique_cursor_master_prompt.md_11` | — | mapped |
| S12 | stitch | Landing Features & Value | dark_core | `/` | `stitch/psique_cursor_master_prompt.md_12` | — | mapped |
| S13 | stitch | Pricing Plans | dark_core | `/pricing` | `stitch/psique_cursor_master_prompt.md_13` | — | mapped |
| S14 | stitch | Secure Checkout | dark_core | `/checkout/secure` | `stitch/psique_cursor_master_prompt.md_14` | — | mapped |
| S15 | derived | Login Dual Role | dark_core | `/auth/login` | Design System | — | mapped |
| S16 | derived | Register Therapist | light_onboard | `/auth/register` | Design System | S08 | mapped |
| S17 | derived | Register Patient | light_patient | `/auth/register/patient` | Design System | S10 | mapped |
| S18 | derived | Forgot Password | dark_core | `/auth/forgot-password` | Design System | — | mapped |
| S19 | derived | Agenda Semanal | dark_core | `/dashboard/agenda` | Design System | S01, S04 | mapped |
| S20 | derived | Lista de Pacientes | dark_core | `/dashboard/pacientes` | Design System | S04 | mapped |
| S21 | derived | Settings Perfil | dark_core | `/dashboard/configuracoes/perfil` | Design System | S09 | mapped |
| S22 | derived | Settings Integrações | dark_core | `/dashboard/configuracoes/integracoes` | Design System | S09 | mapped |
| S23 | derived | Patient Self-Booking | light_patient | `/portal/agendar` | Design System | S02, S10 | mapped |
| S24 | derived | Patient Sessions History | light_patient | `/portal/sessoes` | Design System | S10 | mapped |
| S25 | derived | Patient AI Chat | light_patient | `/portal/chat` | Design System | S05, S10 | mapped |
| S26 | derived | Booking Confirmation | dark_core | `/booking/[slug]/sucesso` | Design System | S14 | mapped |
| S27 | derived | Global Loading | dark_core | `app/loading.tsx` (component) | Design System | — | mapped |
| S28 | derived | Not Found / Global Error | dark_core | `app/not-found.tsx`, `app/global-error.tsx` | Design System | — | mapped |
| S29 | derived | Public Therapists Directory | dark_core | `/terapeutas` | Design System | S02, S11 | mapped |
| S30 | derived | Therapist Public Profile | dark_core | `/terapeuta/[slug]`, `/[slug]` | Design System | S02, S11 | mapped |
| S31 | derived | Therapist Public Content Hub | dark_core | `/terapeuta/[slug]/posts/[postSlug]` | Design System | S05, S12 | mapped |
| S32 | derived | Growth Wallet & Referral Dashboard | dark_core | `/dashboard/crescimento` | Design System | S01, S05 | mapped |

## Verificação rápida
1. 32/32 telas mapeadas.
2. 14 `stitch` + 18 `derived`.
3. Sem tema `light_variant`/`hybrid` legado.
