# Fase 22 — Plano Enterprise de Reconciliação E2E 100%

## Objetivo
Eliminar drift documental e de contrato, consolidar rotas canônicas, ampliar cobertura por camadas (unit/api/e2e/visual) e bloquear regressões em CI.

## Estado consolidado
1. Fonte única: `docs/stitch/*`.
2. `files/*` como espelho automático e estrito.
3. Rotas canônicas de paciente: `/portal/*`.
4. Rotas legadas curtas com redirect permanente `308`.
5. Contrato canônico v4 com validação de schema.
6. Catálogo de rotas não-visuais separado.
7. Testes em três camadas (unit+api, e2e fluxo, visual snapshot).
8. CI/CD bloqueante por gate.

## Microfases e status

### MF-00 — Freeze + baseline
Status: ✅ Concluída
- Baseline gerado em `docs/baselines/mf21_reconcile/`.

### MF-01 — Governança + espelho automático
Status: ✅ Concluída
- Script: `scripts/sync-stitch-mirror.mjs` (`--check`, `--write`).
- Regra: `files/*` sem edição manual.

### MF-02 — Contrato canônico v4 + schema
Status: ✅ Concluída
- Schema: `docs/stitch/schema/canonical-manifest.schema.json`.
- Validação: `scripts/check-canonical-manifest.mjs`.

### MF-03 — Geração automática do catálogo E2E
Status: ✅ Concluída
- Gerador: `scripts/generate-screen-catalog.mjs`.
- Saída: `e2e/contracts/screen-catalog.generated.ts`.

### MF-04 — Catálogo de rotas não-visuais
Status: ✅ Concluída
- Arquivo: `docs/stitch/NON_SCREEN_ROUTES.json`.
- Validação: `scripts/check-non-screen-routes.mjs`.

### MF-05 — Canonicalização `/portal/*` + redirects 308
Status: ✅ Concluída
- `/agendar|/apoio|/chat|/sessoes` com `308` para `/portal/*`.

### MF-06 — Hardening visual por tokens
Status: ✅ Concluída
- Lint de cores hardcoded em operação.

### MF-07 — Testes unit + API + DB contract
Status: ✅ Concluída
- Vitest configurado (`unit` e `api`).

### MF-08 — E2E L1/L2/L3 + evidência visual
Status: ✅ Concluída
- Playwright com snapshots visuais (390/768/1440).

### MF-09 — Segurança operacional + Next 16
Status: ✅ Concluída
- Migração para `proxy.ts`.

### MF-10 — CI/CD bloqueante + handoff final
Status: ✅ Concluída
- Workflows: `lint`, `typecheck`, `build`, `unit`, `api`, `e2e`, `visual`, `docs-sync-check`.
- README raiz atualizado.
- Handoff final gerado: `docs/handoffs/HANDOFF-FASE22-RECONCILIACAO-E2E.md`.

### MF-11 — Backend gate independente + auditoria profunda
Status: ✅ Concluída
- Gate dedicado (estático/CI): `verify:backend` com sequência fixa:
  - `lint`
  - `typecheck`
  - `contract:non-screen:check`
  - `backend:surface:check`
  - `backend:audit`
  - `test:api`
  - `supabase:preflight:static`
- Gate dedicado (runtime): `verify:backend:runtime` com `supabase:preflight:runtime`
- Workflow dedicado: `.github/workflows/verify-backend.yml`
- Superfície backend completa: `docs/backend/BACKEND-API-SURFACE.md`
- Drift check automático catálogo/documento: `scripts/check-backend-api-surface.mjs`
- Runtime Supabase validado e sincronizado até `20260305000006_webhook_event_locks.sql`
- Evidências: `docs/handoffs/HANDOFF-FASE22-RECONCILIACAO-E2E.md` e `docs/handoffs/HANDOFF-FASE22-MIGRACAO-RUNTIME-2026-03-05.md`

## Comandos de gate
```bash
npm run lint
npm run typecheck
npm run contract:manifest:check
npm run contract:non-screen:check
npm run backend:surface:check
npm run backend:audit
npm run supabase:preflight
npm run docs:sync:check
npm run lint:colors
npm run build
npm run test:unit
npm run test:api
npm run test:e2e
npm run test:visual
```

Atalhos:
- `npm run verify` (sem E2E/visual)
- `npm run verify:backend` (gate backend independente)
- `npm run verify:backend:runtime` (gate backend com Supabase runtime)
- `npm run verify:ci` (completo)
