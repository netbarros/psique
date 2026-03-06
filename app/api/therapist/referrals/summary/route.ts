import { NextResponse } from "next/server";
import { requireAuthenticatedContext } from "@/lib/auth/master-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureTherapistReferralCode } from "@/lib/growth/referral";
import { getTherapistIdByUserId, getWalletSummary, WalletError } from "@/lib/growth/wallet";

export async function GET() {
  const auth = await requireAuthenticatedContext();
  if (!auth.context) {
    return auth.response;
  }

  try {
    const admin = createAdminClient();
    const therapistId = await getTherapistIdByUserId(auth.context.supabase, auth.context.user.id);

    const { data: therapist } = await auth.context.supabase
      .from("therapists")
      .select("id, name")
      .eq("id", therapistId)
      .single();

    const code = await ensureTherapistReferralCode(admin, therapistId, therapist?.name ?? "psique");
    const summary = await getWalletSummary(admin, therapistId);

    const { data: invites } = await admin
      .from("therapist_referral_invites")
      .select("id, status, created_at, reward_issued_at")
      .eq("inviter_therapist_id", therapistId)
      .order("created_at", { ascending: false })
      .limit(200);

    const counts = (invites ?? []).reduce<Record<string, number>>((acc, invite) => {
      const key = String(invite.status ?? "unknown");
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
    const referralLink = `${baseUrl}/auth/register?ref=${encodeURIComponent(code.code)}`;

    return NextResponse.json({
      success: true,
      data: {
        referralCode: code.code,
        referralLink,
        inviteCounts: counts,
        pendingRewardsCount: summary.pendingRewardsCount,
        expiringRewards: summary.expiringSoon,
      },
    });
  } catch (error) {
    if (error instanceof WalletError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
