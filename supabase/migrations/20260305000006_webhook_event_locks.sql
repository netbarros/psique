-- MF-24: Stripe webhook idempotency lock table

CREATE TABLE IF NOT EXISTS webhook_event_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'processed', 'failed')),
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_event_locks_provider_status_created
  ON webhook_event_locks(provider, status, created_at DESC);

ALTER TABLE webhook_event_locks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'webhook_event_locks'
      AND policyname = 'service_role_webhook_event_locks'
  ) THEN
    ALTER POLICY "service_role_webhook_event_locks" ON webhook_event_locks
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  ELSE
    CREATE POLICY "service_role_webhook_event_locks" ON webhook_event_locks
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END
$$;

DROP TRIGGER IF EXISTS webhook_event_locks_updated_at ON webhook_event_locks;

CREATE TRIGGER webhook_event_locks_updated_at
  BEFORE UPDATE ON webhook_event_locks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
