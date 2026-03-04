import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCheckoutSession } from "@/lib/stripe";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    therapistId: string;
    scheduledAt: string;
    patientName: string;
    patientEmail: string;
    patientPhone?: string;
    slug: string;
  };

  if (
    !body.therapistId ||
    !body.scheduledAt ||
    !body.patientName ||
    !body.patientEmail
  ) {
    return NextResponse.json(
      { error: "Campos obrigatórios faltando" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  try {
    // Verify therapist exists and is active
    const { data: therapist, error: tError } = await admin
      .from("therapists")
      .select("id, name, session_price, session_duration")
      .eq("id", body.therapistId)
      .eq("active", true)
      .single();

    if (tError || !therapist) {
      return NextResponse.json(
        { error: "Terapeuta não encontrado" },
        { status: 404 }
      );
    }

    // Check for double-booking
    const scheduledDate = new Date(body.scheduledAt);
    const endDate = new Date(
      scheduledDate.getTime() + therapist.session_duration * 60 * 1000
    );

    const { data: conflicts } = await admin
      .from("appointments")
      .select("id")
      .eq("therapist_id", body.therapistId)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_at", scheduledDate.toISOString())
      .lt("scheduled_at", endDate.toISOString());

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: "Este horário já está reservado. Escolha outro." },
        { status: 409 }
      );
    }

    // Find or create patient
    let patientId: string;
    const { data: existingPatient } = await admin
      .from("patients")
      .select("id")
      .eq("therapist_id", body.therapistId)
      .eq("email", body.patientEmail)
      .single();

    if (existingPatient) {
      patientId = existingPatient.id;
    } else {
      const { data: newPatient, error: pError } = await admin
        .from("patients")
        .insert({
          therapist_id: body.therapistId,
          name: body.patientName,
          email: body.patientEmail,
          phone: body.patientPhone ?? null,
          status: "lead",
          onboarding_source: "booking",
          gdpr_consent: true,
          gdpr_consent_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (pError || !newPatient) {
        logger.error("[Booking] Failed to create patient", {
          error: String(pError),
        });
        return NextResponse.json(
          { error: "Erro ao criar cadastro" },
          { status: 500 }
        );
      }
      patientId = newPatient.id;
    }

    // Create appointment (pending payment)
    const { data: appointment, error: apptError } = await admin
      .from("appointments")
      .insert({
        therapist_id: body.therapistId,
        patient_id: patientId,
        scheduled_at: body.scheduledAt,
        duration_minutes: therapist.session_duration,
        type: "online",
        status: "pending",
        payment_status: "pending",
        price_charged: Number(therapist.session_price),
      })
      .select("id")
      .single();

    if (apptError || !appointment) {
      logger.error("[Booking] Failed to create appointment", {
        error: String(apptError),
      });
      return NextResponse.json(
        { error: "Erro ao criar agendamento" },
        { status: 500 }
      );
    }

    // Create Stripe Checkout session
    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const checkoutSession = await createCheckoutSession({
      appointmentId: appointment.id,
      therapistName: therapist.name,
      patientEmail: body.patientEmail,
      patientName: body.patientName,
      amount: Math.round(Number(therapist.session_price) * 100), // BRL cents
      scheduledAt: body.scheduledAt,
      successUrl: `${origin}/booking/${body.slug}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/booking/${body.slug}?cancelled=true`,
    });

    logger.info("[Booking] Checkout session created", {
      appointmentId: appointment.id,
      checkoutSessionId: checkoutSession.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl: checkoutSession.url,
        appointmentId: appointment.id,
      },
    });
  } catch (error) {
    logger.error("[Booking] Checkout error", { error: String(error) });
    return NextResponse.json(
      { error: "Erro interno ao processar agendamento" },
      { status: 500 }
    );
  }
}
