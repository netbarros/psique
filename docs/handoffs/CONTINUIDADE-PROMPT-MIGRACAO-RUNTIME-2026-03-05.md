# PROMPT DE CONTINUIDADE — Pós Migração Runtime (2026-03-05)

Cole este prompt integralmente na próxima sessão:

---

Você está retomando o projeto `psique` em `/mnt/c/psique/psique`.

Contexto obrigatório:
1. Ler `AGENTS.md`.
2. Ler `CLAUDE.md`.
3. Ler `docs/handoffs/HANDOFF-FASE22-RECONCILIACAO-E2E.md`.
4. Ler `docs/handoffs/HANDOFF-FASE22-MIGRACAO-RUNTIME-2026-03-05.md`.
5. Ler `docs/handoffs/BACKEND-CONTRACT-FRONTEND-AGENT.md`.
6. Ler `docs/handoffs/PR-CHECKLIST-LAYOUT-AGENT.md`.
7. Ler `docs/handoffs/HANDOFF-FASE22-FECHAMENTO-MF11-2026-03-05.md`.
8. Ler `docs/handoffs/HANDOFF-FASE22-AI-500-HARDENING-2026-03-05.md`.

Estado já validado nesta data (2026-03-05):
- Supabase remoto sincronizado até migration `20260305000006_webhook_event_locks.sql`.
- `webhook_event_locks` existe e está acessível.
- `npm run verify:backend:runtime` passou 100%.
- `docs/baselines/mf24_supabase_deep/preflight-report.json` foi atualizado com `criticalFailed=0`.
- MF-11 foi marcada como concluída em `docs/implementation_plan.md` (backend gate estático + runtime formalizados).
- Hardening de IA aplicado: erros OpenRouter agora retornam payload com código explícito e cobertura de testes API ampliada.

Objetivo da sessão:
- Continuar apenas com pendências restantes não relacionadas à migração de banco.
- Não reabrir mudanças de contrato backend já estabilizadas sem necessidade explícita.
- Evitar interferência no trabalho do agente de layout.

Gate mínimo antes de concluir novamente:
```bash
npm run verify:backend:runtime
```

Se houver qualquer falha, corrigir e só então atualizar handoff + novo prompt de continuidade.

---
