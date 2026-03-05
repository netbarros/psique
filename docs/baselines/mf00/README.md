# MF-00 Baseline Bundle

This folder contains the full baseline package for microphase `MF-00`:

1. Scope freeze (`SCOPE_LOCK.md`)
2. Route-to-code/test traceability (`TRACEABILITY_MATRIX.md`)
3. Visual baseline by viewport (`BASELINE_VISUAL.md` + screenshots + JSON)
4. Technical baseline (`BASELINE_TECHNICAL.md` + logs)
5. Seed state used for authenticated captures (`seed-state.json`)

## Files

- `route-scope.json`: locked route inventory (A/B/C scope)
- `SCOPE_LOCK.md`: lock metadata and checksums
- `TRACEABILITY_MATRIX.md`: mapping of entries to source and tests
- `BASELINE_VISUAL.md`: visual capture summary and known expected errors
- `BASELINE_TECHNICAL.md`: tsc/build/playwright baseline summary
- `baseline-visual.json`: machine-readable route capture output
- `screenshots/`: PNG captures by viewport and actor
- `logs/`: command logs (`tsc.log`, `build.log`, `playwright.log`)
- `playwright-report-baseline/`: HTML report snapshot

## Repro scripts

- `scripts/mf00-seed-auth.mjs`
- `scripts/mf00-baseline-capture.mjs`
