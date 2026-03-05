import { NextResponse } from "next/server";
import { adminContentQuerySchema } from "@/lib/contracts/admin/content";
import { requireMasterAdminContext } from "@/lib/auth/master-admin";
import { logger } from "@/lib/logger";

function pickContentDocument(value: unknown): { page_key?: string; section_key?: string; locale?: string } {
  if (!value || typeof value !== "object") return {};
  if (Array.isArray(value)) return pickContentDocument(value[0]);
  return value as { page_key?: string; section_key?: string; locale?: string };
}

export async function GET(request: Request) {
  const route = "/api/admin/content";
  const auth = await requireMasterAdminContext();
  if (!auth.context) {
    logger.warn("[Admin/Content] Unauthorized access", { route });
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const parsed = adminContentQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    locale: searchParams.get("locale") ?? "pt-BR",
    status: searchParams.get("status") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid query" }, { status: 400 });
  }

  let query = auth.context.supabase
    .from("content_revisions")
    .select(
      "id, document_id, version, status, payload_json, etag, published_at, created_at, updated_at, content_documents!inner(page_key, section_key, locale)",
    )
    .eq("content_documents.page_key", parsed.data.page)
    .eq("content_documents.locale", parsed.data.locale)
    .order("created_at", { ascending: false });

  if (parsed.data.status) {
    query = query.eq("status", parsed.data.status);
  }

  const { data, error } = await query;
  if (error) {
    logger.error("[Admin/Content] Failed to list content revisions", {
      route,
      userId: auth.context.user.id,
      error: String(error),
      page: parsed.data.page,
      locale: parsed.data.locale,
    });
    return NextResponse.json({ error: "Failed to list content revisions" }, { status: 500 });
  }

  logger.info("[Admin/Content] Listed content revisions", {
    route,
    userId: auth.context.user.id,
    page: parsed.data.page,
    locale: parsed.data.locale,
    count: data?.length ?? 0,
  });

  return NextResponse.json({
    success: true,
    data: (data ?? []).map((row) => {
      const document = pickContentDocument((row as { content_documents?: unknown }).content_documents);
      return {
        id: row.id,
        documentId: row.document_id,
        pageKey: document.page_key ?? "",
        sectionKey: document.section_key ?? "",
        locale: document.locale ?? "pt-BR",
        version: row.version,
        status: row.status,
        etag: row.etag,
        payload: row.payload_json,
        publishedAt: row.published_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }),
  });
}
