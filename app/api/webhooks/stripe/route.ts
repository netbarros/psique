import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { constructWebhookEvent } from "@/lib/stripe";
import { createRoom, createMeetingToken } from "@/lib/daily";
import { sendBookingConfirmation } from "@/lib/resend";
import { sendMessage } from "@/lib/telegram";
import { logger } from "@/lib/logger";
import type Stripe from "stripe";

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    logger.error("[Stripe] Webhook signature verification failed", { error: String(err) });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const appointmentId = session.metadata?.appointmentId;

        if (!appointmentId) {
          logger.warn("[Stripe] checkout.session.completed missing appointmentId");
          break;
        }

        // Fetch appointment details
        const { data: appointment, error: apptError } = await admin
          .from("appointments")
          .select(
            `*, 
             patient:patients(name, email, telegram_chat_id),
             therapist:therapists(name, session_duration, telegram_bot_token, telegram_bot_username)`
          )
          .eq("id", appointmentId)
          .single();

        if (apptError || !appointment) {
          logger.error("[Stripe] Appointment not found", { appointmentId });
          break;
        }

        // Create Daily.co room
        let videoRoomId: string | undefined;
        let videoRoomUrl: string | undefined;
        try {
          const room = await createRoom({
            sessionId: appointmentId,
            expiresInMinutes: 120,
          });
          videoRoomId = room.id;
          videoRoomUrl = room.url;

          // Create therapist token (owner)
          await createMeetingToken({
            roomName: room.name,
            isOwner: true,
            userName: (appointment.therapist as { name: string })?.name,
          });
        } catch (roomError) {
          logger.error("[Stripe] Failed to create Daily room", { error: String(roomError) });
        }

        // Update appointment
        await admin
          .from("appointments")
          .update({
            status: "confirmed",
            payment_status: "paid",
            stripe_session_id: session.id,
            stripe_payment_id: session.payment_intent as string,
            price_charged: session.amount_total ? session.amount_total / 100 : null,
            video_room_id: videoRoomId,
            video_room_url: videoRoomUrl,
          })
          .eq("id", appointmentId);

        const patient = appointment.patient as { name: string; email: string; telegram_chat_id?: number };
        const therapist = appointment.therapist as { name: string };

        // Send confirmation email
        if (patient?.email) {
          await sendBookingConfirmation({
            to: patient.email,
            patientName: patient.name,
            therapistName: therapist?.name ?? "sua terapeuta",
            scheduledAt: appointment.scheduled_at,
            roomUrl: videoRoomUrl,
          }).catch((err) =>
            logger.warn("[Stripe] Email send failed", { error: String(err) })
          );
        }

        // Send Telegram confirmation
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
            text: `✅ *Pagamento confirmado!*\n\nSua sessão com *${therapist?.name}* está confirmada para *${dateStr} às ${timeStr}*.\n\n🔗 O link de acesso será enviado 1h antes.`,
          }).catch((err) =>
            logger.warn("[Stripe] Telegram send failed", { error: String(err) })
          );
        }

        logger.info("[Stripe] checkout.session.completed processed", { appointmentId });
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        logger.warn("[Stripe] Payment failed", {
          paymentIntentId: intent.id,
          reason: intent.last_payment_error?.message,
        });
        break;
      }

      default:
        logger.info("[Stripe] Unhandled event", { type: event.type });
    }
  } catch (error) {
    logger.error("[Stripe] Webhook handler error", { error: String(error) });
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
