# PR Checklist — Layout Agent (CLAUDE) ↔ Backend (Codex)

Data: 2026-03-06  
Owner: Backend Architecture (Codex)  
Escopo: mudanças de layout/UI sem regressão de contrato backend

## 1) Pré-leitura obrigatória

1. `AGENTS.md`
2. `CLAUDE.md`
3. `docs/handoffs/BACKEND-CONTRACT-FRONTEND-AGENT.md`
4. `docs/handoffs/HANDOFF-FASE22-RECONCILIACAO-E2E.md`
5. `docs/handoffs/CONTINUIDADE-PROMPT.md`
6. `docs/backend/BACKEND-API-SURFACE.md`

## 2) Regra de ouro da parceria

1. Layout muda visual/composição, não contrato backend.
2. Não renomear/remover endpoint sem aprovação do owner backend.
3. Tratar semântica HTTP por UX específica.
4. Não fazer escrita client-side direta em tabelas sensíveis.
5. Mudança visual só fecha PR com evidência de gate atualizada no handoff.

## 3) Matriz mínima de endpoint (S29-S32 + legado enterprise)

| Superfície | Endpoint | Método | Critério de aceite UI |
|---|---|---|---|
| Público | `/api/public/plans` | `GET` | Renderiza catálogo publicado sem hardcode |
| Público | `/api/public/content` | `GET` | Renderiza conteúdo por `page+locale` com fallback visual |
| Público | `/api/public/therapists` | `GET` | Diretório com filtros e estado vazio |
| Público | `/api/public/therapists/[slug]` | `GET` | Perfil público com CTA para booking |
| Público | `/api/public/therapists/[slug]/posts` | `GET` | Lista de posts publicados |
| Público | `/api/public/therapists/[slug]/posts/[postSlug]` | `GET` | Detalhe de post público |
| Público | `/api/public/community` | `GET` | Surface pública de comunidade com fallback |
| Admin | `/api/admin/plans` | `GET` | Lista revisões com filtro de status |
| Admin | `/api/admin/content` | `GET` | Lista revisões por página/seção/locale |
| Admin | `/api/admin/integrations` | `GET` | Lista integrações sem expor segredos |
| Admin | `/api/admin/audit/events` | `GET` | Exibe timeline de auditoria com paginação/limite |
| Admin | `/api/admin/growth/rules` | `GET/PATCH` | Painel de regras growth sem hardcode runtime |
| Admin | `/api/admin/wallet/pricebook-actions` | `GET` | Catálogo de ações consumíveis com custo unitário |
| Admin | `/api/admin/wallet/pricebook-actions/[actionKey]` | `PATCH` | Atualização de preço por ação com feedback de erro |
| Admin | `/api/admin/wallet/credit-packages` | `GET/POST` | Lista e criação de pacote com validação |
| Admin | `/api/admin/wallet/credit-packages/[id]` | `PATCH` | Atualização de pacote com UX resiliente |
| Admin | `/api/admin/moderation/posts/[postId]/approve` | `POST` | Aprova conteúdo sinalizado |
| Admin | `/api/admin/moderation/posts/[postId]/reject` | `POST` | Reprova conteúdo com motivo |
| Therapist | `/api/therapist/public-profile` | `PATCH` | Edição pública sem quebrar slug |
| Therapist | `/api/therapist/wallet` | `GET` | Card Total/Paid/Bonus consistente |
| Therapist | `/api/therapist/wallet/ledger` | `GET` | Extrato com filtros e paginação |
| Therapist | `/api/therapist/referrals/summary` | `GET` | Resumo operacional de referral |
| Therapist | `/api/therapist/referrals/generate-code` | `POST` | Código/link idempotente |
| Therapist | `/api/therapist/referrals/invites` | `GET` | Lista de convites e status |
| Patient | `/api/patient/checkins/respond` | `POST` | Fluxo de resposta respeitando consentimento |
| Cron | `/api/cron/wallet/expire-bonuses` | `GET` | Job de expiração sem regressão de resposta |
| Cron | `/api/cron/referrals/qualification-evaluator` | `GET` | Job de qualificação com janela de segurança |
| Legado | `/api/settings/*` writes | `PATCH/POST` | Exibe mensagem de migração (`409`) sem quebrar UI |

## 4) Semântica de erro obrigatória no frontend

1. `400` validação de query/input.
2. `401` redirecionar para login.
3. `403` permissão insuficiente.
4. `404` recurso não encontrado.
5. `409` conflito de estado/endpoint legado desativado.
6. `422` payload inválido.
7. `428` ausência de `If-Match` em publish.
8. `500` fallback resiliente.

## 5) Checklist técnico antes de abrir PR

1. Sem alteração de path/method dos contratos backend.
2. Sem hardcode novo para catálogo público e regras de reward.
3. Sem escrita direta em tabelas admin/públicas no client.
4. Fluxos `loading/empty/error/conflict` cobertos.
5. Executou e anexou evidência no handoff:
   - `npm run lint` (0 warnings/0 errors)
   - `npm run typecheck`
   - `npm run contract:manifest:check`
   - `npm run contract:non-screen:check`
   - `npm run backend:audit:write`
   - `npm run verify`
   - `npm run test:e2e` (se falhar, listar casos e impacto)
   - `npm run docs:sync:check` (se mexer em `docs/stitch/*`)

## 6) Template para pedido de evolução de contrato

1. Endpoint atual.
2. Campo(s) extra(s) e tipo.
3. Exemplo de request/response.
4. Fallback UI quando vazio.
5. Critério de aceite de teste.

## 7) Critério de merge

1. Checklist completo.
2. Sem quebra de contrato.
3. Diferença documental reconciliada em `docs/handoffs` e `docs/backend`.
