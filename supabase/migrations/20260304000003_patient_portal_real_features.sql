-- MF-01/MF-06/MF-07/MF-09: Real patient portal + settings persistence

ALTER TABLE therapists
  ADD COLUMN IF NOT EXISTS cancellation_policy_hours INT NOT NULL DEFAULT 24;

CREATE TABLE IF NOT EXISTS patient_journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  entry_text TEXT NOT NULL,
  mood_score INT CHECK (mood_score BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_journal_entries_patient_created
  ON patient_journal_entries(patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_patient_journal_entries_therapist_created
  ON patient_journal_entries(therapist_id, created_at DESC);

CREATE TABLE IF NOT EXISTS patient_mood_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  mood_score INT NOT NULL CHECK (mood_score BETWEEN 1 AND 10),
  note TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_mood_entries_patient_created
  ON patient_mood_entries(patient_id, created_at DESC);

CREATE TABLE IF NOT EXISTS patient_chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  title TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_chat_threads_patient_last
  ON patient_chat_threads(patient_id, last_message_at DESC NULLS LAST, created_at DESC);

CREATE TABLE IF NOT EXISTS patient_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES patient_chat_threads(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_chat_messages_thread_created
  ON patient_chat_messages(thread_id, created_at ASC);

CREATE TABLE IF NOT EXISTS therapist_settings (
  therapist_id UUID PRIMARY KEY REFERENCES therapists(id) ON DELETE CASCADE,
  encrypt_records BOOLEAN NOT NULL DEFAULT TRUE,
  require_lgpd_consent BOOLEAN NOT NULL DEFAULT TRUE,
  blur_patient_data BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE patient_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patient_journal_entries' AND policyname = 'therapist_journal_entries'
  ) THEN
    CREATE POLICY "therapist_journal_entries" ON patient_journal_entries
      FOR ALL USING (
        therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patient_journal_entries' AND policyname = 'patient_own_journal_entries'
  ) THEN
    CREATE POLICY "patient_own_journal_entries" ON patient_journal_entries
      FOR ALL USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
      )
      WITH CHECK (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patient_mood_entries' AND policyname = 'therapist_mood_entries'
  ) THEN
    CREATE POLICY "therapist_mood_entries" ON patient_mood_entries
      FOR ALL USING (
        therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patient_mood_entries' AND policyname = 'patient_own_mood_entries'
  ) THEN
    CREATE POLICY "patient_own_mood_entries" ON patient_mood_entries
      FOR ALL USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
      )
      WITH CHECK (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patient_chat_threads' AND policyname = 'therapist_chat_threads'
  ) THEN
    CREATE POLICY "therapist_chat_threads" ON patient_chat_threads
      FOR ALL USING (
        therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patient_chat_threads' AND policyname = 'patient_own_chat_threads'
  ) THEN
    CREATE POLICY "patient_own_chat_threads" ON patient_chat_threads
      FOR ALL USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
      )
      WITH CHECK (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patient_chat_messages' AND policyname = 'therapist_chat_messages'
  ) THEN
    CREATE POLICY "therapist_chat_messages" ON patient_chat_messages
      FOR ALL USING (
        patient_id IN (
          SELECT p.id FROM patients p
          JOIN therapists t ON t.id = p.therapist_id
          WHERE t.user_id = auth.uid()
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patient_chat_messages' AND policyname = 'patient_own_chat_messages'
  ) THEN
    CREATE POLICY "patient_own_chat_messages" ON patient_chat_messages
      FOR ALL USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
      )
      WITH CHECK (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'therapist_settings' AND policyname = 'therapist_own_settings'
  ) THEN
    CREATE POLICY "therapist_own_settings" ON therapist_settings
      FOR ALL USING (
        therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
      )
      WITH CHECK (
        therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
      );
  END IF;
END
$$;

 DROP TRIGGER IF EXISTS patient_journal_entries_updated_at ON patient_journal_entries;

CREATE TRIGGER patient_journal_entries_updated_at
  BEFORE UPDATE ON patient_journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

 DROP TRIGGER IF EXISTS patient_chat_threads_updated_at ON patient_chat_threads;

CREATE TRIGGER patient_chat_threads_updated_at
  BEFORE UPDATE ON patient_chat_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

 DROP TRIGGER IF EXISTS therapist_settings_updated_at ON therapist_settings;

CREATE TRIGGER therapist_settings_updated_at
  BEFORE UPDATE ON therapist_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
