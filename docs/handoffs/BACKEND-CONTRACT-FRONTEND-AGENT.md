# Backend Contract — Frontend/Layout Agent (CLAUDE Partner)

Data: 2026-03-05  
Owner: Backend Architecture (Codex)  
Status: Active / Enterprise Synced (master_admin aplicado no remoto)

Checklist operacional de PR: `docs/handoffs/PR-CHECKLIST-LAYOUT-AGENT.md`  
Contrato backend completo: `docs/backend/BACKEND-API-SURFACE.md`

## 0) Resumo desta atualização (o que foi feito no backend)

1. Migrações aplicadas no Supabase remoto até:
   - `20260305000007_master_admin_domain.sql`
   - `20260305000008_master_admin_backfill.sql`
2. Domínio `master_admin` está ativo com:
   - `user_roles`
   - `master_admin_profiles`
   - `plan_documents`, `plan_revisions`
   - `content_documents`, `content_revisions`
   - `platform_integrations`
   - `admin_audit_events`
3. Backfill inicial publicado:
   - Planos: `solo`, `pro` (`pt-BR`)
   - Conteúdo: `landing`, `pricing`, `checkout_secure`, `booking`, `booking_success` (section `main`, locale `pt-BR`)
4. Validação runtime completa: `supabase:preflight:runtime` 14/14 PASS.
5. Verificação backend completa: `verify:backend:runtime` PASS.

## 1) Boundary of responsibilities

1. Frontend agent pode alterar layout/UI/estados visuais sem alterar contrato HTTP.
2. Frontend agent não pode renomear path/method dos endpoints.
3. Frontend agent não pode escrever diretamente em tabelas sensíveis via client.
4. Qualquer dado novo exige evolução de contrato backend.

## 2) Regras de autenticação e roteamento (obrigatórias)

1. `proxy.ts` protege `/admin`, `/dashboard`, `/portal`.
2. `/admin/*` exige usuário autenticado + `user_roles.role = master_admin`.
3. `app/admin/layout.tsx` reforça gate:
   - sem sessão -> redirect `/auth/login?next=/admin`
   - role diferente de `master_admin` -> redirect `/dashboard?error=master_admin_required`
4. Login:
   - `master_admin` -> `/admin`
   - `therapist` -> `/dashboard`
   - `patient` -> `/portal`

## 3) Endpoints que o frontend deve consumir

### Público (somente publicado)
1. `GET /api/public/plans?locale=pt-BR`
2. `GET /api/public/content?page=<pageKey>&locale=pt-BR`

### Admin (somente master_admin)
1. `GET /api/admin/plans?status=draft|published|archived&locale=pt-BR`
2. `POST /api/admin/plans/drafts`
3. `PATCH /api/admin/plans/drafts/:draftId` (`If-Match` opcional)
4. `POST /api/admin/plans/drafts/:draftId/publish` (`If-Match` obrigatório)
5. `GET /api/admin/content?page=<pageKey>&locale=pt-BR&status=...`
6. `POST /api/admin/content/drafts`
7. `PATCH /api/admin/content/drafts/:draftId` (`If-Match` opcional)
8. `POST /api/admin/content/drafts/:draftId/publish` (`If-Match` obrigatório)
9. `GET /api/admin/integrations`
10. `PATCH /api/admin/integrations/:provider`
11. `POST /api/admin/integrations/telegram/connect`
12. `POST /api/admin/integrations/stripe/connect`
13. `POST /api/admin/integrations/asaas/connect`
14. `POST /api/admin/integrations/runtime/sync`
15. `GET /api/admin/audit/events?limit=<n>`

### Legado de escrita (não usar em telas novas)
1. `PATCH /api/settings/profile` -> `409`
2. `PATCH /api/settings/security` -> `409`
3. `PATCH /api/settings/integrations` -> `409`
4. `POST /api/settings/integrations/stripe/connect` -> `409`

## 4) Semântica de payload/response (padrão de envelope)

1. Resposta de sucesso padrão:
   - `{ success: true, data: ... }`
2. Erro padrão:
   - `{ error: string, code?: string, ... }`
3. Contratos canônicos:
   - `lib/contracts/admin/plans.ts`
   - `lib/contracts/admin/content.ts`
   - `lib/contracts/public/plans.ts`
   - `lib/contracts/public/content.ts`

## 5) Concorrência otimista e publish flow

1. ETag é campo de revisão (`etag`) e muda em cada update/publish.
2. `PATCH draft`:
   - aceita `If-Match` opcional
   - se enviado e divergente -> `409 ETAG_MISMATCH`
3. `POST publish`:
   - exige `If-Match` obrigatório
   - sem header -> `428 MISSING_IF_MATCH`
   - header stale -> `409 ETAG_MISMATCH`
4. Publicação faz:
   - arquiva published anterior do mesmo documento
   - publica revisão alvo
   - grava auditoria
   - revalida páginas públicas

## 6) Chaves e convenções para o frontend (não inventar nomes)

1. Plan keys atuais: `solo`, `pro`.
2. Locale padrão: `pt-BR`.
3. Page keys de conteúdo público:
   - `landing`
   - `pricing`
   - `checkout_secure`
   - `booking`
   - `booking_success`
4. Section key padrão: `main`.
5. Status de revisão:
   - `draft`
   - `published`
   - `archived`

## 7) Error semantics obrigatórias no frontend

1. `400` validação de query.
2. `401` sessão expirada/não autenticado.
3. `403` permissão insuficiente.
4. `404` recurso não encontrado.
5. `409` conflito de estado ou endpoint legado bloqueado.
6. `422` payload inválido por schema.
7. `428` ausência de `If-Match` em publish.
8. `500` fallback resiliente.

## 8) Fluxo mínimo para conectar telas admin sem regressão

1. Listar revisões (`GET`) e renderizar `etag` por item.
2. Editar draft com `PATCH` enviando `If-Match` do item aberto.
3. Publicar com `POST publish` enviando `If-Match` obrigatório.
4. Em `409/428`, mostrar conflito e forçar refresh da revisão antes de novo submit.
5. Em integrações, usar somente `/api/admin/integrations*` (nunca `/api/settings/*`).

## 9) Credenciais E2E para validação dos 3 dashboards

1. `master_admin`
   - email: `e2e.master_admin@psique.local`
   - senha: `E2E_Psique_123!`
2. `therapist`
   - email: `e2e.therapist@psique.local`
   - senha: `E2E_Psique_123!`
3. `patient`
   - email: `e2e.patient@psique.local`
   - senha: `E2E_Psique_123!`

## 10) Gates obrigatórios antes do merge frontend

1. `npm run test:api`
2. `npm run typecheck`
3. `npm run backend:audit`
4. `npm run contract:non-screen:check`
5. Se houve alteração documental: `npm run docs:sync:check`

## 11) Política de breaking change

1. Mudanças aditivas apenas.
2. Remoção/rename de endpoint ou campo só com versionamento + migração explícita.
3. Qualquer quebra no contrato bloqueia merge.

## 12) Bloco pronto para colar no agente em execução (incorporar no task/plan atual)

```md
ATUALIZAÇÃO OBRIGATÓRIA DE ESCOPO (IN-FLIGHT)

Incorpore esta frente no task/plan atual em execução (não abrir trilha paralela).

1) Atualize o plano corrente adicionando subtarefas de integração backend `master_admin`:
- consumo de `/api/public/plans` e `/api/public/content` nas telas públicas;
- consumo de `/api/admin/*` nas telas admin;
- tratamento de `If-Match` (patch/publish) com UX de conflito (`409`) e missing header (`428`);
- remoção de qualquer uso de escrita em `/api/settings/*` (agora legado 409).

2) Restrições contratuais:
- não alterar path/method dos endpoints;
- não inventar chaves fora dos contratos (`planKey`, `pageKey`, `sectionKey`, `locale`, `status`, `etag`);
- respeitar RBAC: `/admin/*` somente `master_admin`.

3) Critérios de aceite no PR atual:
- sem hardcode de catálogo público;
- estados `loading/empty/error/conflict` implementados;
- validações obrigatórias executadas: `test:api`, `typecheck`, `backend:audit`, `contract:non-screen:check`.

4) Fonte de verdade:
- `docs/handoffs/BACKEND-CONTRACT-FRONTEND-AGENT.md`
- `docs/handoffs/PR-CHECKLIST-LAYOUT-AGENT.md`
- `docs/backend/BACKEND-API-SURFACE.md`

Credenciais E2E para validar os 3 dashboards:
- master_admin: `e2e.master_admin@psique.local` / `E2E_Psique_123!`
- therapist: `e2e.therapist@psique.local` / `E2E_Psique_123!`
- patient: `e2e.patient@psique.local` / `E2E_Psique_123!`
```
