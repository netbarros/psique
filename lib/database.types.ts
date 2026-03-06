export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PatientStatus = "lead" | "new" | "active" | "inactive" | "archived";
export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";
export type AppointmentType = "online" | "presencial" | "hybrid";
export type PaymentStatus = "pending" | "paid" | "refunded" | "exempt" | "free";
export type PaymentMethod = "stripe" | "pix" | "manual" | "exempt";
export type MedicalRecordType =
  | "note"
  | "hypothesis"
  | "goal"
  | "evolution"
  | "attachment"
  | "risk_assessment";
export type UserRole = "master_admin" | "therapist" | "patient";
export type AdminRevisionStatus = "draft" | "published" | "archived";
export type MasterAdminProfileStatus = "active" | "inactive";
export type PlatformIntegrationStatus = "active" | "inactive" | "invalid" | "draft";
export type CreditWalletStatus = "active" | "blocked" | "closed";
export type CreditLedgerEntryKind = "credit" | "debit" | "expire" | "reverse" | "hold" | "release";
export type CreditLedgerBucket = "paid" | "bonus";
export type CreditLedgerStatus = "pending" | "posted" | "reversed" | "failed";
export type UsageEventStatus = "billed" | "skipped" | "reversed" | "failed";
export type PublicSlugStatus = "active" | "inactive" | "redirect" | "reserved";
export type ReferralInviteStatus =
  | "pending"
  | "qualified"
  | "rewarded"
  | "rejected"
  | "under_review"
  | "expired";
export type PublicPostStatus = "draft" | "pending_review" | "published" | "rejected" | "archived";
export type CheckinChannel = "telegram" | "email" | "whatsapp" | "none";
export type SessionCheckinMoodLabel = "good" | "neutral" | "difficult";
export type SessionCheckinStatus = "queued" | "sent" | "responded" | "skipped" | "failed";

export type TherapistRow = {
  id: string;
  user_id: string | null;
  name: string;
  crp: string;
  bio: string | null;
  photo_url: string | null;
  slug: string;
  specialties: string[];
  session_price: number;
  session_duration: number;
  timezone: string;
  ai_model: string | null;
  openrouter_key_hash: string | null;
  telegram_bot_token: string | null;
  telegram_chat_id: number | null;
  telegram_bot_username: string | null;
  stripe_account_id: string | null;
  cancellation_policy_hours: number;
  onboarding_completed: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type AvailabilityRow = {
  id: string;
  therapist_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  active: boolean;
};

export type AvailabilityBlockRow = {
  id: string;
  therapist_id: string;
  blocked_at: string;
  reason: string | null;
  created_at: string;
};

export type PatientRow = {
  id: string;
  therapist_id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  telegram_chat_id: number | null;
  telegram_username: string | null;
  birth_date: string | null;
  cpf: string | null;
  address: Json | null;
  emergency_contact: Json | null;
  private_notes: string | null;
  tags: string[];
  status: PatientStatus;
  mood_score: number | null;
  gdpr_consent: boolean;
  gdpr_consent_at: string | null;
  gdpr_consent_ip: string | null;
  onboarding_source: string | null;
  created_at: string;
  updated_at: string;
};

export type AppointmentRow = {
  id: string;
  therapist_id: string;
  patient_id: string;
  scheduled_at: string;
  duration_minutes: number;
  type: AppointmentType;
  status: AppointmentStatus;
  video_room_id: string | null;
  video_room_url: string | null;
  patient_access_token: string | null;
  payment_status: PaymentStatus;
  stripe_session_id: string | null;
  stripe_payment_id: string | null;
  price_charged: number | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  cancelled_by: "therapist" | "patient" | "system" | null;
  reminder_24h_sent: boolean;
  reminder_1h_sent: boolean;
  nps_sent: boolean;
  created_at: string;
  updated_at: string;
};

export type SessionRow = {
  id: string;
  appointment_id: string | null;
  therapist_id: string;
  patient_id: string;
  session_number: number;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  therapist_notes: string | null;
  ai_summary: string | null;
  ai_insights: string[] | null;
  ai_next_steps: string[] | null;
  ai_risk_flags: string[] | null;
  transcript: string | null;
  mood_before: number | null;
  mood_after: number | null;
  nps_score: number | null;
  is_signed: boolean;
  signed_at: string | null;
  signed_hash: string | null;
  created_at: string;
};

export type MedicalRecordRow = {
  id: string;
  patient_id: string;
  therapist_id: string;
  session_id: string | null;
  type: MedicalRecordType;
  content: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
};

export type PaymentRow = {
  id: string;
  appointment_id: string | null;
  therapist_id: string;
  patient_id: string;
  amount: number;
  currency: string;
  method: PaymentMethod | null;
  stripe_payment_id: string | null;
  pix_qrcode: string | null;
  status: "pending" | "processing" | "paid" | "failed" | "refunded" | "disputed";
  paid_at: string | null;
  refunded_at: string | null;
  refund_reason: string | null;
  created_at: string;
};

export type AuditLogRow = {
  id: string;
  therapist_id: string | null;
  user_id: string | null;
  action: "view" | "create" | "update" | "delete" | "export" | "sign";
  table_name: string;
  record_id: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Json | null;
  created_at: string;
};

export type TelegramUpdateRow = {
  update_id: number;
  processed_at: string;
};

export type WebhookEventLockRow = {
  id: string;
  provider: string;
  event_id: string;
  event_type: string;
  status: "processing" | "processed" | "failed";
  processed_at: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export type TelegramConfigRow = {
  id: string;
  therapist_id: string;
  welcome_msg: string | null;
  automations: Json;
  created_at: string;
  updated_at: string;
};

export type PatientJournalEntryRow = {
  id: string;
  patient_id: string;
  therapist_id: string;
  entry_text: string;
  mood_score: number | null;
  created_at: string;
  updated_at: string;
};

export type PatientMoodEntryRow = {
  id: string;
  patient_id: string;
  therapist_id: string;
  mood_score: number;
  note: string | null;
  source: string;
  created_at: string;
};

export type PatientChatThreadRow = {
  id: string;
  patient_id: string;
  therapist_id: string;
  title: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PatientChatMessageRow = {
  id: string;
  thread_id: string;
  patient_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

export type TherapistSettingsRow = {
  therapist_id: string;
  encrypt_records: boolean;
  require_lgpd_consent: boolean;
  blur_patient_data: boolean;
  created_at: string;
  updated_at: string;
};

export type UserRoleRow = {
  user_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type MasterAdminProfileRow = {
  user_id: string;
  display_name: string;
  status: MasterAdminProfileStatus;
  created_at: string;
  updated_at: string;
};

export type PlanDocumentRow = {
  id: string;
  plan_key: string;
  locale: string;
  created_at: string;
  updated_at: string;
};

export type PlanRevisionRow = {
  id: string;
  document_id: string;
  version: number;
  status: AdminRevisionStatus;
  payload_json: Json;
  etag: string;
  created_by: string | null;
  published_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ContentDocumentRow = {
  id: string;
  page_key: string;
  section_key: string;
  locale: string;
  created_at: string;
  updated_at: string;
};

export type ContentRevisionRow = {
  id: string;
  document_id: string;
  version: number;
  status: AdminRevisionStatus;
  payload_json: Json;
  etag: string;
  created_by: string | null;
  published_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PlatformIntegrationRow = {
  provider: string;
  status: PlatformIntegrationStatus;
  public_config_json: Json;
  secret_ref: string | null;
  last_validated_at: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminAuditEventRow = {
  id: string;
  actor_user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  diff_json: Json | null;
  created_at: string;
};

export type CreditWalletRow = {
  wallet_id: string;
  therapist_id: string;
  balance_total_credits: number;
  balance_paid_credits: number;
  balance_bonus_credits: number;
  status: CreditWalletStatus;
  created_at: string;
  updated_at: string;
};

export type CreditLedgerRow = {
  id: string;
  wallet_id: string;
  entry_kind: CreditLedgerEntryKind;
  bucket: CreditLedgerBucket;
  amount_credits: number;
  source_type: string;
  source_id: string | null;
  idempotency_key: string;
  expires_at: string | null;
  available_at: string;
  status: CreditLedgerStatus;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type CreditPackageRow = {
  id: string;
  code: string;
  name: string;
  credits_amount: number;
  price_brl_cents: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type PricebookActionRow = {
  action_key: string;
  unit_type: string;
  unit_cost_credits: number;
  active: boolean;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
};

export type UsageEventRow = {
  id: string;
  therapist_id: string;
  wallet_id: string;
  action_key: string;
  units: number;
  billed_credits: number;
  ledger_entry_id: string | null;
  correlation_id: string;
  status: UsageEventStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type GrowthProgramRuleRow = {
  id: string;
  rule_name: string;
  inviter_bonus_credits: number;
  invitee_bonus_credits: number;
  qualification_min_amount_brl: number;
  qualification_wait_days: number;
  max_rewards_per_month: number;
  max_rewards_per_therapist: number;
  bonus_expiration_days: number;
  anti_abuse_enabled: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type PublicSlugRow = {
  id: string;
  slug: string;
  target_type: string;
  target_id: string | null;
  canonical_path: string;
  status: PublicSlugStatus;
  is_reserved: boolean;
  created_at: string;
  updated_at: string;
};

export type PatientCommunicationPreferenceRow = {
  patient_id: string;
  checkin_opt_in: boolean;
  preferred_channel: CheckinChannel;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type TherapistFounderMembershipRow = {
  therapist_id: string;
  tier: string;
  benefits_json: Record<string, unknown>;
  active: boolean;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TherapistReferralCodeRow = {
  id: string;
  therapist_id: string;
  code: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type TherapistReferralInviteRow = {
  id: string;
  inviter_therapist_id: string;
  invited_therapist_id: string | null;
  referral_code: string;
  invited_email: string | null;
  invited_phone: string | null;
  invited_telegram_username: string | null;
  invited_device_fingerprint: string | null;
  status: ReferralInviteStatus;
  qualification_paid_amount_brl: number | null;
  qualification_ready_at: string | null;
  qualification_evaluated_at: string | null;
  reward_ledger_entry_inviter_id: string | null;
  reward_ledger_entry_invitee_id: string | null;
  reward_issued_at: string | null;
  rejection_reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type TherapistPublicProfileRow = {
  therapist_id: string;
  display_name: string | null;
  profile_photo_url: string | null;
  short_bio: string | null;
  long_bio: string | null;
  specialties: string[];
  therapeutic_approaches: string[];
  city: string | null;
  state: string | null;
  modality_online: boolean;
  modality_presential: boolean;
  availability_summary: string | null;
  trust_indicators: string[];
  opt_in_directory: boolean;
  checklist_completed: boolean;
  profile_published: boolean;
  created_at: string;
  updated_at: string;
};

export type TherapistPublicPostRow = {
  id: string;
  therapist_id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_markdown: string;
  content_sanitized: string;
  status: PublicPostStatus;
  moderation_flags: string[];
  moderation_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PatientSessionCheckinRow = {
  id: string;
  appointment_id: string;
  patient_id: string;
  therapist_id: string;
  mood_label: SessionCheckinMoodLabel;
  channel: "telegram" | "email" | "whatsapp" | "portal";
  response_note: string | null;
  sent_at: string | null;
  responded_at: string | null;
  status: SessionCheckinStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type TableDef<Row, Relations extends Relationship[] = []> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: Relations;
};

export type Database = {
  public: {
    Tables: {
      therapists: TableDef<TherapistRow>;
      availability: TableDef<
        AvailabilityRow,
        [
          {
            foreignKeyName: "availability_therapist_id_fkey";
            columns: ["therapist_id"];
            referencedRelation: "therapists";
            referencedColumns: ["id"];
          },
        ]
      >;
      availability_blocks: TableDef<
        AvailabilityBlockRow,
        [
          {
            foreignKeyName: "availability_blocks_therapist_id_fkey";
            columns: ["therapist_id"];
            referencedRelation: "therapists";
            referencedColumns: ["id"];
          },
        ]
      >;
      patients: TableDef<
        PatientRow,
        [
          {
            foreignKeyName: "patients_therapist_id_fkey";
            columns: ["therapist_id"];
            referencedRelation: "therapists";
            referencedColumns: ["id"];
          },
        ]
      >;
      appointments: TableDef<
        AppointmentRow,
        [
          {
            foreignKeyName: "appointments_therapist_id_fkey";
            columns: ["therapist_id"];
            referencedRelation: "therapists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_patient_id_fkey";
            columns: ["patient_id"];
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ]
      >;
      sessions: TableDef<
        SessionRow,
        [
          {
            foreignKeyName: "sessions_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: true;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sessions_therapist_id_fkey";
            columns: ["therapist_id"];
            referencedRelation: "therapists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sessions_patient_id_fkey";
            columns: ["patient_id"];
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ]
      >;
      medical_records: TableDef<
        MedicalRecordRow,
        [
          {
            foreignKeyName: "medical_records_patient_id_fkey";
            columns: ["patient_id"];
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "medical_records_therapist_id_fkey";
            columns: ["therapist_id"];
            referencedRelation: "therapists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "medical_records_session_id_fkey";
            columns: ["session_id"];
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ]
      >;
      payments: TableDef<
        PaymentRow,
        [
          {
            foreignKeyName: "payments_appointment_id_fkey";
            columns: ["appointment_id"];
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_therapist_id_fkey";
            columns: ["therapist_id"];
            referencedRelation: "therapists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_patient_id_fkey";
            columns: ["patient_id"];
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ]
      >;
      audit_logs: TableDef<
        AuditLogRow,
        [
          {
            foreignKeyName: "audit_logs_therapist_id_fkey";
            columns: ["therapist_id"];
            referencedRelation: "therapists";
            referencedColumns: ["id"];
          },
        ]
      >;
      telegram_updates: TableDef<TelegramUpdateRow>;
      webhook_event_locks: TableDef<WebhookEventLockRow>;
      telegram_configs: TableDef<
        TelegramConfigRow,
        [
          {
            foreignKeyName: "telegram_configs_therapist_id_fkey";
            columns: ["therapist_id"];
            referencedRelation: "therapists";
            referencedColumns: ["id"];
          },
        ]
      >;
      patient_journal_entries: TableDef<
        PatientJournalEntryRow,
        [
          {
            foreignKeyName: "patient_journal_entries_patient_id_fkey";
            columns: ["patient_id"];
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patient_journal_entries_therapist_id_fkey";
            columns: ["therapist_id"];
            referencedRelation: "therapists";
            referencedColumns: ["id"];
          },
        ]
      >;
      patient_mood_entries: TableDef<
        PatientMoodEntryRow,
        [
          {
            foreignKeyName: "patient_mood_entries_patient_id_fkey";
            columns: ["patient_id"];
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patient_mood_entries_therapist_id_fkey";
            columns: ["therapist_id"];
            referencedRelation: "therapists";
            referencedColumns: ["id"];
          },
        ]
      >;
      patient_chat_threads: TableDef<
        PatientChatThreadRow,
        [
          {
            foreignKeyName: "patient_chat_threads_patient_id_fkey";
            columns: ["patient_id"];
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patient_chat_threads_therapist_id_fkey";
            columns: ["therapist_id"];
            referencedRelation: "therapists";
            referencedColumns: ["id"];
          },
        ]
      >;
      patient_chat_messages: TableDef<
        PatientChatMessageRow,
        [
          {
            foreignKeyName: "patient_chat_messages_thread_id_fkey";
            columns: ["thread_id"];
            referencedRelation: "patient_chat_threads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patient_chat_messages_patient_id_fkey";
            columns: ["patient_id"];
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ]
      >;
      therapist_settings: TableDef<
        TherapistSettingsRow,
        [
          {
            foreignKeyName: "therapist_settings_therapist_id_fkey";
            columns: ["therapist_id"];
            isOneToOne: true;
            referencedRelation: "therapists";
            referencedColumns: ["id"];
          },
        ]
      >;
      user_roles: TableDef<UserRoleRow>;
      master_admin_profiles: TableDef<MasterAdminProfileRow>;
      plan_documents: TableDef<PlanDocumentRow>;
      plan_revisions: TableDef<
        PlanRevisionRow,
        [
          {
            foreignKeyName: "plan_revisions_document_id_fkey";
            columns: ["document_id"];
            referencedRelation: "plan_documents";
            referencedColumns: ["id"];
          },
        ]
      >;
      content_documents: TableDef<ContentDocumentRow>;
      content_revisions: TableDef<
        ContentRevisionRow,
        [
          {
            foreignKeyName: "content_revisions_document_id_fkey";
            columns: ["document_id"];
            referencedRelation: "content_documents";
            referencedColumns: ["id"];
          },
        ]
      >;
      platform_integrations: TableDef<PlatformIntegrationRow>;
      admin_audit_events: TableDef<AdminAuditEventRow>;
      credit_wallets: TableDef<
        CreditWalletRow,
        [
          {
            foreignKeyName: "credit_wallets_therapist_id_fkey";
            columns: ["therapist_id"];
            referencedRelation: "therapists";
            referencedColumns: ["id"];
          },
        ]
      >;
      credit_ledger: TableDef<
        CreditLedgerRow,
        [
          {
            foreignKeyName: "credit_ledger_wallet_id_fkey";
            columns: ["wallet_id"];
            referencedRelation: "credit_wallets";
            referencedColumns: ["wallet_id"];
          },
        ]
      >;
      credit_packages: TableDef<CreditPackageRow>;
      pricebook_actions: TableDef<PricebookActionRow>;
      usage_events: TableDef<
        UsageEventRow,
        [
          {
            foreignKeyName: "usage_events_therapist_id_fkey";
            columns: ["therapist_id"];
            referencedRelation: "therapists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "usage_events_wallet_id_fkey";
            columns: ["wallet_id"];
            referencedRelation: "credit_wallets";
            referencedColumns: ["wallet_id"];
          },
          {
            foreignKeyName: "usage_events_action_key_fkey";
            columns: ["action_key"];
            referencedRelation: "pricebook_actions";
            referencedColumns: ["action_key"];
          },
          {
            foreignKeyName: "usage_events_ledger_entry_id_fkey";
            columns: ["ledger_entry_id"];
            referencedRelation: "credit_ledger";
            referencedColumns: ["id"];
          },
        ]
      >;
      growth_program_rules: TableDef<GrowthProgramRuleRow>;
      public_slugs: TableDef<PublicSlugRow>;
      patient_communication_preferences: TableDef<
        PatientCommunicationPreferenceRow,
        [
          {
            foreignKeyName: "patient_communication_preferences_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: true;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ]
      >;
      therapist_founder_memberships: TableDef<
        TherapistFounderMembershipRow,
        [
          {
            foreignKeyName: "therapist_founder_memberships_therapist_id_fkey";
            columns: ["therapist_id"];
            isOneToOne: true;
            referencedRelation: "therapists";
            referencedColumns: ["id"];
          },
        ]
      >;
      therapist_referral_codes: TableDef<
        TherapistReferralCodeRow,
        [
          {
            foreignKeyName: "therapist_referral_codes_therapist_id_fkey";
            columns: ["therapist_id"];
            referencedRelation: "therapists";
            referencedColumns: ["id"];
          },
        ]
      >;
      therapist_referral_invites: TableDef<
        TherapistReferralInviteRow,
        [
          {
            foreignKeyName: "therapist_referral_invites_inviter_therapist_id_fkey";
            columns: ["inviter_therapist_id"];
            referencedRelation: "therapists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "therapist_referral_invites_invited_therapist_id_fkey";
            columns: ["invited_therapist_id"];
            referencedRelation: "therapists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "therapist_referral_invites_referral_code_fkey";
            columns: ["referral_code"];
            referencedRelation: "therapist_referral_codes";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "therapist_referral_invites_reward_ledger_entry_inviter_id_fkey";
            columns: ["reward_ledger_entry_inviter_id"];
            referencedRelation: "credit_ledger";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "therapist_referral_invites_reward_ledger_entry_invitee_id_fkey";
            columns: ["reward_ledger_entry_invitee_id"];
            referencedRelation: "credit_ledger";
            referencedColumns: ["id"];
          },
        ]
      >;
      therapist_public_profiles: TableDef<
        TherapistPublicProfileRow,
        [
          {
            foreignKeyName: "therapist_public_profiles_therapist_id_fkey";
            columns: ["therapist_id"];
            isOneToOne: true;
            referencedRelation: "therapists";
            referencedColumns: ["id"];
          },
        ]
      >;
      therapist_public_posts: TableDef<
        TherapistPublicPostRow,
        [
          {
            foreignKeyName: "therapist_public_posts_therapist_id_fkey";
            columns: ["therapist_id"];
            referencedRelation: "therapists";
            referencedColumns: ["id"];
          },
        ]
      >;
      patient_session_checkins: TableDef<
        PatientSessionCheckinRow,
        [
          {
            foreignKeyName: "patient_session_checkins_appointment_id_fkey";
            columns: ["appointment_id"];
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patient_session_checkins_patient_id_fkey";
            columns: ["patient_id"];
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patient_session_checkins_therapist_id_fkey";
            columns: ["therapist_id"];
            referencedRelation: "therapists";
            referencedColumns: ["id"];
          },
        ]
      >;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_master_admin: {
        Args: {
          uid: string;
        };
        Returns: boolean;
      };
      get_public_plans: {
        Args: {
          p_locale: string;
        };
        Returns: Json;
      };
      get_public_content: {
        Args: {
          p_page_key: string;
          p_locale: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
