-- MF-25: master_admin domain, versioned public content/plans, strict RBAC + RLS

-- Role source-of-truth for backend authorization
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('master_admin', 'therapist', 'patient')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS master_admin_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Master Admin',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plan_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'pt-BR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (plan_key, locale)
);

CREATE TABLE IF NOT EXISTS plan_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES plan_documents(id) ON DELETE CASCADE,
  version INT NOT NULL CHECK (version >= 1),
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  etag TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (document_id, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_plan_revisions_one_published_per_document
  ON plan_revisions(document_id)
  WHERE status = 'published';

CREATE TABLE IF NOT EXISTS content_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key TEXT NOT NULL,
  section_key TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'pt-BR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (page_key, section_key, locale)
);

CREATE TABLE IF NOT EXISTS content_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES content_documents(id) ON DELETE CASCADE,
  version INT NOT NULL CHECK (version >= 1),
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  etag TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (document_id, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_content_revisions_one_published_per_document
  ON content_revisions(document_id)
  WHERE status = 'published';

CREATE TABLE IF NOT EXISTS platform_integrations (
  provider TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'inactive'
    CHECK (status IN ('active', 'inactive', 'invalid', 'draft')),
  public_config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  secret_ref TEXT,
  last_validated_at TIMESTAMPTZ,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  diff_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_events_actor_created_at
  ON admin_audit_events(actor_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_plan_revisions_status_created_at
  ON plan_revisions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_revisions_status_created_at
  ON content_revisions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_integrations_status
  ON platform_integrations(status);

-- Canonical RBAC function used by APIs and RLS
CREATE OR REPLACE FUNCTION is_master_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = uid
      AND ur.role = 'master_admin'
  );
$$;

REVOKE ALL ON FUNCTION is_master_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_master_admin(UUID) TO authenticated, service_role;

-- Public read model for published plans only
CREATE OR REPLACE FUNCTION get_public_plans(p_locale TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', pr.id,
        'planKey', pd.plan_key,
        'locale', pd.locale,
        'version', pr.version,
        'etag', pr.etag,
        'payload', pr.payload_json,
        'publishedAt', pr.published_at
      )
      ORDER BY pd.plan_key
    ),
    '[]'::jsonb
  )
  FROM plan_documents pd
  JOIN plan_revisions pr ON pr.document_id = pd.id
  WHERE pr.status = 'published'
    AND (COALESCE(p_locale, '') = '' OR pd.locale = p_locale);
$$;

REVOKE ALL ON FUNCTION get_public_plans(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_public_plans(TEXT) TO anon, authenticated, service_role;

-- Public read model for published content of a page only
CREATE OR REPLACE FUNCTION get_public_content(p_page_key TEXT, p_locale TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'pageKey', p_page_key,
    'locale', p_locale,
    'items', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', cr.id,
          'sectionKey', cd.section_key,
          'version', cr.version,
          'etag', cr.etag,
          'payload', cr.payload_json,
          'publishedAt', cr.published_at
        )
        ORDER BY cd.section_key
      ),
      '[]'::jsonb
    )
  )
  FROM content_documents cd
  JOIN content_revisions cr ON cr.document_id = cd.id
  WHERE cr.status = 'published'
    AND cd.page_key = p_page_key
    AND (COALESCE(p_locale, '') = '' OR cd.locale = p_locale);
$$;

REVOKE ALL ON FUNCTION get_public_content(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_public_content(TEXT, TEXT) TO anon, authenticated, service_role;

-- Updated-at triggers for mutable entities
DROP TRIGGER IF EXISTS user_roles_updated_at ON user_roles;
CREATE TRIGGER user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS master_admin_profiles_updated_at ON master_admin_profiles;
CREATE TRIGGER master_admin_profiles_updated_at
  BEFORE UPDATE ON master_admin_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS plan_documents_updated_at ON plan_documents;
CREATE TRIGGER plan_documents_updated_at
  BEFORE UPDATE ON plan_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS plan_revisions_updated_at ON plan_revisions;
CREATE TRIGGER plan_revisions_updated_at
  BEFORE UPDATE ON plan_revisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS content_documents_updated_at ON content_documents;
CREATE TRIGGER content_documents_updated_at
  BEFORE UPDATE ON content_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS content_revisions_updated_at ON content_revisions;
CREATE TRIGGER content_revisions_updated_at
  BEFORE UPDATE ON content_revisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS platform_integrations_updated_at ON platform_integrations;
CREATE TRIGGER platform_integrations_updated_at
  BEFORE UPDATE ON platform_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS hardening for master_admin domain
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'master_admin_all_user_roles'
  ) THEN
    ALTER POLICY "master_admin_all_user_roles" ON user_roles
      USING (is_master_admin(auth.uid()))
      WITH CHECK (is_master_admin(auth.uid()));
  ELSE
    CREATE POLICY "master_admin_all_user_roles" ON user_roles
      FOR ALL
      USING (is_master_admin(auth.uid()))
      WITH CHECK (is_master_admin(auth.uid()));
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'master_admin_profiles' AND policyname = 'master_admin_all_profiles'
  ) THEN
    ALTER POLICY "master_admin_all_profiles" ON master_admin_profiles
      USING (is_master_admin(auth.uid()))
      WITH CHECK (is_master_admin(auth.uid()));
  ELSE
    CREATE POLICY "master_admin_all_profiles" ON master_admin_profiles
      FOR ALL
      USING (is_master_admin(auth.uid()))
      WITH CHECK (is_master_admin(auth.uid()));
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'plan_documents' AND policyname = 'master_admin_all_plan_documents'
  ) THEN
    ALTER POLICY "master_admin_all_plan_documents" ON plan_documents
      USING (is_master_admin(auth.uid()))
      WITH CHECK (is_master_admin(auth.uid()));
  ELSE
    CREATE POLICY "master_admin_all_plan_documents" ON plan_documents
      FOR ALL
      USING (is_master_admin(auth.uid()))
      WITH CHECK (is_master_admin(auth.uid()));
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'plan_revisions' AND policyname = 'master_admin_all_plan_revisions'
  ) THEN
    ALTER POLICY "master_admin_all_plan_revisions" ON plan_revisions
      USING (is_master_admin(auth.uid()))
      WITH CHECK (is_master_admin(auth.uid()));
  ELSE
    CREATE POLICY "master_admin_all_plan_revisions" ON plan_revisions
      FOR ALL
      USING (is_master_admin(auth.uid()))
      WITH CHECK (is_master_admin(auth.uid()));
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'content_documents' AND policyname = 'master_admin_all_content_documents'
  ) THEN
    ALTER POLICY "master_admin_all_content_documents" ON content_documents
      USING (is_master_admin(auth.uid()))
      WITH CHECK (is_master_admin(auth.uid()));
  ELSE
    CREATE POLICY "master_admin_all_content_documents" ON content_documents
      FOR ALL
      USING (is_master_admin(auth.uid()))
      WITH CHECK (is_master_admin(auth.uid()));
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'content_revisions' AND policyname = 'master_admin_all_content_revisions'
  ) THEN
    ALTER POLICY "master_admin_all_content_revisions" ON content_revisions
      USING (is_master_admin(auth.uid()))
      WITH CHECK (is_master_admin(auth.uid()));
  ELSE
    CREATE POLICY "master_admin_all_content_revisions" ON content_revisions
      FOR ALL
      USING (is_master_admin(auth.uid()))
      WITH CHECK (is_master_admin(auth.uid()));
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'platform_integrations' AND policyname = 'master_admin_all_platform_integrations'
  ) THEN
    ALTER POLICY "master_admin_all_platform_integrations" ON platform_integrations
      USING (is_master_admin(auth.uid()))
      WITH CHECK (is_master_admin(auth.uid()));
  ELSE
    CREATE POLICY "master_admin_all_platform_integrations" ON platform_integrations
      FOR ALL
      USING (is_master_admin(auth.uid()))
      WITH CHECK (is_master_admin(auth.uid()));
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_audit_events' AND policyname = 'master_admin_select_admin_audit_events'
  ) THEN
    ALTER POLICY "master_admin_select_admin_audit_events" ON admin_audit_events
      USING (is_master_admin(auth.uid()));
  ELSE
    CREATE POLICY "master_admin_select_admin_audit_events" ON admin_audit_events
      FOR SELECT
      USING (is_master_admin(auth.uid()));
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_audit_events' AND policyname = 'master_admin_insert_admin_audit_events'
  ) THEN
    ALTER POLICY "master_admin_insert_admin_audit_events" ON admin_audit_events
      WITH CHECK (is_master_admin(auth.uid()));
  ELSE
    CREATE POLICY "master_admin_insert_admin_audit_events" ON admin_audit_events
      FOR INSERT
      WITH CHECK (is_master_admin(auth.uid()));
  END IF;
END
$$;
