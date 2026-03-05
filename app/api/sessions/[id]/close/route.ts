import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { parseJsonBody } from "@/lib/api/request-validation";

const patchSchema = z.object({
  notes: z.string().max(12000).optional(),
  moodBefore: z.number().int().min(1).max(10).nullable().optional(),
  moodAfter: z.number().int().min(1).max(10).nullable().optional(),
  endedAt: z.string().datetime().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const route = "/api/sessions/[id]/close";
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    logger.warn("[SessionsClose] Unauthorized request", { route, sessionId: id });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonBody({
    route,
    request,
    schema: patchSchema,
    context: { sessionId: id, userId: user.id },
  });
  if (!parsed.ok) {
    return parsed.response;
  }

  const { data: therapist } = await supabase
    .from("therapists")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!therapist) {
    logger.warn("[SessionsClose] Therapist not found for user", {
      route,
      requestId: parsed.requestId,
      sessionId: id,
      userId: user.id,
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id, appointment_id, started_at, therapist_id")
    .eq("id", id)
    .eq("therapist_id", therapist.id)
    .single();

  if (sessionError || !session) {
    logger.warn("[SessionsClose] Session not found or forbidden", {
      route,
      requestId: parsed.requestId,
      sessionId: id,
      therapistId: therapist.id,
      error: String(sessionError),
    });
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const endedAt = parsed.data.endedAt ? new Date(parsed.data.endedAt) : new Date();
  const startedAt = session.started_at ? new Date(session.started_at) : null;
  const durationSeconds = startedAt
    ? Math.max(0, Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000))
    : null;

  const { error: updateSessionError } = await supabase
    .from("sessions")
    .update({
      ended_at: endedAt.toISOString(),
      duration_seconds: durationSeconds,
      therapist_notes: parsed.data.notes ?? null,
      mood_before: parsed.data.moodBefore ?? null,
      mood_after: parsed.data.moodAfter ?? null,
    })
    .eq("id", id)
    .eq("therapist_id", therapist.id);

  if (updateSessionError) {
    logger.error("[SessionsClose] Failed to update session", {
      route,
      requestId: parsed.requestId,
      sessionId: id,
      therapistId: therapist.id,
      error: String(updateSessionError),
    });
    return NextResponse.json({ error: "Failed to close session" }, { status: 500 });
  }

  if (session.appointment_id) {
    await supabase
      .from("appointments")
      .update({ status: "completed" })
      .eq("id", session.appointment_id)
      .neq("status", "cancelled");
  }

  await supabase.from("audit_logs").insert({
    therapist_id: therapist.id,
    user_id: user.id,
    action: "update",
    table_name: "sessions",
    record_id: session.id,
    metadata: {
      appointmentId: session.appointment_id,
      durationSeconds,
    },
  });

  logger.info("[SessionsClose] Session closed", {
    route,
    requestId: parsed.requestId,
    sessionId: session.id,
    therapistId: therapist.id,
    durationSeconds,
  });

  return NextResponse.json({
    success: true,
    data: {
      sessionId: session.id,
      endedAt: endedAt.toISOString(),
      durationSeconds,
    },
  });
}
