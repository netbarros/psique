-- MF-22 enterprise hardening: RLS tightening + uniqueness constraints

-- 1) Explicitly protect telegram idempotency table (service-role only)
ALTER TABLE telegram_updates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'telegram_updates'
      AND policyname = 'service_role_telegram_updates'
  ) THEN
    ALTER POLICY "service_role_telegram_updates" ON telegram_updates
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  ELSE
    CREATE POLICY "service_role_telegram_updates" ON telegram_updates
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END
$$;

-- 2) Tighten patient policies to enforce therapist consistency
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'patient_journal_entries'
      AND policyname = 'patient_own_journal_entries'
  ) THEN
    ALTER POLICY "patient_own_journal_entries" ON patient_journal_entries
      USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
      )
      WITH CHECK (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
        AND therapist_id IN (
          SELECT therapist_id FROM patients WHERE user_id = auth.uid()
        )
      );
  ELSE
    CREATE POLICY "patient_own_journal_entries" ON patient_journal_entries
      FOR ALL
      USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
      )
      WITH CHECK (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
        AND therapist_id IN (
          SELECT therapist_id FROM patients WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'patient_mood_entries'
      AND policyname = 'patient_own_mood_entries'
  ) THEN
    ALTER POLICY "patient_own_mood_entries" ON patient_mood_entries
      USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
      )
      WITH CHECK (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
        AND therapist_id IN (
          SELECT therapist_id FROM patients WHERE user_id = auth.uid()
        )
      );
  ELSE
    CREATE POLICY "patient_own_mood_entries" ON patient_mood_entries
      FOR ALL
      USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
      )
      WITH CHECK (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
        AND therapist_id IN (
          SELECT therapist_id FROM patients WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'patient_chat_threads'
      AND policyname = 'patient_own_chat_threads'
  ) THEN
    ALTER POLICY "patient_own_chat_threads" ON patient_chat_threads
      USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
      )
      WITH CHECK (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
        AND therapist_id IN (
          SELECT therapist_id FROM patients WHERE user_id = auth.uid()
        )
      );
  ELSE
    CREATE POLICY "patient_own_chat_threads" ON patient_chat_threads
      FOR ALL
      USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
      )
      WITH CHECK (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
        AND therapist_id IN (
          SELECT therapist_id FROM patients WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- 3) Enforce thread ownership consistency for chat messages
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'patient_chat_messages'
      AND policyname = 'patient_own_chat_messages'
  ) THEN
    ALTER POLICY "patient_own_chat_messages" ON patient_chat_messages
      USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
        AND EXISTS (
          SELECT 1
          FROM patient_chat_threads t
          WHERE t.id = thread_id
            AND t.patient_id = patient_id
        )
      )
      WITH CHECK (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
        AND EXISTS (
          SELECT 1
          FROM patient_chat_threads t
          WHERE t.id = thread_id
            AND t.patient_id = patient_id
        )
      );
  ELSE
    CREATE POLICY "patient_own_chat_messages" ON patient_chat_messages
      FOR ALL
      USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
        AND EXISTS (
          SELECT 1
          FROM patient_chat_threads t
          WHERE t.id = thread_id
            AND t.patient_id = patient_id
        )
      )
      WITH CHECK (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
        AND EXISTS (
          SELECT 1
          FROM patient_chat_threads t
          WHERE t.id = thread_id
            AND t.patient_id = patient_id
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'patient_chat_messages'
      AND policyname = 'therapist_chat_messages'
  ) THEN
    ALTER POLICY "therapist_chat_messages" ON patient_chat_messages
      USING (
        EXISTS (
          SELECT 1
          FROM patient_chat_threads t
          JOIN patients p ON p.id = t.patient_id
          JOIN therapists th ON th.id = p.therapist_id
          WHERE t.id = thread_id
            AND t.patient_id = patient_id
            AND th.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM patient_chat_threads t
          JOIN patients p ON p.id = t.patient_id
          JOIN therapists th ON th.id = p.therapist_id
          WHERE t.id = thread_id
            AND t.patient_id = patient_id
            AND th.user_id = auth.uid()
        )
      );
  ELSE
    CREATE POLICY "therapist_chat_messages" ON patient_chat_messages
      FOR ALL
      USING (
        EXISTS (
          SELECT 1
          FROM patient_chat_threads t
          JOIN patients p ON p.id = t.patient_id
          JOIN therapists th ON th.id = p.therapist_id
          WHERE t.id = thread_id
            AND t.patient_id = patient_id
            AND th.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM patient_chat_threads t
          JOIN patients p ON p.id = t.patient_id
          JOIN therapists th ON th.id = p.therapist_id
          WHERE t.id = thread_id
            AND t.patient_id = patient_id
            AND th.user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- 4) Uniqueness aligned with app assumptions (.single() and anti-duplication)
DO $$
BEGIN
  IF EXISTS (
    SELECT user_id
    FROM therapists
    WHERE user_id IS NOT NULL
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce ux_therapists_user_id_not_null: duplicate therapists.user_id found';
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_therapists_user_id_not_null
  ON therapists(user_id)
  WHERE user_id IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT user_id
    FROM patients
    WHERE user_id IS NOT NULL
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce ux_patients_user_id_not_null: duplicate patients.user_id found';
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_patients_user_id_not_null
  ON patients(user_id)
  WHERE user_id IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT therapist_id, lower(email)
    FROM patients
    GROUP BY therapist_id, lower(email)
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce ux_patients_therapist_email_ci: duplicate patients (therapist_id,email) found';
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_patients_therapist_email_ci
  ON patients(therapist_id, lower(email));

-- Prevent double-booking races at DB level for active appointments
DO $$
BEGIN
  IF EXISTS (
    SELECT therapist_id, scheduled_at
    FROM appointments
    WHERE status IN ('pending', 'confirmed', 'in_progress')
    GROUP BY therapist_id, scheduled_at
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce ux_appointments_therapist_scheduled_active: duplicate active slots found';
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_appointments_therapist_scheduled_active
  ON appointments(therapist_id, scheduled_at)
  WHERE status IN ('pending', 'confirmed', 'in_progress');
