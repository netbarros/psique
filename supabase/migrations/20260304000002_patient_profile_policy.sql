-- Allow patients to read their own profile row.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'patients'
      AND policyname = 'patient_own_profile'
  ) THEN
    CREATE POLICY "patient_own_profile" ON patients
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END
$$;
