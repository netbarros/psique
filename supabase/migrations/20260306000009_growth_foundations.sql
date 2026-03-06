-- Wave 0 Foundations: unified wallet/ledger, growth rules, public slugs, communication preferences

-- Legacy deprecation: growth rewards now share the unified wallet system.
DROP TABLE IF EXISTS therapist_growth_credit_ledger;

CREATE TABLE IF NOT EXISTS credit_wallets (
  wallet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL UNIQUE REFERENCES therapists(id) ON DELETE CASCADE,
  balance_total_credits NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance_paid_credits NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance_bonus_credits NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (balance_total_credits >= 0),
  CHECK (balance_paid_credits >= 0),
  CHECK (balance_bonus_credits >= 0)
);

CREATE TABLE IF NOT EXISTS credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES credit_wallets(wallet_id) ON DELETE CASCADE,
  entry_kind TEXT NOT NULL CHECK (entry_kind IN ('credit', 'debit', 'expire', 'reverse', 'hold', 'release')),
  bucket TEXT NOT NULL CHECK (bucket IN ('paid', 'bonus')),
  amount_credits NUMERIC(12,2) NOT NULL CHECK (amount_credits > 0),
  source_type TEXT NOT NULL,
  source_id TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('pending', 'posted', 'reversed', 'failed')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_wallet_created
  ON credit_ledger(wallet_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_wallet_bucket_created
  ON credit_ledger(wallet_id, bucket, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_expires_at
  ON credit_ledger(expires_at)
  WHERE expires_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  credits_amount NUMERIC(12,2) NOT NULL CHECK (credits_amount > 0),
  price_brl_cents INT NOT NULL CHECK (price_brl_cents > 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pricebook_actions (
  action_key TEXT PRIMARY KEY,
  unit_type TEXT NOT NULL,
  unit_cost_credits NUMERIC(12,2) NOT NULL CHECK (unit_cost_credits >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES credit_wallets(wallet_id) ON DELETE CASCADE,
  action_key TEXT NOT NULL REFERENCES pricebook_actions(action_key),
  units NUMERIC(12,2) NOT NULL CHECK (units > 0),
  billed_credits NUMERIC(12,2) NOT NULL CHECK (billed_credits >= 0),
  ledger_entry_id UUID REFERENCES credit_ledger(id) ON DELETE SET NULL,
  correlation_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'billed' CHECK (status IN ('billed', 'skipped', 'reversed', 'failed')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (action_key, correlation_id)
);

CREATE INDEX IF NOT EXISTS idx_usage_events_therapist_created
  ON usage_events(therapist_id, created_at DESC);

CREATE TABLE IF NOT EXISTS growth_program_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL UNIQUE DEFAULT 'default',
  inviter_bonus_credits NUMERIC(12,2) NOT NULL DEFAULT 30,
  invitee_bonus_credits NUMERIC(12,2) NOT NULL DEFAULT 20,
  qualification_min_amount_brl NUMERIC(10,2) NOT NULL DEFAULT 199.00,
  qualification_wait_days INT NOT NULL DEFAULT 14,
  max_rewards_per_month INT NOT NULL DEFAULT 3,
  max_rewards_per_therapist INT NOT NULL DEFAULT 24,
  bonus_expiration_days INT NOT NULL DEFAULT 90,
  anti_abuse_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (qualification_min_amount_brl >= 0),
  CHECK (qualification_wait_days >= 0),
  CHECK (max_rewards_per_month >= 0),
  CHECK (max_rewards_per_therapist >= 0),
  CHECK (bonus_expiration_days >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_growth_program_rules_one_active
  ON growth_program_rules(active)
  WHERE active = TRUE;

CREATE TABLE IF NOT EXISTS public_slugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE CHECK (slug = lower(slug)),
  target_type TEXT NOT NULL,
  target_id TEXT,
  canonical_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'redirect', 'reserved')),
  is_reserved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_slugs_target
  ON public_slugs(target_type, target_id);

CREATE TABLE IF NOT EXISTS patient_communication_preferences (
  patient_id UUID PRIMARY KEY REFERENCES patients(id) ON DELETE CASCADE,
  checkin_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  preferred_channel TEXT NOT NULL DEFAULT 'telegram'
    CHECK (preferred_channel IN ('telegram', 'email', 'whatsapp', 'none')),
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS therapist_founder_memberships (
  therapist_id UUID PRIMARY KEY REFERENCES therapists(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'none',
  benefits_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS therapist_referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL UNIQUE REFERENCES therapists(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS therapist_referral_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  invited_therapist_id UUID REFERENCES therapists(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL REFERENCES therapist_referral_codes(code),
  invited_email TEXT,
  invited_phone TEXT,
  invited_telegram_username TEXT,
  invited_device_fingerprint TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'qualified', 'rewarded', 'rejected', 'under_review', 'expired')),
  qualification_paid_amount_brl NUMERIC(10,2),
  qualification_ready_at TIMESTAMPTZ,
  qualification_evaluated_at TIMESTAMPTZ,
  reward_ledger_entry_inviter_id UUID REFERENCES credit_ledger(id) ON DELETE SET NULL,
  reward_ledger_entry_invitee_id UUID REFERENCES credit_ledger(id) ON DELETE SET NULL,
  reward_issued_at TIMESTAMPTZ,
  rejection_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (invited_therapist_id IS NULL OR invited_therapist_id <> inviter_therapist_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_referral_invites_one_reward_per_invited
  ON therapist_referral_invites(invited_therapist_id)
  WHERE invited_therapist_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_referral_invites_inviter_status
  ON therapist_referral_invites(inviter_therapist_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_referral_invites_ready
  ON therapist_referral_invites(status, qualification_ready_at)
  WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS therapist_public_profiles (
  therapist_id UUID PRIMARY KEY REFERENCES therapists(id) ON DELETE CASCADE,
  display_name TEXT,
  profile_photo_url TEXT,
  short_bio TEXT,
  long_bio TEXT,
  specialties TEXT[] NOT NULL DEFAULT '{}',
  therapeutic_approaches TEXT[] NOT NULL DEFAULT '{}',
  city TEXT,
  state TEXT,
  modality_online BOOLEAN NOT NULL DEFAULT TRUE,
  modality_presential BOOLEAN NOT NULL DEFAULT FALSE,
  availability_summary TEXT,
  trust_indicators TEXT[] NOT NULL DEFAULT '{}',
  opt_in_directory BOOLEAN NOT NULL DEFAULT FALSE,
  checklist_completed BOOLEAN NOT NULL DEFAULT FALSE,
  profile_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS therapist_public_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content_markdown TEXT NOT NULL,
  content_sanitized TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_review', 'published', 'rejected', 'archived')),
  moderation_flags TEXT[] NOT NULL DEFAULT '{}',
  moderation_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (therapist_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_public_posts_status_published
  ON therapist_public_posts(status, published_at DESC);

CREATE TABLE IF NOT EXISTS patient_session_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  mood_label TEXT NOT NULL CHECK (mood_label IN ('good', 'neutral', 'difficult')),
  channel TEXT NOT NULL CHECK (channel IN ('telegram', 'email', 'whatsapp', 'portal')),
  response_note TEXT,
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'responded' CHECK (status IN ('queued', 'sent', 'responded', 'skipped', 'failed')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkins_patient_created
  ON patient_session_checkins(patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_checkins_therapist_created
  ON patient_session_checkins(therapist_id, created_at DESC);

CREATE OR REPLACE FUNCTION credit_ledger_validate_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  wallet_row credit_wallets%ROWTYPE;
BEGIN
  SELECT *
  INTO wallet_row
  FROM credit_wallets
  WHERE wallet_id = NEW.wallet_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'wallet_not_found';
  END IF;

  IF NEW.bucket = 'paid' AND NEW.expires_at IS NOT NULL THEN
    RAISE EXCEPTION 'paid_credits_cannot_expire';
  END IF;

  IF NEW.entry_kind IN ('debit', 'expire', 'hold') THEN
    IF NEW.bucket = 'bonus' AND wallet_row.balance_bonus_credits < NEW.amount_credits THEN
      RAISE EXCEPTION 'insufficient_bonus_credits';
    END IF;

    IF NEW.bucket = 'paid' AND wallet_row.balance_paid_credits < NEW.amount_credits THEN
      RAISE EXCEPTION 'insufficient_paid_credits';
    END IF;

    IF wallet_row.balance_total_credits < NEW.amount_credits THEN
      RAISE EXCEPTION 'insufficient_total_credits';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION credit_ledger_apply_balance_after_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  delta NUMERIC(12,2);
BEGIN
  delta := CASE NEW.entry_kind
    WHEN 'credit' THEN NEW.amount_credits
    WHEN 'release' THEN NEW.amount_credits
    WHEN 'reverse' THEN NEW.amount_credits
    WHEN 'debit' THEN -NEW.amount_credits
    WHEN 'expire' THEN -NEW.amount_credits
    WHEN 'hold' THEN -NEW.amount_credits
    ELSE 0
  END;

  UPDATE credit_wallets
  SET
    balance_total_credits = GREATEST(0, balance_total_credits + delta),
    balance_paid_credits = CASE
      WHEN NEW.bucket = 'paid' THEN GREATEST(0, balance_paid_credits + delta)
      ELSE balance_paid_credits
    END,
    balance_bonus_credits = CASE
      WHEN NEW.bucket = 'bonus' THEN GREATEST(0, balance_bonus_credits + delta)
      ELSE balance_bonus_credits
    END,
    updated_at = NOW()
  WHERE wallet_id = NEW.wallet_id;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION credit_ledger_block_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'credit_ledger_is_immutable';
END;
$$;

CREATE OR REPLACE FUNCTION enforce_referral_invite_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.invited_therapist_id IS NOT NULL AND NEW.invited_therapist_id = NEW.inviter_therapist_id THEN
    RAISE EXCEPTION 'self_referral_not_allowed';
  END IF;

  IF NEW.invited_therapist_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM therapist_referral_invites t
    WHERE t.inviter_therapist_id = NEW.invited_therapist_id
      AND t.invited_therapist_id = NEW.inviter_therapist_id
      AND t.id <> NEW.id
      AND t.status IN ('pending', 'qualified', 'rewarded', 'under_review')
  ) THEN
    RAISE EXCEPTION 'circular_referral_not_allowed';
  END IF;

  IF NEW.invited_email IS NOT NULL AND EXISTS (
    SELECT 1
    FROM therapist_referral_invites t
    WHERE t.invited_email IS NOT NULL
      AND lower(t.invited_email) = lower(NEW.invited_email)
      AND t.inviter_therapist_id <> NEW.inviter_therapist_id
      AND t.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    NEW.status := 'under_review';
  END IF;

  IF NEW.invited_phone IS NOT NULL AND EXISTS (
    SELECT 1
    FROM therapist_referral_invites t
    WHERE t.invited_phone IS NOT NULL
      AND t.invited_phone = NEW.invited_phone
      AND t.inviter_therapist_id <> NEW.inviter_therapist_id
      AND t.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    NEW.status := 'under_review';
  END IF;

  IF NEW.invited_telegram_username IS NOT NULL AND EXISTS (
    SELECT 1
    FROM therapist_referral_invites t
    WHERE t.invited_telegram_username IS NOT NULL
      AND lower(t.invited_telegram_username) = lower(NEW.invited_telegram_username)
      AND t.inviter_therapist_id <> NEW.inviter_therapist_id
      AND t.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    NEW.status := 'under_review';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION enforce_patient_checkin_guardrails()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  appt RECORD;
BEGIN
  SELECT id, status, patient_id, therapist_id
  INTO appt
  FROM appointments
  WHERE id = NEW.appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'appointment_not_found';
  END IF;

  IF appt.status IN ('cancelled', 'no_show') THEN
    RAISE EXCEPTION 'checkin_not_allowed_for_appointment_status';
  END IF;

  IF appt.patient_id <> NEW.patient_id OR appt.therapist_id <> NEW.therapist_id THEN
    RAISE EXCEPTION 'checkin_patient_or_therapist_mismatch';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS credit_ledger_validate_insert ON credit_ledger;
CREATE TRIGGER credit_ledger_validate_insert
  BEFORE INSERT ON credit_ledger
  FOR EACH ROW EXECUTE FUNCTION credit_ledger_validate_before_insert();

DROP TRIGGER IF EXISTS credit_ledger_apply_balance_insert ON credit_ledger;
CREATE TRIGGER credit_ledger_apply_balance_insert
  AFTER INSERT ON credit_ledger
  FOR EACH ROW EXECUTE FUNCTION credit_ledger_apply_balance_after_insert();

DROP TRIGGER IF EXISTS credit_ledger_block_update ON credit_ledger;
CREATE TRIGGER credit_ledger_block_update
  BEFORE UPDATE ON credit_ledger
  FOR EACH ROW EXECUTE FUNCTION credit_ledger_block_mutation();

DROP TRIGGER IF EXISTS credit_ledger_block_delete ON credit_ledger;
CREATE TRIGGER credit_ledger_block_delete
  BEFORE DELETE ON credit_ledger
  FOR EACH ROW EXECUTE FUNCTION credit_ledger_block_mutation();

DROP TRIGGER IF EXISTS therapist_referral_invites_rules ON therapist_referral_invites;
CREATE TRIGGER therapist_referral_invites_rules
  BEFORE INSERT OR UPDATE ON therapist_referral_invites
  FOR EACH ROW EXECUTE FUNCTION enforce_referral_invite_rules();

DROP TRIGGER IF EXISTS patient_session_checkins_guardrails ON patient_session_checkins;
CREATE TRIGGER patient_session_checkins_guardrails
  BEFORE INSERT OR UPDATE ON patient_session_checkins
  FOR EACH ROW EXECUTE FUNCTION enforce_patient_checkin_guardrails();

DROP TRIGGER IF EXISTS credit_wallets_updated_at ON credit_wallets;
CREATE TRIGGER credit_wallets_updated_at
  BEFORE UPDATE ON credit_wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS credit_packages_updated_at ON credit_packages;
CREATE TRIGGER credit_packages_updated_at
  BEFORE UPDATE ON credit_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS pricebook_actions_updated_at ON pricebook_actions;
CREATE TRIGGER pricebook_actions_updated_at
  BEFORE UPDATE ON pricebook_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS usage_events_updated_at ON usage_events;
CREATE TRIGGER usage_events_updated_at
  BEFORE UPDATE ON usage_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS growth_program_rules_updated_at ON growth_program_rules;
CREATE TRIGGER growth_program_rules_updated_at
  BEFORE UPDATE ON growth_program_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS public_slugs_updated_at ON public_slugs;
CREATE TRIGGER public_slugs_updated_at
  BEFORE UPDATE ON public_slugs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS patient_communication_preferences_updated_at ON patient_communication_preferences;
CREATE TRIGGER patient_communication_preferences_updated_at
  BEFORE UPDATE ON patient_communication_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS therapist_founder_memberships_updated_at ON therapist_founder_memberships;
CREATE TRIGGER therapist_founder_memberships_updated_at
  BEFORE UPDATE ON therapist_founder_memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS therapist_referral_codes_updated_at ON therapist_referral_codes;
CREATE TRIGGER therapist_referral_codes_updated_at
  BEFORE UPDATE ON therapist_referral_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS therapist_referral_invites_updated_at ON therapist_referral_invites;
CREATE TRIGGER therapist_referral_invites_updated_at
  BEFORE UPDATE ON therapist_referral_invites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS therapist_public_profiles_updated_at ON therapist_public_profiles;
CREATE TRIGGER therapist_public_profiles_updated_at
  BEFORE UPDATE ON therapist_public_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS therapist_public_posts_updated_at ON therapist_public_posts;
CREATE TRIGGER therapist_public_posts_updated_at
  BEFORE UPDATE ON therapist_public_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS patient_session_checkins_updated_at ON patient_session_checkins;
CREATE TRIGGER patient_session_checkins_updated_at
  BEFORE UPDATE ON patient_session_checkins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricebook_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_program_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_slugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_communication_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_founder_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_referral_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_public_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_public_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_session_checkins ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'credit_wallets' AND policyname = 'therapist_own_credit_wallets'
  ) THEN
    CREATE POLICY "therapist_own_credit_wallets" ON credit_wallets
      FOR SELECT USING (
        therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'credit_ledger' AND policyname = 'therapist_own_credit_ledger'
  ) THEN
    CREATE POLICY "therapist_own_credit_ledger" ON credit_ledger
      FOR SELECT USING (
        wallet_id IN (
          SELECT w.wallet_id
          FROM credit_wallets w
          JOIN therapists t ON t.id = w.therapist_id
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
    WHERE schemaname = 'public' AND tablename = 'usage_events' AND policyname = 'therapist_own_usage_events'
  ) THEN
    CREATE POLICY "therapist_own_usage_events" ON usage_events
      FOR SELECT USING (
        therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'therapist_referral_codes' AND policyname = 'therapist_manage_referral_codes'
  ) THEN
    CREATE POLICY "therapist_manage_referral_codes" ON therapist_referral_codes
      FOR ALL USING (
        therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
      )
      WITH CHECK (
        therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'therapist_referral_invites' AND policyname = 'therapist_manage_referral_invites'
  ) THEN
    CREATE POLICY "therapist_manage_referral_invites" ON therapist_referral_invites
      FOR ALL USING (
        inviter_therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
      )
      WITH CHECK (
        inviter_therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'therapist_public_profiles' AND policyname = 'therapist_manage_public_profiles'
  ) THEN
    CREATE POLICY "therapist_manage_public_profiles" ON therapist_public_profiles
      FOR ALL USING (
        therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
      )
      WITH CHECK (
        therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'therapist_public_profiles' AND policyname = 'public_read_therapist_profiles'
  ) THEN
    CREATE POLICY "public_read_therapist_profiles" ON therapist_public_profiles
      FOR SELECT USING (profile_published = TRUE);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'therapist_public_posts' AND policyname = 'therapist_manage_public_posts'
  ) THEN
    CREATE POLICY "therapist_manage_public_posts" ON therapist_public_posts
      FOR ALL USING (
        therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
      )
      WITH CHECK (
        therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'therapist_public_posts' AND policyname = 'public_read_published_posts'
  ) THEN
    CREATE POLICY "public_read_published_posts" ON therapist_public_posts
      FOR SELECT USING (status = 'published');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'public_slugs' AND policyname = 'public_read_active_slugs'
  ) THEN
    CREATE POLICY "public_read_active_slugs" ON public_slugs
      FOR SELECT USING (status IN ('active', 'reserved'));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patient_communication_preferences' AND policyname = 'patient_manage_own_communication_preferences'
  ) THEN
    CREATE POLICY "patient_manage_own_communication_preferences" ON patient_communication_preferences
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
    WHERE schemaname = 'public' AND tablename = 'patient_communication_preferences' AND policyname = 'therapist_read_patient_communication_preferences'
  ) THEN
    CREATE POLICY "therapist_read_patient_communication_preferences" ON patient_communication_preferences
      FOR SELECT USING (
        patient_id IN (
          SELECT p.id
          FROM patients p
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
    WHERE schemaname = 'public' AND tablename = 'patient_session_checkins' AND policyname = 'patient_read_own_checkins'
  ) THEN
    CREATE POLICY "patient_read_own_checkins" ON patient_session_checkins
      FOR SELECT USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patient_session_checkins' AND policyname = 'therapist_read_own_patient_checkins'
  ) THEN
    CREATE POLICY "therapist_read_own_patient_checkins" ON patient_session_checkins
      FOR SELECT USING (
        therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'growth_program_rules' AND policyname = 'master_admin_manage_growth_rules'
  ) THEN
    CREATE POLICY "master_admin_manage_growth_rules" ON growth_program_rules
      FOR ALL USING (is_master_admin(auth.uid()))
      WITH CHECK (is_master_admin(auth.uid()));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'growth_program_rules' AND policyname = 'authenticated_read_active_growth_rules'
  ) THEN
    CREATE POLICY "authenticated_read_active_growth_rules" ON growth_program_rules
      FOR SELECT USING (active = TRUE);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'credit_packages' AND policyname = 'master_admin_manage_credit_packages'
  ) THEN
    CREATE POLICY "master_admin_manage_credit_packages" ON credit_packages
      FOR ALL USING (is_master_admin(auth.uid()))
      WITH CHECK (is_master_admin(auth.uid()));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pricebook_actions' AND policyname = 'master_admin_manage_pricebook_actions'
  ) THEN
    CREATE POLICY "master_admin_manage_pricebook_actions" ON pricebook_actions
      FOR ALL USING (is_master_admin(auth.uid()))
      WITH CHECK (is_master_admin(auth.uid()));
  END IF;
END
$$;

INSERT INTO growth_program_rules (
  rule_name,
  inviter_bonus_credits,
  invitee_bonus_credits,
  qualification_min_amount_brl,
  qualification_wait_days,
  max_rewards_per_month,
  max_rewards_per_therapist,
  bonus_expiration_days,
  anti_abuse_enabled,
  active
)
VALUES (
  'default',
  30,
  20,
  199.00,
  14,
  3,
  24,
  90,
  TRUE,
  TRUE
)
ON CONFLICT (rule_name) DO UPDATE
SET
  inviter_bonus_credits = EXCLUDED.inviter_bonus_credits,
  invitee_bonus_credits = EXCLUDED.invitee_bonus_credits,
  qualification_min_amount_brl = EXCLUDED.qualification_min_amount_brl,
  qualification_wait_days = EXCLUDED.qualification_wait_days,
  max_rewards_per_month = EXCLUDED.max_rewards_per_month,
  max_rewards_per_therapist = EXCLUDED.max_rewards_per_therapist,
  bonus_expiration_days = EXCLUDED.bonus_expiration_days,
  anti_abuse_enabled = EXCLUDED.anti_abuse_enabled,
  active = EXCLUDED.active,
  updated_at = NOW();

INSERT INTO pricebook_actions (action_key, unit_type, unit_cost_credits, active)
VALUES
  ('ai.summary', 'request', 3, TRUE),
  ('ai.deep_analysis', 'request', 8, TRUE),
  ('telegram.ai_reply', 'request', 2, TRUE),
  ('video.extra_minutes', 'minute', 1, TRUE),
  ('transcription.minute', 'minute', 1, TRUE)
ON CONFLICT (action_key) DO UPDATE
SET
  unit_type = EXCLUDED.unit_type,
  unit_cost_credits = EXCLUDED.unit_cost_credits,
  active = EXCLUDED.active,
  updated_at = NOW();

INSERT INTO credit_packages (code, name, credits_amount, price_brl_cents, active)
VALUES
  ('starter_100', 'Pacote Inicial 100 créditos', 100, 9900, TRUE),
  ('pro_300', 'Pacote Profissional 300 créditos', 300, 24900, TRUE),
  ('scale_1000', 'Pacote Escala 1000 créditos', 1000, 69900, TRUE)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  credits_amount = EXCLUDED.credits_amount,
  price_brl_cents = EXCLUDED.price_brl_cents,
  active = EXCLUDED.active,
  updated_at = NOW();

INSERT INTO public_slugs (slug, target_type, target_id, canonical_path, status, is_reserved)
VALUES
  ('admin', 'reserved', NULL, '/', 'reserved', TRUE),
  ('api', 'reserved', NULL, '/', 'reserved', TRUE),
  ('auth', 'reserved', NULL, '/', 'reserved', TRUE),
  ('booking', 'reserved', NULL, '/', 'reserved', TRUE),
  ('checkout', 'reserved', NULL, '/', 'reserved', TRUE),
  ('dashboard', 'reserved', NULL, '/', 'reserved', TRUE),
  ('portal', 'reserved', NULL, '/', 'reserved', TRUE),
  ('pricing', 'reserved', NULL, '/', 'reserved', TRUE),
  ('terapeutas', 'reserved', NULL, '/', 'reserved', TRUE),
  ('terapeuta', 'reserved', NULL, '/', 'reserved', TRUE),
  ('_next', 'reserved', NULL, '/', 'reserved', TRUE),
  ('favicon.ico', 'reserved', NULL, '/', 'reserved', TRUE),
  ('robots.txt', 'reserved', NULL, '/', 'reserved', TRUE),
  ('sitemap.xml', 'reserved', NULL, '/', 'reserved', TRUE)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO platform_integrations (provider, status, public_config_json)
VALUES (
  'community',
  'inactive',
  jsonb_build_object(
    'label', 'Comunidade PSIQUE',
    'platform', 'telegram',
    'url', null
  )
)
ON CONFLICT (provider) DO NOTHING;
