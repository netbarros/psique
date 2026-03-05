"use client";

import Link from "next/link";
import { useState, useId, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MedicalRecordRow, SessionRow, PaymentRow } from "@/lib/database.types";
import { formatBRL } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────
interface PatientDetailTabsProps {
  patientId: string;
  records: MedicalRecordRow[];
  sessions: SessionRow[];
  payments: PaymentRow[];
}

interface AIInsightsResult {
  insights: string[];
  recommendations: string[];
  alerts: string[];
}

type AIErrorCode =
  | "AI_NOT_CONFIGURED"
  | "AI_PROVIDER_AUTH"
  | "AI_PROVIDER_RATE_LIMIT"
  | "AI_PROVIDER_UNAVAILABLE"
  | "AI_INTERNAL_ERROR";

// ── Constants ─────────────────────────────────────────────────────
const TABS = [
  { key: "prontuario", label: "Prontuário", icon: "📋" },
  { key: "sessoes", label: "Sessões", icon: "🎙" },
  { key: "ia", label: "IA", icon: "🧠" },
  { key: "financeiro", label: "Financeiro", icon: "💳" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const RECORD_TYPE_LABELS: Record<string, { label: string; badgeClass: string }> = {
  note: {
    label: "Nota",
    badgeClass:
      "border-[rgba(82,183,136,.3)] bg-[rgba(82,183,136,.1)] text-brand",
  },
  hypothesis: {
    label: "Hipótese",
    badgeClass: "border-[#a78bfa]/40 bg-[#a78bfa]/10 text-[#a78bfa]",
  },
  goal: {
    label: "Objetivo",
    badgeClass: "border-info/40 bg-info/10 text-info",
  },
  evolution: {
    label: "Evolução",
    badgeClass: "border-gold/40 bg-gold/10 text-gold",
  },
  attachment: {
    label: "Anexo",
    badgeClass:
      "border-border-strong bg-surface-hover text-text-secondary",
  },
  risk_assessment: {
    label: "Risco",
    badgeClass: "border-error/40 bg-error/10 text-error",
  },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  pending: {
    label: "Pendente",
    badgeClass: "border-gold/40 bg-gold/10 text-gold",
  },
  processing: {
    label: "Processando",
    badgeClass: "border-info/40 bg-info/10 text-info",
  },
  paid: {
    label: "Pago",
    badgeClass:
      "border-[rgba(82,183,136,.4)] bg-[rgba(82,183,136,.12)] text-brand",
  },
  failed: {
    label: "Falhou",
    badgeClass: "border-error/40 bg-error/10 text-error",
  },
  refunded: {
    label: "Reembolsado",
    badgeClass: "border-[#a78bfa]/40 bg-[#a78bfa]/10 text-[#a78bfa]",
  },
  disputed: {
    label: "Disputado",
    badgeClass: "border-error/40 bg-error/10 text-error",
  },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  stripe: "Stripe",
  pix: "PIX",
  manual: "Manual",
  exempt: "Isento",
};

// ── Helpers ───────────────────────────────────────────────────────
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}min ${s > 0 ? `${s}s` : ""}`.trim();
}

// ── Component ─────────────────────────────────────────────────────
export function PatientDetailTabs({
  patientId,
  records,
  sessions,
  payments,
}: PatientDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("prontuario");
  const [aiResult, setAiResult] = useState<AIInsightsResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiErrorCode, setAiErrorCode] = useState<AIErrorCode | null>(null);
  const tabId = useId();

  const fetchInsights = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);
    setAiErrorCode(null);
    try {
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: patientId }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as {
          error?: string;
          code?: AIErrorCode;
        };
        setAiErrorCode(err.code ?? null);
        if (err.code === "AI_NOT_CONFIGURED") {
          setAiError("IA não configurada para sua conta. Conecte um provedor em Configurações > Integrações.");
          return;
        }
        if (err.code === "AI_PROVIDER_AUTH") {
          setAiError("A autenticação do provedor de IA falhou. Revalide a integração em Configurações.");
          return;
        }
        throw new Error(err.error ?? `Erro ${res.status}`);
      }
      const json = (await res.json()) as { data: AIInsightsResult };
      setAiResult(json.data);
    } catch (e) {
      setAiErrorCode(null);
      setAiError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setAiLoading(false);
    }
  }, [patientId]);

  return (
    <div className="w-full">
      {/* Tab bar */}
      <div
        className="flex gap-2 border-b border-border-subtle mb-8"
        role="tablist"
        aria-label="Detalhes do paciente"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              id={`${tabId}-tab-${tab.key}`}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={`${tabId}-panel-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-5 py-3 text-[14px] flex items-center gap-2 transition-colors duration-200 outline-none
                ${isActive ? "text-brand font-medium" : "text-text-muted hover:text-text-primary"}`}
            >
              <span className="opacity-80">{tab.icon}</span>
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-brand shadow-[0_0_8px_var(--color-brand)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab panels */}
      <div
        id={`${tabId}-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`${tabId}-tab-${activeTab}`}
        className="relative min-h-[400px]"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "prontuario" && <ProntuarioTab records={records} />}
            {activeTab === "sessoes" && <SessoesTab sessions={sessions} />}
            {activeTab === "ia" && (
              <IATab
                result={aiResult}
                loading={aiLoading}
                error={aiError}
                errorCode={aiErrorCode}
                onGenerate={fetchInsights}
              />
            )}
            {activeTab === "financeiro" && <FinanceiroTab payments={payments} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Tab: Prontuário ───────────────────────────────────────────────
function ProntuarioTab({ records }: { records: MedicalRecordRow[] }) {
  if (records.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="Nenhum registro no prontuário"
        subtitle="Registros clínicos aparecerão aqui conforme as sessões ocorrem."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {records.map((r, idx) => {
        const typeCfg = RECORD_TYPE_LABELS[r.type] ?? {
          label: r.type,
          badgeClass:
            "border-border-strong bg-surface-hover text-text-muted",
        };
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={r.id}
            className="bg-surface border border-border-subtle rounded-2xl p-6 hover:border-border-strong transition-all duration-300 shadow-sm glass-panel group"
          >
            <div className="flex justify-between items-center mb-4">
              <span
                className={`text-[12px] px-3 py-1 rounded-full border flex items-center gap-1.5 font-medium ${typeCfg.badgeClass}`}
              >
                {typeCfg.label}
              </span>
              <span className="text-[12px] text-text-muted tracking-wider">
                {fmtDate(r.created_at)}
              </span>
            </div>
            <p className="text-[14px] text-text-secondary leading-relaxed whitespace-pre-wrap">
              {r.content.length > 300
                ? r.content.slice(0, 300) + "..."
                : r.content}
            </p>
            {r.is_private && (
              <div className="mt-4 text-[11px] text-text-muted flex items-center gap-1.5 uppercase tracking-widest font-medium">
                <span className="text-amber-400 opacity-80 group-hover:opacity-100 transition-opacity">🔒</span> Privado
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Tab: Sessões ──────────────────────────────────────────────────
function SessoesTab({ sessions }: { sessions: SessionRow[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon="🎙"
        title="Nenhuma sessão realizada"
        subtitle="O histórico de sessões aparecerá aqui após a primeira consulta."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {sessions.map((s, idx) => {
        const isExpanded = expanded === s.id;
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={s.id}
            className="bg-surface border border-border-subtle rounded-2xl overflow-hidden transition-all duration-300 hover:border-border-strong shadow-sm glass-panel"
          >
            {/* Session header */}
            <button
              type="button"
              onClick={() => setExpanded(isExpanded ? null : s.id)}
              className="w-full flex items-center gap-5 p-5 text-left outline-none hover:bg-surface-hover transition-colors group"
            >
              {/* Session number */}
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-display text-[18px] font-light text-brand border-[1.5px] border-brand/30 bg-brand/10 group-hover:border-brand/50 transition-colors shrink-0 shadow-inner">
                {s.session_number}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="text-[16px] text-text-primary font-medium md:text-[18px]">
                  Sessão #{s.session_number}
                </div>
                <div className="flex flex-wrap gap-4 text-[13px] text-text-muted mt-1 font-light">
                  <span>{fmtDate(s.created_at)}</span>
                  {s.duration_seconds && (
                    <span>{fmtDuration(s.duration_seconds)}</span>
                  )}
                  {s.nps_score !== null && s.nps_score !== undefined && (
                    <span className="text-gold font-medium border border-gold/30 bg-gold/10 rounded-full px-2 py-0.5 text-[11px]">
                      NPS: {s.nps_score}/5
                    </span>
                  )}
                </div>
              </div>

              {/* Mood indicators */}
              <div className="flex items-center gap-4 text-[14px]">
                {s.mood_before !== null && s.mood_before !== undefined && (
                  <span className="text-text-muted opacity-60 flex items-center gap-1.5" title="Humor antes">
                    😐 {s.mood_before}
                  </span>
                )}
                {s.mood_after !== null && s.mood_after !== undefined && (
                  <span className="text-brand flex items-center gap-1.5 font-medium" title="Humor depois">
                    😊 {s.mood_after}
                  </span>
                )}
                <span
                  className={`ml-2 text-[20px] text-text-muted transition-transform duration-300 ${
                    isExpanded ? "rotate-180" : "rotate-0"
                  }`}
                >
                  ▾
                </span>
              </div>
            </button>

            {/* Expanded details */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="border-t border-border-subtle bg-bg-base/50"
                >
                  <div className="p-6 space-y-6">
                    {/* AI Summary */}
                    {s.ai_summary && (
                      <div>
                        <div className="text-[12px] text-text-muted uppercase tracking-widest font-medium mb-2.5">
                          Resumo IA
                        </div>
                        <p className="text-[14px] text-text-secondary leading-relaxed whitespace-pre-wrap font-light">
                          {s.ai_summary}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* AI Insights */}
                      {s.ai_insights && s.ai_insights.length > 0 && (
                        <div>
                          <div className="text-[12px] text-text-muted uppercase tracking-widest font-medium mb-2.5 flex items-center gap-1.5">
                            <span className="text-brand opacity-80">💡</span> Insights
                          </div>
                          <ul className="flex flex-col gap-2">
                            {s.ai_insights.map((insight, i) => (
                              <li
                                key={i}
                                className="text-[13px] text-text-secondary pl-3 border-l-2 border-brand/70 py-0.5 leading-relaxed font-light"
                              >
                                {insight}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Next steps */}
                      {s.ai_next_steps && s.ai_next_steps.length > 0 && (
                        <div>
                          <div className="text-[12px] text-text-muted uppercase tracking-widest font-medium mb-2.5 flex items-center gap-1.5">
                            <span className="text-gold opacity-80">🎯</span> Próximos Passos
                          </div>
                          <ul className="flex flex-col gap-2">
                            {s.ai_next_steps.map((step, i) => (
                              <li
                                key={i}
                                className="text-[13px] text-text-secondary pl-3 border-l-2 border-gold/70 py-0.5 leading-relaxed font-light"
                              >
                                {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Risk flags */}
                    {s.ai_risk_flags && s.ai_risk_flags.length > 0 && (
                      <div className="bg-error/10 border border-error/30 rounded-xl p-4">
                        <div className="text-[12px] text-error uppercase tracking-widest font-semibold mb-2 flex items-center gap-1.5">
                          <span>⚠</span> Flags de Risco
                        </div>
                        <ul className="flex flex-col gap-1.5">
                          {s.ai_risk_flags.map((flag, i) => (
                            <li
                              key={i}
                              className="text-[13px] text-error/90 pl-3 border-l-2 border-error leading-relaxed"
                            >
                              {flag}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Therapist notes */}
                    {s.therapist_notes && (
                      <div className="pt-2">
                        <div className="text-[12px] text-text-muted uppercase tracking-widest font-medium mb-2.5">
                          Anotações Terapeuta
                        </div>
                        <p className="text-[14px] text-text-secondary leading-relaxed whitespace-pre-wrap p-4 bg-surface rounded-xl border border-border-subtle font-light shadow-inner">
                          {s.therapist_notes}
                        </p>
                      </div>
                    )}

                    {/* Signed badge */}
                    {s.is_signed && (
                      <div className="mt-4 inline-flex items-center gap-2 text-[12px] px-3.5 py-1.5 rounded-full bg-brand/10 text-brand border border-brand/30 font-medium">
                        ✓ Assinada
                        {s.signed_at && (
                          <span className="text-brand/60 font-light ml-1">
                            · {fmtDate(s.signed_at)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Tab: IA ───────────────────────────────────────────────────────
function IATab({
  result,
  loading,
  error,
  errorCode,
  onGenerate,
}: {
  result: AIInsightsResult | null;
  loading: boolean;
  error: string | null;
  errorCode: AIErrorCode | null;
  onGenerate: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Generate button */}
      <div className="bg-surface border border-border-subtle p-6 rounded-2xl glass-panel">
        <h3 className="font-display text-[22px] font-light text-text-primary mb-2">Análise de IA</h3>
        <p className="text-[14px] text-text-muted font-light mb-5">
          A Inteligência Artificial analisa o histórico de sessões, anotações e evolução do paciente para gerar insights clínicos, identificar padrões e sugerir próximos passos.
        </p>
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          className={`px-6 py-3 rounded-xl text-[14px] font-medium flex items-center justify-center gap-2.5 transition-all duration-300 w-full sm:w-auto shadow-sm
            ${loading ? "bg-surface-hover text-text-muted cursor-not-allowed" : "bg-brand text-bg-base hover:bg-opacity-90 hover:scale-[1.02] shadow-[0_0_15px_rgba(82,183,136,0.2)]"}`}
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-[var(--color-text-muted)] border-t-transparent rounded-full animate-spin" />
              Processando análise...
            </>
          ) : (
            <>🧠 Gerar Relatório de Insights</>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-5 py-4 bg-error/10 border border-error/30 rounded-xl text-error text-[14px] font-medium space-y-2">
          <p>{error}</p>
          {(errorCode === "AI_NOT_CONFIGURED" || errorCode === "AI_PROVIDER_AUTH") && (
            <Link
              href="/dashboard/configuracoes/integracoes"
              className="inline-flex rounded-md border border-error/40 bg-error/15 px-2 py-1 text-[11px] font-medium text-error transition-colors hover:bg-error/20"
            >
              Abrir Configurações de Integração
            </Link>
          )}
        </div>
      )}

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col gap-5"
        >
          {/* Insights */}
          {result.insights.length > 0 && (
            <InsightSection
              title="Insights Clínicos"
              items={result.insights}
              icon="💡"
              tone="brand"
              delay={0.1}
            />
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <InsightSection
              title="Recomendações Terapêuticas"
              items={result.recommendations}
              icon="📌"
              tone="amber"
              delay={0.2}
            />
          )}

          {/* Alerts */}
          {result.alerts.length > 0 && (
            <InsightSection
              title="Atenção Especial"
              items={result.alerts}
              icon="⚠"
              tone="danger"
              delay={0.3}
            />
          )}
        </motion.div>
      )}

      {/* No result yet */}
      {!result && !error && !loading && (
        <EmptyState
          icon="✨"
          title="Pronto para análise"
          subtitle="Clique no botão acima para sintetizar o histórico deste paciente com Inteligência Artificial."
        />
      )}
    </div>
  );
}

function InsightSection({
  title,
  items,
  icon,
  tone,
  delay = 0,
}: {
  title: string;
  items: string[];
  icon: string;
  tone: "brand" | "amber" | "danger";
  delay?: number;
}) {
  const toneClasses: Record<
    "brand" | "amber" | "danger",
    { heading: string; bar: string }
  > = {
    brand: {
      heading: "text-brand",
      bar: "border-brand/70",
    },
    amber: {
      heading: "text-gold",
      bar: "border-gold/70",
    },
    danger: {
      heading: "text-error",
      bar: "border-error/70",
    },
  };

  const toneCfg = toneClasses[tone];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="bg-surface border border-border-subtle rounded-2xl p-6 glass-panel"
    >
      <div className={`text-[14px] font-semibold flex items-center gap-2 mb-4 uppercase tracking-widest ${toneCfg.heading}`}>
        <span className="text-[16px]">{icon}</span> {title}
      </div>
      <ul className="flex flex-col gap-3">
        {items.map((item, i) => (
          <li
            key={i}
            className={`text-[14px] text-text-secondary border-l-[3px] pl-4 py-0.5 font-light leading-relaxed ${toneCfg.bar}`}
          >
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

// ── Tab: Financeiro ───────────────────────────────────────────────
function FinanceiroTab({ payments }: { payments: PaymentRow[] }) {
  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((acc, p) => acc + Number(p.amount), 0);

  if (payments.length === 0) {
    return (
      <EmptyState
        icon="💳"
        title="Nenhum pagamento registrado"
        subtitle="Os pagamentos aparecerão aqui conforme as sessões são realizadas."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          label="Total Recebido"
          value={formatBRL(totalPaid)}
          tone="brand"
          delay={0}
        />
        <SummaryCard
          label="Cobranças"
          value={String(payments.length)}
          tone="sky"
          delay={0.05}
        />
        <SummaryCard
          label="Em Aberto"
          value={String(
            payments.filter((p) => p.status === "pending").length
          )}
          tone="amber"
          delay={0.1}
        />
      </div>

      {/* Payments table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-surface border border-border-subtle rounded-2xl overflow-hidden glass-panel"
      >
        {/* Header */}
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] px-6 py-4 border-b border-border-subtle text-[12px] text-text-muted tracking-widest uppercase font-medium bg-surface/50">
          <span>Data</span>
          <span>Valor</span>
          <span>Método</span>
          <span>Status</span>
        </div>

        {/* Rows */}
        <div className="flex flex-col">
          {payments.map((p, i) => {
            const statusCfg = PAYMENT_STATUS_CONFIG[p.status] ?? {
              label: p.status,
              badgeClass:
                "border-border-strong bg-surface-hover text-text-muted",
            };
            return (
              <div
                key={p.id}
                className={`grid grid-cols-[1.5fr_1fr_1fr_1fr] px-6 py-4 items-center transition-colors hover:bg-surface-hover
                  ${i < payments.length - 1 ? "border-b border-border-subtle" : ""}`}
              >
                <span className="text-[14px] text-text-secondary font-light">
                  {fmtDate(p.created_at)}
                </span>
                <span className="text-[15px] text-text-primary font-medium">
                  {formatBRL(Number(p.amount))}
                </span>
                <span className="text-[13px] text-text-muted font-light">
                  {p.method
                    ? PAYMENT_METHOD_LABELS[p.method] ?? p.method
                    : "—"}
                </span>
                <div>
                  <span
                    className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-[11px] font-medium ${statusCfg.badgeClass}`}
                  >
                    {statusCfg.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// ── Shared ────────────────────────────────────────────────────────
function SummaryCard({
  label,
  value,
  tone,
  delay = 0,
}: {
  label: string;
  value: string;
  tone: "brand" | "sky" | "amber";
  delay?: number;
}) {
  const toneClasses: Record<"brand" | "sky" | "amber", string> = {
    brand: "text-brand",
    sky: "text-info",
    amber: "text-gold",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-surface border border-border-subtle rounded-2xl p-6 hover:border-border-strong transition-all duration-300 glass-panel"
    >
      <div className="text-[12px] text-text-muted mb-2 uppercase tracking-widest font-medium">
        {label}
      </div>
      <div className={`font-display text-[32px] font-light tracking-tight ${toneClasses[tone]}`}>
        {value}
      </div>
    </motion.div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-20 px-6 flex flex-col items-center justify-center max-w-md mx-auto"
    >
      <div className="text-[48px] mb-5 opacity-80">{icon}</div>
      <div className="text-[18px] text-text-primary font-medium mb-2.5 font-display">
        {title}
      </div>
      <div className="text-[14px] text-text-muted leading-relaxed text-center font-light">
        {subtitle}
      </div>
    </motion.div>
  );
}
