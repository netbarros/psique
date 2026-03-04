import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSessionSummary } from "@/lib/openrouter";
import { getAIRatelimiter } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  // 1. Auth check
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Rate limiting (10/min per therapist)
  const ratelimiter = getAIRatelimiter();
  const { success, remaining } = await ratelimiter.limit(user.id);

  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Máximo 10 chamadas/minuto." },
      { status: 429 }
    );
  }

  // 3. Parse body
  const body = await req.json();
  const { sessionId, notes } = body as { sessionId: string; notes: string };

  if (!sessionId || !notes) {
    return NextResponse.json(
      { error: "sessionId e notes são obrigatórios" },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();

    // 4. Fetch session context
    const { data: session, error: sessionError } = await admin
      .from("sessions")
      .select(
        `*, 
         patient:patients(name, tags),
         appointment:appointments(scheduled_at),
         therapist:therapists(ai_model, user_id)`
      )
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // 5. Ensure therapist owns this session
    if (session.therapist?.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 6. Fetch previous summaries for context
    const { data: history } = await admin
      .from("sessions")
      .select("ai_summary")
      .eq("patient_id", session.patient_id)
      .not("ai_summary", "is", null)
      .order("created_at", { ascending: false })
      .limit(3);

    // 7. Generate AI summary
    const result = await generateSessionSummary({
      notes,
      patientName: (session.patient as { name: string })?.name ?? "Paciente",
      sessionNumber: session.session_number,
      previousSummaries: history?.map((h) => h.ai_summary!).filter(Boolean),
      model: session.therapist?.ai_model ?? undefined,
    });

    // 8. Save result to database
    await admin
      .from("sessions")
      .update({
        therapist_notes: notes,
        ai_summary: result.summary,
        ai_insights: result.insights,
        ai_next_steps: result.nextSteps,
        ai_risk_flags: result.riskFlags,
      })
      .eq("id", sessionId);

    logger.info("[AI/Summarize] Generated summary", {
      sessionId,
      userId: user.id,
      remaining,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error("[AI/Summarize] Error", {
      error: String(error),
      sessionId,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
