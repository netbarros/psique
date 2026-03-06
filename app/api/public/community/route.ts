import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

export async function GET() {
  const route = "/api/public/community";
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("platform_integrations")
    .select("provider, status, public_config_json, updated_at")
    .eq("provider", "community")
    .maybeSingle();

  if (error) {
    logger.error("[Public/Community] Failed to load community integration", {
      route,
      error: String(error),
    });
    return NextResponse.json({ error: "Failed to load community" }, { status: 500 });
  }

  const config = (data?.public_config_json ?? {}) as Record<string, unknown>;

  return NextResponse.json({
    success: true,
    data: {
      provider: "community",
      status: data?.status ?? "inactive",
      label: typeof config.label === "string" ? config.label : "Comunidade PSIQUE",
      platform: typeof config.platform === "string" ? config.platform : "telegram",
      url: typeof config.url === "string" ? config.url : null,
      updatedAt: data?.updated_at ?? null,
    },
  });
}
