# HANDOFF — FASES 2 & 3: Supabase Schema + Auth

**Data:** 2026-03-03  
**Status:** ✅ Fases concluídas e validadas (TSC_PASSED — 0 erros TypeScript)

---

## O que foi entregue

### FASE 2 — Supabase Schema

#### Migration SQL

- `supabase/migrations/20240301000001_initial.sql` — schema completo
- `supabase/migrations/20240301000001_rollback.sql` — rollback completo

#### Tabelas criadas (11)

| Tabela                | Descrição                                                              |
| --------------------- | ---------------------------------------------------------------------- |
| `therapists`          | Perfil completo do terapeuta (CRP, IA, Telegram, Stripe, slug público) |
| `availability`        | Disponibilidade semanal (dia da semana + horário)                      |
| `availability_blocks` | Bloqueios específicos de datas                                         |
| `patients`            | Paciente com LGPD (GDPR consent, CPF, endereço, telegram_chat_id)      |
| `appointments`        | Agendamento com ciclo completo de status                               |
| `sessions`            | Sessão pós-consulta com dados de IA e NPS                              |
| `medical_records`     | Prontuário eletrônico com 6 tipos                                      |
| `payments`            | Registro de pagamentos (Stripe, PIX, manual)                           |
| `telegram_updates`    | Idempotência de updates do bot                                         |
| `telegram_configs`    | Configurações de automação por terapeuta                               |
| `audit_logs`          | Log de acesso a prontuários (LGPD)                                     |

#### Segurança implementada

- RLS habilitado em todas as 11 tabelas
- **13 políticas RLS** criadas (therapist_own, therapist_patients, therapist_appointments, therapist_sessions, therapist_records, therapist_payments, therapist_telegram_configs, therapist_audit_logs, patient_own_appointments, patient_own_sessions)
- Extensões: `uuid-ossp`, `pgcrypto`, `pg_trgm` (busca full-text)
- Índices: 9 índices criados incluindo `gin_trgm_ops` para busca por nome de paciente
- Triggers `update_updated_at()` em 5 tabelas

#### Libs Supabase (3 clientes)

| Arquivo                  | Uso                                         |
| ------------------------ | ------------------------------------------- |
| `lib/supabase/client.ts` | Client Components (browser)                 |
| `lib/supabase/server.ts` | Server Components e API Routes (akon key)   |
| `lib/supabase/admin.ts`  | Webhooks e Cron (service role, bypassa RLS) |

#### Types

- `types/database.ts` — `Database = any` (padrão até `supabase gen types` ser executado contra projeto real) + tipos manuais de todas as linhas
- `types/domain.ts` — tipos de domínio: `TherapistProfile`, `PatientSummary`, `AppointmentWithRelations`, `DashboardKPIs`, `AI_MODELS`

---

### FASE 3 — Auth

#### Arquivos criados

| Arquivo                      | Descrição                                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| `app/auth/login/page.tsx`    | Login/Register unificado: email+senha, magic link, Google OAuth, CRP validation para terapeutas |
| `app/auth/callback/route.ts` | OAuth/magic link callback + auto-criação de perfil de terapeuta no primeiro login               |

#### Features de auth

- Login com email + senha
- Registro de terapeuta com validação CRP (formato `XX/XXXXX`)
- Magic Link por email
- OAuth Google (redirect para `/auth/callback`)
- "Esqueci a senha" → Resend magic link de recovery
- Auto-criação do registro em `therapists` no primeiro login OAuth
- Redirect para `/dashboard/onboarding` se terapeuta novo

---

## Variáveis de ambiente necessárias (Fases 2-3)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=seu-jwt-secret
```

---

## Como aplicar a migration

> ⚠️ Requer um projeto Supabase criado em https://supabase.com

```bash
# Opção 1: Supabase CLI
npx supabase init
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push

# Opção 2: Supabase Studio → SQL Editor
# Copiar e executar o conteúdo de:
# supabase/migrations/20240301000001_initial.sql

# Após aplicar, regenerar os types:
npx supabase gen types typescript --local > types/database.ts
```

---

## Validação realizada

```
✅ npx tsc --noEmit → TSC_PASSED (0 erros)
✅ Migration SQL com 11 tabelas + 13 políticas RLS + 9 índices
✅ Rollback SQL pronto
✅ Auth page com CRP validation (regex XX/XXXXX)
✅ Callback com auto-create therapist
```

---

## Gaps conhecidos

- `app/auth/reset-password/page.tsx` ainda não criado (formulário de nova senha após recovery)
- Registro de paciente separado ainda não implementado (integrado no fluxo do terapeuta por ora)
- `types/database.ts` é manual — regenerar com `supabase gen types` após configurar o projeto

---

## Próxima fase

**FASE 4 — Design System** (components/ui/)  
12 componentes: Button, Card, Input, Select, Modal, Toast, Avatar, Badge, Spinner, LineChart, BarChart, Counter.
