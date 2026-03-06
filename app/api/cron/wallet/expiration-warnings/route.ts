import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { collectExpiringBonusWarnings } from "@/lib/growth/wallet";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const windows = await collectExpiringBonusWarnings(admin);

  return NextResponse.json({
    success: true,
    data: {
      windows,
      job: "wallet_expiration_warnings_daily",
      timestamp: new Date().toISOString(),
    },
  });
}
