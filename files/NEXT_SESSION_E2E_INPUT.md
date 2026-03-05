# NEXT_SESSION_E2E_INPUT

## Objetivo
Servir como input formal para a próxima sessão de plano E2E microvalidado, cobrindo UX/UI/layout sem regressão.

## Matriz rota x viewport

### Viewports padrão
- Mobile: `390x844`
- Tablet: `768x1024`
- Desktop: `1440x900`

### Rotas prioritárias
1. `/auth/login`
2. `/dashboard`
3. `/dashboard/onboarding`
4. `/dashboard/agenda`
5. `/dashboard/pacientes`
6. `/dashboard/pacientes/[id]`
7. `/dashboard/consulta/[roomId]`
8. `/dashboard/ia`
9. `/dashboard/telegram`
10. `/dashboard/financeiro`
11. `/dashboard/configuracoes`
12. `/portal`
13. `/portal/apoio`
14. `/booking/[slug]`
15. `/`
16. `/pricing`
17. `/checkout/secure`

## Critérios microvalidados
1. Sem overflow/clipping horizontal e vertical crítico.
2. Hierarquia tipográfica coerente (heading/body/meta/cta).
3. Contraste funcional para leitura e estado.
4. Focus visível em todos os elementos interativos.
5. Sem `pageerror` e sem `console.error` crítico.
6. Sem resposta 5xx crítica nas rotas auditadas.

## Artefatos obrigatórios por cenário
1. `trace.zip`
2. `video.webm`
3. `screenshot` final (e opcional por etapa)
4. Relatório HTML consolidado em pasta dedicada

## Taxonomia de falhas (para relatório final)
1. `layout-overflow`
2. `layout-clipping`
3. `typography-hierarchy`
4. `contrast-issue`
5. `focus-visibility`
6. `interaction-regression`
7. `runtime-js-error`
8. `network-5xx`
9. `data-binding-mismatch`

## Formato de tabela final (obrigatório)
| route | viewport | status | failure_type | evidence_path | notes |
|---|---|---|---|---|---|

## Defaults operacionais para próxima sessão
1. `trace: on`
2. `video: on`
3. `screenshot: on`
4. Execução em sequência por domínio (auth -> dashboard -> portal -> public)

## EN (Short)
Provides E2E input matrix (route x viewport), micro-validation criteria, mandatory artifacts, and failure taxonomy for the next validation session.
