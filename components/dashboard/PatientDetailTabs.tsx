"use client";

import { useState, useId, useCallback } from "react";
import type { MedicalRecordRow, SessionRow, PaymentRow } from "@/types/database";
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

// ── Constants ─────────────────────────────────────────────────────
const TABS = [
  { key: "prontuario", label: "Prontuário", icon: "📋" },
  { key: "sessoes", label: "Sessões", icon: "🎙" },
  { key: "ia", label: "IA", icon: "🧠" },
  { key: "financeiro", label: "Financeiro", icon: "💳" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const RECORD_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  note: { label: "Nota", color: "var(--mint)" },
  hypothesis: { label: "Hipótese", color: "var(--purple)" },
  goal: { label: "Objetivo", color: "var(--blue)" },
  evolution: { label: "Evolução", color: "var(--gold)" },
  attachment: { label: "Anexo", color: "var(--ivoryD)" },
  risk_assessment: { label: "Risco", color: "var(--red)" },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "var(--gold)" },
  processing: { label: "Processando", color: "var(--blue)" },
  paid: { label: "Pago", color: "var(--mint)" },
  failed: { label: "Falhou", color: "var(--red)" },
  refunded: { label: "Reembolsado", color: "var(--purple)" },
  disputed: { label: "Disputado", color: "var(--red)" },
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
  const tabId = useId();

  const fetchInsights = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: patientId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error ?? `Erro ${res.status}`
        );
      }
      const json = (await res.json()) as { data: AIInsightsResult };
      setAiResult(json.data);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setAiLoading(false);
    }
  }, [patientId]);

  return (
    <div>
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 4,
          borderBottom: "1px solid var(--border)",
          marginBottom: 24,
        }}
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
              style={{
                padding: "12px 20px",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "var(--mint)" : "var(--ivoryDD)",
                background: "transparent",
                border: "none",
                borderBottom: isActive
                  ? "2px solid var(--mint)"
                  : "2px solid transparent",
                cursor: "pointer",
                transition: "all .2s var(--ease-out)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab panels */}
      <div
        id={`${tabId}-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`${tabId}-tab-${activeTab}`}
      >
        {activeTab === "prontuario" && <ProntuarioTab records={records} />}
        {activeTab === "sessoes" && <SessoesTab sessions={sessions} />}
        {activeTab === "ia" && (
          <IATab
            result={aiResult}
            loading={aiLoading}
            error={aiError}
            onGenerate={fetchInsights}
          />
        )}
        {activeTab === "financeiro" && <FinanceiroTab payments={payments} />}
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
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {records.map((r) => {
        const typeCfg = RECORD_TYPE_LABELS[r.type] ?? {
          label: r.type,
          color: "var(--ivoryDD)",
        };
        return (
          <div
            key={r.id}
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: "16px 20px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  padding: "3px 10px",
                  borderRadius: 20,
                  background: `color-mix(in srgb, ${typeCfg.color} 12%, transparent)`,
                  color: typeCfg.color,
                  border: `1px solid color-mix(in srgb, ${typeCfg.color} 30%, transparent)`,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                {typeCfg.label}
              </span>
              <span style={{ fontSize: 11, color: "var(--ivoryDD)" }}>
                {fmtDate(r.created_at)}
              </span>
            </div>
            <p
              style={{
                fontSize: 13,
                color: "var(--ivoryD)",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
              }}
            >
              {r.content.length > 300
                ? r.content.slice(0, 300) + "..."
                : r.content}
            </p>
            {r.is_private && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 10,
                  color: "var(--ivoryDD)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                🔒 Privado
              </div>
            )}
          </div>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {sessions.map((s) => {
        const isExpanded = expanded === s.id;
        return (
          <div
            key={s.id}
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {/* Session header */}
            <button
              type="button"
              onClick={() => setExpanded(isExpanded ? null : s.id)}
              style={{
                width: "100%",
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: 16,
                padding: "16px 20px",
                alignItems: "center",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {/* Session number */}
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle at 35% 35%, rgba(82,183,136,.25), rgba(82,183,136,.08))",
                  border: "1.5px solid rgba(82,183,136,.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--ff)",
                  fontSize: 16,
                  fontWeight: 300,
                  color: "var(--mint)",
                }}
              >
                {s.session_number}
              </div>

              {/* Info */}
              <div>
                <div
                  style={{
                    fontSize: 14,
                    color: "var(--ivory)",
                    fontWeight: 500,
                  }}
                >
                  Sessão #{s.session_number}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    fontSize: 12,
                    color: "var(--ivoryDD)",
                    marginTop: 2,
                  }}
                >
                  <span>{fmtDate(s.created_at)}</span>
                  {s.duration_seconds && (
                    <span>{fmtDuration(s.duration_seconds)}</span>
                  )}
                  {s.nps_score !== null && s.nps_score !== undefined && (
                    <span style={{ color: "var(--gold)" }}>
                      NPS: {s.nps_score}/5
                    </span>
                  )}
                </div>
              </div>

              {/* Mood indicators */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 12,
                }}
              >
                {s.mood_before !== null && s.mood_before !== undefined && (
                  <span style={{ color: "var(--ivoryDD)" }}>
                    😐 {s.mood_before}
                  </span>
                )}
                {s.mood_after !== null && s.mood_after !== undefined && (
                  <span style={{ color: "var(--mint)" }}>
                    😊 {s.mood_after}
                  </span>
                )}
                <span
                  style={{
                    color: "var(--ivoryDD)",
                    fontSize: 16,
                    transition: "transform .2s",
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  ▾
                </span>
              </div>
            </button>

            {/* Expanded details */}
            {isExpanded && (
              <div
                style={{
                  borderTop: "1px solid var(--border)",
                  padding: "16px 20px",
                  animation: "fadeUp .25s var(--ease-out)",
                }}
              >
                {/* AI Summary */}
                {s.ai_summary && (
                  <div style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--ivoryDD)",
                        textTransform: "uppercase",
                        letterSpacing: ".08em",
                        marginBottom: 6,
                      }}
                    >
                      Resumo IA
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--ivoryD)",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {s.ai_summary}
                    </p>
                  </div>
                )}

                {/* AI Insights */}
                {s.ai_insights && s.ai_insights.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--ivoryDD)",
                        textTransform: "uppercase",
                        letterSpacing: ".08em",
                        marginBottom: 6,
                      }}
                    >
                      Insights
                    </div>
                    <ul
                      style={{
                        listStyle: "none",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      {s.ai_insights.map((insight, i) => (
                        <li
                          key={i}
                          style={{
                            fontSize: 12,
                            color: "var(--ivoryD)",
                            paddingLeft: 12,
                            borderLeft: "2px solid var(--mint)",
                          }}
                        >
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risk flags */}
                {s.ai_risk_flags && s.ai_risk_flags.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--red)",
                        textTransform: "uppercase",
                        letterSpacing: ".08em",
                        marginBottom: 6,
                      }}
                    >
                      ⚠ Flags de Risco
                    </div>
                    <ul
                      style={{
                        listStyle: "none",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      {s.ai_risk_flags.map((flag, i) => (
                        <li
                          key={i}
                          style={{
                            fontSize: 12,
                            color: "var(--red)",
                            paddingLeft: 12,
                            borderLeft: "2px solid var(--red)",
                          }}
                        >
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Next steps */}
                {s.ai_next_steps && s.ai_next_steps.length > 0 && (
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--ivoryDD)",
                        textTransform: "uppercase",
                        letterSpacing: ".08em",
                        marginBottom: 6,
                      }}
                    >
                      Próximos Passos
                    </div>
                    <ul
                      style={{
                        listStyle: "none",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      {s.ai_next_steps.map((step, i) => (
                        <li
                          key={i}
                          style={{
                            fontSize: 12,
                            color: "var(--ivoryD)",
                            paddingLeft: 12,
                            borderLeft: "2px solid var(--gold)",
                          }}
                        >
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Therapist notes */}
                {s.therapist_notes && (
                  <div style={{ marginTop: 14 }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--ivoryDD)",
                        textTransform: "uppercase",
                        letterSpacing: ".08em",
                        marginBottom: 6,
                      }}
                    >
                      Anotações Terapeuta
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--ivoryD)",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        padding: "10px 14px",
                        background: "var(--bg2)",
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                      }}
                    >
                      {s.therapist_notes}
                    </p>
                  </div>
                )}

                {/* Signed badge */}
                {s.is_signed && (
                  <div
                    style={{
                      marginTop: 12,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 11,
                      padding: "3px 10px",
                      borderRadius: 20,
                      background: "rgba(82,183,136,.12)",
                      color: "var(--mint)",
                      border: "1px solid rgba(82,183,136,.3)",
                    }}
                  >
                    ✓ Assinada
                    {s.signed_at && (
                      <span style={{ color: "var(--ivoryDD)" }}>
                        · {fmtDate(s.signed_at)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
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
  onGenerate,
}: {
  result: AIInsightsResult | null;
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
}) {
  return (
    <div>
      {/* Generate button */}
      <div style={{ marginBottom: 20 }}>
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          style={{
            padding: "10px 24px",
            background: loading ? "var(--card2)" : "var(--mint)",
            color: loading ? "var(--ivoryDD)" : "#060E09",
            borderRadius: 12,
            border: "none",
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "all .2s var(--ease-out)",
          }}
        >
          {loading ? (
            <>
              <span
                style={{
                  display: "inline-block",
                  width: 14,
                  height: 14,
                  border: "2px solid var(--ivoryDD)",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
              Analisando...
            </>
          ) : (
            <>🧠 Gerar Insights IA</>
          )}
        </button>
        <p
          style={{
            fontSize: 11,
            color: "var(--ivoryDD)",
            marginTop: 6,
          }}
        >
          Análise baseada nas sessões recentes e dados do paciente.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            background: "rgba(184,84,80,.1)",
            border: "1px solid rgba(184,84,80,.3)",
            borderRadius: 12,
            color: "var(--red)",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            animation: "fadeUp .3s var(--ease-out)",
          }}
        >
          {/* Insights */}
          {result.insights.length > 0 && (
            <InsightSection
              title="Insights"
              items={result.insights}
              icon="💡"
              color="var(--mint)"
            />
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <InsightSection
              title="Recomendações"
              items={result.recommendations}
              icon="📌"
              color="var(--gold)"
            />
          )}

          {/* Alerts */}
          {result.alerts.length > 0 && (
            <InsightSection
              title="Alertas"
              items={result.alerts}
              icon="⚠"
              color="var(--red)"
            />
          )}
        </div>
      )}

      {/* No result yet */}
      {!result && !error && !loading && (
        <EmptyState
          icon="🧠"
          title="Insights IA"
          subtitle="Clique em Gerar Insights para analisar o perfil deste paciente."
        />
      )}
    </div>
  );
}

function InsightSection({
  title,
  items,
  icon,
  color,
}: {
  title: string;
  items: string[];
  icon: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: "16px 20px",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 10,
        }}
      >
        <span>{icon}</span> {title}
      </div>
      <ul
        style={{
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              fontSize: 13,
              color: "var(--ivoryD)",
              paddingLeft: 14,
              borderLeft: `2px solid ${color}`,
              lineHeight: 1.5,
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
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
    <div>
      {/* Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <SummaryCard
          label="Total Pago"
          value={formatBRL(totalPaid)}
          color="var(--mint)"
        />
        <SummaryCard
          label="Pagamentos"
          value={String(payments.length)}
          color="var(--ivoryD)"
        />
        <SummaryCard
          label="Pendentes"
          value={String(
            payments.filter((p) => p.status === "pending").length
          )}
          color="var(--gold)"
        />
      </div>

      {/* Payments table */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1fr 1fr",
            padding: "12px 20px",
            borderBottom: "1px solid var(--border)",
            fontSize: 11,
            color: "var(--ivoryDD)",
            letterSpacing: ".08em",
            textTransform: "uppercase",
          }}
        >
          <span>Data</span>
          <span>Valor</span>
          <span>Método</span>
          <span>Status</span>
        </div>

        {/* Rows */}
        {payments.map((p, i) => {
          const statusCfg = PAYMENT_STATUS_CONFIG[p.status] ?? {
            label: p.status,
            color: "var(--ivoryDD)",
          };
          return (
            <div
              key={p.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1.5fr 1fr 1fr 1fr",
                padding: "14px 20px",
                alignItems: "center",
                borderBottom:
                  i < payments.length - 1
                    ? "1px solid var(--border)"
                    : "none",
              }}
            >
              <span style={{ fontSize: 13, color: "var(--ivoryD)" }}>
                {fmtDate(p.created_at)}
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
                {p.method
                  ? PAYMENT_METHOD_LABELS[p.method] ?? p.method
                  : "—"}
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
    </div>
  );
}

// ── Shared ────────────────────────────────────────────────────────
function SummaryCard({
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
        borderRadius: 16,
        padding: "16px 20px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "var(--ivoryDD)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--ff)",
          fontSize: 26,
          fontWeight: 200,
          color,
        }}
      >
        {value}
      </div>
    </div>
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
    <div
      style={{
        textAlign: "center",
        padding: "48px 20px",
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div
        style={{
          fontSize: 16,
          color: "var(--ivoryD)",
          fontWeight: 500,
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 13, color: "var(--ivoryDD)" }}>
        {subtitle}
      </div>
    </div>
  );
}
