# HANDOFF — FASE 7: Dashboard Terapeuta (parcial)

**Data:** 2026-03-03  
**Status:** ✅ Itens implementados validados (TSC_PASSED — 0 erros TypeScript)

---

## O que foi entregue

### Páginas criadas

| Rota                    | Arquivo                             | Descrição                                                |
| ----------------------- | ----------------------------------- | -------------------------------------------------------- |
| `/dashboard`            | `app/dashboard/page.tsx`            | KPIs reais (MRR, Sessões, NPS, Pacientes), agenda do dia |
| `/dashboard/layout`     | `app/dashboard/layout.tsx`          | Auth guard server-side + DashboardShell                  |
| `/dashboard/onboarding` | `app/dashboard/onboarding/page.tsx` | Wizard 6 passos completo                                 |
| `/dashboard/agenda`     | `app/dashboard/agenda/page.tsx`     | Calendário semanal (Seg-Dom)                             |
| `/dashboard/pacientes`  | `app/dashboard/pacientes/page.tsx`  | Lista com status, sessões, humor                         |

### Componentes criados

| Arquivo                                   | Descrição                                                             |
| ----------------------------------------- | --------------------------------------------------------------------- |
| `components/dashboard/DashboardShell.tsx` | Sidebar: nav ativa, sign out, AI/Telegram badges, onboarding redirect |

### Root Layout

- `app/layout.tsx` atualizado com `<Toast />` (Sonner global)
- `app/page.tsx` redireciona para `/auth/login` (middleware cuida do resto)

---

## Detalhe de cada página

### `/dashboard/onboarding` — Wizard 6 passos

1. **Boas-vindas** — apresentação das funcionalidades
2. **Dados profissionais** — nome, CRP (validação), bio, especialidades (multi-seleção)
3. **Configurar agenda** — preço da sessão, duração, modalidade (online/presencial/híbrido)
4. **IA Clínica** — escolha do modelo (Claude Opus, Sonnet, Haiku, GPT-4o, Gemini)
5. **Telegram Bot** — instruções do @BotFather (configuração posterior)
6. **Revisão final** — sumário de todos os dados + salvar no Supabase

- **Barra de progresso** animada com `var(--ease-out)`
- Salva na tabela `therapists` via Supabase client + `onboarding_completed: true`

### `/dashboard/agenda` — Calendário Semanal

- Grid de 7 colunas (Seg → Dom)
- Appointments agrupados por `day_of_week`
- Color-coded por status: mint=confirmado, gold=pendente, blue=em andamento
- Stats row: total, confirmadas, pendentes, concluídas

### `/dashboard/pacientes` — Lista de Pacientes

- Summary cards: total, ativos, novos, leads
- Tabela: avatar iniciais + nome + email + Telegram username
- Status badge com dot indicator (5 cores)
- Contador de sessões por paciente
- Mood score (5 dots, mint=preenchido)
- Links para `/dashboard/pacientes/[id]` (detalhe — pendente)

---

## Validação realizada

```
✅ npx tsc --noEmit → TSC_PASSED (0 erros)
✅ Onboarding: validateCRP + Supabase update + router.push
✅ Agenda: query com join patient, agrupamento por day-of-week
✅ Pacientes: join sessions count, type-safe com as unknown as
✅ layout.tsx: <Toast /> global para notificações
```

---

## Itens pendentes da Fase 7

- [ ] `app/dashboard/pacientes/[id]/page.tsx` — detalhe do paciente (prontuário, sessões, IA, financeiro)
- [ ] `app/dashboard/consulta/[roomId]/page.tsx` — videochamada + notas + timer + IA
- [ ] `app/dashboard/ia/page.tsx` — análise de carteira IA
- [ ] `app/dashboard/telegram/page.tsx` — painel do bot
- [ ] `app/dashboard/financeiro/page.tsx` — receitas, MRR, pagamentos
- [ ] `app/dashboard/configuracoes/page.tsx` — perfil, APIs, segurança

---

## Próxima fase

**FASE 8-9 — Portal do Paciente + Booking Público**  
Patient portal (agendar, sessões, chat IA) + booking slug público com checkout Stripe.
