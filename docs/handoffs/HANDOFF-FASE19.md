# HANDOFF — FASE 19 (Stitch-First Rollout + E2E Multi-Viewport)

## Data
- 2026-03-04

## Objetivo da fase
Executar a aplicação prática do baseline `stitch/` no app (rotas públicas faltantes + contrato de fonte/typography) e validar com E2E em três dimensões.

## Entregas realizadas

### 1) Rotas Stitch públicas implementadas
- `/` (S11 + S12)
  - Hero público + proposta de valor + cards de funcionalidades + bloco comparativo + CTA.
- `/pricing` (S13)
  - Planos `Analista Solo` e `Clínica Pro`, bloco de confiança e FAQ.
- `/checkout/secure` (S14)
  - Resumo de assinatura, opções de pagamento (cartão/PIX), trust signals e CTA fixo.

### 2) Tipografia canônica aplicada no layout raiz
- `app/layout.tsx`
  - Removido uso legado de fontes `--ff`/`--fs` em TSX.
  - Aplicado `Cormorant Garamond` (`--font-heading`) + `Instrument Sans` (`--font-body`).
- `app/globals.css`
  - `--font-sans` e `--font-display` mapeados para as novas variáveis canônicas.
  - Aliases legados mantidos apenas em CSS de compatibilidade transitória.

### 3) E2E multi-viewport (390/768/1440) fechado
- `playwright.config.ts`
  - Projetos:
    - `mobile-390x844`
    - `tablet-768x1024`
    - `desktop-1440x900`
  - Artefatos sempre gerados por cenário:
    - `trace: on`
    - `video: on`
    - `screenshot: on`
  - `webServer` estabilizado com `npm run start -- -p 3000`.
  - `workers` não-CI ajustado para `3` (estabilidade).

- Novo spec:
  - `e2e/stitch.coverage.spec.ts`
  - Cobertura:
    - rotas públicas Stitch (`/`, `/pricing`, `/checkout/secure`, `/booking/test-terapeuta`)
    - rotas protegidas Stitch (dashboard/portal) com redirect para login
    - micro-gates por cenário:
      - sem 5xx
      - sem overflow horizontal
      - sem `console.error` crítico e `pageerror`

- Specs ajustados:
  - `e2e/navigation.spec.ts`
    - raiz agora pública (não mais redirect para login)
    - inclusão de checks para `/pricing` e `/checkout/secure`
  - `e2e/layout.enterprise.spec.ts`
    - expectativa de shell pública atualizada para `/`

## Arquivos alterados na fase
- `app/page.tsx`
- `app/pricing/page.tsx` (novo)
- `app/checkout/secure/page.tsx` (novo)
- `app/layout.tsx`
- `app/globals.css`
- `playwright.config.ts`
- `e2e/navigation.spec.ts`
- `e2e/layout.enterprise.spec.ts`
- `e2e/stitch.coverage.spec.ts` (novo)

## Validação executada

### TypeScript
- `npx tsc --noEmit` ✅

### Build
- `npm run build` ✅

### E2E (3 viewports)
- `cmd.exe /c "cd /d C:\psique\psique && npx playwright test e2e/auth.spec.ts e2e/navigation.spec.ts e2e/booking.spec.ts e2e/layout.enterprise.spec.ts e2e/stitch.coverage.spec.ts"` ✅
- Resultado final:
  - `81 passed`
  - `9 skipped` (dependem de seed/credencial opcional já prevista nos próprios testes)
  - `0 failed`

## Observações importantes
1. O lint global do repo continua ruidoso por conta de arquivos externos em `.codex/**` (fora do escopo desta fase).
2. O gate desta fase foi fechado com `tsc + build + playwright`.

## Estado para próxima sessão
- Stitch público base já no ar em localhost (`/`, `/pricing`, `/checkout/secure`).
- Matriz de viewport e artefatos E2E já operacional.
- Próximo foco natural: reduzir `skips` de booking autenticado/seed com dados de teste estáveis.
