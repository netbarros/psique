import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { expireBonusCredits, WalletError } from "@/lib/growth/wallet";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    logger.warn("[Cron/WalletExpiration] Unauthorized access", { route: "/api/cron/wallet/expire-bonuses" });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const result = await expireBonusCredits(admin);

    logger.info("[Cron/WalletExpiration] Bonus expiration completed", {
      route: "/api/cron/wallet/expire-bonuses",
      expiredCount: result.expiredCount,
    });
    return NextResponse.json({
      success: true,
      data: {
        ...result,
        job: "wallet_bonus_expiration_daily",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof WalletError) {
      logger.warn("[Cron/WalletExpiration] Domain error", {
        route: "/api/cron/wallet/expire-bonuses",
        code: error.code,
        status: error.status,
      });
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }

    logger.error("[Cron/WalletExpiration] Unexpected error", {
      route: "/api/cron/wallet/expire-bonuses",
      error: String(error),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
