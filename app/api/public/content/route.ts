import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publicContentQuerySchema } from "@/lib/contracts/public/content";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const route = "/api/public/content";
  const { searchParams } = new URL(request.url);
  const parsed = publicContentQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    locale: searchParams.get("locale") ?? "pt-BR",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid query" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_content", {
    p_page_key: parsed.data.page,
    p_locale: parsed.data.locale,
  });

  if (error) {
    logger.error("[Public/Content] Failed to fetch published content", {
      route,
      page: parsed.data.page,
      locale: parsed.data.locale,
      error: String(error),
    });
    return NextResponse.json({ error: "Failed to fetch public content" }, { status: 500 });
  }

  const payload = data && typeof data === "object" ? data : { pageKey: parsed.data.page, locale: parsed.data.locale, items: [] };

  return NextResponse.json({
    success: true,
    data: payload,
  });
}
