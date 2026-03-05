# COMPONENT_LIBRARY (S01-S28)

## Primitivos base
1. `Shell`
2. `Header`
3. `Sidebar`
4. `Card` (solid/glass)
5. `KPI Card`
6. `Form Field`
7. `Chips`
8. `Badge`
9. `Timeline Row`
10. `Bottom Nav`
11. `Primary CTA`

## Estados obrigatórios
1. `default`
2. `hover`
3. `focus-visible`
4. `active`
5. `disabled`
6. `loading`
7. `error`
8. `empty`

## Domínios

### Dashboard terapeuta (`dark_core`)
- S01, S03-S07, S09, S19-S22
- foco em densidade informacional, KPI e timeline.

### Onboarding/Auth (`dark_core`, `light_onboard`, `light_patient`)
- S08, S15-S18
- fluxo de entrada com alto contraste e validações claras.

### Portal paciente (`light_patient`)
- S10, S23-S25
- cards claros, menor densidade, apoio/reflexão.

### Público (`dark_core`)
- S02, S11-S14, S26
- narrativa e conversão, CTA dominante.

### Sistema (`dark_core`)
- S27, S28
- estados globais de carregamento/erro.

## Acessibilidade mínima
1. Focus ring sempre visível.
2. Labels explícitas em inputs.
3. Nunca depender apenas de cor para estado.
4. Alvos móveis >= 40px.
