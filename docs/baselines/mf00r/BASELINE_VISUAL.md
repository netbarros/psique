# MF-00R Baseline Visual

- Escopo: S01-S28 (rotas capturáveis + componente sistêmico S27)
- Viewports: 390/768/1440
- Arquivo de saída machine-readable: `docs/baselines/mf00r/baseline-visual.json`
- Capturas: `docs/baselines/mf00r/screenshots/**`

## Status
- Executado em: 2026-03-04
- Comando: `npx node scripts/mf00-baseline-capture.mjs`
- Resultado: `81` capturas (`27` rotas capturáveis x `3` viewports)
- Overflow horizontal: `0`
- Erros coletados: `6`

## Observações de erro (esperadas/aceitas no baseline)
- `S28` (`/_mf00r_not_found_probe`) retorna `404` por definição do probe e registra erro de recurso 404 no console.
- `S03` (`/dashboard/consulta/room-stitch-check`) registra erro de CSP para frame `https://example.com` de placeholder de sala.
