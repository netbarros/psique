import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatWithContext } from "@/lib/openrouter";
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

  // Rate limit
  const limiter = getAIRatelimiter();
  const { success } = await limiter.limit(user.id);
  if (!success) {
    return NextResponse.json(
      { error: "Limite de requisições atingido. Aguarde um momento." },
      { status: 429 }
    );
  }

  const body = (await req.json()) as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  };

  if (!body.messages || body.messages.length === 0) {
    return NextResponse.json(
      { error: "messages is required" },
      { status: 400 }
    );
  }

  // Limit to last 10 messages for context window
  const recentMessages = body.messages.slice(-10);

  try {
    // Find patient record for context
    const { data: patient } = await supabase
      .from("patients")
      .select("id, name, therapist_id")
      .eq("user_id", user.id)
      .single();

    let patientContext: string | undefined;

    if (patient) {
      const p = patient as unknown as {
        id: string;
        name: string;
        therapist_id: string;
      };

      // Fetch therapist model preference
      const { data: therapist } = await supabase
        .from("therapists")
        .select("ai_model")
        .eq("id", p.therapist_id)
        .single();

      const model = (therapist as unknown as { ai_model: string | null })
        ?.ai_model;

      patientContext = `Paciente: ${p.name}. Este é um chat de apoio emocional para o paciente. Não compartilhe informações clínicas privadas. Foque em bem-estar, técnicas de mindfulness, reflexão e apoio. Nunca faça diagnósticos. Responda sempre em português brasileiro.`;

      const reply = await chatWithContext({
        messages: recentMessages,
        patientContext,
        model: model ?? undefined,
      });

      logger.info("[AI Chat] Patient chat completed", {
        patientId: p.id,
        messageCount: recentMessages.length,
      });

      return NextResponse.json({
        success: true,
        data: { reply },
      });
    }

    // Fallback if no patient record found
    const reply = await chatWithContext({
      messages: recentMessages,
    });

    return NextResponse.json({
      success: true,
      data: { reply },
    });
  } catch (error) {
    logger.error("[AI Chat] Error", { error: String(error) });
    return NextResponse.json(
      { error: "Erro interno ao processar sua mensagem" },
      { status: 500 }
    );
  }
}
