import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Psique Authenticator",
    });

    if (error) {
      logger.error("[MFA] Enroll failed", { error: error.message, userId: user.id });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    logger.info("[MFA] TOTP enrolled", { userId: user.id, factorId: data.id });

    return NextResponse.json({
      success: true,
      data: {
        factorId: data.id,
        qrUrl: data.totp.uri,
        secret: data.totp.secret,
      },
    });
  } catch (error) {
    logger.error("[MFA] Enroll error", { error: String(error) });
    return NextResponse.json(
      { error: "Erro interno ao configurar 2FA" },
      { status: 500 }
    );
  }
}
