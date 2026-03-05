import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMessage, buildReminderMessage, buildNPSMessage, buildNPSKeyboard } from "@/lib/telegram";
import { sendSessionReminder } from "@/lib/resend";
import { logger } from "@/lib/logger";
import { getRequestId } from "@/lib/api/request-validation";

export async function GET(req: NextRequest) {
  const route = "/api/cron/reminders";
  const requestId = getRequestId(req);
  // Auth via CRON_SECRET
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    logger.warn("[Cron] Unauthorized reminders call", { route, requestId });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const results = { reminders24h: 0, reminders1h: 0, nps: 0, errors: 0 };

  const now = new Date();

  // ── 24h Reminders ─────────────────────────────────────────────
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in24h5 = new Date(in24h.getTime() + 5 * 60 * 1000);

  const { data: upcoming24h } = await admin
    .from("appointments")
    .select(
      `id, scheduled_at,
       patient:patients(name, email, telegram_chat_id),
       therapist:therapists(name, first_name:name)`
    )
    .eq("status", "confirmed")
    .eq("reminder_24h_sent", false)
    .gte("scheduled_at", in24h.toISOString())
    .lte("scheduled_at", in24h5.toISOString());

  for (const appt of upcoming24h ?? []) {
    try {
      const patient = appt.patient as unknown as { name: string; email: string; telegram_chat_id?: number };
      const therapist = appt.therapist as unknown as { name: string };

      if (patient?.telegram_chat_id) {
        await sendMessage({
          chatId: patient.telegram_chat_id,
          text: buildReminderMessage({
            therapistName: therapist?.name ?? "sua terapeuta",
            scheduledAt: appt.scheduled_at,
            hours: 24,
          }),
        });
      }

      if (patient?.email) {
        await sendSessionReminder({
          to: patient.email,
          patientName: patient.name,
          therapistName: therapist?.name ?? "sua terapeuta",
          scheduledAt: appt.scheduled_at,
          hoursUntil: 24,
        });
      }

      await admin
        .from("appointments")
        .update({ reminder_24h_sent: true })
        .eq("id", appt.id);

      results.reminders24h++;
    } catch (err) {
      logger.error("[Cron] 24h reminder error", {
        route,
        requestId,
        apptId: appt.id,
        error: String(err),
      });
      results.errors++;
    }
  }

  // ── 1h Reminders ──────────────────────────────────────────────
  const in1h = new Date(now.getTime() + 60 * 60 * 1000);
  const in1h5 = new Date(in1h.getTime() + 5 * 60 * 1000);

  const { data: upcoming1h } = await admin
    .from("appointments")
    .select(
      `id, scheduled_at, video_room_url,
       patient:patients(name, email, telegram_chat_id),
       therapist:therapists(name)`
    )
    .eq("status", "confirmed")
    .eq("reminder_1h_sent", false)
    .gte("scheduled_at", in1h.toISOString())
    .lte("scheduled_at", in1h5.toISOString());

  for (const appt of upcoming1h ?? []) {
    try {
      const patient = appt.patient as unknown as { name: string; email: string; telegram_chat_id?: number };
      const therapist = appt.therapist as unknown as { name: string };

      if (patient?.telegram_chat_id) {
        await sendMessage({
          chatId: patient.telegram_chat_id,
          text: buildReminderMessage({
            therapistName: therapist?.name ?? "sua terapeuta",
            scheduledAt: appt.scheduled_at,
            hours: 1,
          }),
        });
      }

      if (patient?.email) {
        await sendSessionReminder({
          to: patient.email,
          patientName: patient.name,
          therapistName: therapist?.name ?? "sua terapeuta",
          scheduledAt: appt.scheduled_at,
          roomUrl: appt.video_room_url ?? undefined,
          hoursUntil: 1,
        });
      }

      await admin
        .from("appointments")
        .update({ reminder_1h_sent: true })
        .eq("id", appt.id);

      results.reminders1h++;
    } catch (err) {
      logger.error("[Cron] 1h reminder error", {
        route,
        requestId,
        apptId: appt.id,
        error: String(err),
      });
      results.errors++;
    }
  }

  // ── NPS (2h after session end) ────────────────────────────────
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const twoAndHalfHoursAgo = new Date(now.getTime() - 2.5 * 60 * 60 * 1000);

  const { data: completedSessions } = await admin
    .from("appointments")
    .select(
      `id, scheduled_at, duration_minutes,
       patient:patients(name, telegram_chat_id),
       therapist:therapists(name),
       session:sessions!appointment_id(id, nps_score)`
    )
    .eq("status", "completed")
    .eq("nps_sent", false)
    .gte("scheduled_at", twoAndHalfHoursAgo.toISOString())
    .lte("scheduled_at", twoHoursAgo.toISOString());

  for (const appt of completedSessions ?? []) {
    try {
      const patient = appt.patient as unknown as { name: string; telegram_chat_id?: number };
      const therapist = appt.therapist as unknown as { name: string };
      const session = appt.session as unknown as { id: string } | null;

      if (patient?.telegram_chat_id && session?.id) {
        const firstName = therapist?.name?.split(" ")[0] ?? "";
        await sendMessage({
          chatId: patient.telegram_chat_id,
          text: buildNPSMessage(firstName),
          replyMarkup: buildNPSKeyboard(session.id),
        });
      }

      await admin
        .from("appointments")
        .update({ nps_sent: true })
        .eq("id", appt.id);

      results.nps++;
    } catch (err) {
      logger.error("[Cron] NPS send error", {
        route,
        requestId,
        apptId: appt.id,
        error: String(err),
      });
      results.errors++;
    }
  }

  logger.info("[Cron] Reminders job completed", { route, requestId, ...results });
  return NextResponse.json({ ok: true, ...results, timestamp: now.toISOString() });
}
