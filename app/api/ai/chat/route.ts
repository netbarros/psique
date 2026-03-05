import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { chatWithContext } from "@/lib/openrouter";
import { getAIRatelimiter } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";
import { parseJsonBody } from "@/lib/api/request-validation";
import { classifyAIError } from "@/lib/api/ai-error";
import { resolveOpenRouterRuntimeConfig } from "@/lib/api/openrouter-runtime";

const postSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(4000),
      })
    )
    .min(1)
    .max(20),
});

export async function POST(req: NextRequest) {
  const route = "/api/ai/chat";
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    logger.warn("[AI Chat] Unauthorized request", { route });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit
  const limiter = getAIRatelimiter();
  const { success } = await limiter.limit(user.id);
  if (!success) {
    logger.warn("[AI Chat] Rate limit exceeded", { route, userId: user.id });
    return NextResponse.json(
      { error: "Limite de requisições atingido. Aguarde um momento." },
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

  // Limit to last 10 messages for context window
  const recentMessages = parsed.data.messages.slice(-10);

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
        .select("ai_model, openrouter_key_hash")
        .eq("id", p.therapist_id)
        .single();

      const settings = therapist as unknown as {
        ai_model: string | null;
        openrouter_key_hash: string | null;
      } | null;
      const runtime = await resolveOpenRouterRuntimeConfig({
        route,
        defaultModel: "anthropic/claude-3-haiku",
        therapistModel: settings?.ai_model,
        therapistApiKeyCandidate: settings?.openrouter_key_hash,
      });

      patientContext = `Paciente: ${p.name}. Este é um chat de apoio emocional para o paciente. Não compartilhe informações clínicas privadas. Foque em bem-estar, técnicas de mindfulness, reflexão e apoio. Nunca faça diagnósticos. Responda sempre em português brasileiro.`;

      const reply = await chatWithContext({
        messages: recentMessages,
        patientContext,
        model: runtime.model,
        apiKey: runtime.apiKey,
      });

      logger.info("[AI Chat] Patient chat completed", {
        route,
        requestId: parsed.requestId,
        patientId: p.id,
        messageCount: recentMessages.length,
        model: runtime.modelUsed,
        modelSource: runtime.modelSource,
        keySource: runtime.keySource,
      });

      return NextResponse.json({
        success: true,
        data: {
          reply,
          ai: {
            provider: "openrouter",
            model: runtime.modelUsed,
            modelSource: runtime.modelSource,
            keySource: runtime.keySource,
          },
        },
      });
    }

    // Fallback if no patient record found (therapist self-chat)
    const { data: therapistByUser } = await supabase
      .from("therapists")
      .select("ai_model, openrouter_key_hash")
      .eq("user_id", user.id)
      .single();

    const fallbackSettings = therapistByUser as unknown as {
      ai_model: string | null;
      openrouter_key_hash: string | null;
    } | null;

    const runtime = await resolveOpenRouterRuntimeConfig({
      route,
      defaultModel: "anthropic/claude-3-haiku",
      therapistModel: fallbackSettings?.ai_model,
      therapistApiKeyCandidate: fallbackSettings?.openrouter_key_hash,
    });

    const reply = await chatWithContext({
      messages: recentMessages,
      model: runtime.model,
      apiKey: runtime.apiKey,
    });

    logger.info("[AI Chat] Therapist chat completed", {
      route,
      requestId: parsed.requestId,
      userId: user.id,
      messageCount: recentMessages.length,
      model: runtime.modelUsed,
      modelSource: runtime.modelSource,
      keySource: runtime.keySource,
    });

    return NextResponse.json({
      success: true,
      data: {
        reply,
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
    logger.error("[AI Chat] Error", {
      route,
      requestId: parsed.requestId,
      userId: user.id,
      error: String(error),
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
