# PSIQUE — Lean Enterprise Mode (Fase 1: Validação de Mercado)

## Estado Atual

PSIQUE está operando em modo Lean Enterprise.

Objetivo:
Validar mercado, capturar primeiros terapeutas pagantes e otimizar conversão,
sem destruir a arquitetura enterprise já construída.

## Princípio

Arquitetura enterprise permanece intacta.
Governança pesada fica temporariamente dormente.
Produto e venda tornam-se prioridade absoluta.

## Camadas

### Camada 1 — Produto Comercial (ativa)
Foco total em:
- Landing
- Cadastro terapeuta
- Dashboard simples
- Agenda
- Pacientes
- Sessão online
- IA básica (resumo e insight simples)
- Booking público
- Portal paciente mínimo
- Integração Telegram (Founders)

### Camada 2 — Infra Enterprise (estável)
Manter:
- Supabase com RLS
- Proxy auth
- Stripe
- Separação portal/dashboard
- TypeScript strict
- Component library
- Design tokens

### Camada 3 — Governança Formal (temporariamente não bloqueadora)
Suspender como gate obrigatório:
- Visual regression
- Drift docs ↔ mirror
- Manifest enforcement rígido
- Surface backend audit pesado
- verify:ci full

Manter apenas:
- lint
- typecheck
- build
- test:api

## Critério de Reativação Enterprise Completo

Reativar governança pesada quando:
- 50 terapeutas pagantes ativos
ou
- R$ 10.000 MRR

Até lá, foco total em conversão e iteração rápida.