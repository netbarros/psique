# HANDOFF Fase 22 — Hardening de Erros 500 em IA (Chat/Insights/Summary)

- Data: 2026-03-05
- Owner: Codex (Backend)
- Status: ✅ Concluída

## Contexto
Relato de falhas recorrentes `500` nas funcionalidades de IA (chat e correlatos), com baixa clareza do erro para diagnóstico em runtime.

## Causa raiz (identificada)
1. Falhas do provedor OpenRouter eram retornadas como `500` genérico, sem classificação semântica no payload.
2. Em `POST /api/ai/insights`, o campo `openrouter_key_hash` era repassado direto como `apiKey` (podia ser hash/máscara inválida).
3. `POST /api/patient/chat/messages` não encapsulava a chamada de IA em `try/catch` com resposta controlada.
4. Cobertura E2E atual é majoritariamente de contrato de rota/render/redirect (sem fluxo autenticado de IA), então o gap aparecia mais em produção do que em E2E.

## Correções aplicadas
1. Novo saneamento de chave OpenRouter:
   - `lib/api/openrouter-key.ts`
   - elimina candidatos inválidos (hash/máscara) antes de uso.
2. Novo classificador de erro de IA:
   - `lib/api/ai-error.ts`
   - mapeia para códigos de erro explícitos no payload (`AI_NOT_CONFIGURED`, `AI_PROVIDER_AUTH`, `AI_PROVIDER_RATE_LIMIT`, etc.).
3. Hardening de cliente OpenRouter:
   - `lib/openrouter.ts`
   - exige chave **utilizável** (`Missing usable OPENROUTER_API_KEY`).
4. Rotas corrigidas:
   - `app/api/ai/chat/route.ts`
   - `app/api/ai/insights/route.ts`
   - `app/api/ai/summarize/route.ts`
   - `app/api/patient/chat/messages/route.ts`
   - agora retornam erro classificado e não `500` opaco.
5. Ampliação de cobertura de testes API:
   - `test/api/ai-routes.behavior.test.ts`
   - `test/api/chat-session-video.behavior.test.ts`
   - novos cenários para falha de configuração e autenticação do provedor.

## Evidências (execução nesta sessão)
1. API tests:
   - `npm run test:api` ✅
   - `19 files`, `167 tests`, tudo PASS.
2. E2E:
   - `npm run test:e2e` ✅
   - `204 passed`.
3. Gate mínimo backend runtime:
   - `npm run verify:backend:runtime` ✅
   - `backend:audit` `120/120`, `criticalFailed=0`
   - `supabase:preflight:runtime` `14/14`, `criticalFailed=0`

## Observações
1. Nenhuma mudança de contrato HTTP breaking (paths/methods preservados).
2. Nenhuma alteração de migração de banco.
3. Nenhuma intervenção em layout visual do parceiro de frontend.
