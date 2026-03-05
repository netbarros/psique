# Runbook Backend Incidents

## Escopo
Runbook operacional para incidentes backend críticos em produção.

## 1) Retry Storm no Stripe Webhook
1. Validar volume de eventos por `event.id` no provider Stripe e comparar com `webhook_event_locks`.
2. Consultar locks em `status='processing'` por janelas longas (>10 min).
3. Verificar falhas recorrentes em logs com `route=/api/webhooks/stripe` e `eventId`.
4. Mitigação imediata:
   - Forçar transição de locks presos para `failed` com anotação de erro.
   - Reprocessar somente eventos necessários (idempotentes).
5. Critério de recuperação:
   - queda de retries duplicados;
   - `status='processed'` estável para eventos novos.

## 2) Conflitos Recorrentes de Slot
1. Inspecionar respostas `409` em `/api/appointments/[id]/reschedule` e `/api/booking/checkout`.
2. Confirmar integridade do índice `ux_appointments_therapist_scheduled_active`.
3. Verificar relógio/timezone de payloads de agendamento.
4. Mitigação imediata:
   - bloquear horários com maior colisão;
   - revalidar disponibilidade antes de inserir.
5. Critério de recuperação:
   - redução sustentada de `409` por terapeuta/faixa.

## 3) Falha de Políticas RLS
1. Executar `npm run supabase:preflight` e identificar check estrutural reprovado.
2. Validar migrações aplicadas e presença de policies esperadas por tabela.
3. Conferir logs de `401/403` anômalos em rotas autenticadas.
4. Mitigação imediata:
   - aplicar migração faltante;
   - rollback controlado de policy regressiva.
5. Critério de recuperação:
   - `criticalFailed=0` no preflight;
   - tráfego autenticado normalizado.

## 4) Preflight Crítico Falhando
1. Rodar `npm run supabase:preflight -- --json` para diagnóstico detalhado.
2. Classificar falha:
   - estrutural (RLS/policy/index),
   - dados (orfandade/estado inválido),
   - acesso (credenciais/tabela ausente).
3. Mitigação imediata:
   - estrutural: corrigir via migração;
   - dados: saneamento transacional;
   - acesso: corrigir variáveis/credenciais.
4. Critério de recuperação:
   - `summary.criticalFailed === 0`.

## 5) Comandos Rápidos
1. `npm run verify:backend`
2. `npm run backend:audit`
3. `npm run supabase:preflight -- --write-report`
4. `npm run test:api`
