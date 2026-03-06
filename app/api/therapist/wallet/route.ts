import { NextResponse } from "next/server";
import { requireAuthenticatedContext } from "@/lib/auth/master-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTherapistIdByUserId, getWalletSummary, WalletError } from "@/lib/growth/wallet";
import { logger } from "@/lib/logger";

export async function GET() {
  const auth = await requireAuthenticatedContext();
  if (!auth.context) {
    logger.warn("[Therapist/Wallet] Unauthorized access", { route: "/api/therapist/wallet" });
    return auth.response;
  }

  const admin = createAdminClient();

  try {
    const therapistId = await getTherapistIdByUserId(auth.context.supabase, auth.context.user.id);
    const summary = await getWalletSummary(admin, therapistId);

    logger.info("[Therapist/Wallet] Wallet summary loaded", {
      route: "/api/therapist/wallet",
      userId: auth.context.user.id,
      therapistId,
    });
    return NextResponse.json({
      success: true,
      data: {
        balance: {
          total: summary.wallet.balance_total_credits,
          paid: summary.wallet.balance_paid_credits,
          bonus: summary.wallet.balance_bonus_credits,
        },
        status: summary.wallet.status,
        pendingRewardsCount: summary.pendingRewardsCount,
        expiringSoon: summary.expiringSoon,
        invitesByStatus: summary.invitesByStatus,
      },
    });
  } catch (error) {
    if (error instanceof WalletError) {
      logger.warn("[Therapist/Wallet] Domain error while loading wallet", {
        route: "/api/therapist/wallet",
        userId: auth.context.user.id,
        code: error.code,
        status: error.status,
      });
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }

    logger.error("[Therapist/Wallet] Unexpected error while loading wallet", {
      route: "/api/therapist/wallet",
      userId: auth.context.user.id,
      error: String(error),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
