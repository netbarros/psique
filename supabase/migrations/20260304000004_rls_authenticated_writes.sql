-- MF-21 hardening: allow authenticated writes to audit logs without service-role bypass.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'audit_logs'
      AND policyname = 'therapist_insert_own_audit_logs'
  ) THEN
    CREATE POLICY "therapist_insert_own_audit_logs" ON audit_logs
      FOR INSERT
      WITH CHECK (
        user_id = auth.uid()
        AND therapist_id IN (
          SELECT id FROM therapists WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'appointments'
      AND policyname = 'patient_insert_own_appointments'
  ) THEN
    CREATE POLICY "patient_insert_own_appointments" ON appointments
      FOR INSERT
      WITH CHECK (
        patient_id IN (
          SELECT id FROM patients WHERE user_id = auth.uid()
        )
        AND therapist_id IN (
          SELECT therapist_id
          FROM patients
          WHERE id = patient_id
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'audit_logs'
      AND policyname = 'patient_insert_own_audit_logs'
  ) THEN
    CREATE POLICY "patient_insert_own_audit_logs" ON audit_logs
      FOR INSERT
      WITH CHECK (
        user_id = auth.uid()
        AND therapist_id IN (
          SELECT therapist_id FROM patients WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;
