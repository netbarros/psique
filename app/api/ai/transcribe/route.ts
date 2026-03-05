import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAIRatelimiter } from "@/lib/ratelimit";
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

  const ratelimiter = getAIRatelimiter();
  const { success, remaining } = await ratelimiter.limit(user.id);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = (await req.json()) as {
    sessionId?: string;
    transcriptText?: string;
    source?: "manual" | "upload" | "stream";
  };

  const transcriptText = body.transcriptText?.trim();
  const sessionId = body.sessionId?.trim();

  if (!transcriptText) {
    return NextResponse.json(
      { error: "transcriptText é obrigatório" },
      { status: 400 },
    );
  }

  if (!sessionId) {
    return NextResponse.json({
      success: true,
      data: {
        transcript: transcriptText,
        persisted: false,
        source: body.source ?? "manual",
        remaining,
      },
    });
  }

  try {
    const admin = createAdminClient();

    const { data: session, error: sessionError } = await admin
      .from("sessions")
      .select("id, therapist_id, therapist:therapists(user_id)")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const therapistUserId = (session.therapist as { user_id?: string } | null)
      ?.user_id;

    if (therapistUserId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: updateError } = await admin
      .from("sessions")
      .update({ transcript: transcriptText })
      .eq("id", sessionId);

    if (updateError) {
      throw updateError;
    }

    logger.info("[AI/Transcribe] Transcript persisted", {
      sessionId,
      userId: user.id,
      source: body.source ?? "manual",
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        transcript: transcriptText,
        persisted: true,
        source: body.source ?? "manual",
        remaining,
      },
    });
  } catch (error) {
    logger.error("[AI/Transcribe] Error", { error: String(error), sessionId });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
