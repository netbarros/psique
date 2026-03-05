import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@/lib/admin/http";
import { requireMasterAdminContext } from "@/lib/auth/master-admin";
import { insertAdminAuditEvent } from "@/lib/admin/audit";
import { logger } from "@/lib/logger";

const patchIntegrationSchema = z
  .object({
    status: z.enum(["active", "inactive", "invalid", "draft"]).optional(),
    publicConfig: z.record(z.string(), z.unknown()).optional(),
    secretRef: z.string().trim().min(1).max(500).nullable().optional(),
    lastValidatedAt: z.string().datetime().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No fields to update",
  });

type RouteContext = {
  params: Promise<{
    provider: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const route = "/api/admin/integrations/[provider]";
  const auth = await requireMasterAdminContext();
  if (!auth.context) {
    logger.warn("[Admin/Integrations] Unauthorized update attempt", { route });
    return auth.response;
  }

  // zod safeParse validation is centralized inside parseJsonBody.
  const parsedBody = await parseJsonBody(request, patchIntegrationSchema);
  if (!parsedBody.data) {
    return parsedBody.response;
  }

  const { provider } = await params;
  const payload: Record<string, unknown> = {
    updated_by: auth.context.user.id,
  };

  if (parsedBody.data.status !== undefined) {
    payload.status = parsedBody.data.status;
  }
  if (parsedBody.data.publicConfig !== undefined) {
    payload.public_config_json = parsedBody.data.publicConfig;
  }
  if (parsedBody.data.secretRef !== undefined) {
    payload.secret_ref = parsedBody.data.secretRef;
  }
  if (parsedBody.data.lastValidatedAt !== undefined) {
    payload.last_validated_at = parsedBody.data.lastValidatedAt;
  }

  const { data: updated, error: updateError } = await auth.context.supabase
    .from("platform_integrations")
    .upsert(
      {
        provider,
        ...payload,
      },
      { onConflict: "provider" },
    )
    .select("provider, status, public_config_json, last_validated_at, updated_by, created_at, updated_at")
    .single();

  if (updateError || !updated) {
    logger.error("[Admin/Integrations] Failed to update integration", {
      route,
      userId: auth.context.user.id,
      provider,
      error: String(updateError),
    });
    return NextResponse.json({ error: "Failed to update platform integration" }, { status: 500 });
  }

  await insertAdminAuditEvent(auth.context.supabase, {
    actorUserId: auth.context.user.id,
    action: "platform_integration_updated",
    resourceType: "platform_integration",
    resourceId: provider,
    diff: {
      status: updated.status,
      hasSecretRef: parsedBody.data.secretRef !== undefined,
      hasPublicConfig: parsedBody.data.publicConfig !== undefined,
    },
  });

  logger.info("[Admin/Integrations] Integration updated", {
    route,
    userId: auth.context.user.id,
    provider,
    status: updated.status,
  });

  return NextResponse.json({ success: true, data: updated });
}
