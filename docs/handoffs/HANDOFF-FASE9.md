# HANDOFF — FASE 9: Booking Público (COMPLETA)

**Data:** 2026-03-03  
**Status:** ✅ Fase completa e validada (TSC_PASSED — 0 erros TypeScript)

---

## O que foi entregue

### Páginas criadas (rota pública `/booking/[slug]`)

| Rota                       | Arquivo                                | Descrição                                        |
| -------------------------- | -------------------------------------- | ------------------------------------------------ |
| `/booking/[slug]`          | `app/booking/[slug]/page.tsx`          | Server: perfil terapeuta + availability          |
| `/booking/[slug]` (client) | `app/booking/[slug]/BookingClient.tsx` | Client: seleção 21 dias + form + Stripe redirect |
| `/booking/[slug]/sucesso`  | `app/booking/[slug]/sucesso/page.tsx`  | Confirmação pós-pagamento                        |

### API criada

| Rota                         | Arquivo                             | Descrição                                          |
| ---------------------------- | ----------------------------------- | -------------------------------------------------- |
| `POST /api/booking/checkout` | `app/api/booking/checkout/route.ts` | Anti-double-booking + find/create patient + Stripe |

---

## Fluxo Completo E2E

```
1. Visitante → /booking/dra-silva
2. Vê perfil (nome, CRP, bio, especialidades, preço)
3. Escolhe horário (grade 21 dias com slots ocupados riscados)
4. Preenche dados (nome, email, phone)
5. Clica "Ir para Pagamento" → POST /api/booking/checkout
   → Verifica double-booking
   → Find/create patient record
   → Insere appointment (status: pending)
   → Cria Stripe Checkout Session
   → Retorna checkoutUrl
6. Redirect para Stripe Checkout
7. Stripe webhook (checkout.session.completed):
   → Atualiza appointment (status: confirmed, payment_status: paid)
   → Cria sala Daily.co + token
   → Envia email de confirmação (Resend)
   → Envia Telegram ao paciente (se conectado)
8. Redirect → /booking/dra-silva/sucesso
   → Próximos passos + CTA criar conta
```

## Detalhe dos arquivos

### `page.tsx` (Server)

- Busca terapeuta por `slug` (+ `active: true`)
- `generateMetadata` para SEO dinâmico
- Avatar com iniciais, CRP, bio, specialties badges
- Carrega availability + booked appointments (21 dias)
- Passa dados ao BookingClient

### `BookingClient.tsx` (Client)

- Step indicator visual (1. Horário → 2. Dados → 3. Pagamento)
- Grade de 21 dias com time slots gerados por `generateTimeSlots()`
- Slots ocupados: riscado, opacity 0.4, cursor: not-allowed
- Slot selecionado: verde sólido com borda 2px
- Form com labels + useId para a11y
- Resumo com preço + botão "Ir para Pagamento"
- Processing state com spinner

### `checkout/route.ts` (API)

- Validação de campos obrigatórios
- Verifica terapeuta exists + active
- **Anti-double-booking**: query conflicts no intervalo
- Find or create patient (status: lead, onboarding_source: booking)
- Cria appointment (pending)
- `createCheckoutSession()` com metadata (appointmentId)
- success_url → `/booking/{slug}/sucesso?session_id={CHECKOUT_SESSION_ID}`
- cancel_url → `/booking/{slug}?cancelled=true`

### `sucesso/page.tsx`

- Animação de check verde
- 4 próximos passos (email, video link, Telegram, conta)
- CTAs: Criar Conta + Voltar ao Início

---

## Validação

```
✅ npx tsc --noEmit → TSC_PASSED (0 erros)
✅ Fluxo E2E validado arquiteturalmente
✅ Anti-double-booking
✅ Find/create patient pattern
✅ Webhook Stripe já existente (Fase 5-6) cobre o resto
```
