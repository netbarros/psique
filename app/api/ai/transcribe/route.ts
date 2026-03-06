import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAIRatelimiter } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";
import { CREDIT_ACTION_KEYS } from "@/lib/growth/constants";
import {
  consumeCreditsForAction,
  ensureCreditWallet,
  getPricebookAction,
  getTherapistIdByUserId,
  WalletError,
} from "@/lib/growth/wallet";

function estimateTranscriptMinutes(transcriptText: string, durationMinutes?: number): number {
  if (typeof durationMinutes === "number" && Number.isFinite(durationMinutes) && durationMinutes > 0) {
    return Math.max(Math.ceil(durationMinutes), 1);
  }

  const words = transcriptText.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(Math.ceil(words / 150), 1);
}

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
    durationMinutes?: number;
    source?: "manual" | "upload" | "stream";
  };

  const transcriptText = body.transcriptText?.trim();
  const sessionId = body.sessionId?.trim();
  const consumedMinutes = estimateTranscriptMinutes(transcriptText ?? "", body.durationMinutes);

  if (!transcriptText) {
    return NextResponse.json(
      { error: "transcriptText é obrigatório" },
      { status: 400 },
    );
  }

  try {
    const admin = createAdminClient();
    let therapistId: string;

    if (sessionId) {
      const { data: session, error: sessionError } = await admin
        .from("sessions")
        .select("id, therapist_id, therapist:therapists(user_id)")
        .eq("id", sessionId)
        .single();

      if (sessionError || !session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      const therapistUserId = (session.therapist as { user_id?: string } | null)?.user_id;

      if (therapistUserId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      therapistId = session.therapist_id;
    } else {
      therapistId = await getTherapistIdByUserId(supabase, user.id);
    }

    const wallet = await ensureCreditWallet(admin, therapistId);
    const actionPrice = await getPricebookAction(admin, CREDIT_ACTION_KEYS.transcriptionMinute);
    const projectedCost = actionPrice.unit_cost_credits * consumedMinutes;
    if (wallet.balance_total_credits < projectedCost) {
      return NextResponse.json(
        {
          error: "Saldo de créditos insuficiente para transcrição.",
          code: "INSUFFICIENT_CREDITS",
        },
        { status: 402 },
      );
    }

    if (sessionId) {
      const { error: updateError } = await admin
        .from("sessions")
        .update({ transcript: transcriptText })
        .eq("id", sessionId);

      if (updateError) {
        throw updateError;
      }
    }

    const correlationId = `transcription.minute:${sessionId ?? "adhoc"}:${transcriptText.slice(0, 32)}`;
    const usage = await consumeCreditsForAction({
      admin,
      therapistId,
      actionKey: CREDIT_ACTION_KEYS.transcriptionMinute,
      units: consumedMinutes,
      correlationId,
      sourceType: "transcription.minute",
      sourceId: sessionId ?? therapistId,
      metadata: {
        source: body.source ?? "manual",
        estimatedMinutes: consumedMinutes,
      },
    });

    logger.info("[AI/Transcribe] Transcript persisted", {
      sessionId,
      userId: user.id,
      source: body.source ?? "manual",
      consumedMinutes,
      billedCredits: usage.billed_credits,
      usageEventId: usage.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: sessionId ?? null,
        transcript: transcriptText,
        persisted: Boolean(sessionId),
        source: body.source ?? "manual",
        consumedMinutes,
        billedCredits: usage.billed_credits,
        remaining,
      },
    });
  } catch (error) {
    if (error instanceof WalletError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }

    logger.error("[AI/Transcribe] Error", { error: String(error), sessionId });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
