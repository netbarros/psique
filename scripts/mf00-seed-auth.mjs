#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const BASELINE_DIR = (() => {
  if (process.env.MF_BASELINE_DIR) return process.env.MF_BASELINE_DIR;
  const mf00rPath = path.join(process.cwd(), "docs", "baselines", "mf00r");
  return mf00rPath;
})();
const OUTPUT_FILE = path.join(BASELINE_DIR, "seed-state.json");

const THERAPIST_EMAIL = process.env.E2E_THERAPIST_EMAIL ?? "e2e.therapist@psique.local";
const THERAPIST_PASSWORD = process.env.E2E_THERAPIST_PASSWORD ?? "E2E_Psique_123!";
const PATIENT_EMAIL = process.env.E2E_PATIENT_EMAIL ?? "e2e.patient@psique.local";
const PATIENT_PASSWORD = process.env.E2E_PATIENT_PASSWORD ?? "E2E_Psique_123!";

const FIXTURES = {
  therapist: {
    slug: "test-terapeuta",
    crp: "06/990001",
    name: "Administrador E2E",
  },
  patient: {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Paciente E2E",
  },
  appointment: {
    id: "22222222-2222-4222-8222-222222222222",
    roomId: "room-stitch-check",
  },
  session: {
    id: "33333333-3333-4333-8333-333333333333",
  },
  payment: {
    id: "44444444-4444-4444-8444-444444444444",
  },
};

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

async function loadDotEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  let content = "";
  try {
    content = await fs.readFile(envPath, "utf8");
  } catch {
    return;
  }

  for (const rawLine of content.split("\n")) {
    const line = rawLine.replace(/\r/g, "").trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

async function getUserByEmail(admin, email) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const found = (data?.users ?? []).find(
      (user) => user.email?.toLowerCase() === email.toLowerCase()
    );
    if (found) return found;
    if ((data?.users ?? []).length < perPage) return null;
    page += 1;
  }
}

async function ensureUser(admin, { email, password, role }) {
  let user = await getUserByEmail(admin, email);

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, seeded_by: "mf00" },
    });
    if (error) throw error;
    user = data.user;
  } else {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      user_metadata: { ...(user.user_metadata ?? {}), role, seeded_by: "mf00" },
    });
    if (error) throw error;
  }

  return user.id;
}

async function resolveTherapistRow(admin, therapistUserId) {
  const { data: byUser } = await admin
    .from("therapists")
    .select("id")
    .eq("user_id", therapistUserId)
    .maybeSingle();
  if (byUser?.id) return byUser.id;

  const { data: bySlug } = await admin
    .from("therapists")
    .select("id")
    .eq("slug", FIXTURES.therapist.slug)
    .maybeSingle();
  if (bySlug?.id) return bySlug.id;

  const { data: byCrp } = await admin
    .from("therapists")
    .select("id")
    .eq("crp", FIXTURES.therapist.crp)
    .maybeSingle();
  if (byCrp?.id) return byCrp.id;

  return null;
}

async function ensureTherapist(admin, therapistUserId) {
  const therapistId = await resolveTherapistRow(admin, therapistUserId);
  const payload = {
    user_id: therapistUserId,
    name: FIXTURES.therapist.name,
    crp: FIXTURES.therapist.crp,
    bio: "Conta de baseline E2E para validação visual.",
    slug: FIXTURES.therapist.slug,
    specialties: ["Psicanálise", "TCC"],
    session_price: 200,
    session_duration: 50,
    timezone: "America/Sao_Paulo",
    ai_model: "anthropic/claude-sonnet-4-5",
    onboarding_completed: true,
    active: true,
  };

  if (therapistId) {
    const { error } = await admin.from("therapists").update(payload).eq("id", therapistId);
    if (error) throw error;
    return therapistId;
  }

  const { data, error } = await admin.from("therapists").insert(payload).select("id").single();
  if (error) throw error;
  return data.id;
}

async function ensureAvailability(admin, therapistId) {
  const { error: deleteError } = await admin.from("availability").delete().eq("therapist_id", therapistId);
  if (deleteError) throw deleteError;

  const availabilityRows = [
    { therapist_id: therapistId, day_of_week: 1, start_time: "09:00", end_time: "17:00", active: true },
    { therapist_id: therapistId, day_of_week: 3, start_time: "09:00", end_time: "17:00", active: true },
    { therapist_id: therapistId, day_of_week: 5, start_time: "09:00", end_time: "17:00", active: true },
  ];

  const { error } = await admin.from("availability").insert(availabilityRows);
  if (error) throw error;
}

async function ensurePatient(admin, therapistId, patientUserId) {
  const patientPayload = {
    id: FIXTURES.patient.id,
    therapist_id: therapistId,
    user_id: patientUserId,
    name: FIXTURES.patient.name,
    email: PATIENT_EMAIL,
    phone: "+55 11 90000-0000",
    status: "active",
    mood_score: 4,
    gdpr_consent: true,
    onboarding_source: "mf00",
  };

  const { error } = await admin.from("patients").upsert(patientPayload, { onConflict: "id" });
  if (error) throw error;

  return FIXTURES.patient.id;
}

async function ensureAppointment(admin, therapistId, patientId) {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 60);

  const appointmentPayload = {
    id: FIXTURES.appointment.id,
    therapist_id: therapistId,
    patient_id: patientId,
    scheduled_at: now.toISOString(),
    duration_minutes: 50,
    type: "online",
    status: "confirmed",
    video_room_id: FIXTURES.appointment.roomId,
    video_room_url: "https://example.com/room-stitch-check",
    payment_status: "paid",
    price_charged: 200,
  };

  const { error } = await admin.from("appointments").upsert(appointmentPayload, { onConflict: "id" });
  if (error) throw error;

  return FIXTURES.appointment.id;
}

async function ensureSession(admin, therapistId, patientId, appointmentId) {
  const sessionPayload = {
    id: FIXTURES.session.id,
    appointment_id: appointmentId,
    therapist_id: therapistId,
    patient_id: patientId,
    session_number: 1,
    duration_seconds: 3000,
    mood_before: 4,
    mood_after: 5,
    nps_score: 5,
    ai_summary: "Sessão de baseline E2E.",
    ai_insights: ["Padrão de melhora de humor na sessão."],
    ai_next_steps: ["Manter rotina de acompanhamento."],
    ai_risk_flags: [],
  };

  const { error } = await admin.from("sessions").upsert(sessionPayload, { onConflict: "id" });
  if (error) throw error;
}

async function ensurePayment(admin, therapistId, patientId, appointmentId) {
  const paymentPayload = {
    id: FIXTURES.payment.id,
    appointment_id: appointmentId,
    therapist_id: therapistId,
    patient_id: patientId,
    amount: 200,
    currency: "BRL",
    method: "stripe",
    status: "paid",
    paid_at: new Date().toISOString(),
  };

  const { error } = await admin.from("payments").upsert(paymentPayload, { onConflict: "id" });
  if (error) throw error;
}

async function main() {
  await loadDotEnvLocal();
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const therapistUserId = await ensureUser(admin, {
    email: THERAPIST_EMAIL,
    password: THERAPIST_PASSWORD,
    role: "therapist",
  });

  const patientUserId = await ensureUser(admin, {
    email: PATIENT_EMAIL,
    password: PATIENT_PASSWORD,
    role: "patient",
  });

  const therapistId = await ensureTherapist(admin, therapistUserId);
  await ensureAvailability(admin, therapistId);
  const patientId = await ensurePatient(admin, therapistId, patientUserId);
  const appointmentId = await ensureAppointment(admin, therapistId, patientId);
  await ensureSession(admin, therapistId, patientId, appointmentId);
  await ensurePayment(admin, therapistId, patientId, appointmentId);

  await fs.mkdir(BASELINE_DIR, { recursive: true });
  await fs.writeFile(
    OUTPUT_FILE,
    JSON.stringify(
      {
        seededAt: new Date().toISOString(),
        therapist: {
          email: THERAPIST_EMAIL,
          userId: therapistUserId,
          therapistId,
          slug: FIXTURES.therapist.slug,
          roomId: FIXTURES.appointment.roomId,
        },
        patient: {
          email: PATIENT_EMAIL,
          userId: patientUserId,
          patientId,
        },
        appointment: { id: appointmentId },
      },
      null,
      2
    ),
    "utf8"
  );

  process.stdout.write(
    `MF-00 seed complete\n` +
      `Therapist email: ${THERAPIST_EMAIL}\n` +
      `Patient email: ${PATIENT_EMAIL}\n` +
      `Room ID: ${FIXTURES.appointment.roomId}\n` +
      `Scope slug: ${FIXTURES.therapist.slug}\n`
  );
}

main().catch((error) => {
  process.stderr.write(`MF-00 seed failed: ${error.message}\n`);
  process.exit(1);
});
