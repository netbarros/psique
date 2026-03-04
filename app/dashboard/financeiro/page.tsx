import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatBRL, formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Financeiro" };

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
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

  const [paymentsThisMonth, paymentsLastMonth, allPayments] = await Promise.all([
    supabase
      .from("payments")
      .select("amount, status")
      .eq("therapist_id", therapist.id)
      .eq("status", "paid")
      .gte("created_at", startOfMonth),
    supabase
      .from("payments")
      .select("amount")
      .eq("therapist_id", therapist.id)
      .eq("status", "paid")
      .gte("created_at", lastMonthStart)
      .lte("created_at", lastMonthEnd),
    supabase
      .from("payments")
      .select(`
        id, amount, currency, method, status, created_at, paid_at,
        patient:patients(name)
      `)
      .eq("therapist_id", therapist.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const mrr = (paymentsThisMonth.data ?? []).reduce(
    (acc, p) => acc + Number(p.amount),
    0
  );
  const mrrLast = (paymentsLastMonth.data ?? []).reduce(
    (acc, p) => acc + Number(p.amount),
    0
  );
  const mrrDelta = mrrLast > 0 ? ((mrr - mrrLast) / mrrLast) * 100 : 0;
  const payments = allPayments.data ?? [];
  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((acc, p) => acc + Number(p.amount), 0);
  const pending = payments.filter((p) => p.status === "pending").length;

  const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    pending: { label: "Pendente", color: "var(--gold)" },
    processing: { label: "Processando", color: "var(--blue)" },
    paid: { label: "Pago", color: "var(--mint)" },
    failed: { label: "Falhou", color: "var(--red)" },
    refunded: { label: "Reembolsado", color: "var(--purple)" },
    disputed: { label: "Disputado", color: "var(--red)" },
  };

  const METHOD_LABELS: Record<string, string> = {
    stripe: "Stripe",
    pix: "PIX",
    manual: "Manual",
    exempt: "Isento",
  };

  const isPositive = mrrDelta >= 0;

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "var(--ff)",
            fontSize: 34,
            fontWeight: 200,
            color: "var(--ivory)",
          }}
        >
          Financeiro
        </h1>
        <p style={{ fontSize: 14, color: "var(--ivoryDD)", marginTop: 4 }}>
          Receitas, pagamentos e relatórios financeiros
        </p>
      </div>

      {/* KPI cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 18,
            padding: "24px 28px",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "var(--ivoryDD)",
              letterSpacing: ".06em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            MRR Este Mês
          </div>
          <div
            style={{
              fontFamily: "var(--ff)",
              fontSize: 32,
              fontWeight: 200,
              color: "var(--gold)",
              lineHeight: 1,
              marginBottom: 8,
            }}
          >
            {formatBRL(mrr)}
          </div>
          <div
            style={{
              fontSize: 12,
              color: isPositive ? "var(--mint)" : "var(--red)",
            }}
          >
            {isPositive ? "↑" : "↓"} {Math.abs(mrrDelta).toFixed(1)}% vs mês
            anterior
          </div>
        </div>

        <KPISimple
          label="Total Recebido"
          value={formatBRL(totalPaid)}
          color="var(--mint)"
        />
        <KPISimple
          label="Pagamentos"
          value={String(payments.length)}
          color="var(--blue)"
        />
        <KPISimple
          label="Pendentes"
          value={String(pending)}
          color="var(--gold)"
        />
      </div>

      {/* Price info */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: "16px 20px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 11, color: "var(--ivoryDD)", textTransform: "uppercase", letterSpacing: ".08em" }}>
          Preço por sessão:
        </span>
        <span
          style={{
            fontFamily: "var(--ff)",
            fontSize: 20,
            fontWeight: 300,
            color: "var(--gold)",
          }}
        >
          {formatBRL(Number(therapist.session_price))}
        </span>
      </div>

      {/* Payments table */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--ff)",
              fontSize: 22,
              fontWeight: 300,
              color: "var(--ivory)",
            }}
          >
            Últimos Pagamentos
          </h2>
        </div>

        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
            padding: "12px 20px",
            borderBottom: "1px solid var(--border)",
            fontSize: 11,
            color: "var(--ivoryDD)",
            letterSpacing: ".08em",
            textTransform: "uppercase",
          }}
        >
          <span>Paciente</span>
          <span>Data</span>
          <span>Valor</span>
          <span>Método</span>
          <span>Status</span>
        </div>

        {payments.length === 0 ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "var(--ivoryDD)",
              fontSize: 14,
            }}
          >
            Nenhum pagamento registrado ainda.
          </div>
        ) : (
          <div>
            {payments.map((p, i) => {
              const patient = p.patient as unknown as { name: string } | null;
              const statusCfg = PAYMENT_STATUS_CONFIG[p.status] ?? {
                label: p.status,
                color: "var(--ivoryDD)",
              };
              return (
                <div
                  key={p.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                    padding: "14px 20px",
                    alignItems: "center",
                    borderBottom:
                      i < payments.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                  }}
                >
                  <span style={{ fontSize: 14, color: "var(--ivory)", fontWeight: 500 }}>
                    {patient?.name ?? "—"}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--ivoryDD)" }}>
                    {formatDate(p.created_at)}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color: "var(--ivory)",
                      fontWeight: 500,
                    }}
                  >
                    {formatBRL(Number(p.amount))}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--ivoryDD)" }}>
                    {p.method ? METHOD_LABELS[p.method] ?? p.method : "—"}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "3px 10px",
                      borderRadius: 20,
                      background: `color-mix(in srgb, ${statusCfg.color} 12%, transparent)`,
                      color: statusCfg.color,
                      border: `1px solid color-mix(in srgb, ${statusCfg.color} 30%, transparent)`,
                      display: "inline-flex",
                      alignItems: "center",
                      width: "fit-content",
                    }}
                  >
                    {statusCfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function KPISimple({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 18,
        padding: "24px 28px",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "var(--ivoryDD)",
          letterSpacing: ".06em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--ff)",
          fontSize: 32,
          fontWeight: 200,
          color,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}
