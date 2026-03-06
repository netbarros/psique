import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import type { Database } from "@/lib/database.types";
import type { CreditBucket, GrowthRuleRow } from "@/lib/growth/constants";

export class WalletError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status = 400) {
    super(message);
    this.name = "WalletError";
    this.code = code;
    this.status = status;
  }
}

type AnySupabase = SupabaseClient<Database>;

type WalletRow = {
  wallet_id: string;
  therapist_id: string;
  balance_total_credits: number;
  balance_paid_credits: number;
  balance_bonus_credits: number;
  status: "active" | "blocked" | "closed";
};

type PricebookActionRow = {
  action_key: string;
  unit_type: string;
  unit_cost_credits: number;
  active: boolean;
  effective_from: string;
  effective_to: string | null;
};

type UsageEventRow = {
  id: string;
  therapist_id: string;
  wallet_id: string;
  action_key: string;
  units: number;
  billed_credits: number;
  ledger_entry_id: string | null;
  correlation_id: string;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

type LedgerInsertInput = {
  walletId: string;
  entryKind: "credit" | "debit" | "expire" | "reverse" | "hold" | "release";
  bucket: CreditBucket;
  amountCredits: number;
  sourceType: string;
  sourceId?: string | null;
  idempotencyKey: string;
  expiresAt?: string | null;
  availableAt?: string;
  status?: "pending" | "posted" | "reversed" | "failed";
  metadata?: Record<string, unknown>;
};

type ConsumeCreditsInput = {
  admin: AnySupabase;
  therapistId: string;
  actionKey: string;
  units: number;
  correlationId: string;
  sourceType?: string;
  sourceId?: string | null;
  metadata?: Record<string, unknown>;
};

type GrantCreditsInput = {
  admin: AnySupabase;
  therapistId: string;
  bucket: CreditBucket;
  amountCredits: number;
  sourceType: string;
  sourceId?: string | null;
  idempotencyKey: string;
  expiresAt?: string | null;
  metadata?: Record<string, unknown>;
};

function normalizeNumber(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100) / 100;
}

export async function getTherapistIdByUserId(
  supabase: AnySupabase,
  userId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("therapists")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (error || !data?.id) {
    throw new WalletError("Therapist not found", "THERAPIST_NOT_FOUND", 404);
  }

  return data.id;
}

export async function ensureCreditWallet(
  admin: AnySupabase,
  therapistId: string,
): Promise<WalletRow> {
  const db = admin as unknown as {
    from: AnySupabase["from"];
  };

  const { data: existing, error: existingError } = await db
    .from("credit_wallets")
    .select("wallet_id, therapist_id, balance_total_credits, balance_paid_credits, balance_bonus_credits, status")
    .eq("therapist_id", therapistId)
    .maybeSingle();

  if (existingError) {
    throw new WalletError("Failed to load wallet", "WALLET_LOAD_FAILED", 500);
  }

  if (existing) {
    return {
      ...existing,
      balance_total_credits: normalizeNumber(existing.balance_total_credits),
      balance_paid_credits: normalizeNumber(existing.balance_paid_credits),
      balance_bonus_credits: normalizeNumber(existing.balance_bonus_credits),
    } as WalletRow;
  }

  const { data: inserted, error: insertError } = await db
    .from("credit_wallets")
    .insert({ therapist_id: therapistId })
    .select("wallet_id, therapist_id, balance_total_credits, balance_paid_credits, balance_bonus_credits, status")
    .single();

  if (insertError && insertError.code !== "23505") {
    throw new WalletError("Failed to create wallet", "WALLET_CREATE_FAILED", 500);
  }

  if (inserted) {
    return {
      ...inserted,
      balance_total_credits: normalizeNumber(inserted.balance_total_credits),
      balance_paid_credits: normalizeNumber(inserted.balance_paid_credits),
      balance_bonus_credits: normalizeNumber(inserted.balance_bonus_credits),
    } as WalletRow;
  }

  const { data: raced, error: racedError } = await db
    .from("credit_wallets")
    .select("wallet_id, therapist_id, balance_total_credits, balance_paid_credits, balance_bonus_credits, status")
    .eq("therapist_id", therapistId)
    .single();

  if (racedError || !raced) {
    throw new WalletError("Wallet unavailable", "WALLET_UNAVAILABLE", 500);
  }

  return {
    ...raced,
    balance_total_credits: normalizeNumber(raced.balance_total_credits),
    balance_paid_credits: normalizeNumber(raced.balance_paid_credits),
    balance_bonus_credits: normalizeNumber(raced.balance_bonus_credits),
  } as WalletRow;
}

export async function getActiveGrowthProgramRule(
  admin: AnySupabase,
): Promise<GrowthRuleRow> {
  const db = admin as unknown as {
    from: AnySupabase["from"];
  };

  const { data, error } = await db
    .from("growth_program_rules")
    .select(
      "id, inviter_bonus_credits, invitee_bonus_credits, qualification_min_amount_brl, qualification_wait_days, max_rewards_per_month, max_rewards_per_therapist, bonus_expiration_days, anti_abuse_enabled, active",
    )
    .eq("active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    throw new WalletError("Growth rules unavailable", "GROWTH_RULES_UNAVAILABLE", 500);
  }

  return {
    id: data.id,
    inviter_bonus_credits: normalizeNumber(data.inviter_bonus_credits),
    invitee_bonus_credits: normalizeNumber(data.invitee_bonus_credits),
    qualification_min_amount_brl: normalizeNumber(data.qualification_min_amount_brl),
    qualification_wait_days: Number(data.qualification_wait_days),
    max_rewards_per_month: Number(data.max_rewards_per_month),
    max_rewards_per_therapist: Number(data.max_rewards_per_therapist),
    bonus_expiration_days: Number(data.bonus_expiration_days),
    anti_abuse_enabled: Boolean(data.anti_abuse_enabled),
    active: Boolean(data.active),
  };
}

export async function getPricebookAction(
  admin: AnySupabase,
  actionKey: string,
): Promise<PricebookActionRow> {
  const db = admin as unknown as {
    from: AnySupabase["from"];
  };

  const nowIso = new Date().toISOString();
  const { data, error } = await db
    .from("pricebook_actions")
    .select("action_key, unit_type, unit_cost_credits, active, effective_from, effective_to")
    .eq("action_key", actionKey)
    .eq("active", true)
    .lte("effective_from", nowIso)
    .or(`effective_to.is.null,effective_to.gte.${nowIso}`)
    .maybeSingle();

  if (error || !data) {
    throw new WalletError("Pricebook action not configured", "PRICEBOOK_ACTION_NOT_FOUND", 404);
  }

  return {
    action_key: data.action_key,
    unit_type: data.unit_type,
    unit_cost_credits: normalizeNumber(data.unit_cost_credits),
    active: Boolean(data.active),
    effective_from: data.effective_from,
    effective_to: data.effective_to,
  };
}

async function findUsageEventByCorrelation(
  admin: AnySupabase,
  actionKey: string,
  correlationId: string,
): Promise<UsageEventRow | null> {
  const db = admin as unknown as {
    from: AnySupabase["from"];
  };

  const { data, error } = await db
    .from("usage_events")
    .select(
      "id, therapist_id, wallet_id, action_key, units, billed_credits, ledger_entry_id, correlation_id, status, metadata, created_at",
    )
    .eq("action_key", actionKey)
    .eq("correlation_id", correlationId)
    .maybeSingle();

  if (error) {
    throw new WalletError("Failed to load usage event", "USAGE_EVENT_LOAD_FAILED", 500);
  }

  if (!data) return null;

  return {
    ...data,
    units: normalizeNumber(data.units),
    billed_credits: normalizeNumber(data.billed_credits),
  } as UsageEventRow;
}

export async function insertLedgerEntry(
  admin: AnySupabase,
  input: LedgerInsertInput,
): Promise<{ id: string }> {
  const db = admin as unknown as {
    from: AnySupabase["from"];
  };

  const payload = {
    wallet_id: input.walletId,
    entry_kind: input.entryKind,
    bucket: input.bucket,
    amount_credits: normalizeNumber(input.amountCredits),
    source_type: input.sourceType,
    source_id: input.sourceId ?? null,
    idempotency_key: input.idempotencyKey,
    expires_at: input.expiresAt ?? null,
    available_at: input.availableAt ?? undefined,
    status: input.status ?? "posted",
    metadata: input.metadata ?? {},
  };

  const { data, error } = await db
    .from("credit_ledger")
    .insert(payload)
    .select("id")
    .single();

  if (!error && data?.id) {
    return { id: data.id };
  }

  if (error?.code === "23505") {
    const { data: existing, error: existingError } = await db
      .from("credit_ledger")
      .select("id")
      .eq("idempotency_key", input.idempotencyKey)
      .single();

    if (existingError || !existing?.id) {
      throw new WalletError("Ledger idempotency conflict", "LEDGER_IDEMPOTENCY_CONFLICT", 409);
    }

    return { id: existing.id };
  }

  throw new WalletError(
    error?.message ?? "Failed to insert ledger entry",
    "LEDGER_INSERT_FAILED",
    500,
  );
}

export async function consumeCreditsForAction(
  input: ConsumeCreditsInput,
): Promise<UsageEventRow> {
  const { admin, therapistId, actionKey, correlationId } = input;
  const units = normalizeNumber(input.units);
  if (units <= 0) {
    throw new WalletError("Units must be positive", "INVALID_UNITS", 422);
  }

  const existing = await findUsageEventByCorrelation(admin, actionKey, correlationId);
  if (existing) {
    return existing;
  }

  const wallet = await ensureCreditWallet(admin, therapistId);
  if (wallet.status !== "active") {
    throw new WalletError("Wallet is not active", "WALLET_NOT_ACTIVE", 403);
  }

  const action = await getPricebookAction(admin, actionKey);
  const billedCredits = normalizeNumber(action.unit_cost_credits * units);

  const db = admin as unknown as {
    from: AnySupabase["from"];
  };

  if (billedCredits <= 0) {
    const { data: skipped, error: skippedError } = await db
      .from("usage_events")
      .insert({
        therapist_id: therapistId,
        wallet_id: wallet.wallet_id,
        action_key: actionKey,
        units,
        billed_credits: 0,
        ledger_entry_id: null,
        correlation_id: correlationId,
        status: "skipped",
        metadata: input.metadata ?? {},
      })
      .select(
        "id, therapist_id, wallet_id, action_key, units, billed_credits, ledger_entry_id, correlation_id, status, metadata, created_at",
      )
      .single();

    if (skippedError || !skipped) {
      throw new WalletError("Failed to save usage event", "USAGE_EVENT_INSERT_FAILED", 500);
    }

    return {
      ...skipped,
      units: normalizeNumber(skipped.units),
      billed_credits: normalizeNumber(skipped.billed_credits),
    } as UsageEventRow;
  }

  if (wallet.balance_total_credits < billedCredits) {
    throw new WalletError("Insufficient credits", "INSUFFICIENT_CREDITS", 402);
  }

  let remaining = billedCredits;
  let firstLedgerEntryId: string | null = null;

  const bonusDebit = Math.min(wallet.balance_bonus_credits, remaining);
  if (bonusDebit > 0) {
    const bonusEntry = await insertLedgerEntry(admin, {
      walletId: wallet.wallet_id,
      entryKind: "debit",
      bucket: "bonus",
      amountCredits: bonusDebit,
      sourceType: input.sourceType ?? actionKey,
      sourceId: input.sourceId ?? correlationId,
      idempotencyKey: `${actionKey}:${correlationId}:bonus`,
      metadata: {
        correlationId,
        units,
        actionKey,
        ...(input.metadata ?? {}),
      },
    });
    firstLedgerEntryId = bonusEntry.id;
    remaining = normalizeNumber(remaining - bonusDebit);
  }

  if (remaining > 0) {
    const paidEntry = await insertLedgerEntry(admin, {
      walletId: wallet.wallet_id,
      entryKind: "debit",
      bucket: "paid",
      amountCredits: remaining,
      sourceType: input.sourceType ?? actionKey,
      sourceId: input.sourceId ?? correlationId,
      idempotencyKey: `${actionKey}:${correlationId}:paid`,
      metadata: {
        correlationId,
        units,
        actionKey,
        ...(input.metadata ?? {}),
      },
    });

    if (!firstLedgerEntryId) {
      firstLedgerEntryId = paidEntry.id;
    }
  }

  const { data: usage, error: usageError } = await db
    .from("usage_events")
    .insert({
      therapist_id: therapistId,
      wallet_id: wallet.wallet_id,
      action_key: actionKey,
      units,
      billed_credits: billedCredits,
      ledger_entry_id: firstLedgerEntryId,
      correlation_id: correlationId,
      status: "billed",
      metadata: {
        unitType: action.unit_type,
        unitCostCredits: action.unit_cost_credits,
        ...(input.metadata ?? {}),
      },
    })
    .select(
      "id, therapist_id, wallet_id, action_key, units, billed_credits, ledger_entry_id, correlation_id, status, metadata, created_at",
    )
    .single();

  if (usageError?.code === "23505") {
    const racedUsage = await findUsageEventByCorrelation(admin, actionKey, correlationId);
    if (racedUsage) return racedUsage;
  }

  if (usageError || !usage) {
    throw new WalletError("Failed to persist usage event", "USAGE_EVENT_INSERT_FAILED", 500);
  }

  return {
    ...usage,
    units: normalizeNumber(usage.units),
    billed_credits: normalizeNumber(usage.billed_credits),
  } as UsageEventRow;
}

export async function grantCredits(input: GrantCreditsInput): Promise<{ ledgerEntryId: string; walletId: string }> {
  if (normalizeNumber(input.amountCredits) <= 0) {
    throw new WalletError("Amount must be positive", "INVALID_CREDIT_AMOUNT", 422);
  }

  const wallet = await ensureCreditWallet(input.admin, input.therapistId);
  const entry = await insertLedgerEntry(input.admin, {
    walletId: wallet.wallet_id,
    entryKind: "credit",
    bucket: input.bucket,
    amountCredits: input.amountCredits,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    idempotencyKey: input.idempotencyKey,
    expiresAt: input.bucket === "bonus" ? input.expiresAt ?? null : null,
    metadata: input.metadata,
  });

  return {
    ledgerEntryId: entry.id,
    walletId: wallet.wallet_id,
  };
}

export async function getWalletSummary(admin: AnySupabase, therapistId: string) {
  const db = admin as unknown as {
    from: AnySupabase["from"];
  };

  const wallet = await ensureCreditWallet(admin, therapistId);

  const [{ data: pendingRewards }, { data: expiringSoon }, { data: invitesSummary }] = await Promise.all([
    db
      .from("therapist_referral_invites")
      .select("id", { count: "exact", head: true })
      .eq("inviter_therapist_id", therapistId)
      .in("status", ["pending", "qualified", "under_review"]),
    db
      .from("credit_ledger")
      .select("id, amount_credits, expires_at")
      .eq("wallet_id", wallet.wallet_id)
      .eq("bucket", "bonus")
      .eq("entry_kind", "credit")
      .not("expires_at", "is", null)
      .lte("expires_at", new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString())
      .order("expires_at", { ascending: true })
      .limit(20),
    db
      .from("therapist_referral_invites")
      .select("status")
      .eq("inviter_therapist_id", therapistId)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const invitesByStatus = (invitesSummary ?? []).reduce<Record<string, number>>((acc, row) => {
    const key = String(row.status ?? "unknown");
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return {
    wallet,
    pendingRewardsCount: pendingRewards?.length ? pendingRewards.length : 0,
    expiringSoon: (expiringSoon ?? []).map((row) => ({
      id: row.id,
      amountCredits: normalizeNumber(row.amount_credits),
      expiresAt: row.expires_at,
    })),
    invitesByStatus,
  };
}

export async function expireBonusCredits(admin: AnySupabase) {
  const db = admin as unknown as {
    from: AnySupabase["from"];
  };

  const nowIso = new Date().toISOString();
  const { data: expirableRows, error } = await db
    .from("credit_ledger")
    .select("id, wallet_id, amount_credits, expires_at")
    .eq("entry_kind", "credit")
    .eq("bucket", "bonus")
    .not("expires_at", "is", null)
    .lte("expires_at", nowIso)
    .order("expires_at", { ascending: true })
    .limit(1000);

  if (error) {
    throw new WalletError("Failed to load expirable credits", "EXPIRATION_LOAD_FAILED", 500);
  }

  let expiredCount = 0;
  for (const row of expirableRows ?? []) {
    const { data: alreadyExpired } = await db
      .from("credit_ledger")
      .select("id")
      .eq("source_type", "system.bonus_expiration")
      .eq("source_id", row.id)
      .maybeSingle();

    if (alreadyExpired?.id) {
      continue;
    }

    const { data: wallet } = await db
      .from("credit_wallets")
      .select("balance_bonus_credits")
      .eq("wallet_id", row.wallet_id)
      .single();

    const availableBonus = normalizeNumber(wallet?.balance_bonus_credits);
    if (availableBonus <= 0) {
      continue;
    }

    const amountToExpire = Math.min(availableBonus, normalizeNumber(row.amount_credits));
    if (amountToExpire <= 0) {
      continue;
    }

    await insertLedgerEntry(admin, {
      walletId: row.wallet_id,
      entryKind: "expire",
      bucket: "bonus",
      amountCredits: amountToExpire,
      sourceType: "system.bonus_expiration",
      sourceId: row.id,
      idempotencyKey: `expire:${row.id}`,
      metadata: {
        originLedgerId: row.id,
        originExpiresAt: row.expires_at,
      },
    });

    expiredCount += 1;
  }

  return {
    expiredCount,
  };
}

export async function collectExpiringBonusWarnings(admin: AnySupabase) {
  const db = admin as unknown as {
    from: AnySupabase["from"];
  };

  const now = Date.now();
  const windows = [14, 7, 1].map((days) => ({
    days,
    start: new Date(now + days * 24 * 60 * 60 * 1000),
    end: new Date(now + (days + 1) * 24 * 60 * 60 * 1000),
  }));

  const result: Array<{ days: number; entries: number }> = [];

  for (const window of windows) {
    const { data, error } = await db
      .from("credit_ledger")
      .select("id")
      .eq("entry_kind", "credit")
      .eq("bucket", "bonus")
      .not("expires_at", "is", null)
      .gte("expires_at", window.start.toISOString())
      .lt("expires_at", window.end.toISOString());

    if (error) {
      logger.warn("[Wallet] Failed to collect expiration warnings", {
        days: window.days,
        error: String(error),
      });
      result.push({ days: window.days, entries: 0 });
      continue;
    }

    result.push({ days: window.days, entries: data?.length ?? 0 });
  }

  return result;
}
