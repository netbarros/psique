import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createRoom, createMeetingToken } from "@/lib/daily";
import { logger } from "@/lib/logger";
import { parseJsonBody } from "@/lib/api/request-validation";

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
    // Verify ownership
    const { data: appointment, error } = await supabase
      .from("appointments")
      .select("id, scheduled_at, duration_minutes, therapist:therapists(name, user_id)")
      .eq("id", appointmentId)
      .single();

    if (error || !appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const therapist = appointment.therapist as unknown as { name: string; user_id: string };
    if (therapist.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create Daily room
    const room = await createRoom({
      sessionId: appointmentId,
      expiresInMinutes: appointment.duration_minutes + 30,
    });

    // Create therapist owner token
    const therapistToken = await createMeetingToken({
      roomName: room.name,
      isOwner: true,
      userName: therapist.name,
      expiresInMinutes: appointment.duration_minutes + 30,
    });

    // Update appointment with room info
    await supabase
      .from("appointments")
      .update({
        video_room_id: room.id,
        video_room_url: room.url,
      })
      .eq("id", appointmentId);

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
