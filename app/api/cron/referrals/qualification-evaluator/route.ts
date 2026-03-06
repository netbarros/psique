import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateReferralQualifications } from "@/lib/growth/referral";
import { WalletError } from "@/lib/growth/wallet";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    logger.warn("[Cron/ReferralQualification] Unauthorized access", {
      route: "/api/cron/referrals/qualification-evaluator",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const result = await evaluateReferralQualifications(admin);

    logger.info("[Cron/ReferralQualification] Qualification evaluation completed", {
      route: "/api/cron/referrals/qualification-evaluator",
      pendingEvaluated: result.pendingEvaluated,
      rewarded: result.rewarded,
      rejected: result.rejected,
      underReview: result.underReview,
    });
    return NextResponse.json({
      success: true,
      data: {
        ...result,
        job: "referral_qualification_evaluator_daily",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof WalletError) {
      logger.warn("[Cron/ReferralQualification] Domain error", {
        route: "/api/cron/referrals/qualification-evaluator",
        code: error.code,
        status: error.status,
      });
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }

    logger.error("[Cron/ReferralQualification] Unexpected error", {
      route: "/api/cron/referrals/qualification-evaluator",
      error: String(error),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
