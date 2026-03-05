import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { generateEtag } from "@/lib/admin/etag";
import { conflict, readIfMatch } from "@/lib/admin/http";
import { requireMasterAdminContext } from "@/lib/auth/master-admin";
import { insertAdminAuditEvent } from "@/lib/admin/audit";
import { logger } from "@/lib/logger";

type RouteContext = {
  params: Promise<{
    draftId: string;
  }>;
};

function pickPlanDocument(value: unknown): { plan_key?: string; locale?: string } {
  if (!value || typeof value !== "object") return {};
  if (Array.isArray(value)) return pickPlanDocument(value[0]);
  return value as { plan_key?: string; locale?: string };
}

export async function POST(request: Request, { params }: RouteContext) {
  const route = "/api/admin/plans/drafts/[draftId]/publish";
  const auth = await requireMasterAdminContext();
  if (!auth.context) {
    logger.warn("[Admin/Plans] Unauthorized publish attempt", { route });
    return auth.response;
  }

  const ifMatch = readIfMatch(request);
  if (!ifMatch) {
    return NextResponse.json({ error: "Missing If-Match header", code: "MISSING_IF_MATCH" }, { status: 428 });
  }

  const { draftId } = await params;
  const supabase = auth.context.supabase;

  const { data: targetRevision, error: targetRevisionError } = await supabase
    .from("plan_revisions")
    .select(
      "id, document_id, version, status, payload_json, etag, published_at, created_at, updated_at, plan_documents!inner(plan_key, locale)",
    )
    .eq("id", draftId)
    .maybeSingle();

  if (targetRevisionError) {
    logger.error("[Admin/Plans] Failed loading revision for publish", {
      route,
      userId: auth.context.user.id,
      draftId,
      error: String(targetRevisionError),
    });
    return NextResponse.json({ error: "Failed to load revision" }, { status: 500 });
  }

  if (!targetRevision) {
    return NextResponse.json({ error: "Revision not found" }, { status: 404 });
  }

  if (targetRevision.status === "archived") {
    return conflict("Archived revision cannot be published", "REVISION_ARCHIVED");
  }

  if (ifMatch !== targetRevision.etag) {
    return conflict("Etag mismatch", "ETAG_MISMATCH");
  }

  const { error: archivePreviousError } = await supabase
    .from("plan_revisions")
    .update({ status: "archived" })
    .eq("document_id", targetRevision.document_id)
    .eq("status", "published")
    .neq("id", targetRevision.id);

  if (archivePreviousError) {
    logger.error("[Admin/Plans] Failed archiving previous published revision", {
      route,
      userId: auth.context.user.id,
      draftId,
      documentId: targetRevision.document_id,
      error: String(archivePreviousError),
    });
    return NextResponse.json({ error: "Failed to archive previous published revision" }, { status: 500 });
  }

  const { data: publishedRevision, error: publishError } = await supabase
    .from("plan_revisions")
    .update({
      status: "published",
      published_by: auth.context.user.id,
      published_at: new Date().toISOString(),
      etag: generateEtag(),
    })
    .eq("id", draftId)
    .select(
      "id, document_id, version, status, payload_json, etag, published_at, created_at, updated_at, plan_documents!inner(plan_key, locale)",
    )
    .single();

  if (publishError || !publishedRevision) {
    logger.error("[Admin/Plans] Failed publishing revision", {
      route,
      userId: auth.context.user.id,
      draftId,
      error: String(publishError),
    });
    return NextResponse.json({ error: "Failed to publish revision" }, { status: 500 });
  }

  const document = pickPlanDocument((publishedRevision as { plan_documents?: unknown }).plan_documents);

  await insertAdminAuditEvent(supabase, {
    actorUserId: auth.context.user.id,
    action: "plan_revision_published",
    resourceType: "plan_revision",
    resourceId: publishedRevision.id,
    diff: {
      documentId: publishedRevision.document_id,
      planKey: document.plan_key,
      locale: document.locale,
      version: publishedRevision.version,
    },
  });

  revalidatePath("/pricing");
  revalidatePath("/checkout/secure");

  logger.info("[Admin/Plans] Revision published", {
    route,
    userId: auth.context.user.id,
    draftId,
    documentId: publishedRevision.document_id,
    version: publishedRevision.version,
  });

  return NextResponse.json({
    success: true,
    data: {
      id: publishedRevision.id,
      documentId: publishedRevision.document_id,
      planKey: document.plan_key ?? "",
      locale: document.locale ?? "pt-BR",
      version: publishedRevision.version,
      status: publishedRevision.status,
      etag: publishedRevision.etag,
      payload: publishedRevision.payload_json,
      publishedAt: publishedRevision.published_at,
      createdAt: publishedRevision.created_at,
      updatedAt: publishedRevision.updated_at,
    },
  });
}
