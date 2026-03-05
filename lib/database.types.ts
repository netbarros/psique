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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
