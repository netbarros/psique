import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureTherapistReferralCode } from "@/lib/growth/referral";
import { getWalletSummary } from "@/lib/growth/wallet";
import type { CreditLedgerEntryKind } from "@/lib/database.types";

const LEDGER_ENTRY_KINDS: CreditLedgerEntryKind[] = [
  "credit",
  "debit",
  "expire",
  "reverse",
  "hold",
  "release",
];

export default async function GrowthDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    entryKind?: string;
    sourceType?: string;
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const params = await searchParams;

  const { data: therapist } = await supabase
    .from("therapists")
    .select("id, name, slug")
    .eq("user_id", user.id)
    .single();

  if (!therapist) {
    redirect("/dashboard/onboarding");
  }

  const admin = createAdminClient();
  const [summary, referralCode, invitesResult] = await Promise.all([
    getWalletSummary(admin, therapist.id),
    ensureTherapistReferralCode(admin, therapist.id, therapist.name),
    admin
      .from("therapist_referral_invites")
      .select(
        "id, invited_email, invited_phone, status, qualification_ready_at, reward_issued_at, created_at, rejection_reason",
      )
      .eq("inviter_therapist_id", therapist.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  let ledgerQuery = admin
    .from("credit_ledger")
    .select(
      "id, entry_kind, bucket, amount_credits, source_type, source_id, expires_at, status, created_at",
    )
    .eq("wallet_id", summary.wallet.wallet_id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (params.from) ledgerQuery = ledgerQuery.gte("created_at", params.from);
  if (params.to) ledgerQuery = ledgerQuery.lte("created_at", params.to);
  if (params.entryKind && LEDGER_ENTRY_KINDS.includes(params.entryKind as CreditLedgerEntryKind)) {
    ledgerQuery = ledgerQuery.eq("entry_kind", params.entryKind as CreditLedgerEntryKind);
  }
  if (params.sourceType) ledgerQuery = ledgerQuery.eq("source_type", params.sourceType);

  const { data: ledgerEntries } = await ledgerQuery;

  const referralLinkBase = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  const referralLink = `${referralLinkBase}/auth/register?ref=${encodeURIComponent(referralCode.code)}`;

  const expiringTotal = summary.expiringSoon.reduce((total, row) => total + row.amountCredits, 0);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-border-subtle bg-bg-elevated p-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-brand">S32 — Crescimento & Carteira</p>
        <h1 className="mt-2 font-display text-4xl text-text-primary sm:text-5xl">Carteira de Créditos e Programa de Indicação</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">
          Acompanhe saldo total, paid vs bonus, recompensas pendentes, créditos prestes a expirar e convites ativos.
        </p>
      </header>

      {expiringTotal > 0 ? (
        <section className="rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          Atenção: você possui {expiringTotal.toFixed(2)} créditos bônus em janela de expiração (D-14 / D-7 / D-1).
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-border-subtle bg-surface p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-text-muted">Total</p>
          <p className="mt-2 font-display text-4xl text-text-primary">{summary.wallet.balance_total_credits.toFixed(2)}</p>
        </article>
        <article className="rounded-2xl border border-border-subtle bg-surface p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-text-muted">Paid</p>
          <p className="mt-2 font-display text-4xl text-brand">{summary.wallet.balance_paid_credits.toFixed(2)}</p>
        </article>
        <article className="rounded-2xl border border-border-subtle bg-surface p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-text-muted">Bonus</p>
          <p className="mt-2 font-display text-4xl text-gold">{summary.wallet.balance_bonus_credits.toFixed(2)}</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-border-subtle bg-surface p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-3xl text-text-primary">Pending Rewards</h2>
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
              {summary.pendingRewardsCount} pendentes
            </span>
          </div>
          {(invitesResult.data ?? []).filter((invite) => ["pending", "qualified", "under_review"].includes(invite.status)).length === 0 ? (
            <p className="mt-3 text-sm text-text-secondary">Nenhuma recompensa pendente no momento.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {(invitesResult.data ?? [])
                .filter((invite) => ["pending", "qualified", "under_review"].includes(invite.status))
                .map((invite) => (
                  <li key={invite.id} className="rounded-xl border border-border-subtle bg-bg-elevated p-3 text-sm">
                    <p className="text-text-primary">{invite.invited_email ?? invite.invited_phone ?? "Convite sem contato"}</p>
                    <p className="text-xs text-text-muted">
                      Status: {invite.status} • ETA: {invite.qualification_ready_at ? new Date(invite.qualification_ready_at).toLocaleDateString("pt-BR") : "aguardando"}
                    </p>
                  </li>
                ))}
            </ul>
          )}
        </article>

        <aside className="rounded-2xl border border-border-subtle bg-surface p-5">
          <h2 className="font-display text-3xl text-text-primary">Referral</h2>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-text-muted">Código</p>
          <div className="mt-1 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 font-mono text-sm text-text-primary">
            {referralCode.code}
          </div>
          <p className="mt-3 text-xs uppercase tracking-[0.16em] text-text-muted">Link</p>
          <div className="mt-1 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs text-text-secondary">
            {referralLink}
          </div>
          <div className="mt-4 text-xs text-text-muted">
            Convites: {Object.entries(summary.invitesByStatus)
              .map(([status, count]) => `${status} (${count})`)
              .join(" • ") || "nenhum"}
          </div>
        </aside>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-border-subtle bg-surface p-5">
          <h2 className="font-display text-3xl text-text-primary">Expiring Soon</h2>
          {summary.expiringSoon.length === 0 ? (
            <p className="mt-3 text-sm text-text-secondary">Sem créditos bônus em expiração próxima.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {summary.expiringSoon.map((entry) => (
                <li key={entry.id} className="rounded-xl border border-gold/30 bg-gold/10 p-3 text-sm text-gold">
                  {entry.amountCredits.toFixed(2)} créditos expiram em {entry.expiresAt ? new Date(entry.expiresAt).toLocaleDateString("pt-BR") : "—"}
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-2xl border border-border-subtle bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-3xl text-text-primary">Invite Status</h2>
            <Link href="/api/therapist/referrals/invites" className="text-xs text-brand hover:text-brand-hover">
              API
            </Link>
          </div>
          {(invitesResult.data ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-text-secondary">Nenhum convite registrado ainda.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {(invitesResult.data ?? []).slice(0, 8).map((invite) => (
                <li key={invite.id} className="rounded-xl border border-border-subtle bg-bg-elevated p-3 text-sm">
                  <p className="text-text-primary">{invite.invited_email ?? invite.invited_phone ?? "Contato indisponível"}</p>
                  <p className="text-xs text-text-muted">
                    {invite.status} • criado em {new Date(invite.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="rounded-2xl border border-border-subtle bg-surface p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-3xl text-text-primary">Ledger / Extract</h2>
          <form className="flex flex-wrap items-center gap-2 text-xs" method="GET">
            <input name="from" defaultValue={params.from ?? ""} placeholder="from ISO" className="rounded-lg border border-border-subtle bg-bg-elevated px-2 py-1 text-text-secondary" />
            <input name="to" defaultValue={params.to ?? ""} placeholder="to ISO" className="rounded-lg border border-border-subtle bg-bg-elevated px-2 py-1 text-text-secondary" />
            <input name="entryKind" defaultValue={params.entryKind ?? ""} placeholder="entry kind" className="rounded-lg border border-border-subtle bg-bg-elevated px-2 py-1 text-text-secondary" />
            <input name="sourceType" defaultValue={params.sourceType ?? ""} placeholder="source type" className="rounded-lg border border-border-subtle bg-bg-elevated px-2 py-1 text-text-secondary" />
            <button type="submit" className="rounded-lg bg-brand px-3 py-1 font-semibold text-bg-base">Filtrar</button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs text-text-secondary">
            <thead>
              <tr className="border-b border-border-subtle text-text-muted">
                <th className="py-2">Data</th>
                <th className="py-2">Tipo</th>
                <th className="py-2">Bucket</th>
                <th className="py-2">Créditos</th>
                <th className="py-2">Source</th>
                <th className="py-2">Status</th>
                <th className="py-2">Expira</th>
              </tr>
            </thead>
            <tbody>
              {(ledgerEntries ?? []).map((entry) => (
                <tr key={entry.id} className="border-b border-border-subtle/60">
                  <td className="py-2">{new Date(entry.created_at).toLocaleString("pt-BR")}</td>
                  <td className="py-2 uppercase">{entry.entry_kind}</td>
                  <td className="py-2 uppercase">{entry.bucket}</td>
                  <td className="py-2 font-semibold text-text-primary">{Number(entry.amount_credits).toFixed(2)}</td>
                  <td className="py-2">{entry.source_type}</td>
                  <td className="py-2">{entry.status}</td>
                  <td className="py-2">{entry.expires_at ? new Date(entry.expires_at).toLocaleDateString("pt-BR") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
