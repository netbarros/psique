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
  content: z.string().trim().min(1).max(4000),
  threadId: z.string().uuid().optional(),
});

async function getPatientOrNull() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data: patient } = await supabase
    .from("patients")
    .select("id, therapist_id, name")
    .eq("user_id", user.id)
    .single();

  if (!patient) return null;

  return {
    userId: user.id,
    patientId: patient.id,
    therapistId: patient.therapist_id,
    patientName: patient.name,
  };
}

export async function POST(request: Request) {
  const route = "/api/patient/chat/messages";
  const patient = await getPatientOrNull();
  if (!patient) {
    logger.warn("[PatientChat] Unauthorized request", { route });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonBody({
    route,
    request,
    schema: postSchema,
    context: { userId: patient.userId, patientId: patient.patientId },
  });
  if (!parsed.ok) {
    return parsed.response;
  }

  const limiter = getAIRatelimiter();
  const { success } = await limiter.limit(patient.userId);
  if (!success) {
    logger.warn("[PatientChat] Rate limit exceeded", { userId: patient.userId });
    return NextResponse.json({ error: "Limite de requisições atingido" }, { status: 429 });
  }

  const supabase = await createClient();

  let threadId = parsed.data.threadId;
  if (threadId) {
    const { data: existingThread } = await supabase
      .from("patient_chat_threads")
      .select("id")
      .eq("id", threadId)
      .eq("patient_id", patient.patientId)
      .single();

    if (!existingThread) {
      logger.warn("[PatientChat] Thread not found for patient", {
        threadId,
        patientId: patient.patientId,
      });
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }
  }

  if (!threadId) {
    const { data: createdThread, error: createThreadError } = await supabase
      .from("patient_chat_threads")
      .insert({
        patient_id: patient.patientId,
        therapist_id: patient.therapistId,
        title: parsed.data.content.slice(0, 70),
        last_message_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (createThreadError || !createdThread) {
      logger.error("[PatientChat] Failed to create thread", {
        route,
        requestId: parsed.requestId,
        error: String(createThreadError),
        patientId: patient.patientId,
      });
      return NextResponse.json({ error: "Failed to create chat thread" }, { status: 500 });
    }

    threadId = createdThread.id;
  }

  const userContent = parsed.data.content;

  const { error: insertUserError } = await supabase.from("patient_chat_messages").insert({
    thread_id: threadId,
    patient_id: patient.patientId,
    role: "user",
    content: userContent,
  });

  if (insertUserError) {
    logger.error("[PatientChat] Failed to persist user message", {
      route,
      requestId: parsed.requestId,
      error: String(insertUserError),
      threadId,
      patientId: patient.patientId,
    });
    return NextResponse.json({ error: "Failed to persist user message" }, { status: 500 });
  }

  const { data: previousMessages } = await supabase
    .from("patient_chat_messages")
    .select("role, content")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(12);

  const recentMessages = [...(previousMessages ?? [])]
    .reverse()
    .map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.content,
    }))
    .filter((message) => message.role === "user" || message.role === "assistant");

  const { data: therapistSettings } = await supabase
    .from("therapists")
    .select("ai_model, openrouter_key_hash")
    .eq("id", patient.therapistId)
    .single();

  try {
    const runtime = await resolveOpenRouterRuntimeConfig({
      route,
      defaultModel: "anthropic/claude-3-haiku",
      therapistModel: therapistSettings?.ai_model,
      therapistApiKeyCandidate: therapistSettings?.openrouter_key_hash,
    });

    const reply = await chatWithContext({
      messages: recentMessages,
      patientContext: `Paciente: ${patient.patientName}. Responda em português brasileiro com acolhimento, sem diagnóstico e sem prescrição. Foque em suporte breve, técnicas de regulação emocional e orientação para levar o tema à sessão clínica.`,
      model: runtime.model,
      apiKey: runtime.apiKey,
    });

    const { data: assistantMessage, error: assistantError } = await supabase
      .from("patient_chat_messages")
      .insert({
        thread_id: threadId,
        patient_id: patient.patientId,
        role: "assistant",
        content: reply,
      })
      .select("id, role, content, created_at")
      .single();

    if (assistantError || !assistantMessage) {
      logger.error("[PatientChat] Failed to persist assistant message", {
        route,
        requestId: parsed.requestId,
        error: String(assistantError),
        threadId,
        patientId: patient.patientId,
      });
      return NextResponse.json({ error: "Failed to persist assistant message" }, { status: 500 });
    }

    await supabase
      .from("patient_chat_threads")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", threadId);

    logger.info("[PatientChat] Message exchange completed", {
      route,
      requestId: parsed.requestId,
      threadId,
      patientId: patient.patientId,
      model: runtime.modelUsed,
      modelSource: runtime.modelSource,
      keySource: runtime.keySource,
    });

    return NextResponse.json({
      success: true,
      data: {
        threadId,
        reply: assistantMessage.content,
        message: {
          id: assistantMessage.id,
          role: assistantMessage.role,
          content: assistantMessage.content,
          createdAt: assistantMessage.created_at,
        },
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
    logger.error("[PatientChat] AI provider failure", {
      route,
      requestId: parsed.requestId,
      threadId,
      patientId: patient.patientId,
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
