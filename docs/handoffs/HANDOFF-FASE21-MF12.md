# HANDOFF Fase 21 — MF12

- Data: 2026-03-04
- Status: ✅ Concluída

## Objetivo
Fechar lacunas remanescentes de tipagem de banco e reduzir bypass de service-role em endpoints transacionais autenticados, mantendo estabilidade visual/funcional.

## Entregáveis
1. Tipagem de banco canônica:
   - `lib/database.types.ts` passou a conter a definição completa de tipos de banco.
   - `types/database.ts` virou reexport compatível (`export * from "@/lib/database.types"`).
   - Imports migrados para `@/lib/database.types` nos clients Supabase e telas clínicas.
2. Hardening de writes autenticados via RLS (sem service-role para escrita em endpoints alvo):
   - Refatorados para cliente autenticado:
     - `app/api/patient/journal/route.ts`
     - `app/api/patient/mood/route.ts`
     - `app/api/patient/chat/threads/route.ts`
     - `app/api/patient/chat/threads/[id]/messages/route.ts`
     - `app/api/patient/chat/messages/route.ts` (write via RLS; sem query admin de modelo)
     - `app/api/settings/profile/route.ts`
     - `app/api/settings/security/route.ts`
     - `app/api/sessions/[id]/close/route.ts`
   - `app/api/patient/appointments/checkout/route.ts`: criação de appointment e audit por cliente autenticado; admin mantido apenas para leitura operacional (conflito/terapeuta).
3. Migração aditiva de políticas:
   - `supabase/migrations/20260304000004_rls_authenticated_writes.sql`
   - Policies novas:
     - `therapist_insert_own_audit_logs` (INSERT em `audit_logs`)
     - `patient_insert_own_audit_logs` (INSERT em `audit_logs`)
     - `patient_insert_own_appointments` (INSERT em `appointments`)

## Evidência de validação
- `npx tsc --noEmit`: ✅ PASS
- `npm run build`: ✅ PASS
- `npx playwright test --workers=1`: ✅ PASS (`183 passed`, `0 failed`, `0 skipped`)

## Observações
- Layout não foi alterado nesta microfase.
- A rota de checkout autenticado mantém leitura admin apenas para dados não expostos ao paciente; writes críticos foram movidos para caminho autenticado com RLS.
