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

  const body = (await req.json()) as { factorId: string };

  if (!body.factorId) {
    return NextResponse.json(
      { error: "factorId is required" },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabase.auth.mfa.unenroll({
      factorId: body.factorId,
    });

    if (error) {
      logger.error("[MFA] Unenroll failed", {
        error: error.message,
        userId: user.id,
      });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    logger.info("[MFA] TOTP unenrolled", {
      userId: user.id,
      factorId: body.factorId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("[MFA] Unenroll error", { error: String(error) });
    return NextResponse.json(
      { error: "Erro interno ao desativar 2FA" },
      { status: 500 }
    );
  }
}
