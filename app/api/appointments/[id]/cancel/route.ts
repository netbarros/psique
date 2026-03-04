import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRefund } from "@/lib/stripe";
import { sendEmail } from "@/lib/resend";
import { sendMessage } from "@/lib/telegram";
import { logger } from "@/lib/logger";

// Default cancellation policy: 24 hours before
const DEFAULT_CANCELLATION_HOURS = 24;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: appointmentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { reason?: string };
  const admin = createAdminClient();

  try {
    // Fetch appointment with relations
    const { data: appointment, error: apptError } = await admin
      .from("appointments")
      .select(
        `*, 
         patient:patients(id, name, email, user_id, telegram_chat_id),
         therapist:therapists(id, name, user_id, cancellation_policy_hours, telegram_bot_token)`
      )
      .eq("id", appointmentId)
      .single();

    if (apptError || !appointment) {
      return NextResponse.json(
        { error: "Agendamento não encontrado" },
        { status: 404 }
      );
    }

    // Determine who is cancelling
    const patient = appointment.patient as unknown as {
      id: string;
      name: string;
      email: string;
      user_id: string | null;
      telegram_chat_id: number | null;
    };
    const therapist = appointment.therapist as unknown as {
      id: string;
      name: string;
      user_id: string | null;
      cancellation_policy_hours: number | null;
      telegram_bot_token: string | null;
    };

    const isTherapist = user.id === therapist.user_id;
    const isPatient = user.id === patient.user_id;

    if (!isTherapist && !isPatient) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if already cancelled
    if (appointment.status === "cancelled") {
      return NextResponse.json(
        { error: "Este agendamento já foi cancelado" },
        { status: 400 }
      );
    }

    // Check if completed
    if (appointment.status === "completed") {
      return NextResponse.json(
        { error: "Não é possível cancelar uma sessão já realizada" },
        { status: 400 }
      );
    }

    // Check cancellation policy (for patient-initiated)
    const policyHours =
      therapist.cancellation_policy_hours ?? DEFAULT_CANCELLATION_HOURS;
    const scheduledDate = new Date(appointment.scheduled_at);
    const hoursUntil =
      (scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60);
    const withinPolicy = hoursUntil >= policyHours;
    const cancelledBy = isTherapist ? "therapist" : "patient";

    // If patient cancels within the policy window, flag it (but still allow)
    const shouldRefund = isTherapist || withinPolicy;

    // Update appointment
    await admin
      .from("appointments")
      .update({
        status: "cancelled",
        cancellation_reason:
          body.reason ?? (isTherapist ? "Cancelado pelo terapeuta" : "Cancelado pelo paciente"),
        cancelled_at: new Date().toISOString(),
        cancelled_by: cancelledBy,
      })
      .eq("id", appointmentId);

    // Process refund if applicable
    let refunded = false;
    if (
      shouldRefund &&
      appointment.payment_status === "paid" &&
      appointment.stripe_payment_id
    ) {
      try {
        await createRefund({
          paymentIntentId: appointment.stripe_payment_id,
          reason: "requested_by_customer",
        });

        await admin
          .from("appointments")
          .update({ payment_status: "refunded" })
          .eq("id", appointmentId);

        refunded = true;
      } catch (refundError) {
        logger.error("[Cancel] Refund failed", {
          error: String(refundError),
          appointmentId,
        });
      }
    }

    // Send cancellation email to patient
    if (patient.email) {
      const date = scheduledDate.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      });

      await sendEmail({
        to: patient.email,
        subject: `❌ Sessão cancelada — ${date}`,
        html: `
<!DOCTYPE html>
<html>
<body style="background:#080F0B;color:#DDD7C8;font-family:'Instrument Sans',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
  <div style="background:#121A14;border:1px solid #1C2E20;border-radius:16px;padding:32px;">
    <h2 style="font-weight:300;color:#B85450;margin:0 0 12px">Sessão Cancelada</h2>
    <p style="color:#C8BFA8">Olá, ${patient.name}.</p>
    <p style="color:#C8BFA8">Sua sessão com <strong>${therapist.name}</strong> em <strong>${date}</strong> foi cancelada${cancelledBy === "therapist" ? " pelo terapeuta" : ""}.</p>
    ${refunded ? '<p style="color:#52B788;font-weight:500">💰 Reembolso processado automaticamente.</p>' : ""}
    ${!withinPolicy && cancelledBy === "patient" ? '<p style="color:#C4A35A;font-size:13px">⚠️ Cancelamento dentro do prazo de ' + policyHours + 'h — reembolso não aplicável conforme política.</p>' : ""}
    <p style="font-size:13px;color:#8A8070;margin-top:24px">Para reagendar, acesse seu portal ou visite a página de booking do seu terapeuta.</p>
  </div>
</body>
</html>`,
      }).catch((err) =>
        logger.warn("[Cancel] Email failed", { error: String(err) })
      );
    }

    // Send Telegram notification
    if (patient.telegram_chat_id) {
      await sendMessage({
        chatId: patient.telegram_chat_id,
        text: `❌ *Sessão cancelada*\n\nSua sessão com *${therapist.name}* foi cancelada.\n${refunded ? "💰 Reembolso processado." : ""}`,
      }).catch((err) =>
        logger.warn("[Cancel] Telegram failed", { error: String(err) })
      );
    }

    logger.info("[Cancel] Appointment cancelled", {
      appointmentId,
      cancelledBy,
      refunded,
      withinPolicy,
    });

    return NextResponse.json({
      success: true,
      data: {
        refunded,
        withinPolicy,
        cancelledBy,
      },
    });
  } catch (error) {
    logger.error("[Cancel] Error", { error: String(error) });
    return NextResponse.json(
      { error: "Erro interno ao cancelar" },
      { status: 500 }
    );
  }
}
