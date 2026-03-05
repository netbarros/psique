import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generatePatientInsights } from "@/lib/openrouter";
import { getAIRatelimiter } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";
import { sanitizeOpenRouterApiKeyCandidate } from "@/lib/api/openrouter-key";
import { classifyAIError } from "@/lib/api/ai-error";

const postSchema = z.object({
  patientLimit: z.number().int().min(1).max(50).optional(),
});

export async function POST(req: Request) {
  const route = "/api/ai/insights";
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    logger.warn("[AI/Insights] Unauthorized request", { route });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let patientLimit = 20;
  const rawBody = await req.text();
  if (rawBody.trim().length > 0) {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawBody);
    } catch (error) {
      logger.warn("[AI/Insights] Invalid JSON payload", {
        route,
        userId: user.id,
        error: String(error),
      });
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const parsedPayload = postSchema.safeParse(parsedJson);
    if (!parsedPayload.success) {
      logger.warn("[AI/Insights] Invalid payload", {
        route,
        userId: user.id,
        issues: parsedPayload.error.issues.map((issue) => issue.message),
      });
      return NextResponse.json(
        {
          error: "Invalid payload",
          details: parsedPayload.error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      );
    }
    patientLimit = parsedPayload.data.patientLimit ?? patientLimit;
  }

  const ratelimiter = getAIRatelimiter();
  const { success } = await ratelimiter.limit(user.id);
  if (!success) {
    logger.warn("[AI/Insights] Rate limit exceeded", { route, userId: user.id });
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    // Fetch therapist
    const { data: therapist } = await supabase
      .from("therapists")
      .select("id, ai_model, openrouter_key_hash")
      .eq("user_id", user.id)
      .single();

    if (!therapist) {
      return NextResponse.json({ error: "Therapist not found" }, { status: 404 });
    }

    // Fetch active patients with recent summaries
    const { data: patients } = await supabase
      .from("patients")
      .select(`
        id, name, tags, mood_score, status,
        sessions:sessions(session_number, ai_summary, created_at)
      `)
      .eq("therapist_id", therapist.id)
      .in("status", ["active", "new"])
      .order("updated_at", { ascending: false })
      .limit(patientLimit);

    const patientsData = (patients ?? []).map((p) => {
      const sessions = (p.sessions as Array<{ session_number: number; ai_summary: string | null; created_at: string }>) ?? [];
      const recentSummaries = sessions
        .filter((s) => s.ai_summary)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3)
        .map((s) => s.ai_summary!);

      return {
        name: p.name,
        sessions: sessions.length,
        tags: p.tags ?? [],
        moodScore: p.mood_score ?? undefined,
        recentSummaries,
      };
    });

    if (patientsData.length === 0) {
      return NextResponse.json({
        success: true,
        data: { insights: ["Adicione pacientes para gerar insights de carteira."], recommendations: [], alerts: [] },
      });
    }

    const result = await generatePatientInsights({
      patients: patientsData,
      model: therapist.ai_model ?? undefined,
      apiKey: sanitizeOpenRouterApiKeyCandidate(therapist.openrouter_key_hash),
    });

    logger.info("[AI/Insights] Generated insights", {
      route,
      therapistId: therapist.id,
      patientCount: patientsData.length,
      patientLimit,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const classified = classifyAIError(error);
    logger.error("[AI/Insights] Error", {
      route,
      userId: user.id,
      error: String(error),
      errorCode: classified.code,
      errorStatus: classified.status,
      providerStatus: classified.providerStatus ?? null,
    });
    return NextResponse.json({ error: classified.message, code: classified.code }, { status: classified.status });
  }
}
