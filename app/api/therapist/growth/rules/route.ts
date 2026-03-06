import { NextResponse } from "next/server";
import { requireAuthenticatedContext } from "@/lib/auth/master-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveGrowthProgramRule, WalletError } from "@/lib/growth/wallet";

export async function GET() {
  const auth = await requireAuthenticatedContext();
  if (!auth.context) {
    return auth.response;
  }

  try {
    const admin = createAdminClient();
    const rule = await getActiveGrowthProgramRule(admin);
    return NextResponse.json({ success: true, data: rule });
  } catch (error) {
    if (error instanceof WalletError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
