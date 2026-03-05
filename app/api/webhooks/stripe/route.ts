import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { constructWebhookEvent } from "@/lib/stripe";
import { createRoom, createMeetingToken } from "@/lib/daily";
import { sendBookingConfirmation } from "@/lib/resend";
import { sendMessage } from "@/lib/telegram";
import { logger } from "@/lib/logger";
import type Stripe from "stripe";
import { getRequestId } from "@/lib/api/request-validation";

const route = "/api/webhooks/stripe";
const STRIPE_PROVIDER = "stripe";

const checkoutSessionSchema = z.object({
  id: z.string().min(1),
  metadata: z
    .object({
      appointmentId: z.string().min(1),
    })
    .passthrough()
    .optional(),
  payment_intent: z.union([z.string(), z.object({ id: z.string() })]).nullable().optional(),
  amount_total: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
});

type AdminClient = ReturnType<typeof createAdminClient>;

function resolvePaymentIntentId(
  paymentIntent: Stripe.Checkout.Session["payment_intent"]
): string | null {
  if (!paymentIntent) return null;
  if (typeof paymentIntent === "string") return paymentIntent;
  return paymentIntent.id;
}

function toErrorMessage(error: unknown): string {
  return String(error).slice(0, 1024);
}

async function setWebhookLockStatus(params: {
  admin: AdminClient;
  eventId: string;
  status: "processing" | "processed" | "failed";
  error?: string | null;
  markProcessed?: boolean;
}) {
  const payload: Record<string, unknown> = {
    status: params.status,
    error: params.error ?? null,
  };
  if (params.markProcessed) {
    payload.processed_at = new Date().toISOString();
  }

  await params.admin
    .from("webhook_event_locks")
    .update(payload)
    .eq("provider", STRIPE_PROVIDER)
    .eq("event_id", params.eventId);
}

async function acquireWebhookLock(params: {
  admin: AdminClient;
  eventId: string;
  eventType: string;
  requestId?: string;
}): Promise<"acquired" | "processed" | "in_progress"> {
  const { admin, eventId, eventType, requestId } = params;
  const { error } = await admin.from("webhook_event_locks").insert({
    provider: STRIPE_PROVIDER,
    event_id: eventId,
    event_type: eventType,
    status: "processing",
  });

  if (!error) return "acquired";

  if (error.code !== "23505") {
    throw error;
  }

  const { data: lockRow, error: lockError } = await admin
    .from("webhook_event_locks")
    .select("status")
    .eq("provider", STRIPE_PROVIDER)
    .eq("event_id", eventId)
    .maybeSingle();

  if (lockError) {
    throw lockError;
  }

  if (!lockRow) {
    return "in_progress";
  }

  if (lockRow.status === "processed") {
    return "processed";
  }

  if (lockRow.status === "failed") {
    const { data: updated, error: reclaimError } = await admin
      .from("webhook_event_locks")
      .update({
        status: "processing",
        error: null,
        processed_at: null,
      })
      .eq("provider", STRIPE_PROVIDER)
      .eq("event_id", eventId)
      .eq("status", "failed")
      .select("event_id")
      .maybeSingle();

    if (reclaimError) {
      throw reclaimError;
    }

    if (updated) {
      logger.info("[Stripe] Reclaimed failed webhook lock", {
        route,
        eventId,
        eventType,
        requestId,
      });
      return "acquired";
    }
  }

  return "in_progress";
}

async function processCheckoutCompleted(params: {
  admin: AdminClient;
  event: Stripe.Event;
  requestId?: string;
}) {
  const { admin, event, requestId } = params;
  const parsedSession = checkoutSessionSchema.safeParse(event.data.object);

  if (!parsedSession.success) {
    logger.warn("[Stripe] Invalid checkout.session.completed payload", {
      route,
      eventId: event.id,
      requestId,
      issues: parsedSession.error.issues.map((issue) => issue.message),
    });
    return;
  }

  const session = parsedSession.data;
  const appointmentId = session.metadata?.appointmentId;

  if (!appointmentId) {
    logger.warn("[Stripe] checkout.session.completed missing appointmentId", {
      route,
      eventId: event.id,
      requestId,
    });
    return;
  }

  const { data: appointment, error: apptError } = await admin
    .from("appointments")
    .select(
      `id, therapist_id, patient_id, status, payment_status, scheduled_at, video_room_id, video_room_url,
       patient:patients(name, email, telegram_chat_id),
       therapist:therapists(name)`
    )
    .eq("id", appointmentId)
    .maybeSingle();

  if (apptError || !appointment) {
    logger.error("[Stripe] Appointment not found", {
      route,
      eventId: event.id,
      requestId,
      appointmentId,
      error: String(apptError),
    });
    return;
  }

  const paymentIntentId = resolvePaymentIntentId(session.payment_intent as Stripe.Checkout.Session["payment_intent"]);
  const amount = session.amount_total ? session.amount_total / 100 : null;
  const wasAlreadyPaid =
    appointment.status === "confirmed" && appointment.payment_status === "paid";

  let videoRoomId = appointment.video_room_id;
  let videoRoomUrl = appointment.video_room_url;

  if (!videoRoomId || !videoRoomUrl) {
    try {
      const room = await createRoom({
        sessionId: appointmentId,
        expiresInMinutes: 120,
      });
      videoRoomId = room.id;
      videoRoomUrl = room.url;

      await createMeetingToken({
        roomName: room.name,
        isOwner: true,
        userName: (appointment.therapist as { name?: string } | null)?.name,
      });
    } catch (roomError) {
      logger.error("[Stripe] Failed to create Daily room", {
        route,
        eventId: event.id,
        requestId,
        appointmentId,
        error: String(roomError),
      });
    }
  }

  await admin
    .from("appointments")
    .update({
      status: "confirmed",
      payment_status: "paid",
      stripe_session_id: session.id,
      stripe_payment_id: paymentIntentId,
      price_charged: amount,
      video_room_id: videoRoomId,
      video_room_url: videoRoomUrl,
    })
    .eq("id", appointmentId);

  let shouldInsertPayment = true;
  if (paymentIntentId) {
    const { data: existingPayment } = await admin
      .from("payments")
      .select("id")
      .eq("stripe_payment_id", paymentIntentId)
      .maybeSingle();
    shouldInsertPayment = !existingPayment;
  }

  if (shouldInsertPayment) {
    const { error: paymentError } = await admin.from("payments").insert({
      appointment_id: appointmentId,
      therapist_id: appointment.therapist_id,
      patient_id: appointment.patient_id,
      amount: amount ?? 0,
      currency: (session.currency ?? "brl").toUpperCase(),
      method: "stripe",
      stripe_payment_id: paymentIntentId,
      status: "paid",
      paid_at: new Date().toISOString(),
    });

    if (paymentError && paymentError.code !== "23505") {
      throw paymentError;
    }
  }

  const patient = appointment.patient as
    | { name?: string; email?: string | null; telegram_chat_id?: number | null }
    | null;
  const therapist = appointment.therapist as { name?: string } | null;

  // Side effects only on first effective payment transition.
  if (!wasAlreadyPaid) {
    if (patient?.email) {
      await sendBookingConfirmation({
        to: patient.email,
        patientName: patient.name ?? "Paciente",
        therapistName: therapist?.name ?? "sua terapeuta",
        scheduledAt: appointment.scheduled_at,
        roomUrl: videoRoomUrl ?? undefined,
      }).catch((error) =>
        logger.warn("[Stripe] Email send failed", {
          route,
          eventId: event.id,
          requestId,
          appointmentId,
          error: String(error),
        })
      );
    }

    if (patient?.telegram_chat_id) {
      const dateStr = new Date(appointment.scheduled_at).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      });
      const timeStr = new Date(appointment.scheduled_at).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      await sendMessage({
        chatId: patient.telegram_chat_id,
        text: `✅ *Pagamento confirmado!*\n\nSua sessão com *${therapist?.name ?? "sua terapeuta"}* está confirmada para *${dateStr} às ${timeStr}*.\n\n🔗 O link de acesso será enviado 1h antes.`,
      }).catch((error) =>
        logger.warn("[Stripe] Telegram send failed", {
          route,
          eventId: event.id,
          requestId,
          appointmentId,
          error: String(error),
        })
      );
    }
  }

  logger.info("[Stripe] checkout.session.completed processed", {
    route,
    eventId: event.id,
    requestId,
    appointmentId,
    wasAlreadyPaid,
  });
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    logger.warn("[Stripe] Missing stripe signature", { route, requestId });
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    logger.error("[Stripe] Webhook signature verification failed", {
      route,
      requestId,
      error: String(err),
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();
  let lockState: "acquired" | "processed" | "in_progress";
  try {
    lockState = await acquireWebhookLock({
      admin,
      eventId: event.id,
      eventType: event.type,
      requestId,
    });
  } catch (error) {
    logger.error("[Stripe] Failed to acquire webhook lock", {
      route,
      requestId,
      eventId: event.id,
      eventType: event.type,
      error: String(error),
    });
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  if (lockState === "processed") {
    logger.info("[Stripe] Duplicate processed event ignored", {
      route,
      requestId,
      eventId: event.id,
      eventType: event.type,
    });
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (lockState === "in_progress") {
    logger.info("[Stripe] Event already in progress, skipping retry", {
      route,
      requestId,
      eventId: event.id,
      eventType: event.type,
    });
    return NextResponse.json({ received: true, inProgress: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await processCheckoutCompleted({ admin, event, requestId });
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        logger.warn("[Stripe] Payment failed", {
          route,
          requestId,
          eventId: event.id,
          paymentIntentId: intent.id,
          reason: intent.last_payment_error?.message,
        });
        break;
      }

      default:
        logger.info("[Stripe] Unhandled event", {
          route,
          requestId,
          eventId: event.id,
          type: event.type,
        });
    }
    await setWebhookLockStatus({
      admin,
      eventId: event.id,
      status: "processed",
      error: null,
      markProcessed: true,
    });
  } catch (error) {
    await setWebhookLockStatus({
      admin,
      eventId: event.id,
      status: "failed",
      error: toErrorMessage(error),
    }).catch((lockError) => {
      logger.error("[Stripe] Failed to update webhook lock status", {
        route,
        requestId,
        eventId: event.id,
        error: String(lockError),
      });
    });

    logger.error("[Stripe] Webhook handler error", {
      route,
      requestId,
      eventId: event.id,
      eventType: event.type,
      error: String(error),
    });
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
