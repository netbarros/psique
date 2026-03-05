import { NextResponse } from "next/server";
import { requireMasterAdminContext } from "@/lib/auth/master-admin";
import { logger } from "@/lib/logger";

export async function GET() {
  const route = "/api/admin/integrations";
  const auth = await requireMasterAdminContext();
  if (!auth.context) {
    logger.warn("[Admin/Integrations] Unauthorized access", { route });
    return auth.response;
  }

  const { data, error } = await auth.context.supabase
    .from("platform_integrations")
    .select("provider, status, public_config_json, last_validated_at, updated_by, created_at, updated_at")
    .order("provider", { ascending: true });

  if (error) {
    logger.error("[Admin/Integrations] Failed to list integrations", {
      route,
      userId: auth.context.user.id,
      error: String(error),
    });
    return NextResponse.json({ error: "Failed to list platform integrations" }, { status: 500 });
  }

  logger.info("[Admin/Integrations] Listed integrations", {
    route,
    userId: auth.context.user.id,
    count: data?.length ?? 0,
  });

  return NextResponse.json({
    success: true,
    data: data ?? [],
  });
}
