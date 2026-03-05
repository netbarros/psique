# HANDOFF Fase 22 — Reconciliação E2E Enterprise

- Data: 2026-03-05
- Status: ✅ Concluída (MF-00..MF-11)

## Objetivo
Executar reconciliação enterprise 100% com fonte canônica em `docs/stitch/*`, espelho automático sem drift, canonicalização de rotas de paciente em `/portal/*`, cobertura de testes em múltiplas camadas e CI/CD bloqueante.

## Escopo entregue (MF-00..MF-11)

1. **MF-00 — Baseline de reconciliação**
- Baseline em `docs/baselines/mf21_reconcile/`:
  - `inventory.json`
  - `checksums.json`
  - `gap-register.json`

2. **MF-01 — Governança + espelho automático**
- Script: `scripts/sync-stitch-mirror.mjs`
- Modos: `--write` e `--check`
- Regra explícita adicionada: `files/*` é espelho gerado (sem edição manual)

3. **MF-02 — Manifesto canônico v4 + schema**
- Schema: `docs/stitch/schema/canonical-manifest.schema.json`
- Validador: `scripts/check-canonical-manifest.mjs`
- Manifesto v4: `docs/stitch/CANONICAL_MANIFEST.json`

4. **MF-03 — Catálogo E2E gerado**
- Gerador: `scripts/generate-screen-catalog.mjs`
- Arquivo gerado: `e2e/contracts/screen-catalog.generated.ts`
- Wrapper: `e2e/contracts/screen-catalog.ts`

5. **MF-04 — Catálogo de rotas não-visuais**
- Arquivo: `docs/stitch/NON_SCREEN_ROUTES.json`
- Check: `scripts/check-non-screen-routes.mjs`

6. **MF-05 — Canonicalização `/portal/*` + legado 308**
- Canonical: `/portal`, `/portal/agendar`, `/portal/apoio`, `/portal/sessoes`, `/portal/chat`
- Legado: `/agendar`, `/apoio`, `/sessoes`, `/chat` com `308`
- Migração de runtime: `middleware.ts` -> `proxy.ts`

7. **MF-06 — Hardening visual por tokens**
- Lint de hardcoded colors ativo: `scripts/check-no-hardcoded-colors.mjs`
- Gate: `npm run lint:colors`

8. **MF-07 — Unit + API + DB contract**
- Vitest configurado (`vitest.config.ts`, `vitest.unit.config.ts`, `vitest.api.config.ts`)
- Suites em `test/unit/*` e `test/api/*`

9. **MF-08 — E2E + visual regression**
- Redirect tests (`308`) para rotas legadas
- Visual snapshots em 390/768/1440
- Suite visual: `e2e/visual-regression.spec.ts`

10. **MF-09/MF-10 — Segurança operacional + CI/CD bloqueante**
- `proxy.ts` ativo para Next 16
- Workflows criados em `.github/workflows/`:
  - `backend-audit.yml`
  - `lint.yml`
  - `typecheck.yml`
  - `build.yml`
  - `unit.yml`
  - `api.yml`
  - `e2e.yml`
  - `visual.yml`
  - `docs-sync-check.yml`
- README raiz atualizado com governança e gates.

11. **MF-11 — Backend Audit Orchestrator (enterprise)**
- Script de auditoria central: `scripts/backend-audit-orchestrator.mjs`
- Report automático: `docs/baselines/mf23_backend_audit/report.json`
- Gates adicionados:
  - `npm run backend:audit`
  - `npm run backend:audit:write`
- `verify` atualizado para bloquear em falhas críticas de auditoria backend.
- Teste de superfície backend acoplado ao catálogo canônico:
  - `test/api/backend-surface-contract.test.ts` lê `docs/stitch/NON_SCREEN_ROUTES.json`
- Hardening de observabilidade em rotas críticas:
  - `app/api/patient/chat/messages/route.ts`
  - `app/api/sessions/[id]/close/route.ts`

## Evidências de validação (frescas)

### Execução de qualidade estática/contrato/build
- `npm run verify` ✅ PASS
  - `lint` ✅
  - `typecheck` ✅
  - `contract:manifest:check` ✅ `ok (28 screens)`
  - `contract:non-screen:check` ✅ `ok (28 api paths)`
  - `docs:sync:check` ✅ `check completed with 0 drift item(s)`
  - `lint:colors` ✅ `ok (141 allowlisted occurrences)`
  - `build` ✅ (Next 16.1.6 build completo)
  - `test:unit` ✅ `7 passed`
  - `test:api` ✅ `10 passed`
  - `docs:watch:snapshot` ✅ (state atualizado)
  - `docs:watch:check` ✅ (`0 changes`)
  - `supabase:preflight:write` ✅ (`4/4 checks`, relatório em `docs/baselines/mf22_supabase/preflight-report.json`)
  - `backend:audit:write` ✅ (`120/120 checks`, relatório em `docs/baselines/mf23_backend_audit/report.json`)

### Execução de testes E2E/visual
- `npm run test:e2e` ✅ `204 passed (46.9s)`
- `npm run test:visual` ✅ `9 passed (11.9s)`

### Resultado comprovado
1. 0 drift `docs/stitch/*` vs `files/*` no check de espelho.
2. Redirect `308` para `/agendar|/apoio|/chat|/sessoes` validado em suíte dedicada.
3. 0 falha em unit/api/e2e/visual.
4. Gates configurados em CI bloqueante por workflow.

## Coordenação Multiagente (Backend x Layout)
- Parceiro oficial de execução: `CLAUDE.md` (delegado para `AGENTS.md`).
- Contrato backend↔frontend formalizado em `docs/handoffs/BACKEND-CONTRACT-FRONTEND-AGENT.md`.
- Checklist de PR para trabalho de layout sem quebra de backend:
  - `docs/handoffs/PR-CHECKLIST-LAYOUT-AGENT.md`
- Monitoramento de mudanças em `docs/` e `docs/handoffs/`:
  - `scripts/track-docs-updates.mjs`
  - `npm run docs:watch:snapshot`
  - `npm run docs:watch:check`
- Preflight de integridade Supabase antes do enforce final de unicidade:
  - `scripts/supabase-preflight.mjs`
  - `npm run supabase:preflight`
  - `npm run supabase:preflight:write`
- Auditoria contínua de backend:
  - `scripts/backend-audit-orchestrator.mjs`
  - `npm run backend:audit`
  - `npm run backend:audit:write`
- Saneamento orientado para possíveis duplicidades históricas:
  - migration de hardening: `supabase/migrations/20260305000005_enterprise_supabase_hardening.sql`
  - playbook manual: `supabase/playbooks/20260305_preflight_dedupe_playbook.sql`

## Checksums de referência (canônicos)
- `docs/stitch/CANONICAL_MANIFEST.json`: `96d3710b175b7d4c6979cb079eb5fb02acb0361c1e02998b2b5977cdd2594340`
- `docs/stitch/NON_SCREEN_ROUTES.json`: `9c0c1317a95c5900cd2dfb188550122291f3d3a3107c08daa2105cae0371f1b5`
- `docs/stitch/schema/canonical-manifest.schema.json`: `00c6161f6b0619bb422142f745be80a11c5ee046154be193cfa40008b432e372`
- `docs/stitch/README.md`: `345872e467dd725ecc6667baba02844bc7cae1590ee6bfc571b19f37d6693a7d`
- `files/README.md` (espelho): `345872e467dd725ecc6667baba02844bc7cae1590ee6bfc571b19f37d6693a7d`

## Observações
- Worktree permanece intencionalmente sujo por histórico de execução e artefatos locais; nenhuma reversão destrutiva foi aplicada.
- Para publicação/merge, executar limpeza seletiva de artefatos não versionáveis se necessário.
- Gate global `verify` pode ficar bloqueado por violações visuais do branch de layout em paralelo; gates de backend (contrato, API, typecheck, audit, supabase preflight) estão independentes e verdes.
