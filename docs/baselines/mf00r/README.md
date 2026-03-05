# MF-00R Baseline Bundle

Recalibração do baseline após AGENTS v3.0, mantendo `mf00` intacto.

## Conteúdo
1. `route-scope-v3.json` — escopo S01-S28.
2. `SCOPE_LOCK.md` — lock de checksum/head.
3. `TRACEABILITY_MATRIX.md` — rota -> tela -> arquivo -> teste.
4. `BASELINE_VISUAL.md` — resumo de capturas 390/768/1440.
5. `BASELINE_TECHNICAL.md` — resumo de `tsc`, `build`, `playwright`.
6. `seed-state.json` — fixtures de autenticação e dados E2E.
7. `baseline-visual.json` — resultado machine-readable de captura.
8. `logs/*.log` — logs de execução.

## Regra de imutabilidade
- Não altera `docs/baselines/mf00/**`.
- Toda evolução de baseline da Fase 21 v3 fica em `mf00r/**`.
