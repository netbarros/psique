import { NextResponse } from "next/server";
import { adminPlansQuerySchema } from "@/lib/contracts/admin/plans";
import { requireMasterAdminContext } from "@/lib/auth/master-admin";
import { logger } from "@/lib/logger";

function pickPlanDocument(value: unknown): { plan_key?: string; locale?: string } {
  if (!value || typeof value !== "object") return {};
  if (Array.isArray(value)) {
    return pickPlanDocument(value[0]);
  }

  return value as { plan_key?: string; locale?: string };
}

export async function GET(request: Request) {
  const route = "/api/admin/plans";
  const auth = await requireMasterAdminContext();
  if (!auth.context) {
    logger.warn("[Admin/Plans] Unauthorized access", { route });
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const parsed = adminPlansQuerySchema.safeParse({
    status: searchParams.get("status") ?? undefined,
    locale: searchParams.get("locale") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid query" }, { status: 400 });
  }

  let query = auth.context.supabase
    .from("plan_revisions")
    .select(
      "id, document_id, version, status, payload_json, etag, published_at, created_at, updated_at, plan_documents!inner(plan_key, locale)",
    )
    .order("created_at", { ascending: false });

  if (parsed.data.status) {
    query = query.eq("status", parsed.data.status);
  }

  if (parsed.data.locale) {
    query = query.eq("plan_documents.locale", parsed.data.locale);
  }

  const { data, error } = await query;
  if (error) {
    logger.error("[Admin/Plans] Failed to list plans", {
      route,
      userId: auth.context.user.id,
      error: String(error),
    });
    return NextResponse.json({ error: "Failed to list plans" }, { status: 500 });
  }

  logger.info("[Admin/Plans] Listed plan revisions", {
    route,
    userId: auth.context.user.id,
    count: data?.length ?? 0,
  });

  return NextResponse.json({
    success: true,
    data: (data ?? []).map((row) => {
      const document = pickPlanDocument((row as { plan_documents?: unknown }).plan_documents);
      return {
        id: row.id,
        documentId: row.document_id,
        planKey: document.plan_key ?? "",
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
