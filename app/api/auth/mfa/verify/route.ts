import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

  const body = (await req.json()) as { factorId: string; code: string };

  if (!body.factorId || !body.code) {
    return NextResponse.json(
      { error: "factorId and code are required" },
      { status: 400 }
    );
  }

  try {
    // Create a challenge
    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: body.factorId });

    if (challengeError) {
      logger.error("[MFA] Challenge failed", {
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
        error: verifyError.message,
        userId: user.id,
      });
      return NextResponse.json(
        { error: "Código inválido. Tente novamente." },
        { status: 400 }
      );
    }

    logger.info("[MFA] TOTP verified successfully", {
      userId: user.id,
      factorId: body.factorId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("[MFA] Verify error", { error: String(error) });
    return NextResponse.json(
      { error: "Erro interno ao verificar código" },
      { status: 500 }
    );
  }
}
