import { NextResponse } from "next/server";
import { requireMasterAdminContext } from "@/lib/auth/master-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

export async function GET() {
  const auth = await requireMasterAdminContext();
  if (!auth.context) {
    logger.warn("[Admin/PricebookActions] Unauthorized access", { route: "/api/admin/wallet/pricebook-actions" });
    return auth.response;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pricebook_actions")
    .select("action_key, unit_type, unit_cost_credits, active, effective_from, effective_to, created_at, updated_at")
    .order("action_key", { ascending: true });

  if (error) {
    logger.error("[Admin/PricebookActions] Failed to load pricebook actions", {
      route: "/api/admin/wallet/pricebook-actions",
      error: error.message,
    });
    return NextResponse.json({ error: "Failed to load pricebook actions" }, { status: 500 });
  }

  logger.info("[Admin/PricebookActions] Pricebook actions loaded", {
    route: "/api/admin/wallet/pricebook-actions",
    count: data?.length ?? 0,
  });
  return NextResponse.json({ success: true, data: data ?? [] });
}
