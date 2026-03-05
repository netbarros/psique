import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { formatBRL } from "@/lib/utils";
import { EnterpriseCard, EnterpriseStat } from "@/components/ui/EnterpriseCard";

export const metadata: Metadata = { title: "Financeiro" };

type PaymentRow = {
  id: string;
  amount: number;
  status: string;
  method: string | null;
  created_at: string;
  patient: { name?: string | null } | Array<{ name?: string | null }> | null;
};

const BAR_HEIGHT_CLASSES = [
  "h-[24%]",
  "h-[34%]",
  "h-[46%]",
  "h-[58%]",
  "h-[74%]",
  "h-[92%]",
] as const;

const BAR_TONE_CLASSES = [
  "bg-brand/20",
  "bg-brand/30",
  "bg-brand/40",
  "bg-brand/50",
  "bg-brand/60",
  "bg-brand",
] as const;

function monthShort(date: Date): string {
  return date
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "")
    .replace(/^\w/, (char) => char.toUpperCase());
}

function resolvePatientName(patient: PaymentRow["patient"]): string {
  if (!patient) return "Paciente";
  if (Array.isArray(patient)) return patient[0]?.name ?? "Paciente";
  return patient.name ?? "Paciente";
}

function statusBadge(status: string): string {
  if (status === "paid") return "border-brand/35 bg-brand/10 text-brand";
  if (status === "pending") return "border-gold/35 bg-gold/10 text-gold";
  return "border-border-strong bg-surface text-text-muted";
}

function methodLabel(method: string | null): string {
  if (!method) return "Manual";
  if (method === "stripe") return "Stripe";
  if (method === "pix") return "PIX";
  if (method === "manual") return "Manual";
  return method;
}

export default async function FinanceiroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: therapist } = await supabase
    .from("therapists")
    .select("id, session_price")
    .eq("user_id", user.id)
    .single();

  if (!therapist) redirect("/auth/login");

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const sixMonthsStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [currentMonthPaid, previousMonthPaid, recentPayments, pendingPayments, sixMonthPayments] = await Promise.all([
    supabase
      .from("payments")
      .select("amount")
      .eq("therapist_id", therapist.id)
      .eq("status", "paid")
      .gte("created_at", currentMonthStart.toISOString()),
    supabase
      .from("payments")
      .select("amount")
      .eq("therapist_id", therapist.id)
      .eq("status", "paid")
      .gte("created_at", previousMonthStart.toISOString())
      .lte("created_at", previousMonthEnd.toISOString()),
    supabase
      .from("payments")
      .select(`
        id, amount, status, method, created_at,
        patient:patients(name)
      `)
      .eq("therapist_id", therapist.id)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("payments")
      .select("amount")
      .eq("therapist_id", therapist.id)
      .eq("status", "pending"),
    supabase
      .from("payments")
      .select("amount, created_at")
      .eq("therapist_id", therapist.id)
      .eq("status", "paid")
      .gte("created_at", sixMonthsStart.toISOString()),
  ]);

  const mrr = (currentMonthPaid.data ?? []).reduce((sum, item) => sum + Number(item.amount), 0);
  const previousMrr = (previousMonthPaid.data ?? []).reduce((sum, item) => sum + Number(item.amount), 0);
  const mrrDelta = previousMrr > 0 ? ((mrr - previousMrr) / previousMrr) * 100 : 0;
  const pendingAmount = (pendingPayments.data ?? []).reduce((sum, item) => sum + Number(item.amount), 0);
  const estimatedTax = mrr * 0.06;

  const monthTotals = Array.from({ length: 6 }, (_, offset) => {
    const baseDate = new Date(now.getFullYear(), now.getMonth() - (5 - offset), 1);
    const key = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, "0")}`;
    const total = (sixMonthPayments.data ?? []).reduce((sum, payment) => {
      const paymentDate = new Date(payment.created_at);
      const paymentKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, "0")}`;
      return paymentKey === key ? sum + Number(payment.amount) : sum;
    }, 0);
    return { label: monthShort(baseDate), total };
  });

  const maxTotal = Math.max(...monthTotals.map((month) => month.total), 1);
  const bars = monthTotals.map((month) => {
    const pct = Math.round((month.total / maxTotal) * 100);
    if (pct <= 20) return BAR_HEIGHT_CLASSES[0];
    if (pct <= 35) return BAR_HEIGHT_CLASSES[1];
    if (pct <= 50) return BAR_HEIGHT_CLASSES[2];
    if (pct <= 65) return BAR_HEIGHT_CLASSES[3];
    if (pct <= 80) return BAR_HEIGHT_CLASSES[4];
    return BAR_HEIGHT_CLASSES[5];
  });

  const payments = (recentPayments.data ?? []) as PaymentRow[];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-text-primary">
            Financial Intelligence
          </h1>
          <p className="text-sm text-text-muted">
            {now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-surface text-text-secondary transition-colors hover:text-text-primary"
          aria-label="Filtros financeiros"
        >
          <span className="material-symbols-outlined text-xl">tune</span>
        </button>
      </header>

      <EnterpriseCard className="p-6">
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gold/10 blur-3xl" />

        <div className="relative space-y-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm text-text-secondary">
              <span className="material-symbols-outlined text-sm">monitoring</span>
              Monthly Recurring Revenue
            </p>
            <span className="inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
              <span className="material-symbols-outlined text-[10px]">
                {mrrDelta >= 0 ? "arrow_upward" : "arrow_downward"}
              </span>
              {Math.abs(mrrDelta).toFixed(1)}%
            </span>
          </div>

          <div>
            <h2 className="font-display text-5xl font-bold tracking-tight text-text-primary">
              {formatBRL(mrr)}
            </h2>
            <p className="mt-1 text-sm text-text-muted">vs {formatBRL(previousMrr)} no mês anterior</p>
          </div>

          <div className="border-t border-border-subtle pt-4">
            <div className="flex h-16 items-end gap-2">
              {bars.map((barClass, index) => (
                <div
                  key={`${monthTotals[index].label}-${index}`}
                  className={`w-full rounded-t-sm transition-colors duration-300 hover:bg-brand/80 ${barClass} ${BAR_TONE_CLASSES[index]}`}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-text-muted">
              {monthTotals.map((month, index) => (
                <span key={month.label} className={index === monthTotals.length - 1 ? "font-medium text-brand" : ""}>
                  {month.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </EnterpriseCard>

      <div className="grid grid-cols-2 gap-4">
        <EnterpriseStat
          label={
            <div className="mb-3 flex items-center gap-2">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 text-gold">
                <span className="material-symbols-outlined text-sm">schedule</span>
              </div>
              <span className="text-sm font-medium text-text-secondary normal-case tracking-normal">Pending</span>
            </div> as unknown as string
          }
          value={formatBRL(pendingAmount)}
          trendLabel={`${pendingPayments.data?.length ?? 0} aguardando`}
          delay={0.1}
        />

        <EnterpriseStat
          label={
            <div className="mb-3 flex items-center gap-2">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-error/10 text-error">
                <span className="material-symbols-outlined text-sm">receipt_long</span>
              </div>
              <span className="text-sm font-medium text-text-secondary normal-case tracking-normal">Est. Tax</span>
            </div> as unknown as string
          }
          value={formatBRL(estimatedTax)}
          trendLabel="Simples (6%)"
          delay={0.2}
        />
      </div>

      <EnterpriseCard className="p-0 overflow-hidden" delay={0.3}>
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-4">
          <h3 className="text-base font-semibold text-text-primary">Recent Transactions</h3>
          <button type="button" className="text-sm text-gold transition-colors hover:text-text-primary">
            Ver todas
          </button>
        </div>

        {payments.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-text-secondary">Nenhuma transação encontrada.</div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {payments.map((payment) => (
              <article
                key={payment.id}
                className="flex cursor-pointer items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-bg-elevated"
              >
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <span className="material-symbols-outlined">psychology</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{resolvePatientName(payment.patient)}</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {new Date(payment.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })}{" "}
                      • {methodLabel(payment.method)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-text-primary">
                    {formatBRL(Number(payment.amount))}
                  </p>
                  <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusBadge(payment.status)}`}>
                    {payment.status}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="border-t border-border-subtle bg-bg-elevated px-4 py-3 text-center">
          <p className="inline-flex items-center gap-1 text-xs text-text-muted">
            <span className="material-symbols-outlined text-sm">lock</span>
            Payments securely processed by Stripe
          </p>
        </div>
      </EnterpriseCard>
    </div>
  );
}
