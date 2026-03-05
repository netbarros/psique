# LAYOUT_PATTERNS (S01-S28)

## Política de fidelidade
1. Mobile (`390x844`) = canônico.
2. Tablet (`768x1024`) = reflow sem quebrar hierarquia.
3. Desktop (`1440x900`) = expansão sistemática.

## Containers e espaçamento
1. Mobile: `px-4` a `px-6`.
2. Tablet: `px-6` a `px-8`.
3. Desktop: container máximo + grids explícitos.

## Anti-overflow
1. Nenhuma rota deve gerar scroll horizontal global.
2. Listas/tabelas devem truncar ou quebrar linha com contexto.
3. Componentes dinâmicos precisam fallback de largura.

## Regras por domínio
1. Dashboard: cards + grid KPI com ritmo vertical alto.
2. Portal paciente: blocos amplos e leitura confortável.
3. Público: hero + prova social + CTA + seções de valor.
4. Sistema: centro visual claro e mensagem inequívoca.
