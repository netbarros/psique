import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("DB contract smoke", () => {
  it("contains core schema and enterprise RLS/uniqueness hardening", () => {
    const initialPath = path.join(ROOT, "supabase", "migrations", "20240301000001_initial.sql");
    const rlsPath = path.join(ROOT, "supabase", "migrations", "20260304000004_rls_authenticated_writes.sql");
    const hardeningPath = path.join(
      ROOT,
      "supabase",
      "migrations",
      "20260305000005_enterprise_supabase_hardening.sql"
    );
    const masterAdminDomainPath = path.join(
      ROOT,
      "supabase",
      "migrations",
      "20260305000007_master_admin_domain.sql"
    );

    const initialSql = fs.readFileSync(initialPath, "utf8").toLowerCase();
    const rlsSql = fs.readFileSync(rlsPath, "utf8").toLowerCase();
    const hardeningSql = fs.readFileSync(hardeningPath, "utf8").toLowerCase();
    const masterAdminSql = fs.readFileSync(masterAdminDomainPath, "utf8").toLowerCase();

    expect(initialSql).toContain("create table therapists");
    expect(initialSql).toContain("create table appointments");
    expect(initialSql).toContain("enable row level security");

    expect(rlsSql).toContain("therapist_insert_own_audit_logs");
    expect(rlsSql).toContain("patient_insert_own_audit_logs");
    expect(rlsSql).toContain("patient_insert_own_appointments");

    expect(hardeningSql).toContain("service_role_telegram_updates");
    expect(hardeningSql).toContain("patient_own_chat_messages");
    expect(hardeningSql).toContain("ux_therapists_user_id_not_null");
    expect(hardeningSql).toContain("ux_patients_user_id_not_null");
    expect(hardeningSql).toContain("ux_patients_therapist_email_ci");
    expect(hardeningSql).toContain("ux_appointments_therapist_scheduled_active");

    expect(masterAdminSql).toContain("create table if not exists user_roles");
    expect(masterAdminSql).toContain("create table if not exists plan_documents");
    expect(masterAdminSql).toContain("create table if not exists plan_revisions");
    expect(masterAdminSql).toContain("create table if not exists content_documents");
    expect(masterAdminSql).toContain("create table if not exists content_revisions");
    expect(masterAdminSql).toContain("create table if not exists platform_integrations");
    expect(masterAdminSql).toContain("create table if not exists admin_audit_events");
    expect(masterAdminSql).toContain("create or replace function is_master_admin");
    expect(masterAdminSql).toContain("create or replace function get_public_plans");
    expect(masterAdminSql).toContain("create or replace function get_public_content");
    expect(masterAdminSql).toContain("enable row level security");
  });
});
