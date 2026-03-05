# PR Checklist — Layout Agent (CLAUDE) ↔ Backend (Codex)

Data: 2026-03-05
Owner: Backend Architecture (Codex)
Escopo: mudanças de layout/UI sem regressão de contrato backend

## 1) Pré-leitura obrigatória

1. `AGENTS.md`
2. `CLAUDE.md`
3. `docs/handoffs/BACKEND-CONTRACT-FRONTEND-AGENT.md`
4. `docs/handoffs/HANDOFF-FASE22-RECONCILIACAO-E2E.md`
5. `docs/handoffs/CONTINUIDADE-PROMPT.md`

## 2) Regra de ouro da parceria

1. Layout pode mudar visual/composição, sem quebrar contratos de API.
2. Nenhuma rota/método backend deve ser renomeada/removida sem aprovação do owner backend.
3. Tratar erros por semântica HTTP (401/403/409/429/500) com UX específica.

## 3) Matriz de contrato endpoint por endpoint

| Superfície | Endpoint | Método | Critério de aceite UI |
|---|---|---|---|
| Booking público | `/api/booking/checkout` | `POST` | Lida com `409` (horário indisponível) e não assume sucesso 200-only |
| Portal paciente | `/api/patient/appointments/checkout` | `POST` | Em conflito `409`, oferece reescolha de horário |
| Portal paciente | `/api/patient/journal` | `GET` | Carrega estado inicial sem crash para vazio |
| Portal paciente | `/api/patient/journal` | `POST` | Após escrita, atualiza feed sem recarregar página |
| Portal paciente | `/api/patient/mood` | `GET` | Exibe histórico/estado com fallback |
| Portal paciente | `/api/patient/mood` | `POST` | Mantém consistência visual após submit |
| Portal paciente | `/api/patient/chat/threads` | `GET` | Se vazio, mostra estado “sem conversas” |
| Portal paciente | `/api/patient/chat/threads/[id]/messages` | `GET` | Não quebra quando thread é inválida/expirada |
| Portal paciente | `/api/patient/chat/messages` | `POST` | Em `429`, mostra cooldown; em `500`, fallback amigável |
| Segurança | `/api/auth/mfa/enroll` | `POST` | Fluxo de setup robusto com erro explícito |
| Segurança | `/api/auth/mfa/verify` | `POST` | Verificação com feedback claro de sucesso/falha |
| Segurança | `/api/auth/mfa/unenroll` | `POST` | Remoção sem estados inconsistentes |
| Bootstrap | `/api/auth/patient/bootstrap` | `POST` | Fluxo tolerante a reexecução |
| IA | `/api/ai/summarize` | `POST` | Em `429`, exibe limite; sem travar tela |
| IA | `/api/ai/insights` | `POST` | Em falha, mantém dashboard utilizável |
| Agenda | `/api/appointments/[id]/cancel` | `POST` | Reflete cancelamento com estado e toast |
| Agenda | `/api/appointments/[id]/reschedule` | `PUT` | Em conflito, mantém formulário com mensagem |
| Sessão | `/api/sessions/[id]/close` | `PATCH` | Encerramento idempotente com feedback |
| Config | `/api/settings/profile` | `PATCH` | Persistência sem perda de estado local |
| Config | `/api/settings/security` | `PATCH` | Persistência + atualização de UI imediata |
| Auditoria | `/api/audit/events` | `GET` | Falha não bloqueia a tela de segurança |

## 4) Semântica de erro obrigatória no frontend

1. `400` → validação de entrada (campo/toast).
2. `401` → redirecionar para login/sessão expirada.
3. `403` → permissão insuficiente (mensagem estática, sem loop).
4. `404` → recurso indisponível/não encontrado.
5. `409` → conflito de estado (ex.: slot reservado por outra sessão).
6. `429` → limite de taxa (cooldown/backoff visual).
7. `500` → fallback resiliente (sem tela quebrada).

## 5) Checklist técnico antes de abrir PR

1. Não alterou path/método de API existente.
2. Não moveu lógica de negócio sensível para client sem endpoint.
3. Cobriu fluxos de erro acima em UI.
4. Executou:
   - `npm run test:api`
   - `npm run typecheck`
   - `npm run backend:audit`
   - `npm run docs:watch:check`
   - `npm run contract:non-screen:check` (se mexer em integração de rotas)

## 6) Template de solicitação para owner backend

Quando precisar evoluir contrato, abrir pedido com:

1. Endpoint atual.
2. Campos adicionais necessários.
3. Exemplo de payload/response desejado.
4. UX fallback se o dado vier vazio.
5. Critério de aceite de teste.

## 7) Critério de merge

1. PR de layout só é elegível com checklist completo.
2. Qualquer quebra de contrato backend bloqueia merge.
3. Divergência detectada em `docs/handoffs` exige reconciliação antes do merge.
