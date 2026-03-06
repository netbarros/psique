import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMasterAdminContext } from "@/lib/auth/master-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { insertAdminAuditEvent } from "@/lib/admin/audit";
import type { Json } from "@/lib/database.types";
import { logger } from "@/lib/logger";

const patchPackageSchema = z
  .object({
    name: z.string().trim().min(2).max(180).optional(),
    creditsAmount: z.number().positive().max(1000000).optional(),
    priceBrlCents: z.number().int().positive().max(100000000).optional(),
    active: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No fields to update",
  });

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireMasterAdminContext();
  if (!auth.context) {
    logger.warn("[Admin/CreditPackage] Unauthorized update attempt", {
      route: "/api/admin/wallet/credit-packages/[id]",
    });
    return auth.response;
  }

  const payload = patchPackageSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    logger.warn("[Admin/CreditPackage] Invalid payload", {
      route: "/api/admin/wallet/credit-packages/[id]",
      issues: payload.error.issues.length,
    });
    return NextResponse.json({ error: payload.error.issues[0]?.message ?? "Invalid payload" }, { status: 422 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const updatePayload: Record<string, unknown> = {};
  if (payload.data.name !== undefined) updatePayload.name = payload.data.name;
  if (payload.data.creditsAmount !== undefined) updatePayload.credits_amount = payload.data.creditsAmount;
  if (payload.data.priceBrlCents !== undefined) updatePayload.price_brl_cents = payload.data.priceBrlCents;
  if (payload.data.active !== undefined) updatePayload.active = payload.data.active;

  const { data, error } = await admin
    .from("credit_packages")
    .update(updatePayload)
    .eq("id", id)
    .select("id, code, name, credits_amount, price_brl_cents, active, updated_at")
    .single();

  if (error || !data) {
    logger.error("[Admin/CreditPackage] Failed to update credit package", {
      route: "/api/admin/wallet/credit-packages/[id]",
      packageId: id,
      error: error?.message ?? "Unknown error",
    });
    return NextResponse.json({ error: "Failed to update credit package" }, { status: 500 });
  }

  await insertAdminAuditEvent(auth.context.supabase, {
    actorUserId: auth.context.user.id,
    action: "credit_package_updated",
    resourceType: "credit_packages",
    resourceId: id,
    diff: updatePayload as Json,
  });

  logger.info("[Admin/CreditPackage] Credit package updated", {
    route: "/api/admin/wallet/credit-packages/[id]",
    actorUserId: auth.context.user.id,
    packageId: id,
  });
  return NextResponse.json({ success: true, data });
}
