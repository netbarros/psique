import { NextResponse } from "next/server";
import { createContentDraftSchema } from "@/lib/contracts/admin/content";
import { generateEtag } from "@/lib/admin/etag";
import { parseJsonBody } from "@/lib/admin/http";
import { requireMasterAdminContext } from "@/lib/auth/master-admin";
import { insertAdminAuditEvent } from "@/lib/admin/audit";
import { toDatabaseJson } from "@/lib/admin/json";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const route = "/api/admin/content/drafts";
  const auth = await requireMasterAdminContext();
  if (!auth.context) {
    logger.warn("[Admin/Content] Unauthorized draft create attempt", { route });
    return auth.response;
  }

  // zod safeParse validation is centralized inside parseJsonBody.
  const parsedBody = await parseJsonBody(request, createContentDraftSchema);
  if (!parsedBody.data) {
    return parsedBody.response;
  }

  const { pageKey, sectionKey, locale, payload } = parsedBody.data;
  const supabase = auth.context.supabase;

  let documentId: string;
  const { data: existingDocument, error: existingDocumentError } = await supabase
    .from("content_documents")
    .select("id")
    .eq("page_key", pageKey)
    .eq("section_key", sectionKey)
    .eq("locale", locale)
    .maybeSingle();

  if (existingDocumentError) {
    logger.error("[Admin/Content] Failed resolving content document", {
      route,
      userId: auth.context.user.id,
      pageKey,
      sectionKey,
      locale,
      error: String(existingDocumentError),
    });
    return NextResponse.json({ error: "Failed to resolve content document" }, { status: 500 });
  }

  if (existingDocument?.id) {
    documentId = existingDocument.id;
  } else {
    const { data: createdDocument, error: createDocumentError } = await supabase
      .from("content_documents")
      .insert({
        page_key: pageKey,
        section_key: sectionKey,
        locale,
      })
      .select("id")
      .single();

    if (createDocumentError || !createdDocument) {
      logger.error("[Admin/Content] Failed creating content document", {
        route,
        userId: auth.context.user.id,
        pageKey,
        sectionKey,
        locale,
        error: String(createDocumentError),
      });
      return NextResponse.json({ error: "Failed to create content document" }, { status: 500 });
    }

    documentId = createdDocument.id;
  }

  const { data: previousRevision, error: previousRevisionError } = await supabase
    .from("content_revisions")
    .select("version")
    .eq("document_id", documentId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (previousRevisionError) {
    logger.error("[Admin/Content] Failed resolving content version", {
      route,
      userId: auth.context.user.id,
      documentId,
      error: String(previousRevisionError),
    });
    return NextResponse.json({ error: "Failed to resolve content version" }, { status: 500 });
  }

  const nextVersion = (previousRevision?.version ?? 0) + 1;
  const etag = generateEtag();

  const { data: createdDraft, error: createDraftError } = await supabase
    .from("content_revisions")
    .insert({
      document_id: documentId,
      version: nextVersion,
      status: "draft",
      payload_json: toDatabaseJson(payload),
      etag,
      created_by: auth.context.user.id,
    })
    .select("id, document_id, version, status, payload_json, etag, published_at, created_at, updated_at")
    .single();

  if (createDraftError || !createdDraft) {
    logger.error("[Admin/Content] Failed creating content draft", {
      route,
      userId: auth.context.user.id,
      pageKey,
      sectionKey,
      locale,
      version: nextVersion,
      error: String(createDraftError),
    });
    return NextResponse.json({ error: "Failed to create content draft" }, { status: 500 });
  }

  await insertAdminAuditEvent(supabase, {
    actorUserId: auth.context.user.id,
    action: "content_draft_created",
    resourceType: "content_revision",
    resourceId: createdDraft.id,
    diff: {
      pageKey,
      sectionKey,
      locale,
      version: nextVersion,
      status: createdDraft.status,
    },
  });

  logger.info("[Admin/Content] Draft created", {
    route,
    userId: auth.context.user.id,
    draftId: createdDraft.id,
    pageKey,
    sectionKey,
    locale,
    version: nextVersion,
  });

  return NextResponse.json(
    {
      success: true,
      data: {
        id: createdDraft.id,
        documentId: createdDraft.document_id,
        pageKey,
        sectionKey,
        locale,
        version: createdDraft.version,
        status: createdDraft.status,
        etag: createdDraft.etag,
        payload: createdDraft.payload_json,
        publishedAt: createdDraft.published_at,
        createdAt: createdDraft.created_at,
        updatedAt: createdDraft.updated_at,
      },
    },
    { status: 201 },
  );
}
