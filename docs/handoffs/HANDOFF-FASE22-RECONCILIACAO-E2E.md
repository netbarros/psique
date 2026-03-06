# HANDOFF Fase 22 — Reconciliação E2E Enterprise

- Data base: 2026-03-05
- Última atualização operacional: 2026-03-06
- Status: ✅ MF-00..MF-11 concluídas | ✅ suíte E2E global reconciliada

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

## Evidências de validação (sessão 2026-03-06)

### Execução de qualidade estática/contrato/build
- `npm run verify` ✅ PASS
  - `lint` ✅ (0 warnings)
  - `typecheck` ✅
  - `contract:manifest:check` ✅ `ok (32 screens)`
  - `contract:non-screen:check` ✅ `ok (73 api paths)`
  - `docs:sync:check` ✅ `check completed with 0 drift item(s)`
  - `lint:colors` ✅ `ok (12 allowlisted occurrences)`
  - `backend:audit` ✅ `checks=293 passed=293 failed=0 criticalFailed=0`
  - `build` ✅ (Next 16.1.6 build completo)
  - `test:unit` ✅ `3 files, 16 tests passed`
  - `test:api` ✅ `23 files, 191 tests passed`
- `npm run backend:audit:write` ✅
  - relatório atualizado em `docs/baselines/mf23_backend_audit/report.json` com `293/293`.

### Execução E2E/visual (estado atual)
- `npm run test:e2e` ✅ PASS
  - `237 passed`
  - `9 skipped`
  - `0 failed`
- Reconciliações aplicadas na sessão:
  - `integrations.authenticated.spec.ts`: seletor de senha não ambíguo + asserts alinhados ao modo read-only de integrações.
  - `admin-integrations.real.spec.ts`: espera robusta para fim de inicialização da stack antes dos asserts de providers.
  - `booking.spec.ts`: asserts alinhados ao heading/step contract atual (`Agendamento público` / `Horário`).
  - `screen-contract.spec.ts`: hardening do cenário S16 mobile com fix global em `.material-symbols-outlined` (sem overflow horizontal).
  - `auth-redirects.authenticated.spec.ts`: assert estabilizado para alvo visível no tablet (`main`) sem falso negativo de elemento hidden.
  - `visual-regression.spec.ts`: snapshots atualizados (`landing`, `pricing`, `auth-login`) em `desktop/tablet/mobile`.
  - `auth/resolve-home`: matriz `next + role` validada em `desktop/tablet/mobile` para evitar redirecionamento confuso e loops pós-login.

### Resultado comprovado
1. Backend sem gaps de observabilidade no auditor (`NSR-049..053,057,058,070,072,073` saneados).
2. `verify` verde com contrato e build íntegros.
3. E2E/visual reconciliado no estado atual, sem falhas abertas na suíte global.

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
- `docs/stitch/CANONICAL_MANIFEST.json`: `4d2358d0036dfcee446ff6e9f4a14e75f89b2ab0c0fec565321de12c97053eba`
- `docs/stitch/NON_SCREEN_ROUTES.json`: `c9ca9eee501ebd872bdc7b2ef33e3d43c82eb224681b0267142626381a949295`
- `docs/stitch/schema/canonical-manifest.schema.json`: `00c6161f6b0619bb422142f745be80a11c5ee046154be193cfa40008b432e372`
- `docs/stitch/README.md`: `345872e467dd725ecc6667baba02844bc7cae1590ee6bfc571b19f37d6693a7d`
- `files/README.md` (espelho): `345872e467dd725ecc6667baba02844bc7cae1590ee6bfc571b19f37d6693a7d`

## Observações
- Worktree permanece intencionalmente sujo por histórico de execução e artefatos locais; nenhuma reversão destrutiva foi aplicada.
- Para publicação/merge, executar limpeza seletiva de artefatos não versionáveis se necessário.
- Gate global `verify` pode ficar bloqueado por violações visuais do branch de layout em paralelo; gates de backend (contrato, API, typecheck, audit, supabase preflight) estão independentes e verdes.
