#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const MIGRATIONS_DIR = path.join(ROOT, "supabase", "migrations");
const REPORT_PATH = path.join(
  ROOT,
  "docs",
  "baselines",
  "mf24_supabase_deep",
  "preflight-report.json"
);
const PAGE_SIZE = 1000;

const args = new Set(process.argv.slice(2));
const writeReport = args.has("--write-report");
const outputJson = args.has("--json");
const skipRuntimeChecks =
  args.has("--skip-runtime") || process.env.SUPABASE_PREFLIGHT_SKIP_RUNTIME === "1";

const APPOINTMENT_ACTIVE_STATUSES = new Set(["pending", "confirmed", "in_progress"]);
const APPOINTMENT_STATUSES = new Set([
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
]);
const APPOINTMENT_PAYMENT_STATUSES = new Set(["pending", "paid", "refunded", "exempt", "free"]);
const SESSION_MOOD_MIN = 1;
const SESSION_MOOD_MAX = 10;
const PAYMENTS_STATUSES = new Set(["pending", "processing", "paid", "failed", "refunded", "disputed"]);
const PAYMENTS_METHODS = new Set(["stripe", "pix", "manual", "exempt"]);

const RLS_REQUIRED_TABLES = [
  "therapists",
  "availability",
  "availability_blocks",
  "patients",
  "appointments",
  "sessions",
  "medical_records",
  "payments",
  "telegram_configs",
  "audit_logs",
  "telegram_updates",
  "patient_journal_entries",
  "patient_mood_entries",
  "patient_chat_threads",
  "patient_chat_messages",
  "therapist_settings",
  "webhook_event_locks",
];

const POLICY_ALLOWLIST = {
  therapists: ["therapist_own"],
  appointments: [
    "therapist_appointments",
    "patient_own_appointments",
    "patient_insert_own_appointments",
  ],
  audit_logs: [
    "therapist_audit_logs",
    "therapist_insert_own_audit_logs",
    "patient_insert_own_audit_logs",
  ],
  patient_journal_entries: ["therapist_journal_entries", "patient_own_journal_entries"],
  patient_mood_entries: ["therapist_mood_entries", "patient_own_mood_entries"],
  patient_chat_threads: ["therapist_chat_threads", "patient_own_chat_threads"],
  patient_chat_messages: ["therapist_chat_messages", "patient_own_chat_messages"],
  therapist_settings: ["therapist_own_settings"],
  telegram_updates: ["service_role_telegram_updates"],
  webhook_event_locks: ["service_role_webhook_event_locks"],
};

const INDEX_PATTERNS = [
  { id: "ux_therapists_user_id_not_null", pattern: /\bux_therapists_user_id_not_null\b/i },
  { id: "ux_patients_user_id_not_null", pattern: /\bux_patients_user_id_not_null\b/i },
  { id: "ux_patients_therapist_email_ci", pattern: /\bux_patients_therapist_email_ci\b/i },
  {
    id: "ux_appointments_therapist_scheduled_active",
    pattern: /\bux_appointments_therapist_scheduled_active\b/i,
  },
  {
    id: "payments_stripe_payment_id_unique",
    pattern: /stripe_payment_id\s+text\s+unique/i,
  },
  {
    id: "webhook_event_locks_provider_event_unique",
    pattern: /unique\s*\(\s*provider\s*,\s*event_id\s*\)/i,
  },
  {
    id: "idx_webhook_event_locks_provider_status_created",
    pattern: /\bidx_webhook_event_locks_provider_status_created\b/i,
  },
];

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function loadEnvFromFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const lines = raw.replace(/\r/g, "").split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const idx = trimmed.indexOf("=");
      if (idx <= 0) continue;

      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();

      if (
        (value.startsWith("\"") && value.endsWith("\"")) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // Optional file; ignore when absent.
  }
}

async function loadLocalEnvFallback() {
  await loadEnvFromFile(path.join(ROOT, ".env.local"));
  await loadEnvFromFile(path.join(ROOT, ".env"));
}

async function selectAll(client, table, select, applyFilters) {
  const rows = [];
  let from = 0;

  while (true) {
    let query = client.from(table).select(select).range(from, from + PAGE_SIZE - 1);
    if (typeof applyFilters === "function") {
      query = applyFilters(query);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to query ${table}: ${error.message} (${error.code ?? "no-code"})`);
    }

    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

function collectDuplicateGroups(items, keyFn) {
  const counts = new Map();

  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

function normalizeEmail(email) {
  return String(email ?? "")
    .trim()
    .toLowerCase();
}

function pushCheck(checks, check) {
  checks.push({
    ...check,
    samples: check.samples ?? [],
  });
}

async function safeCheck(checks, { id, severity, run }) {
  try {
    const result = await run();
    pushCheck(checks, { id, severity, ...result });
  } catch (error) {
    pushCheck(checks, {
      id,
      severity,
      passed: false,
      detail: `Check failed with exception: ${String(error)}`,
      samples: [],
    });
  }
}

async function loadMigrationsSnapshot() {
  const entries = await fs.readdir(MIGRATIONS_DIR, { withFileTypes: true });
  const migrationFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort();

  const chunks = [];
  for (const file of migrationFiles) {
    const fullPath = path.join(MIGRATIONS_DIR, file);
    chunks.push(await fs.readFile(fullPath, "utf8"));
  }

  return {
    migrationFiles,
    sql: chunks.join("\n\n"),
  };
}

async function run() {
  await loadLocalEnvFallback();
  const autoSkipRuntimeChecks =
    /example\.supabase\.co/i.test(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "") ||
    /test-service-role-key/i.test(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "");
  const runtimeChecksDisabled = skipRuntimeChecks || autoSkipRuntimeChecks;

  const checks = [];
  const { migrationFiles, sql } = await loadMigrationsSnapshot();

  await safeCheck(checks, {
    id: "migrations_present",
    severity: "critical",
    run: async () => ({
      passed: migrationFiles.length > 0,
      detail:
        migrationFiles.length > 0
          ? `Loaded ${migrationFiles.length} migration files`
          : "No migration files found under supabase/migrations",
      samples: migrationFiles.slice(0, 10),
    }),
  });

  await safeCheck(checks, {
    id: "rls_enabled_tables_declared",
    severity: "critical",
    run: async () => {
      const missing = RLS_REQUIRED_TABLES.filter(
        (table) => !new RegExp(`alter\\s+table\\s+${table}\\s+enable\\s+row\\s+level\\s+security`, "i").test(sql)
      );
      return {
        passed: missing.length === 0,
        detail:
          missing.length === 0
            ? "RLS enable statements found for all required domain tables"
            : `Missing RLS enable statements for ${missing.length} table(s)`,
        samples: missing.slice(0, 20),
      };
    },
  });

  await safeCheck(checks, {
    id: "policy_allowlist_declared",
    severity: "critical",
    run: async () => {
      const missing = [];
      for (const [table, policies] of Object.entries(POLICY_ALLOWLIST)) {
        for (const policy of policies) {
          const regex = new RegExp(
            `(create|alter)\\s+policy\\s+"?${policy}"?\\s+on\\s+${table}`,
            "i"
          );
          if (!regex.test(sql)) {
            missing.push(`${table}:${policy}`);
          }
        }
      }
      return {
        passed: missing.length === 0,
        detail:
          missing.length === 0
            ? "Policy allowlist declarations found in migrations"
            : `Missing ${missing.length} expected policy declaration(s)`,
        samples: missing.slice(0, 30),
      };
    },
  });

  await safeCheck(checks, {
    id: "critical_indexes_and_constraints_declared",
    severity: "critical",
    run: async () => {
      const missing = INDEX_PATTERNS.filter((entry) => !entry.pattern.test(sql)).map((entry) => entry.id);
      return {
        passed: missing.length === 0,
        detail:
          missing.length === 0
            ? "Critical index/constraint declarations found in migrations"
            : `Missing ${missing.length} critical index/constraint declaration(s)`,
        samples: missing,
      };
    },
  });

  if (runtimeChecksDisabled) {
    pushCheck(checks, {
      id: "runtime_data_checks_skipped",
      severity: "major",
      passed: true,
      detail:
        "Runtime Supabase data checks skipped (explicit flag or placeholder CI credentials)",
      samples: [],
    });

    const summary = {
      total: checks.length,
      passed: checks.filter((check) => check.passed).length,
      failed: checks.filter((check) => !check.passed).length,
      criticalFailed: checks.filter((check) => !check.passed && check.severity === "critical").length,
    };

    const report = {
      generatedAt: new Date().toISOString(),
      summary,
      checks,
    };

    if (writeReport) {
      await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
      await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2) + "\n", "utf8");
    }

    if (outputJson) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(
        `[supabase-preflight] checks: ${summary.total}, passed: ${summary.passed}, failed: ${summary.failed}, criticalFailed: ${summary.criticalFailed}`
      );
      for (const check of checks) {
        const status = check.passed ? "PASS" : "FAIL";
        console.log(` - [${status}] ${check.id}: ${check.detail}`);
      }

      if (writeReport) {
        console.log(`[supabase-preflight] report written to ${path.relative(ROOT, REPORT_PATH)}`);
      }
    }

    if (summary.criticalFailed > 0) {
      process.exit(1);
    }

    return;
  }

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { "x-client-info": "psique-supabase-preflight-deep" } },
  });

  const therapists = await selectAll(supabase, "therapists", "id,user_id");
  const patients = await selectAll(supabase, "patients", "id,therapist_id,user_id,email,created_at");
  const appointments = await selectAll(
    supabase,
    "appointments",
    "id,therapist_id,patient_id,scheduled_at,status,payment_status,created_at"
  );
  const sessions = await selectAll(
    supabase,
    "sessions",
    "id,appointment_id,therapist_id,patient_id,mood_before,mood_after,created_at"
  );
  const payments = await selectAll(
    supabase,
    "payments",
    "id,appointment_id,therapist_id,patient_id,method,status,stripe_payment_id,currency"
  );

  let webhookLocks = [];
  await safeCheck(checks, {
    id: "webhook_event_locks_table_accessible",
    severity: "critical",
    run: async () => {
      webhookLocks = await selectAll(
        supabase,
        "webhook_event_locks",
        "id,provider,event_id,event_type,status,processed_at,error,created_at"
      );
      return {
        passed: true,
        detail: `webhook_event_locks accessible (${webhookLocks.length} rows)`,
      };
    },
  });

  const therapistDupUserIds = collectDuplicateGroups(
    therapists.filter((row) => row.user_id),
    (row) => row.user_id
  );
  pushCheck(checks, {
    id: "therapists_user_id_unique",
    severity: "critical",
    passed: therapistDupUserIds.length === 0,
    detail:
      therapistDupUserIds.length === 0
        ? "No duplicate therapists.user_id found"
        : `Found ${therapistDupUserIds.length} duplicate user_id group(s) in therapists`,
    samples: therapistDupUserIds.slice(0, 20),
  });

  const patientDupUserIds = collectDuplicateGroups(
    patients.filter((row) => row.user_id),
    (row) => row.user_id
  );
  pushCheck(checks, {
    id: "patients_user_id_unique",
    severity: "critical",
    passed: patientDupUserIds.length === 0,
    detail:
      patientDupUserIds.length === 0
        ? "No duplicate patients.user_id found"
        : `Found ${patientDupUserIds.length} duplicate user_id group(s) in patients`,
    samples: patientDupUserIds.slice(0, 20),
  });

  const patientDupTherapistEmail = collectDuplicateGroups(
    patients.filter((row) => row.therapist_id && row.email),
    (row) => `${row.therapist_id}::${normalizeEmail(row.email)}`
  );
  pushCheck(checks, {
    id: "patients_therapist_email_ci_unique",
    severity: "critical",
    passed: patientDupTherapistEmail.length === 0,
    detail:
      patientDupTherapistEmail.length === 0
        ? "No duplicate (therapist_id,email_ci) found in patients"
        : `Found ${patientDupTherapistEmail.length} duplicate therapist/email group(s) in patients`,
    samples: patientDupTherapistEmail.slice(0, 20),
  });

  const duplicateActiveSlots = collectDuplicateGroups(
    appointments.filter(
      (row) => row.therapist_id && row.scheduled_at && APPOINTMENT_ACTIVE_STATUSES.has(row.status)
    ),
    (row) => `${row.therapist_id}::${row.scheduled_at}`
  );
  pushCheck(checks, {
    id: "appointments_active_slot_unique",
    severity: "critical",
    passed: duplicateActiveSlots.length === 0,
    detail:
      duplicateActiveSlots.length === 0
        ? "No duplicate active appointment slots found"
        : `Found ${duplicateActiveSlots.length} duplicate active slot group(s)`,
    samples: duplicateActiveSlots.slice(0, 20),
  });

  const patientIds = new Set(patients.map((row) => row.id));
  const therapistIds = new Set(therapists.map((row) => row.id));
  const appointmentIds = new Set(appointments.map((row) => row.id));

  const orphanAppointments = appointments
    .filter((row) => !patientIds.has(row.patient_id) || !therapistIds.has(row.therapist_id))
    .map((row) => ({
      appointmentId: row.id,
      missingPatient: !patientIds.has(row.patient_id),
      missingTherapist: !therapistIds.has(row.therapist_id),
    }));
  pushCheck(checks, {
    id: "orphan_appointments_relations",
    severity: "critical",
    passed: orphanAppointments.length === 0,
    detail:
      orphanAppointments.length === 0
        ? "No orphan appointments detected"
        : `Found ${orphanAppointments.length} orphan appointment(s)`,
    samples: orphanAppointments.slice(0, 20),
  });

  const orphanSessions = sessions
    .filter((row) => {
      const missingAppointment = row.appointment_id && !appointmentIds.has(row.appointment_id);
      const missingPatient = !patientIds.has(row.patient_id);
      const missingTherapist = !therapistIds.has(row.therapist_id);
      return missingAppointment || missingPatient || missingTherapist;
    })
    .map((row) => ({
      sessionId: row.id,
      missingAppointment: Boolean(row.appointment_id && !appointmentIds.has(row.appointment_id)),
      missingPatient: !patientIds.has(row.patient_id),
      missingTherapist: !therapistIds.has(row.therapist_id),
    }));
  pushCheck(checks, {
    id: "orphan_sessions_relations",
    severity: "critical",
    passed: orphanSessions.length === 0,
    detail:
      orphanSessions.length === 0
        ? "No orphan sessions detected"
        : `Found ${orphanSessions.length} orphan session(s)`,
    samples: orphanSessions.slice(0, 20),
  });

  const invalidAppointmentStates = appointments
    .filter(
      (row) =>
        !APPOINTMENT_STATUSES.has(String(row.status)) ||
        !APPOINTMENT_PAYMENT_STATUSES.has(String(row.payment_status))
    )
    .map((row) => ({
      appointmentId: row.id,
      status: row.status,
      payment_status: row.payment_status,
    }));
  pushCheck(checks, {
    id: "appointments_state_values_valid",
    severity: "critical",
    passed: invalidAppointmentStates.length === 0,
    detail:
      invalidAppointmentStates.length === 0
        ? "No invalid appointment state values found"
        : `Found ${invalidAppointmentStates.length} appointment(s) with invalid state values`,
    samples: invalidAppointmentStates.slice(0, 20),
  });

  const invalidSessionMood = sessions
    .filter(
      (row) =>
        (row.mood_before != null &&
          (Number(row.mood_before) < SESSION_MOOD_MIN || Number(row.mood_before) > SESSION_MOOD_MAX)) ||
        (row.mood_after != null &&
          (Number(row.mood_after) < SESSION_MOOD_MIN || Number(row.mood_after) > SESSION_MOOD_MAX))
    )
    .map((row) => ({
      sessionId: row.id,
      mood_before: row.mood_before,
      mood_after: row.mood_after,
    }));
  pushCheck(checks, {
    id: "sessions_mood_values_valid",
    severity: "critical",
    passed: invalidSessionMood.length === 0,
    detail:
      invalidSessionMood.length === 0
        ? "No invalid session mood values found"
        : `Found ${invalidSessionMood.length} session(s) with invalid mood values`,
    samples: invalidSessionMood.slice(0, 20),
  });

  const invalidPayments = payments
    .filter(
      (row) =>
        !PAYMENTS_STATUSES.has(String(row.status)) ||
        (row.method != null && !PAYMENTS_METHODS.has(String(row.method)))
    )
    .map((row) => ({
      paymentId: row.id,
      status: row.status,
      method: row.method,
    }));
  pushCheck(checks, {
    id: "payments_state_values_valid",
    severity: "critical",
    passed: invalidPayments.length === 0,
    detail:
      invalidPayments.length === 0
        ? "No invalid payments state values found"
        : `Found ${invalidPayments.length} payment(s) with invalid status/method`,
    samples: invalidPayments.slice(0, 20),
  });

  if (webhookLocks.length > 0) {
    const lockDuplicates = collectDuplicateGroups(
      webhookLocks,
      (row) => `${row.provider}::${row.event_id}`
    );
    pushCheck(checks, {
      id: "webhook_event_locks_provider_event_unique_runtime",
      severity: "critical",
      passed: lockDuplicates.length === 0,
      detail:
        lockDuplicates.length === 0
          ? "No duplicate webhook_event_locks(provider,event_id) rows found"
          : `Found ${lockDuplicates.length} duplicate webhook lock group(s)`,
      samples: lockDuplicates.slice(0, 20),
    });

    const invalidLockStatus = webhookLocks
      .filter((row) => !["processing", "processed", "failed"].includes(String(row.status)))
      .map((row) => ({ id: row.id, status: row.status, event_id: row.event_id }));
    pushCheck(checks, {
      id: "webhook_event_locks_status_values_valid",
      severity: "critical",
      passed: invalidLockStatus.length === 0,
      detail:
        invalidLockStatus.length === 0
          ? "No invalid webhook_event_locks.status values found"
          : `Found ${invalidLockStatus.length} invalid webhook lock status value(s)`,
      samples: invalidLockStatus.slice(0, 20),
    });
  }

  const summary = {
    total: checks.length,
    passed: checks.filter((check) => check.passed).length,
    failed: checks.filter((check) => !check.passed).length,
    criticalFailed: checks.filter((check) => !check.passed && check.severity === "critical").length,
  };

  const report = {
    generatedAt: new Date().toISOString(),
    summary,
    checks,
  };

  if (writeReport) {
    await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
    await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2) + "\n", "utf8");
  }

  if (outputJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(
      `[supabase-preflight] checks: ${summary.total}, passed: ${summary.passed}, failed: ${summary.failed}, criticalFailed: ${summary.criticalFailed}`
    );
    for (const check of checks) {
      const status = check.passed ? "PASS" : "FAIL";
      console.log(` - [${status}] ${check.id}: ${check.detail}`);
      if (!check.passed && check.samples.length > 0) {
        console.log(`   sample: ${JSON.stringify(check.samples[0])}`);
      }
    }

    if (writeReport) {
      console.log(`[supabase-preflight] report written to ${path.relative(ROOT, REPORT_PATH)}`);
    }
  }

  if (summary.criticalFailed > 0) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error(`[supabase-preflight] failed: ${String(error)}`);
  process.exit(1);
});
