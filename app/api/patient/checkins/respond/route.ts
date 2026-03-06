import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedContext } from "@/lib/auth/master-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

const checkinSchema = z.object({
  appointmentId: z.string().uuid(),
  moodLabel: z.enum(["good", "neutral", "difficult"]),
  responseNote: z.string().trim().max(5000).optional(),
  channel: z.enum(["telegram", "email", "whatsapp", "portal"]).default("portal"),
});

export async function POST(request: Request) {
  const auth = await requireAuthenticatedContext();
  if (!auth.context) {
    logger.warn("[Patient/CheckinRespond] Unauthorized access", { route: "/api/patient/checkins/respond" });
    return auth.response;
  }

  const parsedBody = checkinSchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    logger.warn("[Patient/CheckinRespond] Invalid payload", {
      route: "/api/patient/checkins/respond",
      issues: parsedBody.error.issues.length,
    });
    return NextResponse.json({ error: parsedBody.error.issues[0]?.message ?? "Invalid payload" }, { status: 422 });
  }

  const admin = createAdminClient();

  const { data: patient, error: patientError } = await admin
    .from("patients")
    .select("id, therapist_id, user_id")
    .eq("user_id", auth.context.user.id)
    .maybeSingle();

  if (patientError || !patient?.id) {
    logger.warn("[Patient/CheckinRespond] Patient not found", {
      route: "/api/patient/checkins/respond",
      userId: auth.context.user.id,
      error: patientError?.message ?? null,
    });
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const { data: appointment, error: appointmentError } = await admin
    .from("appointments")
    .select("id, status, patient_id, therapist_id")
    .eq("id", parsedBody.data.appointmentId)
    .eq("patient_id", patient.id)
    .single();

  if (appointmentError || !appointment) {
    logger.warn("[Patient/CheckinRespond] Appointment not found", {
      route: "/api/patient/checkins/respond",
      appointmentId: parsedBody.data.appointmentId,
      patientId: patient.id,
      error: appointmentError?.message ?? null,
    });
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  if (appointment.status === "cancelled" || appointment.status === "no_show") {
    logger.warn("[Patient/CheckinRespond] Invalid appointment status for check-in", {
      route: "/api/patient/checkins/respond",
      appointmentId: appointment.id,
      status: appointment.status,
    });
    return NextResponse.json(
      { error: "Check-in is not allowed for cancelled or no-show appointments." },
      { status: 409 },
    );
  }

  const { data: prefs } = await admin
    .from("patient_communication_preferences")
    .select("checkin_opt_in")
    .eq("patient_id", patient.id)
    .maybeSingle();

  if (prefs && prefs.checkin_opt_in === false) {
    logger.warn("[Patient/CheckinRespond] Patient opted out", {
      route: "/api/patient/checkins/respond",
      patientId: patient.id,
      appointmentId: appointment.id,
    });
    return NextResponse.json({ error: "Patient opted out of check-ins." }, { status: 409 });
  }

  const { data, error } = await admin
    .from("patient_session_checkins")
    .upsert(
      {
        appointment_id: appointment.id,
        patient_id: patient.id,
        therapist_id: appointment.therapist_id,
        mood_label: parsedBody.data.moodLabel,
        channel: parsedBody.data.channel,
        response_note: parsedBody.data.responseNote ?? null,
        responded_at: new Date().toISOString(),
        status: "responded",
      },
      { onConflict: "appointment_id" },
    )
    .select("id, appointment_id, mood_label, channel, response_note, responded_at, status, created_at")
    .single();

  if (error || !data) {
    logger.error("[Patient/CheckinRespond] Failed to save check-in response", {
      route: "/api/patient/checkins/respond",
      patientId: patient.id,
      appointmentId: appointment.id,
      error: error?.message ?? "Unknown error",
    });
    return NextResponse.json({ error: "Failed to save check-in response" }, { status: 500 });
  }

  logger.info("[Patient/CheckinRespond] Check-in response saved", {
    route: "/api/patient/checkins/respond",
    patientId: patient.id,
    appointmentId: appointment.id,
    checkinId: data.id,
  });
  return NextResponse.json({
    success: true,
    data,
  });
}
