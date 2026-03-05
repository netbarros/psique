# Stitch-First Governance — PSIQUE

## Objetivo
Estabelecer uma base única de design/governança para execução multi-IA (Codex, Claude, Gemini), evitando regressão visual e inconsistências de layout/UX/UI.

## Princípios
1. Stitch é a fonte visual primária.
2. Fidelidade mobile é obrigatória.
3. Desktop é derivado de forma sistematizada (não improvisada).
4. Governança e especificação vêm antes de implementação.
5. `docs/stitch/*` é fonte canônica; `files/*` é somente espelho gerado.

## Regra de espelho (obrigatória)
1. Edição manual em `files/*` é proibida.
2. O espelho é mantido por script:
   - `npm run docs:sync:write` (sincroniza)
   - `npm run docs:sync:check` (falha em caso de drift)
3. Qualquer alteração em `docs/stitch/*` deve ser seguida de sincronização do espelho.

## Estrutura desta pasta
1. `SCREEN_REGISTRY.md`: catálogo humano das telas Stitch e rotas.
2. `CANONICAL_MANIFEST.json`: catálogo machine-readable para agentes/IDE.
3. `DESIGN_TOKENS.md`: contrato de tokens, tipografia e compatibilidade.
4. `COMPONENT_LIBRARY.md`: primitives, variantes e estados obrigatórios.
5. `LAYOUT_PATTERNS.md`: regras de breakpoint, densidade e consistência.
6. `IMPLEMENTATION_BACKLOG.md`: backlog por tela (`S01..S14`).
7. `NEXT_SESSION_E2E_INPUT.md`: insumo para plano E2E microvalidado.

## Fluxo obrigatório
1. Ler este README.
2. Ler `SCREEN_REGISTRY.md`.
3. Ler `DESIGN_TOKENS.md`.
4. Ler `COMPONENT_LIBRARY.md`.
5. Ler `IMPLEMENTATION_BACKLOG.md`.
6. Cruzar com `docs/implementation_plan.md`.

## Regras de não-regressão
1. Não usar `style={{...}}` em `app/` e `components/`.
2. Não usar tokens legados em TSX (`--ff`, `--fs`, `--ivory`, `--mint`, `--gold`, `--card`, `--bg`).
3. Não criar tela fora do Stitch quando houver referência direta.

## English Summary
This folder defines Stitch-first governance. Start with screen registry, token contract, component contract, and backlog before implementation. Mobile must be Stitch-faithful; desktop must be systematically derived.
