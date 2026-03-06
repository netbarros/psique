import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { logger } from "@/lib/logger";
import { getActiveGrowthProgramRule, grantCredits, WalletError } from "@/lib/growth/wallet";

type AnySupabase = SupabaseClient<Database>;

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function randomCode(seed: string) {
  const base = normalizeText(seed).slice(0, 10) || "psique";
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}-${suffix}`.toUpperCase();
}

export async function ensureTherapistReferralCode(
  admin: AnySupabase,
  therapistId: string,
  therapistName: string,
) {
  const db = admin as unknown as {
    from: AnySupabase["from"];
  };

  const { data: existing, error: existingError } = await db
    .from("therapist_referral_codes")
    .select("id, code, active")
    .eq("therapist_id", therapistId)
    .maybeSingle();

  if (existingError) {
    throw new WalletError("Failed to load referral code", "REFERRAL_CODE_LOAD_FAILED", 500);
  }

  if (existing?.code) {
    return existing;
  }

  let code = randomCode(therapistName);
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { data, error } = await db
      .from("therapist_referral_codes")
      .insert({
        therapist_id: therapistId,
        code,
        active: true,
      })
      .select("id, code, active")
      .single();

    if (!error && data?.code) {
      return data;
    }

    if (error?.code !== "23505") {
      throw new WalletError("Failed to create referral code", "REFERRAL_CODE_CREATE_FAILED", 500);
    }

    code = randomCode(`${therapistName}-${attempt + 1}`);
  }

  throw new WalletError("Unable to generate unique referral code", "REFERRAL_CODE_COLLISION", 409);
}

export async function evaluateReferralQualifications(admin: AnySupabase) {
  const db = admin as unknown as {
    from: AnySupabase["from"];
  };

  const rule = await getActiveGrowthProgramRule(admin);
  const now = new Date();

  const { data: pendingInvites, error: pendingError } = await db
    .from("therapist_referral_invites")
    .select(
      "id, inviter_therapist_id, invited_therapist_id, status, qualification_ready_at, created_at, invited_email, invited_phone, invited_telegram_username, invited_device_fingerprint",
    )
    .eq("status", "pending")
    .not("invited_therapist_id", "is", null)
    .lte("qualification_ready_at", now.toISOString())
    .order("created_at", { ascending: true })
    .limit(200);

  if (pendingError) {
    throw new WalletError("Failed to load pending referral invites", "REFERRAL_PENDING_LOAD_FAILED", 500);
  }

  let rewarded = 0;
  let rejected = 0;
  let underReview = 0;

  for (const invite of pendingInvites ?? []) {
    const inviteId = String(invite.id);
    const inviterTherapistId = String(invite.inviter_therapist_id);
    const invitedTherapistId = String(invite.invited_therapist_id ?? "");

    if (!invitedTherapistId) {
      continue;
    }

    if (rule.anti_abuse_enabled) {
      const suspicious = [invite.invited_email, invite.invited_phone, invite.invited_telegram_username, invite.invited_device_fingerprint]
        .filter((value) => typeof value === "string" && value.trim().length > 0)
        .some((value) =>
          (pendingInvites ?? []).some(
            (other) =>
              other.id !== invite.id &&
              (other.invited_email === value ||
                other.invited_phone === value ||
                other.invited_telegram_username === value ||
                other.invited_device_fingerprint === value),
          ),
        );

      if (suspicious) {
        await db
          .from("therapist_referral_invites")
          .update({
            status: "under_review",
            qualification_evaluated_at: now.toISOString(),
            rejection_reason: "Consistency checks flagged this invite.",
          })
          .eq("id", inviteId);
        underReview += 1;
        continue;
      }
    }

    const { data: qualifyingPayment, error: paymentError } = await db
      .from("payments")
      .select("id, amount, status, paid_at")
      .eq("therapist_id", invitedTherapistId)
      .eq("status", "paid")
      .gte("amount", rule.qualification_min_amount_brl)
      .not("paid_at", "is", null)
      .order("paid_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (paymentError || !qualifyingPayment) {
      continue;
    }

    const paidAt = new Date(String(qualifyingPayment.paid_at));
    const waitBoundary = new Date(paidAt.getTime());
    waitBoundary.setDate(waitBoundary.getDate() + rule.qualification_wait_days);

    if (waitBoundary > now) {
      continue;
    }

    const { data: refundOrDispute } = await db
      .from("payments")
      .select("id")
      .eq("therapist_id", invitedTherapistId)
      .in("status", ["refunded", "disputed"])
      .limit(1)
      .maybeSingle();

    if (refundOrDispute?.id) {
      await db
        .from("therapist_referral_invites")
        .update({
          status: "rejected",
          qualification_evaluated_at: now.toISOString(),
          rejection_reason: "Payment had refund/dispute during qualification window.",
        })
        .eq("id", inviteId);
      rejected += 1;
      continue;
    }

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { count: monthlyRewardCount } = await db
      .from("therapist_referral_invites")
      .select("id", { count: "exact", head: true })
      .eq("inviter_therapist_id", inviterTherapistId)
      .eq("status", "rewarded")
      .gte("reward_issued_at", monthStart);

    const { count: lifetimeRewardCount } = await db
      .from("therapist_referral_invites")
      .select("id", { count: "exact", head: true })
      .eq("inviter_therapist_id", inviterTherapistId)
      .eq("status", "rewarded");

    if ((monthlyRewardCount ?? 0) >= rule.max_rewards_per_month) {
      await db
        .from("therapist_referral_invites")
        .update({
          status: "rejected",
          qualification_evaluated_at: now.toISOString(),
          rejection_reason: "Monthly reward cap reached.",
        })
        .eq("id", inviteId);
      rejected += 1;
      continue;
    }

    if ((lifetimeRewardCount ?? 0) >= rule.max_rewards_per_therapist) {
      await db
        .from("therapist_referral_invites")
        .update({
          status: "rejected",
          qualification_evaluated_at: now.toISOString(),
          rejection_reason: "Lifetime reward cap reached.",
        })
        .eq("id", inviteId);
      rejected += 1;
      continue;
    }

    const bonusExpiresAt = new Date(now);
    bonusExpiresAt.setDate(bonusExpiresAt.getDate() + rule.bonus_expiration_days);

    const inviterReward = await grantCredits({
      admin,
      therapistId: inviterTherapistId,
      bucket: "bonus",
      amountCredits: rule.inviter_bonus_credits,
      sourceType: "growth.referral",
      sourceId: inviteId,
      idempotencyKey: `referral:${inviteId}:inviter`,
      expiresAt: bonusExpiresAt.toISOString(),
      metadata: {
        inviteId,
        role: "inviter",
        qualificationPaymentId: qualifyingPayment.id,
      },
    });

    const inviteeReward = await grantCredits({
      admin,
      therapistId: invitedTherapistId,
      bucket: "bonus",
      amountCredits: rule.invitee_bonus_credits,
      sourceType: "growth.referral",
      sourceId: inviteId,
      idempotencyKey: `referral:${inviteId}:invitee`,
      expiresAt: bonusExpiresAt.toISOString(),
      metadata: {
        inviteId,
        role: "invitee",
        qualificationPaymentId: qualifyingPayment.id,
      },
    });

    const { error: updateInviteError } = await db
      .from("therapist_referral_invites")
      .update({
        status: "rewarded",
        qualification_paid_amount_brl: qualifyingPayment.amount,
        qualification_evaluated_at: now.toISOString(),
        reward_ledger_entry_inviter_id: inviterReward.ledgerEntryId,
        reward_ledger_entry_invitee_id: inviteeReward.ledgerEntryId,
        reward_issued_at: now.toISOString(),
      })
      .eq("id", inviteId);

    if (updateInviteError) {
      logger.error("[Referral] Failed to mark invite as rewarded", {
        inviteId,
        error: String(updateInviteError),
      });
      continue;
    }

    rewarded += 1;
  }

  return {
    pendingEvaluated: (pendingInvites ?? []).length,
    rewarded,
    rejected,
    underReview,
  };
}
