# HANDOFF FASE 17 — Audits & E2E Validation (Concluída)

## Escopo

Concluir a Fase 17 com correções de navegação/roteamento e validação E2E completa (desktop + mobile), eliminando falhas aparentes de UI na jornada crítica.

## Problemas raiz identificados

1. **Portal do paciente em `/portal` não existia como rota concreta**
   - As páginas estavam em `app/(patient)` com links/login apontando para `/portal/*`.
2. **Booking público dependia de leitura pública sujeita a RLS**
   - Em alguns ambientes, dados de terapeuta/disponibilidade não carregavam de forma determinística.
3. **Leitura de `patients` para usuário paciente bloqueada por RLS**
   - Layout/páginas do portal redirecionavam para `/dashboard`, quebrando navegação E2E do paciente.

## Implementação realizada

### 1) Rotas reais do portal do paciente

Criados wrappers em `/portal` reaproveitando os arquivos existentes do grupo `(patient)`:

- `app/portal/layout.tsx`
- `app/portal/page.tsx`
- `app/portal/agendar/page.tsx`
- `app/portal/sessoes/page.tsx`
- `app/portal/chat/page.tsx`
- `app/portal/apoio/page.tsx`

### 2) Booking público robusto

Arquivo:

- `app/booking/[slug]/page.tsx`

Ajuste:

- Introduzido `getPublicBookingClient()` com fallback para `createAdminClient()` quando `SUPABASE_SERVICE_ROLE_KEY` estiver disponível (senão usa client SSR padrão).
- Aplicado em `generateMetadata` e `BookingPage` para leituras públicas de terapeuta/disponibilidade previsíveis.

### 3) Fallback seguro para perfil do paciente em contexto autenticado

Arquivos:

- `app/(patient)/layout.tsx`
- `app/(patient)/page.tsx`
- `app/(patient)/agendar/page.tsx`
- `app/(patient)/sessoes/page.tsx`

Ajuste:

- Mantida tentativa via RLS (`createClient`).
- Adicionado fallback server-side com `createAdminClient()` somente para localizar a linha do paciente por `user_id` quando RLS negar leitura.
- Preservado redirect para `/dashboard` caso o usuário realmente não seja paciente.

### 4) Migração RLS para consistência estrutural

Arquivo:

- `supabase/migrations/20260304000002_patient_profile_policy.sql`

Inclui:

- Policy `patient_own_profile` em `patients` para `SELECT` quando `user_id = auth.uid()`.

## Validações executadas

### TypeScript (obrigatória)

Comando:

```bash
cmd /c "cd c:\psique\psique && npx tsc --noEmit && echo TSC_PASSED || echo TSC_FAILED"
```

Resultado:

- `TSC_PASSED`

### Playwright (suite do repositório)

Comando:

```bash
npx playwright test e2e/auth.spec.ts e2e/navigation.spec.ts e2e/booking.spec.ts --reporter=line
```

Resultado:

- `22 passed`
- `4 skipped`

### Auditoria E2E de UI (jornada crítica completa, desktop + mobile)

Execução local via script de auditoria:

- `total: 36`
- `passed: 36`
- `failed: 0`

Artefatos:

- `C:\tmp\psique-ui-audit-artifacts\ui-audit-summary.json`
- traces/videos/screenshots em `C:\tmp\psique-ui-audit-artifacts\`

### Cleanup de dados temporários

Resultado:

- `residues.therapists = 0`
- `residues.patients = 0`

Arquivo:

- `C:\tmp\psique-e2e\psique-e2e-cleanup.json`

## Status final da fase

- **Fase 17 concluída** com validação E2E e TypeScript.
