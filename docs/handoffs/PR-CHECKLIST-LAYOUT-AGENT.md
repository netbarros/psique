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

1. Layout muda visual/composição, não contrato backend.
2. Não renomear/remover endpoint sem aprovação do owner backend.
3. Tratar semântica HTTP por UX específica.
4. Não fazer escrita client-side direta em tabelas sensíveis.

## 3) Matriz de endpoint para a nova migração

| Superfície | Endpoint | Método | Critério de aceite UI |
|---|---|---|---|
| Público | `/api/public/plans` | `GET` | Renderiza catálogo publicado sem hardcode |
| Público | `/api/public/content` | `GET` | Renderiza conteúdo por `page+locale` com fallback visual |
| Admin | `/api/admin/plans` | `GET` | Lista revisões com filtro de status |
| Admin | `/api/admin/plans/drafts` | `POST` | Cria draft e atualiza lista sem reload |
| Admin | `/api/admin/plans/drafts/[draftId]` | `PATCH` | Atualiza draft com controle de conflito por ETag |
| Admin | `/api/admin/plans/drafts/[draftId]/publish` | `POST` | Publica e reflete no público após revalidação |
| Admin | `/api/admin/content` | `GET` | Lista revisões por página/seção/locale |
| Admin | `/api/admin/content/drafts` | `POST` | Cria draft de conteúdo |
| Admin | `/api/admin/content/drafts/[draftId]` | `PATCH` | Atualiza draft de conteúdo com ETag |
| Admin | `/api/admin/content/drafts/[draftId]/publish` | `POST` | Publica conteúdo e valida reflexo nas páginas públicas |
| Admin | `/api/admin/integrations` | `GET` | Lista integrações sem expor segredos |
| Admin | `/api/admin/integrations/[provider]` | `PATCH` | Atualiza config global com UX resiliente |
| Admin | `/api/admin/audit/events` | `GET` | Exibe timeline de auditoria com paginação/limite |
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
2. Sem hardcode novo para catálogo público.
3. Sem escrita direta em tabelas admin/públicas no client.
4. Fluxos `loading/empty/error/conflict` cobertos.
5. Executou:
   - `npm run test:api`
   - `npm run typecheck`
   - `npm run backend:audit`
   - `npm run contract:non-screen:check`
   - `npm run docs:sync:check` (se mexer em docs espelho)

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
