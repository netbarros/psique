import { NextResponse } from "next/server";
import { patchContentDraftSchema } from "@/lib/contracts/admin/content";
import { generateEtag } from "@/lib/admin/etag";
import { conflict, parseJsonBody, readIfMatch } from "@/lib/admin/http";
import { requireMasterAdminContext } from "@/lib/auth/master-admin";
import { insertAdminAuditEvent } from "@/lib/admin/audit";
import { toDatabaseJson } from "@/lib/admin/json";
import { logger } from "@/lib/logger";

type RouteContext = {
  params: Promise<{
    draftId: string;
  }>;
};

function pickContentDocument(value: unknown): { page_key?: string; section_key?: string; locale?: string } {
  if (!value || typeof value !== "object") return {};
  if (Array.isArray(value)) return pickContentDocument(value[0]);
  return value as { page_key?: string; section_key?: string; locale?: string };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const route = "/api/admin/content/drafts/[draftId]";
  const auth = await requireMasterAdminContext();
  if (!auth.context) {
    logger.warn("[Admin/Content] Unauthorized draft update attempt", { route });
    return auth.response;
  }

  const { draftId } = await params;
  // zod safeParse validation is centralized inside parseJsonBody.
  const parsedBody = await parseJsonBody(request, patchContentDraftSchema);
  if (!parsedBody.data) {
    return parsedBody.response;
  }

  const supabase = auth.context.supabase;
  const { data: currentDraft, error: currentDraftError } = await supabase
    .from("content_revisions")
    .select(
      "id, document_id, version, status, payload_json, etag, published_at, created_at, updated_at, content_documents!inner(page_key, section_key, locale)",
    )
    .eq("id", draftId)
    .maybeSingle();

  if (currentDraftError) {
    logger.error("[Admin/Content] Failed loading draft", {
      route,
      userId: auth.context.user.id,
      draftId,
      error: String(currentDraftError),
    });
    return NextResponse.json({ error: "Failed to load draft" }, { status: 500 });
  }

  if (!currentDraft) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  const ifMatch = readIfMatch(request);
  if (ifMatch && ifMatch !== currentDraft.etag) {
    return conflict("Etag mismatch", "ETAG_MISMATCH");
  }

  if (currentDraft.status === "published") {
    return conflict("Published revision must be changed via publish endpoint", "REVISION_ALREADY_PUBLISHED");
  }

  const nextPayload = toDatabaseJson(parsedBody.data.payload ?? currentDraft.payload_json);
  const nextStatus = parsedBody.data.status ?? currentDraft.status;
  const nextEtag = generateEtag();

  const { data: updatedDraft, error: updateError } = await supabase
    .from("content_revisions")
    .update({
      payload_json: nextPayload,
      status: nextStatus,
      etag: nextEtag,
    })
    .eq("id", draftId)
    .select(
      "id, document_id, version, status, payload_json, etag, published_at, created_at, updated_at, content_documents!inner(page_key, section_key, locale)",
    )
    .single();

  if (updateError || !updatedDraft) {
    logger.error("[Admin/Content] Failed updating draft", {
      route,
      userId: auth.context.user.id,
      draftId,
      error: String(updateError),
    });
    return NextResponse.json({ error: "Failed to update draft" }, { status: 500 });
  }

  const document = pickContentDocument((updatedDraft as { content_documents?: unknown }).content_documents);

  await insertAdminAuditEvent(supabase, {
    actorUserId: auth.context.user.id,
    action: "content_draft_updated",
    resourceType: "content_revision",
    resourceId: updatedDraft.id,
    diff: {
      pageKey: document.page_key,
      sectionKey: document.section_key,
      locale: document.locale,
      version: updatedDraft.version,
      status: updatedDraft.status,
    },
  });

  logger.info("[Admin/Content] Draft updated", {
    route,
    userId: auth.context.user.id,
    draftId,
    status: updatedDraft.status,
    version: updatedDraft.version,
  });

  return NextResponse.json({
    success: true,
    data: {
      id: updatedDraft.id,
      documentId: updatedDraft.document_id,
      pageKey: document.page_key ?? "",
      sectionKey: document.section_key ?? "",
      locale: document.locale ?? "pt-BR",
      version: updatedDraft.version,
      status: updatedDraft.status,
      etag: updatedDraft.etag,
      payload: updatedDraft.payload_json,
      publishedAt: updatedDraft.published_at,
      createdAt: updatedDraft.created_at,
      updatedAt: updatedDraft.updated_at,
    },
  });
}
