-- ═══════════════════════════════════════════════════════════
-- PSIQUE — Migration 001: Initial Schema
-- ═══════════════════════════════════════════════════════════

-- ── EXTENSÕES ─────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ── TERAPEUTA ─────────────────────────────────────────────────
CREATE TABLE therapists (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  crp                   TEXT UNIQUE NOT NULL,
  bio                   TEXT,
  photo_url             TEXT,
  slug                  TEXT UNIQUE NOT NULL,
  specialties           TEXT[] DEFAULT '{}',
  session_price         NUMERIC(10,2) NOT NULL DEFAULT 200.00,
  session_duration      INT NOT NULL DEFAULT 50,
  timezone              TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  ai_model              TEXT DEFAULT 'anthropic/claude-3.5-sonnet',
  openrouter_key_hash   TEXT,
  telegram_bot_token    TEXT,
  telegram_chat_id      BIGINT,
  telegram_bot_username TEXT,
  stripe_account_id     TEXT,
  onboarding_completed  BOOLEAN DEFAULT FALSE,
  active                BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── DISPONIBILIDADE ───────────────────────────────────────────
CREATE TABLE availability (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE,
  day_of_week  INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE availability_blocks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE,
  blocked_at   TIMESTAMPTZ NOT NULL,
  reason       TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── PACIENTES ─────────────────────────────────────────────────
CREATE TABLE patients (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id         UUID REFERENCES therapists(id) ON DELETE CASCADE,
  user_id              UUID REFERENCES auth.users(id),
  name                 TEXT NOT NULL,
  email                TEXT NOT NULL,
  phone                TEXT,
  telegram_chat_id     BIGINT,
  telegram_username    TEXT,
  birth_date           DATE,
  cpf                  TEXT,
  address              JSONB,
  emergency_contact    JSONB,
  private_notes        TEXT,
  tags                 TEXT[] DEFAULT '{}',
  status               TEXT NOT NULL DEFAULT 'lead'
                       CHECK (status IN ('lead','new','active','inactive','archived')),
  mood_score           INT CHECK (mood_score BETWEEN 0 AND 100),
  gdpr_consent         BOOLEAN DEFAULT FALSE,
  gdpr_consent_at      TIMESTAMPTZ,
  gdpr_consent_ip      INET,
  onboarding_source    TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_patients_therapist ON patients(therapist_id);
CREATE INDEX idx_patients_email     ON patients(therapist_id, email);
CREATE INDEX idx_patients_status    ON patients(therapist_id, status);
CREATE INDEX idx_patients_telegram  ON patients(telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;
CREATE INDEX idx_patients_name_trgm ON patients USING gin(name gin_trgm_ops);

-- ── AGENDAMENTOS ──────────────────────────────────────────────
CREATE TABLE appointments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id          UUID REFERENCES therapists(id) ON DELETE CASCADE,
  patient_id            UUID REFERENCES patients(id) ON DELETE CASCADE,
  scheduled_at          TIMESTAMPTZ NOT NULL,
  duration_minutes      INT NOT NULL DEFAULT 50,
  type                  TEXT NOT NULL DEFAULT 'online'
                        CHECK (type IN ('online','presencial','hybrid')),
  status                TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','confirmed','in_progress','completed','cancelled','no_show')),
  video_room_id         TEXT,
  video_room_url        TEXT,
  patient_access_token  TEXT UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  payment_status        TEXT DEFAULT 'pending'
                        CHECK (payment_status IN ('pending','paid','refunded','exempt','free')),
  stripe_session_id     TEXT,
  stripe_payment_id     TEXT,
  price_charged         NUMERIC(10,2),
  cancellation_reason   TEXT,
  cancelled_at          TIMESTAMPTZ,
  cancelled_by          TEXT CHECK (cancelled_by IN ('therapist','patient','system')),
  reminder_24h_sent     BOOLEAN DEFAULT FALSE,
  reminder_1h_sent      BOOLEAN DEFAULT FALSE,
  nps_sent              BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointments_therapist_date ON appointments(therapist_id, scheduled_at);
CREATE INDEX idx_appointments_patient        ON appointments(patient_id, scheduled_at);
CREATE INDEX idx_appointments_status         ON appointments(status, scheduled_at);

-- ── SESSÕES (pós-consulta) ────────────────────────────────────
CREATE TABLE sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id    UUID UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  therapist_id      UUID REFERENCES therapists(id),
  patient_id        UUID REFERENCES patients(id),
  session_number    INT NOT NULL,
  started_at        TIMESTAMPTZ,
  ended_at          TIMESTAMPTZ,
  duration_seconds  INT,
  therapist_notes   TEXT, -- encrypted at rest via trigger + pgcrypto
  ai_summary        TEXT,
  ai_insights       TEXT[],
  ai_next_steps     TEXT[],
  ai_risk_flags     TEXT[],
  transcript        TEXT, -- encrypted at rest
  mood_before       INT CHECK (mood_before BETWEEN 1 AND 10),
  mood_after        INT CHECK (mood_after BETWEEN 1 AND 10),
  nps_score         INT CHECK (nps_score BETWEEN 1 AND 5),
  is_signed         BOOLEAN DEFAULT FALSE,
  signed_at         TIMESTAMPTZ,
  signed_hash       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_therapist ON sessions(therapist_id, created_at DESC);
CREATE INDEX idx_sessions_patient   ON sessions(patient_id, created_at DESC);

-- ── PRONTUÁRIO ────────────────────────────────────────────────
CREATE TABLE medical_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES therapists(id),
  session_id   UUID REFERENCES sessions(id),
  type         TEXT NOT NULL
               CHECK (type IN ('note','hypothesis','goal','evolution','attachment','risk_assessment')),
  content      TEXT NOT NULL,
  is_private   BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── PAGAMENTOS ────────────────────────────────────────────────
CREATE TABLE payments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id     UUID REFERENCES appointments(id),
  therapist_id       UUID REFERENCES therapists(id),
  patient_id         UUID REFERENCES patients(id),
  amount             NUMERIC(10,2) NOT NULL,
  currency           TEXT DEFAULT 'BRL',
  method             TEXT CHECK (method IN ('stripe','pix','manual','exempt')),
  stripe_payment_id  TEXT UNIQUE,
  pix_qrcode         TEXT,
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','processing','paid','failed','refunded','disputed')),
  paid_at            TIMESTAMPTZ,
  refunded_at        TIMESTAMPTZ,
  refund_reason      TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ── AUDIT LOG (prontuários) ───────────────────────────────────
CREATE TABLE audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID REFERENCES therapists(id),
  user_id      UUID REFERENCES auth.users(id),
  action       TEXT NOT NULL CHECK (action IN ('view','create','update','delete','export','sign')),
  table_name   TEXT NOT NULL,
  record_id    UUID NOT NULL,
  ip_address   INET,
  user_agent   TEXT,
  metadata     JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_therapist ON audit_logs(therapist_id, created_at DESC);
CREATE INDEX idx_audit_logs_record    ON audit_logs(table_name, record_id);

-- ── TELEGRAM UPDATES (idempotência) ───────────────────────────
CREATE TABLE telegram_updates (
  update_id    BIGINT PRIMARY KEY,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CONFIGS DO BOT ────────────────────────────────────────────
CREATE TABLE telegram_configs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID UNIQUE REFERENCES therapists(id) ON DELETE CASCADE,
  welcome_msg  TEXT,
  automations  JSONB DEFAULT '{
    "reminder_24h": true,
    "reminder_1h": true,
    "post_session_billing": true,
    "nps_collection": true,
    "lead_nurture": false,
    "reengagement": false
  }'::jsonb,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
ALTER TABLE therapists          ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability        ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients            ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records     ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_configs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs          ENABLE ROW LEVEL SECURITY;

-- Terapeutas acessam apenas seus próprios dados
CREATE POLICY "therapist_own" ON therapists
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "therapist_own_availability" ON availability
  FOR ALL USING (therapist_id IN (
    SELECT id FROM therapists WHERE user_id = auth.uid()
  ));

CREATE POLICY "therapist_own_blocks" ON availability_blocks
  FOR ALL USING (therapist_id IN (
    SELECT id FROM therapists WHERE user_id = auth.uid()
  ));

CREATE POLICY "therapist_patients" ON patients
  FOR ALL USING (therapist_id IN (
    SELECT id FROM therapists WHERE user_id = auth.uid()
  ));

CREATE POLICY "therapist_appointments" ON appointments
  FOR ALL USING (therapist_id IN (
    SELECT id FROM therapists WHERE user_id = auth.uid()
  ));

CREATE POLICY "therapist_sessions" ON sessions
  FOR ALL USING (therapist_id IN (
    SELECT id FROM therapists WHERE user_id = auth.uid()
  ));

CREATE POLICY "therapist_records" ON medical_records
  FOR ALL USING (therapist_id IN (
    SELECT id FROM therapists WHERE user_id = auth.uid()
  ));

CREATE POLICY "therapist_payments" ON payments
  FOR ALL USING (therapist_id IN (
    SELECT id FROM therapists WHERE user_id = auth.uid()
  ));

CREATE POLICY "therapist_telegram_configs" ON telegram_configs
  FOR ALL USING (therapist_id IN (
    SELECT id FROM therapists WHERE user_id = auth.uid()
  ));

CREATE POLICY "therapist_audit_logs" ON audit_logs
  FOR SELECT USING (therapist_id IN (
    SELECT id FROM therapists WHERE user_id = auth.uid()
  ));

-- Pacientes acessam seus próprios agendamentos (portal do paciente)
CREATE POLICY "patient_own_appointments" ON appointments
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
  );

CREATE POLICY "patient_own_sessions" ON sessions
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
  );

-- ── AUTO-UPDATE TRIGGERS ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER therapists_updated_at    BEFORE UPDATE ON therapists    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER patients_updated_at      BEFORE UPDATE ON patients      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER appointments_updated_at  BEFORE UPDATE ON appointments  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER medical_records_updated_at BEFORE UPDATE ON medical_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER telegram_configs_updated_at BEFORE UPDATE ON telegram_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
