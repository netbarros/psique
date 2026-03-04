"use client";

import { useState, useCallback } from "react";

interface InsightsResult {
  insights: string[];
  recommendations: string[];
  alerts: string[];
}

export default function IAPage() {
  const [result, setResult] = useState<InsightsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error ?? `Erro ${res.status}`
        );
      }
      const json = (await res.json()) as { data: InsightsResult };
      setResult(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "var(--ff)",
            fontSize: 34,
            fontWeight: 200,
            color: "var(--ivory)",
          }}
        >
          IA Clínica
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--ivoryDD)",
            marginTop: 4,
          }}
        >
          Análise inteligente da sua carteira de pacientes via OpenRouter
        </p>
      </div>

      {/* Action */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 18,
          padding: "28px",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 16,
                color: "var(--ivory)",
                fontWeight: 500,
                marginBottom: 4,
              }}
            >
              🧠 Análise de Carteira
            </div>
            <div style={{ fontSize: 13, color: "var(--ivoryDD)" }}>
              Gera insights, recomendações e alertas baseados nos dados das sessões recentes.
            </div>
          </div>
          <button
            type="button"
            onClick={fetchInsights}
            disabled={loading}
            style={{
              padding: "12px 28px",
              background: loading ? "var(--card2)" : "var(--mint)",
              color: loading ? "var(--ivoryDD)" : "#060E09",
              borderRadius: 12,
              border: "none",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
              transition: "all .2s var(--ease-out)",
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: 16,
                    height: 16,
                    border: "2px solid var(--ivoryDD)",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                Analisando...
              </>
            ) : (
              "Gerar Análise"
            )}
          </button>
        </div>

        <div
          style={{
            fontSize: 11,
            color: "var(--ivoryDD)",
            padding: "8px 12px",
            background: "var(--bg2)",
            borderRadius: 8,
            border: "1px solid var(--border)",
          }}
        >
          💡 Limite: 10 requisições/min · Modelo configurado no onboarding
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "14px 18px",
            background: "rgba(184,84,80,.1)",
            border: "1px solid rgba(184,84,80,.3)",
            borderRadius: 14,
            color: "var(--red)",
            fontSize: 14,
            marginBottom: 20,
          }}
        >
          ❌ {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            animation: "fadeUp .3s var(--ease-out)",
          }}
        >
          {/* Insights */}
          <InsightCard
            title="💡 Insights"
            items={result.insights}
            color="var(--mint)"
            fullWidth={false}
          />

          {/* Recommendations */}
          <InsightCard
            title="📌 Recomendações"
            items={result.recommendations}
            color="var(--gold)"
            fullWidth={false}
          />

          {/* Alerts */}
          {result.alerts.length > 0 && (
            <div style={{ gridColumn: "1 / -1" }}>
              <InsightCard
                title="⚠ Alertas"
                items={result.alerts}
                color="var(--red)"
                fullWidth
              />
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !error && !loading && (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 16 }}>🧠</div>
          <div
            style={{
              fontFamily: "var(--ff)",
              fontSize: 24,
              color: "var(--ivoryD)",
              fontWeight: 300,
              marginBottom: 8,
            }}
          >
            Inteligência Artificial Clínica
          </div>
          <div style={{ fontSize: 14, color: "var(--ivoryDD)", maxWidth: 400, margin: "0 auto" }}>
            Analise sua carteira de pacientes com IA. Receba insights sobre tendências,
            recomendações clínicas e alertas de risco.
          </div>
        </div>
      )}
    </div>
  );
}

function InsightCard({
  title,
  items,
  color,
}: {
  title: string;
  items: string[];
  color: string;
  fullWidth: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "20px 24px",
      }}
    >
      <div
        style={{
          fontSize: 14,
          color,
          fontWeight: 600,
          marginBottom: 14,
        }}
      >
        {title}
      </div>
      <ul
        style={{
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: 8,
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
              lineHeight: 1.6,
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
