import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMasterAdminContext } from "@/lib/auth/master-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { insertAdminAuditEvent } from "@/lib/admin/audit";
import { getActiveGrowthProgramRule } from "@/lib/growth/wallet";
import type { Json } from "@/lib/database.types";
import { logger } from "@/lib/logger";

const patchRuleSchema = z.object({
  inviterBonusCredits: z.number().positive().max(100000).optional(),
  inviteeBonusCredits: z.number().positive().max(100000).optional(),
  qualificationMinAmountBrl: z.number().min(0).max(100000).optional(),
  qualificationWaitDays: z.number().int().min(0).max(365).optional(),
  maxRewardsPerMonth: z.number().int().min(0).max(10000).optional(),
  maxRewardsPerTherapist: z.number().int().min(0).max(100000).optional(),
  bonusExpirationDays: z.number().int().min(0).max(3650).optional(),
  antiAbuseEnabled: z.boolean().optional(),
  active: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireMasterAdminContext();
  if (!auth.context) {
    logger.warn("[Admin/GrowthRules] Unauthorized access", { route: "/api/admin/growth/rules" });
    return auth.response;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("growth_program_rules")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) {
    logger.error("[Admin/GrowthRules] Failed to load growth rules", {
      route: "/api/admin/growth/rules",
      error: error.message,
    });
    return NextResponse.json({ error: "Failed to load growth rules" }, { status: 500 });
  }

  logger.info("[Admin/GrowthRules] Growth rules loaded", {
    route: "/api/admin/growth/rules",
    count: data?.length ?? 0,
  });
  return NextResponse.json({ success: true, data: data ?? [] });
}

export async function PATCH(request: Request) {
  const auth = await requireMasterAdminContext();
  if (!auth.context) {
    logger.warn("[Admin/GrowthRules] Unauthorized update attempt", { route: "/api/admin/growth/rules" });
    return auth.response;
  }

  const payload = patchRuleSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    logger.warn("[Admin/GrowthRules] Invalid payload", {
      route: "/api/admin/growth/rules",
      issues: payload.error.issues.length,
    });
    return NextResponse.json({ error: payload.error.issues[0]?.message ?? "Invalid payload" }, { status: 422 });
  }

  const admin = createAdminClient();
  const activeRule = await getActiveGrowthProgramRule(admin);

  const updatePayload: Record<string, unknown> = {};
  if (payload.data.inviterBonusCredits !== undefined) {
    updatePayload.inviter_bonus_credits = payload.data.inviterBonusCredits;
  }
  if (payload.data.inviteeBonusCredits !== undefined) {
    updatePayload.invitee_bonus_credits = payload.data.inviteeBonusCredits;
  }
  if (payload.data.qualificationMinAmountBrl !== undefined) {
    updatePayload.qualification_min_amount_brl = payload.data.qualificationMinAmountBrl;
  }
  if (payload.data.qualificationWaitDays !== undefined) {
    updatePayload.qualification_wait_days = payload.data.qualificationWaitDays;
  }
  if (payload.data.maxRewardsPerMonth !== undefined) {
    updatePayload.max_rewards_per_month = payload.data.maxRewardsPerMonth;
  }
  if (payload.data.maxRewardsPerTherapist !== undefined) {
    updatePayload.max_rewards_per_therapist = payload.data.maxRewardsPerTherapist;
  }
  if (payload.data.bonusExpirationDays !== undefined) {
    updatePayload.bonus_expiration_days = payload.data.bonusExpirationDays;
  }
  if (payload.data.antiAbuseEnabled !== undefined) {
    updatePayload.anti_abuse_enabled = payload.data.antiAbuseEnabled;
  }
  if (payload.data.active !== undefined) {
    updatePayload.active = payload.data.active;
  }

  const { data: updated, error } = await admin
    .from("growth_program_rules")
    .update(updatePayload)
    .eq("id", activeRule.id)
    .select("*")
    .single();

  if (error || !updated) {
    logger.error("[Admin/GrowthRules] Failed to update growth rule", {
      route: "/api/admin/growth/rules",
      error: error?.message ?? "Unknown error",
      ruleId: activeRule.id,
    });
    return NextResponse.json({ error: "Failed to update growth rule" }, { status: 500 });
  }

  await insertAdminAuditEvent(auth.context.supabase, {
    actorUserId: auth.context.user.id,
    action: "growth_rule_updated",
    resourceType: "growth_program_rules",
    resourceId: activeRule.id,
    diff: updatePayload as Json,
  });

  logger.info("[Admin/GrowthRules] Growth rule updated", {
    route: "/api/admin/growth/rules",
    actorUserId: auth.context.user.id,
    ruleId: activeRule.id,
  });
  return NextResponse.json({ success: true, data: updated });
}
