import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMasterAdminContext } from "@/lib/auth/master-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { insertAdminAuditEvent } from "@/lib/admin/audit";
import type { Json } from "@/lib/database.types";
import { logger } from "@/lib/logger";

const patchSchema = z
  .object({
    unitType: z.string().trim().min(2).max(40).optional(),
    unitCostCredits: z.number().min(0).max(100000).optional(),
    active: z.boolean().optional(),
    effectiveFrom: z.string().datetime().optional(),
    effectiveTo: z.string().datetime().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No fields to update",
  });

type RouteContext = {
  params: Promise<{
    actionKey: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireMasterAdminContext();
  if (!auth.context) {
    logger.warn("[Admin/PricebookAction] Unauthorized update attempt", {
      route: "/api/admin/wallet/pricebook-actions/[actionKey]",
    });
    return auth.response;
  }

  const payload = patchSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    logger.warn("[Admin/PricebookAction] Invalid payload", {
      route: "/api/admin/wallet/pricebook-actions/[actionKey]",
      issues: payload.error.issues.length,
    });
    return NextResponse.json({ error: payload.error.issues[0]?.message ?? "Invalid payload" }, { status: 422 });
  }

  const { actionKey } = await params;
  const admin = createAdminClient();

  const updatePayload: Record<string, unknown> = {};
  if (payload.data.unitType !== undefined) updatePayload.unit_type = payload.data.unitType;
  if (payload.data.unitCostCredits !== undefined) updatePayload.unit_cost_credits = payload.data.unitCostCredits;
  if (payload.data.active !== undefined) updatePayload.active = payload.data.active;
  if (payload.data.effectiveFrom !== undefined) updatePayload.effective_from = payload.data.effectiveFrom;
  if (payload.data.effectiveTo !== undefined) updatePayload.effective_to = payload.data.effectiveTo;

  const { data, error } = await admin
    .from("pricebook_actions")
    .update(updatePayload)
    .eq("action_key", actionKey)
    .select("action_key, unit_type, unit_cost_credits, active, effective_from, effective_to, updated_at")
    .single();

  if (error || !data) {
    logger.error("[Admin/PricebookAction] Failed to update action", {
      route: "/api/admin/wallet/pricebook-actions/[actionKey]",
      actionKey,
      error: error?.message ?? "Unknown error",
    });
    return NextResponse.json({ error: "Failed to update pricebook action" }, { status: 500 });
  }

  await insertAdminAuditEvent(auth.context.supabase, {
    actorUserId: auth.context.user.id,
    action: "pricebook_action_updated",
    resourceType: "pricebook_actions",
    resourceId: actionKey,
    diff: updatePayload as Json,
  });

  logger.info("[Admin/PricebookAction] Action updated", {
    route: "/api/admin/wallet/pricebook-actions/[actionKey]",
    actionKey,
    actorUserId: auth.context.user.id,
  });
  return NextResponse.json({ success: true, data });
}
