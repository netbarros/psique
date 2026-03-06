import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMasterAdminContext } from "@/lib/auth/master-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { insertAdminAuditEvent } from "@/lib/admin/audit";
import { logger } from "@/lib/logger";

const createPackageSchema = z.object({
  code: z.string().trim().min(2).max(80),
  name: z.string().trim().min(2).max(180),
  creditsAmount: z.number().positive().max(1000000),
  priceBrlCents: z.number().int().positive().max(100000000),
  active: z.boolean().default(true),
});

export async function GET() {
  const auth = await requireMasterAdminContext();
  if (!auth.context) {
    logger.warn("[Admin/CreditPackages] Unauthorized access", { route: "/api/admin/wallet/credit-packages" });
    return auth.response;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("credit_packages")
    .select("id, code, name, credits_amount, price_brl_cents, active, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("[Admin/CreditPackages] Failed to load credit packages", {
      route: "/api/admin/wallet/credit-packages",
      error: error.message,
    });
    return NextResponse.json({ error: "Failed to load credit packages" }, { status: 500 });
  }

  logger.info("[Admin/CreditPackages] Credit packages loaded", {
    route: "/api/admin/wallet/credit-packages",
    count: data?.length ?? 0,
  });
  return NextResponse.json({ success: true, data: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireMasterAdminContext();
  if (!auth.context) {
    logger.warn("[Admin/CreditPackages] Unauthorized create attempt", {
      route: "/api/admin/wallet/credit-packages",
    });
    return auth.response;
  }

  const payload = createPackageSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    logger.warn("[Admin/CreditPackages] Invalid payload", {
      route: "/api/admin/wallet/credit-packages",
      issues: payload.error.issues.length,
    });
    return NextResponse.json({ error: payload.error.issues[0]?.message ?? "Invalid payload" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("credit_packages")
    .insert({
      code: payload.data.code,
      name: payload.data.name,
      credits_amount: payload.data.creditsAmount,
      price_brl_cents: payload.data.priceBrlCents,
      active: payload.data.active,
    })
    .select("id, code, name, credits_amount, price_brl_cents, active, created_at, updated_at")
    .single();

  if (error || !data) {
    logger.error("[Admin/CreditPackages] Failed to create credit package", {
      route: "/api/admin/wallet/credit-packages",
      error: error?.message ?? "Unknown error",
      code: payload.data.code,
    });
    return NextResponse.json({ error: "Failed to create credit package" }, { status: 500 });
  }

  await insertAdminAuditEvent(auth.context.supabase, {
    actorUserId: auth.context.user.id,
    action: "credit_package_created",
    resourceType: "credit_packages",
    resourceId: data.id,
    diff: {
      code: data.code,
      creditsAmount: data.credits_amount,
      priceBrlCents: data.price_brl_cents,
      active: data.active,
    },
  });

  logger.info("[Admin/CreditPackages] Credit package created", {
    route: "/api/admin/wallet/credit-packages",
    actorUserId: auth.context.user.id,
    packageId: data.id,
  });
  return NextResponse.json({ success: true, data }, { status: 201 });
}
