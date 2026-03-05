# Task: Plano Microfaseado — Elevação UI/UX E2E PSIQUE

## Status

- [x] Research: read AGENTS.md, Claude.md, CONTINUIDADE-PROMPT.md, IMPLEMENTATION_BACKLOG.md
- [x] Research: inspect globals.css, existing routes, component library, stitch references
- [x] Research: verify E2E infrastructure, package.json scripts, test specs
- [x] Write implementation_plan.md with micro-phased plan aligned to MF-00..MF-10
- [x] Notify user for review — APPROVED

## MF-00 — Baseline e Rastreabilidade
- [/] Freeze route inventory (28 screens A/B/C)
- [ ] Run tsc + build baseline
- [ ] Generate baseline screenshots (3 viewports × key routes)
- [ ] Create HANDOFF-MF00.md

## MF-01 — Fundação Visual Única
- [ ] Consolidate fonts (Cormorant + Instrument Sans)
- [ ] Consolidate dark_core tokens in globals.css
- [ ] Add light_patient / light_onboard data-theme
- [ ] Add glass/glow/hide-scrollbar utilities
- [ ] Audit + eliminate legacy tokens in TSX

## MF-02 — Shells e Navegação
- [ ] Rebuild DashboardShell (mobile/tablet/desktop)
- [ ] Rebuild PatientLayout (mobile/desktop + data-theme)

## MF-03 — S01–S04 (Núcleo Clínico)
- [ ] S01 /dashboard
- [ ] S02 /booking/[slug]
- [ ] S03 /consulta/[roomId]
- [ ] S04 /pacientes/[id]

## MF-04 — S05–S09 (Workspace)
- [ ] S05 /ia
- [ ] S06 /financeiro
- [ ] S07 /telegram
- [ ] S08 /onboarding
- [ ] S09 /configuracoes

## MF-05 — S10–S14 (Portal + Público)
- [ ] S10 /portal
- [ ] S11-S12 Landing
- [ ] S13 /pricing
- [ ] S14 /checkout/secure

## MF-06 — S15–S28 (Derivadas)
- [ ] S15–S18 Auth screens
- [ ] S19–S22 Dashboard sub-screens
- [ ] S23–S25 Portal sub-screens
- [ ] S26–S28 Booking success + Loading + Error

## MF-07–10 — E2E + Hardening
- [ ] E2E Level 1 (route health)
- [ ] E2E Level 2 (critical flows)
- [ ] E2E Level 3 (visual regression)
- [ ] Hardening final + handoff
