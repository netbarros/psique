import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSessionSummary } from "@/lib/openrouter";
import { getAIRatelimiter } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { parseJsonBody } from "@/lib/api/request-validation";
import { classifyAIError } from "@/lib/api/ai-error";
import { resolveOpenRouterRuntimeConfig } from "@/lib/api/openrouter-runtime";

const postSchema = z.object({
  sessionId: z.string().uuid(),
  notes: z.string().trim().min(1).max(20000),
});

export async function POST(req: NextRequest) {
  const route = "/api/ai/summarize";
  // 1. Auth check
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    logger.warn("[AI/Summarize] Unauthorized request", { route });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Rate limiting (10/min per therapist)
  const ratelimiter = getAIRatelimiter();
  const { success, remaining } = await ratelimiter.limit(user.id);

  if (!success) {
    logger.warn("[AI/Summarize] Rate limit exceeded", { route, userId: user.id });
    return NextResponse.json(
      { error: "Rate limit exceeded. Máximo 10 chamadas/minuto." },
      { status: 429 }
    );
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

  const { sessionId, notes } = parsed.data;

  try {
    const admin = createAdminClient();

    // 4. Fetch session context
    const { data: session, error: sessionError } = await admin
      .from("sessions")
      .select(
        `*, 
         patient:patients(name, tags),
         appointment:appointments(scheduled_at),
         therapist:therapists(ai_model, user_id, openrouter_key_hash)`
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

    const runtime = await resolveOpenRouterRuntimeConfig({
      route,
      defaultModel: "anthropic/claude-3.5-sonnet",
      therapistModel: session.therapist?.ai_model,
      therapistApiKeyCandidate: session.therapist?.openrouter_key_hash,
    });

    // 7. Generate AI summary
    const result = await generateSessionSummary({
      notes,
      patientName: (session.patient as { name: string })?.name ?? "Paciente",
      sessionNumber: session.session_number,
      previousSummaries: history?.map((h) => h.ai_summary!).filter(Boolean),
      model: runtime.model,
      apiKey: runtime.apiKey,
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
      route,
      requestId: parsed.requestId,
      sessionId,
      userId: user.id,
      remaining,
      model: runtime.modelUsed,
      modelSource: runtime.modelSource,
      keySource: runtime.keySource,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        ai: {
          provider: "openrouter",
          model: runtime.modelUsed,
          modelSource: runtime.modelSource,
          keySource: runtime.keySource,
        },
      },
    });
  } catch (error) {
    const classified = classifyAIError(error);
    logger.error("[AI/Summarize] Error", {
      route,
      requestId: parsed.requestId,
      error: String(error),
      userId: user.id,
      sessionId,
      errorCode: classified.code,
      errorStatus: classified.status,
      providerStatus: classified.providerStatus ?? null,
    });
    return NextResponse.json(
      { error: classified.message, code: classified.code },
      { status: classified.status }
    );
  }
}
