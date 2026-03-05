-- Enterprise preflight dedupe playbook (manual execution in staging first).
-- Purpose: clean historical duplicates before applying uniqueness indexes from
-- supabase/migrations/20260305000005_enterprise_supabase_hardening.sql

-- =====================================================================
-- 1) Detect duplicate therapists.user_id
-- =====================================================================
SELECT user_id, COUNT(*) AS total
FROM therapists
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) > 1
ORDER BY total DESC;

-- =====================================================================
-- 2) Detect duplicate patients.user_id
-- =====================================================================
SELECT user_id, COUNT(*) AS total
FROM patients
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) > 1
ORDER BY total DESC;

-- =====================================================================
-- 3) Detect duplicate patients by (therapist_id, lower(email))
-- =====================================================================
SELECT therapist_id, lower(email) AS email_ci, COUNT(*) AS total
FROM patients
GROUP BY therapist_id, lower(email)
HAVING COUNT(*) > 1
ORDER BY total DESC, therapist_id;

-- =====================================================================
-- 4) Detect duplicate active appointments by (therapist_id, scheduled_at)
-- =====================================================================
SELECT therapist_id, scheduled_at, COUNT(*) AS total
FROM appointments
WHERE status IN ('pending', 'confirmed', 'in_progress')
GROUP BY therapist_id, scheduled_at
HAVING COUNT(*) > 1
ORDER BY total DESC, therapist_id, scheduled_at;

-- =====================================================================
-- 5) Suggested remediation strategy (execute manually with business review)
-- =====================================================================
-- a) For duplicate patients by therapist/email:
--    - Keep canonical row (earliest created_at).
--    - Repoint dependents (appointments, sessions, patient_* tables).
--    - Archive/delete duplicates only after repointing.
--
-- b) For duplicate active appointments at same slot:
--    - Keep canonical by created_at ASC.
--    - Move later duplicates to status='cancelled' with cancellation_reason='dedupe_conflict'.
--
-- c) For duplicate user_id mappings:
--    - Keep canonical profile linked to auth user.
--    - Archive and detach duplicates (set user_id = NULL) only with operator approval.

-- =====================================================================
-- 6) Example safe transaction for duplicate active appointments
-- =====================================================================
-- BEGIN;
--
-- WITH ranked AS (
--   SELECT id,
--          therapist_id,
--          scheduled_at,
--          ROW_NUMBER() OVER (
--            PARTITION BY therapist_id, scheduled_at
--            ORDER BY created_at ASC, id ASC
--          ) AS rn
--   FROM appointments
--   WHERE status IN ('pending', 'confirmed', 'in_progress')
-- ),
-- to_cancel AS (
--   SELECT id FROM ranked WHERE rn > 1
-- )
-- UPDATE appointments
-- SET status = 'cancelled',
--     cancellation_reason = COALESCE(cancellation_reason, 'dedupe_conflict'),
--     cancelled_at = NOW(),
--     cancelled_by = COALESCE(cancelled_by, 'system')
-- WHERE id IN (SELECT id FROM to_cancel);
--
-- COMMIT;

-- =====================================================================
-- 7) Post-remediation verification (must return zero rows)
-- =====================================================================
-- Re-run sections (1) to (4), then apply migration 20260305000005.
