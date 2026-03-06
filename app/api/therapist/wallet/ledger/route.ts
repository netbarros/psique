import { NextResponse } from "next/server";
import { requireAuthenticatedContext } from "@/lib/auth/master-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureCreditWallet, getTherapistIdByUserId, WalletError } from "@/lib/growth/wallet";
import type { CreditLedgerBucket, CreditLedgerEntryKind } from "@/lib/database.types";
import { logger } from "@/lib/logger";

const LEDGER_ENTRY_KINDS: CreditLedgerEntryKind[] = [
  "credit",
  "debit",
  "expire",
  "reverse",
  "hold",
  "release",
];
const LEDGER_BUCKETS: CreditLedgerBucket[] = ["paid", "bonus"];

export async function GET(request: Request) {
  const auth = await requireAuthenticatedContext();
  if (!auth.context) {
    logger.warn("[Therapist/WalletLedger] Unauthorized access", { route: "/api/therapist/wallet/ledger" });
    return auth.response;
  }

  const admin = createAdminClient();

  try {
    const therapistId = await getTherapistIdByUserId(auth.context.supabase, auth.context.user.id);
    const wallet = await ensureCreditWallet(admin, therapistId);

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from")?.trim();
    const to = searchParams.get("to")?.trim();
    const entryKind = searchParams.get("entryKind")?.trim();
    const bucket = searchParams.get("bucket")?.trim();
    const sourceType = searchParams.get("sourceType")?.trim();
    const limitRaw = Number(searchParams.get("limit") ?? "100");
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.trunc(limitRaw), 1), 500) : 100;

    let query = admin
      .from("credit_ledger")
      .select(
        "id, entry_kind, bucket, amount_credits, source_type, source_id, idempotency_key, expires_at, available_at, status, metadata, created_at",
      )
      .eq("wallet_id", wallet.wallet_id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);
    if (entryKind && LEDGER_ENTRY_KINDS.includes(entryKind as CreditLedgerEntryKind)) {
      query = query.eq("entry_kind", entryKind as CreditLedgerEntryKind);
    }
    if (bucket && LEDGER_BUCKETS.includes(bucket as CreditLedgerBucket)) {
      query = query.eq("bucket", bucket as CreditLedgerBucket);
    }
    if (sourceType) query = query.eq("source_type", sourceType);

    const { data, error } = await query;

    if (error) {
      logger.error("[Therapist/WalletLedger] Failed to load wallet ledger", {
        route: "/api/therapist/wallet/ledger",
        walletId: wallet.wallet_id,
        error: error.message,
      });
      return NextResponse.json({ error: "Failed to load wallet ledger" }, { status: 500 });
    }

    logger.info("[Therapist/WalletLedger] Wallet ledger loaded", {
      route: "/api/therapist/wallet/ledger",
      userId: auth.context.user.id,
      walletId: wallet.wallet_id,
      count: data?.length ?? 0,
    });
    return NextResponse.json({
      success: true,
      data: {
        walletId: wallet.wallet_id,
        entries: data ?? [],
      },
    });
  } catch (error) {
    if (error instanceof WalletError) {
      logger.warn("[Therapist/WalletLedger] Domain error while loading ledger", {
        route: "/api/therapist/wallet/ledger",
        userId: auth.context.user.id,
        code: error.code,
        status: error.status,
      });
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }

    logger.error("[Therapist/WalletLedger] Unexpected error while loading ledger", {
      route: "/api/therapist/wallet/ledger",
      userId: auth.context.user.id,
      error: String(error),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
