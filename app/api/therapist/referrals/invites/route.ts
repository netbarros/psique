import { NextResponse } from "next/server";
import { requireAuthenticatedContext } from "@/lib/auth/master-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTherapistIdByUserId, WalletError } from "@/lib/growth/wallet";
import type { ReferralInviteStatus } from "@/lib/database.types";

const REFERRAL_INVITE_STATUSES: ReferralInviteStatus[] = [
  "pending",
  "qualified",
  "rewarded",
  "rejected",
  "under_review",
  "expired",
];

export async function GET(request: Request) {
  const auth = await requireAuthenticatedContext();
  if (!auth.context) {
    return auth.response;
  }

  try {
    const admin = createAdminClient();
    const therapistId = await getTherapistIdByUserId(auth.context.supabase, auth.context.user.id);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status")?.trim();
    const limitRaw = Number(searchParams.get("limit") ?? "100");
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.trunc(limitRaw), 1), 500) : 100;

    let query = admin
      .from("therapist_referral_invites")
      .select(
        "id, invited_therapist_id, invited_email, invited_phone, invited_telegram_username, status, qualification_paid_amount_brl, qualification_ready_at, qualification_evaluated_at, reward_issued_at, rejection_reason, metadata, created_at, updated_at",
      )
      .eq("inviter_therapist_id", therapistId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status && REFERRAL_INVITE_STATUSES.includes(status as ReferralInviteStatus)) {
      query = query.eq("status", status as ReferralInviteStatus);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Failed to load invites" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
    });
  } catch (error) {
    if (error instanceof WalletError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
