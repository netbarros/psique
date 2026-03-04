-- ═══════════════════════════════════════════════════════════
-- PSIQUE — Rollback Migration 001
-- Run this to undo the initial migration
-- ═══════════════════════════════════════════════════════════

-- Drop triggers first
DROP TRIGGER IF EXISTS telegram_configs_updated_at ON telegram_configs;
DROP TRIGGER IF EXISTS medical_records_updated_at ON medical_records;
DROP TRIGGER IF EXISTS appointments_updated_at ON appointments;
DROP TRIGGER IF EXISTS patients_updated_at ON patients;
DROP TRIGGER IF EXISTS therapists_updated_at ON therapists;
DROP FUNCTION IF EXISTS update_updated_at();

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS telegram_configs CASCADE;
DROP TABLE IF EXISTS telegram_updates CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS medical_records CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS availability_blocks CASCADE;
DROP TABLE IF EXISTS availability CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS therapists CASCADE;

-- Drop extensions (only if not used by other projects)
-- DROP EXTENSION IF EXISTS "pg_trgm";
-- DROP EXTENSION IF EXISTS "pgcrypto";
-- DROP EXTENSION IF EXISTS "uuid-ossp";
