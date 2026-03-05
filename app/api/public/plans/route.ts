import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publicPlansQuerySchema } from "@/lib/contracts/public/plans";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const route = "/api/public/plans";
  const { searchParams } = new URL(request.url);
  const parsed = publicPlansQuerySchema.safeParse({
    locale: searchParams.get("locale") ?? "pt-BR",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid query" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_plans", {
    p_locale: parsed.data.locale,
  });

  if (error) {
    logger.error("[Public/Plans] Failed to fetch published plans", {
      route,
      locale: parsed.data.locale,
      error: String(error),
    });
    return NextResponse.json({ error: "Failed to fetch public plans" }, { status: 500 });
  }

  logger.info("[Public/Plans] Fetched published plans", {
    route,
    locale: parsed.data.locale,
    count: Array.isArray(data) ? data.length : 0,
  });

  return NextResponse.json({
    success: true,
    data: Array.isArray(data) ? data : [],
  });
}
