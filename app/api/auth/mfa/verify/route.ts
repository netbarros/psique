import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { parseJsonBody } from "@/lib/api/request-validation";

const postSchema = z.object({
  factorId: z.string().trim().min(1),
  code: z.string().trim().min(1).max(12),
});

export async function POST(req: NextRequest) {
  const route = "/api/auth/mfa/verify";
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    logger.warn("[MFA] Verify unauthorized", { route });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  const body = parsed.data;

  try {
    // Create a challenge
    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: body.factorId });

    if (challengeError) {
      logger.error("[MFA] Challenge failed", {
        route,
        requestId: parsed.requestId,
        error: challengeError.message,
        userId: user.id,
      });
      return NextResponse.json(
        { error: challengeError.message },
        { status: 400 }
      );
    }

    // Verify the code
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: body.factorId,
      challengeId: challenge.id,
      code: body.code,
    });

    if (verifyError) {
      logger.warn("[MFA] Verify failed", {
        route,
        requestId: parsed.requestId,
        error: verifyError.message,
        userId: user.id,
      });
      return NextResponse.json(
        { error: "Código inválido. Tente novamente." },
        { status: 400 }
      );
    }

    logger.info("[MFA] TOTP verified successfully", {
      route,
      requestId: parsed.requestId,
      userId: user.id,
      factorId: body.factorId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("[MFA] Verify error", {
      route,
      requestId: parsed.requestId,
      userId: user.id,
      error: String(error),
    });
    return NextResponse.json(
      { error: "Erro interno ao verificar código" },
      { status: 500 }
    );
  }
}
