# Backend API Surface (Canonical)

Este documento cobre a superfície backend completa de APIs não-visuais.

- Fonte canônica: `docs/stitch/NON_SCREEN_ROUTES.json`
- Total de APIs: `73`
- Versão do catálogo: `1.0.0`
- Gerado em: `2026-03-05T00:00:00-03:00`

## Regras
1. Política de mudança: additive only.
2. Divergência de `path/method` entre este documento e o catálogo canônico deve falhar em CI.
3. O documento `docs/handoffs/BACKEND-CONTRACT-FRONTEND-AGENT.md` é um subconjunto de consumo frontend.

## Superfície Completa

| Path | Methods | Auth Model | Criticality | Validation | Notes |
|---|---|---|---|---|---|
| `/api/admin/audit/events` | `GET` | `authenticated_master_admin` | `major` | `query_limit` | Timeline de auditoria do domínio admin |
| `/api/admin/content` | `GET` | `authenticated_master_admin` | `critical` | `query_page_locale_status` | Lista revisões de conteúdo público por página/locale |
| `/api/admin/content/drafts` | `POST` | `authenticated_master_admin` | `critical` | `zod_content_draft_payload` | Criação de draft de conteúdo público versionado |
| `/api/admin/content/drafts/[draftId]` | `PATCH` | `authenticated_master_admin` | `critical` | `zod_patch_if_match_optional` | Atualização de draft de conteúdo com ETag otimista |
| `/api/admin/content/drafts/[draftId]/publish` | `POST` | `authenticated_master_admin` | `critical` | `if_match_required_publish` | Publicação de revisão de conteúdo (draft -> published) |
| `/api/admin/growth/rules` | `GET, PATCH` | `authenticated_master_admin` | `critical` | `zod_growth_rule_patch_and_active_rule_resolution` | Leitura e atualização de regras de growth/referral |
| `/api/admin/integrations` | `GET` | `authenticated_master_admin` | `critical` | `list_integrations_without_secrets` | Leitura de integrações globais sem exposição de segredos |
| `/api/admin/integrations/[provider]` | `PATCH` | `authenticated_master_admin` | `critical` | `zod_provider_config_payload` | Atualização global de integração com trilha de auditoria |
| `/api/admin/integrations/asaas/connect` | `POST` | `authenticated_master_admin` | `critical` | `asaas_myaccount_validation_and_runtime_match` | Conexão real do provider Asaas (api key + validação /v3/myAccount) |
| `/api/admin/integrations/runtime/sync` | `POST` | `authenticated_master_admin` | `critical` | `runtime_env_discovery_and_provider_connectivity_validation` | Sincronização inteligente das integrações a partir de ENV runtime (dry-run e persistência auditável) |
| `/api/admin/integrations/stripe/connect` | `POST` | `authenticated_master_admin` | `critical` | `stripe_accounts_retrieve_validation_and_runtime_match` | Conexão real do provider Stripe (secret key + validação accounts.retrieve) |
| `/api/admin/integrations/telegram/connect` | `POST` | `authenticated_master_admin` | `critical` | `telegram_getme_token_validation_and_runtime_match` | Conexão real do provider Telegram (bot token + validação getMe) |
| `/api/admin/moderation/posts/[postId]/approve` | `POST` | `authenticated_master_admin` | `major` | `post_exists_and_moderation_transition` | Aprovação de conteúdo público terapêutico |
| `/api/admin/moderation/posts/[postId]/reject` | `POST` | `authenticated_master_admin` | `major` | `post_exists_reason_required_and_moderation_transition` | Reprovação de conteúdo público terapêutico |
| `/api/admin/plans` | `GET` | `authenticated_master_admin` | `critical` | `query_status_locale` | Lista revisões de planos no domínio master_admin |
| `/api/admin/plans/drafts` | `POST` | `authenticated_master_admin` | `critical` | `zod_plan_draft_payload` | Criação de draft de plano com versionamento |
| `/api/admin/plans/drafts/[draftId]` | `PATCH` | `authenticated_master_admin` | `critical` | `zod_patch_if_match_optional` | Atualização de draft de plano com ETag otimista |
| `/api/admin/plans/drafts/[draftId]/publish` | `POST` | `authenticated_master_admin` | `critical` | `if_match_required_publish` | Publicação de revisão de plano (draft -> published) |
| `/api/admin/wallet/credit-packages` | `GET, POST` | `authenticated_master_admin` | `critical` | `zod_credit_package_create` | Leitura e criação de pacotes de crédito |
| `/api/admin/wallet/credit-packages/[id]` | `PATCH` | `authenticated_master_admin` | `critical` | `zod_credit_package_patch` | Atualização de pacote de crédito existente |
| `/api/admin/wallet/pricebook-actions` | `GET` | `authenticated_master_admin` | `critical` | `read_only_pricebook_listing` | Catálogo de ações tarifáveis por crédito |
| `/api/admin/wallet/pricebook-actions/[actionKey]` | `PATCH` | `authenticated_master_admin` | `critical` | `zod_pricebook_patch` | Atualização de preço unitário por ação |
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
| `/api/auth/resolve-home` | `POST` | `authenticated` | `major` | `role_resolution_and_safe_next_redirect` | Resolução de home pós-login com role real e redirect seguro |
| `/api/booking/checkout` | `POST` | `public_validated` | `critical` | `required_fields_and_cpf` | Checkout público |
| `/api/cron/referrals/qualification-evaluator` | `GET` | `secret_header` | `critical` | `authorization_bearer_secret` | Job diário de qualificação de convites com janela de segurança |
| `/api/cron/reminders` | `GET` | `secret_header` | `critical` | `authorization_bearer_secret` | Disparo de lembretes/NPS |
| `/api/cron/wallet/expiration-warnings` | `GET` | `secret_header` | `major` | `authorization_bearer_secret` | Job diário de avisos D-14/D-7/D-1 para bônus |
| `/api/cron/wallet/expire-bonuses` | `GET` | `secret_header` | `critical` | `authorization_bearer_secret` | Job diário de expiração de bônus e baixa no ledger |
| `/api/patient/appointments/checkout` | `POST` | `authenticated_patient` | `critical` | `zod_payload_and_slot_conflict` | Checkout no portal do paciente |
| `/api/patient/chat/messages` | `POST` | `authenticated_patient` | `critical` | `rate_limit_and_thread_access` | Envio de mensagens no chat paciente |
| `/api/patient/chat/threads` | `GET` | `authenticated_patient` | `major` | `query_limit` | Lista de threads do paciente |
| `/api/patient/chat/threads/[id]/messages` | `GET` | `authenticated_patient` | `major` | `thread_ownership` | Mensagens da thread do paciente |
| `/api/patient/checkins/respond` | `POST` | `authenticated_patient` | `critical` | `consent_preferences_and_appointment_dedup` | Resposta de check-in longitudinal pós-sessão |
| `/api/patient/journal` | `GET, POST` | `authenticated_patient` | `major` | `zod_entry_payload` | Diário do paciente |
| `/api/patient/mood` | `GET, POST` | `authenticated_patient` | `major` | `zod_mood_payload` | Humor do paciente |
| `/api/public/community` | `GET` | `public_readonly` | `major` | `community_provider_public_config` | Superfície pública de comunidade (Telegram-first) |
| `/api/public/content` | `GET` | `public_readonly` | `critical` | `published_only_page_locale_filter` | Conteúdo público publicado por página/locale |
| `/api/public/plans` | `GET` | `public_readonly` | `critical` | `published_only_locale_filter` | Catálogo público de planos publicados |
| `/api/public/therapists` | `GET` | `public_readonly` | `critical` | `directory_filters_and_opt_in_visibility` | Diretório público de terapeutas opt-in |
| `/api/public/therapists/[slug]` | `GET` | `public_readonly` | `critical` | `slug_resolution_and_profile_visibility` | Perfil público de terapeuta por slug |
| `/api/public/therapists/[slug]/posts` | `GET` | `public_readonly` | `major` | `published_posts_only` | Listagem pública de posts publicados por terapeuta |
| `/api/public/therapists/[slug]/posts/[postSlug]` | `GET` | `public_readonly` | `major` | `published_post_by_slug` | Detalhe público de post terapêutico |
| `/api/reports/sessions` | `GET` | `authenticated` | `major` | `query_filters` | Relatórios PDF de sessões |
| `/api/sessions/[id]/close` | `PATCH` | `authenticated_owner` | `critical` | `session_id_and_state` | Fechamento de sessão clínica |
| `/api/settings/integrations` | `PATCH` | `authenticated_legacy_readonly` | `critical` | `legacy_write_conflict_409` | Legacy: escrita desabilitada, migrado para /api/admin/integrations/:provider |
| `/api/settings/integrations/stripe/connect` | `POST` | `authenticated_legacy_readonly` | `critical` | `legacy_write_conflict_409` | Legacy: escrita desabilitada, migrado para /api/admin/integrations/stripe |
| `/api/settings/profile` | `PATCH` | `authenticated_legacy_readonly` | `major` | `legacy_write_conflict_409` | Legacy: escrita desabilitada, migrado para domínio admin |
| `/api/settings/security` | `PATCH` | `authenticated_legacy_readonly` | `major` | `legacy_write_conflict_409` | Legacy: escrita desabilitada, migrado para domínio admin |
| `/api/subscriptions` | `DELETE, POST` | `authenticated` | `critical` | `plan_and_subscription_state` | Gestão de assinatura |
| `/api/telegram/webhook` | `POST` | `secret_header` | `critical` | `telegram_secret_and_idempotency` | Webhook Telegram |
| `/api/therapist/growth/rules` | `GET` | `authenticated_therapist` | `major` | `active_rules_read_only_projection` | Leitura read-only de regras ativas de growth |
| `/api/therapist/patients/[id]/timeline` | `GET` | `authenticated_therapist_owner` | `major` | `patient_ownership_and_unified_timeline` | Timeline consolidada de sessões, humor e check-ins |
| `/api/therapist/posts/[postId]/submit-review` | `POST` | `authenticated_therapist_owner` | `major` | `post_ownership_and_state_transition` | Submissão de conteúdo para moderação |
| `/api/therapist/public-profile` | `PATCH` | `authenticated_therapist` | `critical` | `zod_public_profile_payload_and_slug_rules` | Atualização de perfil público com registro de slug |
| `/api/therapist/referrals/generate-code` | `POST` | `authenticated_therapist` | `major` | `idempotent_code_generation` | Geração/recuperação de código de indicação |
| `/api/therapist/referrals/invites` | `GET` | `authenticated_therapist` | `major` | `status_filter_and_scope` | Lista de convites e estados de indicação |
| `/api/therapist/referrals/summary` | `GET` | `authenticated_therapist` | `major` | `referral_summary_projection` | Resumo operacional do programa de indicação |
| `/api/therapist/wallet` | `GET` | `authenticated_therapist` | `critical` | `wallet_autocreate_and_balance_projection` | Resumo da carteira de créditos |
| `/api/therapist/wallet/ledger` | `GET` | `authenticated_therapist` | `critical` | `query_filters_and_wallet_scope` | Extrato do ledger de créditos |
| `/api/video/room` | `POST` | `authenticated` | `critical` | `session_access` | Provisionamento de sala de vídeo |
| `/api/webhooks/stripe` | `POST` | `stripe_signature` | `critical` | `signature_and_event_type` | Webhook Stripe |
| `/api/webhooks/supabase` | `POST` | `shared_secret` | `major` | `webhook_secret_and_payload` | Webhook Supabase |
