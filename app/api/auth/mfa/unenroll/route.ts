import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { parseJsonBody } from "@/lib/api/request-validation";

const postSchema = z.object({
  factorId: z.string().trim().min(1),
});

export async function POST(req: NextRequest) {
  const route = "/api/auth/mfa/unenroll";
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    logger.warn("[MFA] Unenroll unauthorized", { route });
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
    const { error } = await supabase.auth.mfa.unenroll({
      factorId: body.factorId,
    });

    if (error) {
      logger.error("[MFA] Unenroll failed", {
        route,
        requestId: parsed.requestId,
        error: error.message,
        userId: user.id,
      });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    logger.info("[MFA] TOTP unenrolled", {
      route,
      requestId: parsed.requestId,
      userId: user.id,
      factorId: body.factorId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("[MFA] Unenroll error", {
      route,
      requestId: parsed.requestId,
      userId: user.id,
      error: String(error),
    });
    return NextResponse.json(
      { error: "Erro interno ao desativar 2FA" },
      { status: 500 }
    );
  }
}
