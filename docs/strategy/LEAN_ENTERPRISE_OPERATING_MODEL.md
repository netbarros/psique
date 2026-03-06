# PSIQUE — Lean Enterprise Operating Model

## Objetivo

Operar o PSIQUE em modo Lean Enterprise durante a Fase 1 de validação de mercado, preservando a base enterprise já construída, mas reduzindo fricção operacional para acelerar iteração e venda.

## Princípio

Arquitetura enterprise continua.
Governança pesada fica parcialmente dormente.
Produto e venda tornam-se prioridade.
Nenhum agente pode extrapolar sua área de responsabilidade.

---

## Papéis dos agentes

### Codex (VS Code)

Responsável exclusivamente por:

- backend
- APIs
- Supabase
- RLS
- auth/proxy
- Stripe
- billing
- contracts
- scripts backend
- gates backend
- docs técnicas de backend

### Claude / Google (Antigravity)

Responsáveis exclusivamente por:

- frontend
- layout
- UI/UX
- composição visual
- landing
- dashboard visual
- onboarding visual
- aderência ao Stitch / design system
- ajustes visuais de produto

---

## Regras de fronteira

### Codex NÃO pode:

- refatorar layout
- alterar composição visual
- mudar hierarquia de telas
- mexer em design tokens sem necessidade técnica
- alterar jornada visual sem contrato explícito

### Claude / Google NÃO podem:

- alterar auth/proxy
- mexer em RLS
- alterar Stripe/backend
- mudar contratos de API sem documento de handshake
- criar suposições de backend inexistentes

---

## Comunicação entre agentes

Toda mudança entre frontend e backend deve passar por:

1. documento Markdown de contrato C:\psique\psique\docs\handoffs\BACKEND-CONTRACT-FRONTEND-AGENT.md
2. PR ou handoff com escopo explícito docs\handoffs\PR-CHECKLIST-LAYOUT-AGENT.md
3. diffs limitados à responsabilidade do agente

---

## Lean Enterprise Mode ativo

### Prioridade máxima de produto

- Landing
- Onboarding
- Dashboard simples
- Agenda
- Pacientes
- Sessão
- IA básica
- Booking público
- Portal paciente mínimo
- Telegram founders

### Secundário

- hardening visual completo
- visual regression rígida
- manifesto ultra detalhado em toda iteração
- expansões não comerciais

---

## Gates

### Backend blocking

- lint
- typecheck
- build
- test:api

### Full / opcional nesta fase

- test:visual
- docs drift
- manifest enforcement total
- full e2e
- backend surface audit pesado

---

## Critério para sair do Lean Mode

- 50 terapeutas pagantes ativos
  ou
- R$ 10.000 MRR

A partir daí, reativar governança enterprise total.
