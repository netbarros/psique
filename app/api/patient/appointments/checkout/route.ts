import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCheckoutSession } from "@/lib/stripe";
import { logger } from "@/lib/logger";

const postSchema = z.object({
  scheduledAt: z.string().datetime(),
  patientName: z.string().trim().min(2).max(120).optional(),
  patientEmail: z.string().trim().email().optional(),
  patientPhone: z.string().trim().max(40).optional(),
});

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: patient } = await supabase
    .from("patients")
    .select("id, therapist_id, name, email, phone")
    .eq("user_id", user.id)
    .single();

  if (!patient) {
    return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });
  }

  const { data: therapist } = await admin
    .from("therapists")
    .select("id, name, session_price, session_duration, slug, active")
    .eq("id", patient.therapist_id)
    .single();

  if (!therapist || !therapist.active) {
    return NextResponse.json({ error: "Therapist unavailable" }, { status: 404 });
  }

  const scheduledDate = new Date(parsed.data.scheduledAt);
  const slotEnd = new Date(scheduledDate.getTime() + therapist.session_duration * 60 * 1000);

  const { data: conflicts } = await admin
    .from("appointments")
    .select("id")
    .eq("therapist_id", therapist.id)
    .in("status", ["pending", "confirmed", "in_progress"])
    .gte("scheduled_at", scheduledDate.toISOString())
    .lt("scheduled_at", slotEnd.toISOString());

  if ((conflicts ?? []).length > 0) {
    return NextResponse.json({ error: "Este horário já está reservado" }, { status: 409 });
  }

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .insert({
      therapist_id: therapist.id,
      patient_id: patient.id,
      scheduled_at: scheduledDate.toISOString(),
      duration_minutes: therapist.session_duration,
      type: "online",
      status: "pending",
      payment_status: "pending",
      price_charged: Number(therapist.session_price),
    })
    .select("id")
    .single();

  if (appointmentError || !appointment) {
    if (isUniqueViolation(appointmentError)) {
      return NextResponse.json({ error: "Este horário acabou de ser reservado" }, { status: 409 });
    }
    logger.error("[PatientCheckout] Failed to create appointment", {
      error: String(appointmentError),
      userId: user.id,
    });
    return NextResponse.json({ error: "Falha ao criar agendamento" }, { status: 500 });
  }

  const origin =
    request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const checkoutSession = await createCheckoutSession({
    appointmentId: appointment.id,
    therapistName: therapist.name,
    patientEmail: parsed.data.patientEmail ?? patient.email,
    patientName: parsed.data.patientName ?? patient.name,
    amount: Math.round(Number(therapist.session_price) * 100),
    scheduledAt: scheduledDate.toISOString(),
    successUrl: `${origin}/booking/${therapist.slug}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${origin}/portal/agendar?cancelled=true`,
  });

  await supabase.from("audit_logs").insert({
    therapist_id: therapist.id,
    user_id: user.id,
    action: "create",
    table_name: "appointments",
    record_id: appointment.id,
    metadata: { source: "patient_portal_checkout" },
  });

  return NextResponse.json({
    success: true,
    data: {
      appointmentId: appointment.id,
      checkoutUrl: checkoutSession.url,
    },
  });
}
