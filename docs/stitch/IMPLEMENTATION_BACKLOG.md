# IMPLEMENTATION_BACKLOG (Fase 21 v3.0)

## Bloco A — Fundação e governança
1. Normalizar docs Stitch para S01-S28.
2. Criar contrato tipado E2E (`e2e/contracts/screen-contract.ts`).
3. Criar baseline `mf00r` sem alterar `mf00`.

## Bloco B — Rotas faltantes obrigatórias
1. S16: `/auth/register`
2. S17: `/auth/register/patient`
3. S18: `/auth/forgot-password`
4. S21: `/dashboard/configuracoes/perfil`
5. S22: `/dashboard/configuracoes/integracoes`

## Bloco C — APIs faltantes obrigatórias
1. `/api/ai/transcribe`
2. `/api/webhooks/supabase`
3. `auth/reset-password` page (recovery flow)

## Bloco D — E2E e evidência
1. Contrato de rotas S01-S28.
2. Auth matrix (público/terapeuta/paciente).
3. Capturas 390/768/1440 por rota capturável.
4. G1..G7 com logs/artefatos.

## Definição de pronto
1. 28 telas mapeadas e testáveis.
2. 0 inline styles em `app/` + `components/`.
3. 0 tokens legados em TSX.
4. `tsc`, `build`, `playwright` verdes.
