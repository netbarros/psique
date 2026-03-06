import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRoom, createMeetingToken } from "@/lib/daily";
import { logger } from "@/lib/logger";
import { parseJsonBody } from "@/lib/api/request-validation";
import { CREDIT_ACTION_KEYS } from "@/lib/growth/constants";
import { consumeCreditsForAction, WalletError } from "@/lib/growth/wallet";

const postSchema = z.object({
  appointmentId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const route = "/api/video/room";
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    logger.warn("[Video] Unauthorized request", { route });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonBody({
    route,
    request: req,
    schema: postSchema,
    context: { userId: user.id },
  });
  if (!parsed.ok) {
    return parsed.response;
  }
  const { appointmentId } = parsed.data;

  try {
    const { data: appointment, error } = await supabase
      .from("appointments")
      .select("id, therapist_id, scheduled_at, duration_minutes, therapist:therapists(name, user_id)")
      .eq("id", appointmentId)
      .single();

    if (error || !appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const therapist = appointment.therapist as unknown as { name: string; user_id: string };
    if (therapist.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const room = await createRoom({
      sessionId: appointmentId,
      expiresInMinutes: appointment.duration_minutes + 30,
    });

    const therapistToken = await createMeetingToken({
      roomName: room.name,
      isOwner: true,
      userName: therapist.name,
      expiresInMinutes: appointment.duration_minutes + 30,
    });

    await supabase
      .from("appointments")
      .update({
        video_room_id: room.id,
        video_room_url: room.url,
      })
      .eq("id", appointmentId);

    const extraMinutes = Math.max((appointment.duration_minutes ?? 50) - 50, 0);
    if (extraMinutes > 0) {
      const admin = createAdminClient();
      const usage = await consumeCreditsForAction({
        admin,
        therapistId: appointment.therapist_id,
        actionKey: CREDIT_ACTION_KEYS.videoExtraMinutes,
        units: extraMinutes,
        correlationId: `video.extra_minutes:${appointmentId}:${extraMinutes}`,
        sourceType: "video.extra_minutes",
        sourceId: appointmentId,
        metadata: {
          roomId: room.id,
          durationMinutes: appointment.duration_minutes,
          extraMinutes,
        },
      });

      logger.info("[Video] Extra minutes billed", {
        appointmentId,
        extraMinutes,
        billedCredits: usage.billed_credits,
        usageEventId: usage.id,
      });
    }

    logger.info("[Video] Room created", { appointmentId, roomId: room.id });

    return NextResponse.json({
      success: true,
      data: {
        roomId: room.id,
        roomName: room.name,
        roomUrl: room.url,
        therapistToken,
      },
    });
  } catch (error) {
    if (error instanceof WalletError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }

    logger.error("[Video] Failed to create room", {
      route,
      requestId: parsed.requestId,
      userId: user.id,
      error: String(error),
      appointmentId,
    });
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}
