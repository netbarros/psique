import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePatientInsights } from "@/lib/openrouter";
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
  const { success } = await ratelimiter.limit(user.id);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    // Fetch therapist
    const { data: therapist } = await supabase
      .from("therapists")
      .select("id, ai_model")
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
      .limit(20);

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
    });

    logger.info("[AI/Insights] Generated insights", { therapistId: therapist.id, patientCount: patientsData.length });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error("[AI/Insights] Error", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
