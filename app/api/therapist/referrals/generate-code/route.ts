import { NextResponse } from "next/server";
import { requireAuthenticatedContext } from "@/lib/auth/master-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureTherapistReferralCode } from "@/lib/growth/referral";
import { getTherapistIdByUserId, WalletError } from "@/lib/growth/wallet";

export async function POST() {
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

    return NextResponse.json({
      success: true,
      data: {
        code: code.code,
        link: `${baseUrl}/auth/register?ref=${encodeURIComponent(code.code)}`,
      },
    });
  } catch (error) {
    if (error instanceof WalletError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
