# PSIQUE — Plataforma Clínica SaaS

Plataforma SaaS para psicanalistas brasileiros construída em Next.js + TypeScript + Supabase + Stripe, com governança visual Stitch-first e reconciliação E2E enterprise.

## Fonte Canônica e Governança
1. Fonte soberana de contrato/documentação: `docs/stitch/*`.
2. Espelho obrigatório: `files/*` (gerado automaticamente).
3. Edição manual em `files/*`: proibida.
4. Sincronização:
   - `npm run docs:sync:write` para escrever espelho.
   - `npm run docs:sync:check` para validar drift.

## Rotas Canônicas de Paciente
- `/portal`
- `/portal/agendar`
- `/portal/apoio`
- `/portal/sessoes`
- `/portal/chat`

Rotas legadas curtas (`/agendar`, `/apoio`, `/sessoes`, `/chat`) retornam `308` permanente para `/portal/*`.

## Contratos de Tela e Testes
- Manifesto canônico v4: `docs/stitch/CANONICAL_MANIFEST.json`
- Schema: `docs/stitch/schema/canonical-manifest.schema.json`
- Catálogo E2E gerado: `e2e/contracts/screen-catalog.generated.ts`
- Catálogo de rotas não-visuais: `docs/stitch/NON_SCREEN_ROUTES.json`
- Superfície backend completa: `docs/backend/BACKEND-API-SURFACE.md`

## Setup Local
```bash
npm ci
npm run dev
```

## Qualidade e Verificação
```bash
npm run lint
npm run typecheck
npm run contract:manifest:check
npm run contract:non-screen:check
npm run backend:surface:check
npm run backend:audit
npm run supabase:preflight
npm run docs:sync:check
npm run lint:colors
npm run build
npm run test:unit
npm run test:api
npm run test:e2e
npm run test:visual
```

Atalho local:
```bash
npm run verify
```

Gate backend independente (merge-blocking para trilha backend):
```bash
npm run verify:backend
```

Gate backend com runtime real (ambientes com Supabase remoto acessível):
```bash
npm run verify:backend:runtime
```

Política de gate:
1. `verify:backend` é independente do gate visual.
2. `verify:backend:runtime` inclui preflight runtime (`criticalFailed === 0`) e deve ser usado antes de handoff backend com banco real.
3. `verify` global continua obrigatório para release full-stack.
4. `lint:colors` permanece no `verify` global.
5. `supabase:preflight` roda em modo estrutural quando credenciais placeholder de CI são detectadas.

Atalho CI completo:
```bash
npm run verify:ci
```

## CI/CD Bloqueante
Workflows na pasta `.github/workflows`:
- `lint`
- `typecheck`
- `build`
- `unit`
- `api`
- `e2e`
- `visual`
- `docs-sync-check`
- `verify-backend`

Qualquer falha nesses gates deve bloquear merge.

## Handoff Fase 22
- `docs/handoffs/HANDOFF-FASE22-RECONCILIACAO-E2E.md`
