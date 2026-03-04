import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRoom, createMeetingToken } from "@/lib/daily";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { appointmentId } = (await req.json()) as { appointmentId: string };

  if (!appointmentId) {
    return NextResponse.json({ error: "appointmentId is required" }, { status: 400 });
  }

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
    logger.error("[Video] Failed to create room", { error: String(error), appointmentId });
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}
