# HANDOFF — FASE 4: Design System (components/ui/)

**Data:** 2026-03-03  
**Status:** ✅ Fase concluída e validada (TSC_PASSED — 0 erros TypeScript)

---

## O que foi entregue

### 12 Componentes UI criados

| Componente | Arquivo         | Destaque Técnico                                                                                    |
| ---------- | --------------- | --------------------------------------------------------------------------------------------------- |
| Button     | `Button.tsx`    | 5 variantes (primary/ghost/gold/dark/danger), 4 tamanhos, loading state, magnetic animation, ARIA   |
| Card       | `Card.tsx`      | hover elevation, glow opcional, sub-components Card.Header / Card.Title                             |
| Input      | `Input.tsx`     | label, error/hint, prefix/suffix icons, ARIA completo (aria-describedby, aria-invalid), useId()     |
| Select     | `Select.tsx`    | chevron customizado, ARIA, useId(), label, error/hint                                               |
| Modal      | `Modal.tsx`     | focus trap, ESC close, body scroll lock, backdrop click, portal (createPortal), `scaleIn` animation |
| Toast      | `Toast.tsx`     | Sonner wrapper com design tokens PSIQUE — `border-mint/red/gold` nas variantes                      |
| Avatar     | `Avatar.tsx`    | 5 tamanhos (xs-xl), fallback de iniciais com gradiente, online/offline indicator                    |
| Badge      | `Badge.tsx`     | 6 variantes de cor (mint/gold/red/blue/purple/neutral), 2 tamanhos, dot indicator                   |
| Spinner    | `Spinner.tsx`   | 4 tamanhos, 3 cores, `role="status"` ARIA                                                           |
| Counter    | `Counter.tsx`   | IntersectionObserver (triggered na visibilidade), `easeOutExpo`, prefix/suffix, ARIA label          |
| LineChart  | `LineChart.tsx` | SVG puro — grid, area fill com gradiente, polyline, data points, auto-labels                        |
| BarChart   | `BarChart.tsx`  | SVG puro — gradiente por barra, Y-axis ticks automáticos, cor customizável por item                 |

---

## Como usar

```tsx
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { Toast } from "@/components/ui/Toast"; // no layout root
import { LineChart } from "@/components/ui/LineChart";

// Adicionar <Toast /> no root layout para Sonner funcionar
```

---

## Validação realizada

```
✅ npx tsc --noEmit → TSC_PASSED (0 erros)
✅ Input.tsx: Omit<InputHTMLAttributes,'prefix'> para evitar TS2430
✅ Input.tsx + Select.tsx: useId() em vez de Math.random() (React purity rule)
✅ Modal.tsx: focus trap + ESC close + body scroll lock + createPortal
✅ Counter.tsx: IntersectionObserver com easeOutExpo
✅ LineChart.tsx + BarChart.tsx: SVG puro sem dependência externa
```

---

## Gaps conhecidos

- Nenhum gap crítico. Os lints de Tailwind v4 (`text-(--ivory)` vs `text-[var(--ivory)]`) são avisos cosméticos, não erros.
- `Toast` requer `<Toast />` inserido no `app/layout.tsx` para funcionar globalmente.

---

## Próxima fase

**FASE 7 (continuação) — Páginas do Dashboard**  
Implementar: onboarding wizard (6 passos), agenda/calendário, lista de pacientes, detalhe de paciente (prontuário+IA), sessão ao vivo.
