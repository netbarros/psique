import { NextResponse } from "next/server";
import { createPlanDraftSchema } from "@/lib/contracts/admin/plans";
import { generateEtag } from "@/lib/admin/etag";
import { parseJsonBody } from "@/lib/admin/http";
import { requireMasterAdminContext } from "@/lib/auth/master-admin";
import { insertAdminAuditEvent } from "@/lib/admin/audit";
import { toDatabaseJson } from "@/lib/admin/json";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const route = "/api/admin/plans/drafts";
  const auth = await requireMasterAdminContext();
  if (!auth.context) {
    logger.warn("[Admin/Plans] Unauthorized draft create attempt", { route });
    return auth.response;
  }

  // zod safeParse validation is centralized inside parseJsonBody.
  const parsedBody = await parseJsonBody(request, createPlanDraftSchema);
  if (!parsedBody.data) {
    return parsedBody.response;
  }

  const { planKey, locale, payload } = parsedBody.data;
  const supabase = auth.context.supabase;

  let documentId: string;
  const { data: existingDocument, error: existingDocumentError } = await supabase
    .from("plan_documents")
    .select("id")
    .eq("plan_key", planKey)
    .eq("locale", locale)
    .maybeSingle();

  if (existingDocumentError) {
    logger.error("[Admin/Plans] Failed resolving plan document", {
      route,
      userId: auth.context.user.id,
      error: String(existingDocumentError),
      planKey,
      locale,
    });
    return NextResponse.json({ error: "Failed to resolve plan document" }, { status: 500 });
  }

  if (existingDocument?.id) {
    documentId = existingDocument.id;
  } else {
    const { data: createdDocument, error: createDocumentError } = await supabase
      .from("plan_documents")
      .insert({
        plan_key: planKey,
        locale,
      })
      .select("id")
      .single();

    if (createDocumentError || !createdDocument) {
      logger.error("[Admin/Plans] Failed creating plan document", {
        route,
        userId: auth.context.user.id,
        error: String(createDocumentError),
        planKey,
        locale,
      });
      return NextResponse.json({ error: "Failed to create plan document" }, { status: 500 });
    }

    documentId = createdDocument.id;
  }

  const { data: previousRevision, error: previousRevisionError } = await supabase
    .from("plan_revisions")
    .select("version")
    .eq("document_id", documentId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (previousRevisionError) {
    logger.error("[Admin/Plans] Failed resolving next plan version", {
      route,
      userId: auth.context.user.id,
      error: String(previousRevisionError),
      documentId,
    });
    return NextResponse.json({ error: "Failed to resolve plan version" }, { status: 500 });
  }

  const nextVersion = (previousRevision?.version ?? 0) + 1;
  const etag = generateEtag();

  const { data: createdDraft, error: createDraftError } = await supabase
    .from("plan_revisions")
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
    logger.error("[Admin/Plans] Failed creating plan draft", {
      route,
      userId: auth.context.user.id,
      error: String(createDraftError),
      planKey,
      locale,
      version: nextVersion,
    });
    return NextResponse.json({ error: "Failed to create plan draft" }, { status: 500 });
  }

  await insertAdminAuditEvent(supabase, {
    actorUserId: auth.context.user.id,
    action: "plan_draft_created",
    resourceType: "plan_revision",
    resourceId: createdDraft.id,
    diff: {
      planKey,
      locale,
      version: nextVersion,
      status: createdDraft.status,
    },
  });

  logger.info("[Admin/Plans] Draft created", {
    route,
    userId: auth.context.user.id,
    planKey,
    locale,
    version: nextVersion,
    draftId: createdDraft.id,
  });

  return NextResponse.json(
    {
      success: true,
      data: {
        id: createdDraft.id,
        documentId: createdDraft.document_id,
        planKey,
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
