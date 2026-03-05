"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { MedicalRecordRow, PaymentRow, SessionRow } from "@/lib/database.types";
import { formatBRL } from "@/lib/utils";

type TabKey = "overview" | "records" | "finance";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "overview", label: "Visão Geral" },
  { key: "records", label: "Prontuário" },
  { key: "finance", label: "Financeiro" },
];

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function paymentStatusChip(status: string): string {
  if (status === "paid") return "border-brand/35 bg-brand/10 text-brand";
  if (status === "pending") return "border-amber-400/35 bg-amber-400/10 text-amber-300";
  if (status === "refunded") return "border-sky-400/35 bg-sky-400/10 text-sky-300";
  return "border-border-strong bg-surface text-text-muted";
}

const MOOD_HEIGHT_CLASSES = [
  "h-[12%]",
  "h-[20%]",
  "h-[28%]",
  "h-[36%]",
  "h-[44%]",
  "h-[52%]",
  "h-[60%]",
  "h-[68%]",
  "h-[76%]",
  "h-[84%]",
  "h-[92%]",
] as const;

function moodHeightClass(value: number): string {
  const clamped = Math.max(0, Math.min(10, Math.round(value)));
  return MOOD_HEIGHT_CLASSES[clamped];
}

export function PatientProfileTabs({
  patientName,
  records,
  sessions,
  payments,
  riskBadge,
}: {
  patientName: string;
  records: MedicalRecordRow[];
  sessions: SessionRow[];
  payments: PaymentRow[];
  riskBadge: string | null;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const latestSession = sessions[0] ?? null;
  const insightSummary =
    latestSession?.ai_summary?.trim() ||
    `${patientName} apresenta evolução progressiva no processo terapêutico, mantendo pontos de atenção em regulação emocional e limites interpessoais.`;
  const keyHypothesis = latestSession?.ai_insights?.[0] ?? "Conflito entre autonomia e necessidade de validação externa.";
  const nextSteps =
    latestSession?.ai_next_steps?.slice(0, 2) ??
    [
      "Explorar eventos gatilho da semana no contexto profissional.",
      "Mapear resposta corporal em situações de cobrança externa.",
    ];

  const paidTotal = useMemo(
    () =>
      payments
        .filter((payment) => payment.status === "paid")
        .reduce((acc, payment) => acc + Number(payment.amount ?? 0), 0),
    [payments]
  );
  const pendingCount = useMemo(
    () => payments.filter((payment) => payment.status === "pending").length,
    [payments]
  );

  const moodSeries = sessions
    .slice(0, 5)
    .reverse()
    .map((session) => ({
      key: session.id,
      label: `S${session.session_number}`,
      value: Math.max(0, Math.min(10, Math.round((session.mood_after ?? session.mood_before ?? 5) * 2))),
    }));

  return (
    <section className="space-y-4">
      <div className="flex border-b border-border-subtle relative">
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex-1 pb-3 text-sm font-medium transition-colors ${
                active
                  ? "text-brand"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <span className="relative z-10">{tab.label}</span>
              {active && (
                <motion.div
                  layoutId="patientProfileTabIndicator"
                  className="absolute -bottom-px left-0 right-0 h-[2px] bg-brand"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <AnimatePresence mode="wait">

          {activeTab === "overview" ? (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-4"
            >
          <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-[linear-gradient(135deg,rgba(82,183,136,0.1),rgba(196,163,90,0.05))] p-5">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/10 blur-2xl" />
            <div className="relative space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="flex items-center gap-2 font-display text-xl font-medium text-text-primary">
                  <Sparkles className="h-5 w-5 text-gold" />
                  AI Clinical Insights
                </h3>
                {riskBadge ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-error/35 bg-error/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-error">
                    <AlertTriangle className="h-3 w-3" />
                    {riskBadge}
                  </span>
                ) : null}
              </div>

              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold">
                  Resumo Analítico
                </h4>
                <p className="text-sm leading-relaxed text-text-secondary">{insightSummary}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-gold/20 bg-bg-elevated p-3">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Hipótese Principal
                  </h4>
                  <p className="text-sm text-text-primary">{keyHypothesis}</p>
                </div>
                <div className="rounded-lg border border-gold/20 bg-bg-elevated p-3">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Próximos Passos
                  </h4>
                  <ul className="list-disc space-y-1 pl-4 text-sm text-text-primary marker:text-gold">
                    {nextSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {moodSeries.length > 0 ? (
            <div className="rounded-2xl border border-border-subtle bg-surface p-4">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="font-display text-lg text-text-primary">
                  Evolução de Humor
                </h4>
                <span className="text-xs text-text-muted">Últimas 5 sessões</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {moodSeries.map((point, index) => (
                  <motion.div 
                    key={point.key} 
                    className="space-y-1"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <div className="flex h-16 items-end rounded bg-bg-elevated p-1">
                      <div className={`w-full rounded bg-brand/80 ${moodHeightClass(point.value)}`} />
                    </div>
                    <p className="text-center text-[10px] text-text-muted">{point.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : null}
            </motion.div>
          ) : null}

          {activeTab === "records" ? (
            <motion.div
              key="records"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-3"
            >
          {records.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-subtle bg-surface p-4 text-sm text-text-secondary">
              Nenhum registro clínico até o momento.
            </div>
          ) : (
            records.map((record, index) => (
              <motion.article
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="rounded-xl border border-border-subtle bg-surface p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-full border border-border-strong bg-bg-elevated px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    {record.type}
                  </span>
                  <span className="text-xs text-text-muted">{formatDate(record.created_at)}</span>
                </div>
                <p className="text-sm leading-relaxed text-text-secondary">{record.content}</p>
              </motion.article>
            ))
          )}
            </motion.div>
          ) : null}

          {activeTab === "finance" ? (
            <motion.div
              key="finance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border-subtle bg-surface p-4">
                  <p className="text-xs uppercase tracking-widest text-text-muted">Recebido</p>
                  <p className="mt-1 font-display text-2xl text-text-primary">
                    {formatBRL(paidTotal)}
                  </p>
                </div>
                <div className="rounded-xl border border-border-subtle bg-surface p-4">
                  <p className="text-xs uppercase tracking-widest text-text-muted">Pendências</p>
                  <p className="mt-1 font-display text-2xl text-text-primary">
                    {pendingCount}
                  </p>
                </div>
              </div>

              {payments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border-subtle bg-surface p-4 text-sm text-text-secondary">
                  Sem pagamentos vinculados.
                </div>
              ) : (
                payments.slice(0, 8).map((payment, index) => (
                  <motion.article
                    key={payment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 + 0.1, duration: 0.3 }}
                    className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {formatBRL(Number(payment.amount ?? 0))}
                      </p>
                      <p className="text-xs text-text-muted">{formatDate(payment.created_at)}</p>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${paymentStatusChip(payment.status)}`}>
                      {payment.status}
                    </span>
                  </motion.article>
                ))
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}
