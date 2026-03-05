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

    const initialSql = fs.readFileSync(initialPath, "utf8").toLowerCase();
    const rlsSql = fs.readFileSync(rlsPath, "utf8").toLowerCase();
    const hardeningSql = fs.readFileSync(hardeningPath, "utf8").toLowerCase();

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
  });
});
