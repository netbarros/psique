# Backend API Surface (Canonical)

Este documento cobre a superfície backend completa de APIs não-visuais.

- Fonte canônica: `docs/stitch/NON_SCREEN_ROUTES.json`
- Total de APIs: `30`
- Versão do catálogo: `1.0.0`
- Gerado em: `2026-03-05T00:00:00-03:00`

## Regras
1. Política de mudança: additive only.
2. Divergência de `path/method` entre este documento e o catálogo canônico deve falhar em CI.
3. O documento `docs/handoffs/BACKEND-CONTRACT-FRONTEND-AGENT.md` é um subconjunto de consumo frontend.

## Superfície Completa

| Path | Methods | Auth Model | Criticality | Validation | Notes |
|---|---|---|---|---|---|
| `/api/ai/chat` | `POST` | `authenticated` | `critical` | `session_and_payload` | Chat IA terapeuta |
| `/api/ai/insights` | `POST` | `authenticated` | `critical` | `rate_limit_and_context` | Insights IA |
| `/api/ai/summarize` | `POST` | `authenticated` | `critical` | `rate_limit_and_input` | Resumo de sessão |
| `/api/ai/transcribe` | `POST` | `authenticated` | `major` | `audio_and_quota` | Transcrição de áudio |
| `/api/appointments/[id]/cancel` | `POST` | `authenticated_owner` | `critical` | `id_and_ownership` | Cancelamento de agendamento |
| `/api/appointments/[id]/reschedule` | `PUT` | `authenticated_owner` | `critical` | `id_slot_conflict` | Reagendamento |
| `/api/audit/events` | `GET` | `authenticated` | `major` | `query_limits` | Leitura de eventos de auditoria |
| `/api/auth/mfa/enroll` | `POST` | `authenticated` | `critical` | `mfa_factor_state` | Cadastro TOTP |
| `/api/auth/mfa/unenroll` | `POST` | `authenticated` | `critical` | `factor_id` | Remoção TOTP |
| `/api/auth/mfa/verify` | `POST` | `authenticated` | `critical` | `challenge_and_code` | Verificação TOTP |
| `/api/auth/patient/bootstrap` | `POST` | `authenticated` | `major` | `patient_profile_presence` | Bootstrap de perfil paciente |
| `/api/booking/checkout` | `POST` | `public_validated` | `critical` | `required_fields_and_cpf` | Checkout público |
| `/api/cron/reminders` | `GET` | `secret_header` | `critical` | `authorization_bearer_secret` | Disparo de lembretes/NPS |
| `/api/patient/appointments/checkout` | `POST` | `authenticated_patient` | `critical` | `zod_payload_and_slot_conflict` | Checkout no portal do paciente |
| `/api/patient/chat/messages` | `POST` | `authenticated_patient` | `critical` | `rate_limit_and_thread_access` | Envio de mensagens no chat paciente |
| `/api/patient/chat/threads` | `GET` | `authenticated_patient` | `major` | `query_limit` | Lista de threads do paciente |
| `/api/patient/chat/threads/[id]/messages` | `GET` | `authenticated_patient` | `major` | `thread_ownership` | Mensagens da thread do paciente |
| `/api/patient/journal` | `GET, POST` | `authenticated_patient` | `major` | `zod_entry_payload` | Diário do paciente |
| `/api/patient/mood` | `GET, POST` | `authenticated_patient` | `major` | `zod_mood_payload` | Humor do paciente |
| `/api/reports/sessions` | `GET` | `authenticated` | `major` | `query_filters` | Relatórios PDF de sessões |
| `/api/sessions/[id]/close` | `PATCH` | `authenticated_owner` | `critical` | `session_id_and_state` | Fechamento de sessão clínica |
| `/api/settings/integrations` | `PATCH` | `authenticated` | `critical` | `provider_keys_and_account_validation` | Configurações de integrações (OpenRouter, Telegram, Stripe) |
| `/api/settings/integrations/stripe/connect` | `POST` | `authenticated` | `critical` | `stripe_connect_onboarding_or_login_link` | Fluxo Stripe Connect Express |
| `/api/settings/profile` | `PATCH` | `authenticated` | `major` | `zod_profile_payload` | Configurações de perfil |
| `/api/settings/security` | `PATCH` | `authenticated` | `major` | `zod_security_payload` | Configurações de segurança |
| `/api/subscriptions` | `DELETE, POST` | `authenticated` | `critical` | `plan_and_subscription_state` | Gestão de assinatura |
| `/api/telegram/webhook` | `POST` | `secret_header` | `critical` | `telegram_secret_and_idempotency` | Webhook Telegram |
| `/api/video/room` | `POST` | `authenticated` | `critical` | `session_access` | Provisionamento de sala de vídeo |
| `/api/webhooks/stripe` | `POST` | `stripe_signature` | `critical` | `signature_and_event_type` | Webhook Stripe |
| `/api/webhooks/supabase` | `POST` | `shared_secret` | `major` | `webhook_secret_and_payload` | Webhook Supabase |
