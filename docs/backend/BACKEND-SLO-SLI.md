# Backend SLO/SLI

## Escopo
Mínimos operacionais para endpoints críticos backend.

## SLI 1 — Taxa de erro por endpoint crítico
1. Definição: `% de respostas 5xx` por rota crítica.
2. SLO alvo: `<= 1%` por janela de 7 dias.
3. Alertas:
   - warning: `> 1%` por 30 min.
   - critical: `> 3%` por 10 min.

## SLI 2 — Latência p95 por endpoint crítico
1. Definição: `p95` do tempo de resposta por rota crítica.
2. SLO alvo:
   - leitura simples: `<= 500ms`;
   - mutações/webhooks: `<= 1200ms`.
3. Alertas:
   - warning: p95 acima do alvo por 30 min.
   - critical: p95 `> 2x` alvo por 10 min.

## SLI 3 — Sucesso de webhooks processados idempotentemente
1. Definição: `% de eventos Stripe com lock final em status=processed sem side effects duplicados`.
2. SLO alvo: `>= 99.9%` por 30 dias.
3. Alertas:
   - warning: `status=failed` > 0.5% em 1h.
   - critical: duplicatas efetivas detectadas em produção.

## Métricas mínimas por log/evento
1. `route`
2. `requestId` (quando disponível)
3. identificador de domínio (`userId`/`therapistId`/`patientId`/`eventId`)
4. `status` de operação (success/failure)

## Gate operacional
1. Merge backend: `npm run verify:backend` obrigatório.
2. Release full-stack: `npm run verify` + gates complementares.
