# HANDOFF Fase 22 — Migração/Sincronização Runtime (Supabase)

- Data: 2026-03-05
- Owner: Codex (Backend)
- Status: ✅ Concluída
- Ambiente alvo (project ref): `ojccqjjphunmidfkicml`

## Objetivo
Resolver a pendência de runtime no Supabase (`webhook_event_locks` ausente) e fechar os gates backend/runtime para 100%.

## Diagnóstico inicial (antes da correção)
Comando executado:

```bash
npm run -s supabase:preflight -- --json
```

Resultado crítico:
- `webhook_event_locks_table_accessible` = **FAILED**
- Erro: `Could not find the table 'public.webhook_event_locks' in the schema cache (PGRST205)`

## Ação de migração/sincronização aplicada
1. Validação de pendências remotas:

```bash
npx supabase migration list --linked
```

2. Dry-run de push:

```bash
npx supabase db push --linked --dry-run
```

3. Push real para o ambiente alvo:

```bash
npx supabase db push --linked --yes
```

Migrations aplicadas no remoto:
- `20260304000002_patient_profile_policy.sql`
- `20260304000003_patient_portal_real_features.sql`
- `20260304000004_rls_authenticated_writes.sql`
- `20260305000005_enterprise_supabase_hardening.sql`
- `20260305000006_webhook_event_locks.sql`

## Verificação pós-migração (evidência fresca)
1. Preflight runtime JSON:

```bash
npm run -s supabase:preflight -- --json
```

Resumo:
- `total=14`
- `passed=14`
- `failed=0`
- `criticalFailed=0`
- `webhook_event_locks_table_accessible`: **PASS** (`webhook_event_locks accessible (0 rows)`)

2. Gate backend runtime completo:

```bash
npm run verify:backend:runtime
```

Resultado:
- ✅ `lint`
- ✅ `typecheck`
- ✅ `contract:non-screen:check`
- ✅ `backend:surface:check`
- ✅ `backend:audit` (`120/120`, `criticalFailed=0`)
- ✅ `test:api` (`19 files`, `163 tests`, tudo PASS)
- ✅ `supabase:preflight:runtime` (`14/14`, `criticalFailed=0`)

3. Sincronismo local/remoto de migrations:

```bash
npx supabase migration list --linked
```

Resultado: versões locais e remotas alinhadas de `20240301000001` até `20260305000006`.

## Artefatos atualizados
- Report runtime escrito: `docs/baselines/mf24_supabase_deep/preflight-report.json`
- Este handoff: `docs/handoffs/HANDOFF-FASE22-MIGRACAO-RUNTIME-2026-03-05.md`

## Observações operacionais
- Execução focada em banco/runtime, sem alteração de contratos HTTP existentes.
- Nenhuma operação destrutiva foi utilizada.
- Worktree já estava sujo antes desta ação; nenhuma reversão foi feita.
