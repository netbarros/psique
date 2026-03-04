"use client";

import { useState, useEffect, useRef, useCallback, useId } from "react";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────
interface ConsultaPageProps {
  roomUrl: string;
  appointmentId: string;
  patientName: string;
  scheduledAt: string;
  durationMinutes: number;
}

export default function ConsultaClient({
  roomUrl,
  appointmentId,
  patientName,
  scheduledAt,
  durationMinutes,
}: ConsultaPageProps) {
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [moodBefore, setMoodBefore] = useState<number | null>(null);
  const [moodAfter, setMoodAfter] = useState<number | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaId = useId();
  const router = useRouter();

  // Timer
  useEffect(() => {
    if (sessionStarted) {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionStarted]);

  const formatElapsed = useCallback((secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }, []);

  const isOvertime = elapsed > durationMinutes * 60;
  const progress = Math.min((elapsed / (durationMinutes * 60)) * 100, 100);

  // Generate AI summary
  const handleSummarize = useCallback(async () => {
    if (!notes.trim()) return;
    setSummarizing(true);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          notes,
          moodBefore,
          moodAfter,
        }),
      });
      if (!res.ok) throw new Error("Falha ao gerar resumo");
      const json = (await res.json()) as { data?: { summary?: string } };
      setSummary(json.data?.summary ?? "Resumo gerado sem conteúdo.");
    } catch {
      setSummary("Erro ao gerar resumo IA.");
    } finally {
      setSummarizing(false);
    }
  }, [notes, appointmentId, moodBefore, moodAfter]);

  // End session
  const handleEndSession = useCallback(async () => {
    setSaving(true);
    try {
      // In production this would save session data via API
      // For now we navigate back
      router.push("/dashboard/agenda");
    } catch {
      setSaving(false);
    }
  }, [router]);

  const scheduledTime = new Date(scheduledAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div style={{ display: "flex", height: "calc(100vh - 64px)", overflow: "hidden" }}>
      {/* Video area */}
      <div style={{ flex: 1, background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        {/* Video header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div>
            <div style={{ fontSize: 16, color: "var(--ivory)", fontWeight: 500 }}>
              {patientName}
            </div>
            <div style={{ fontSize: 12, color: "var(--ivoryDD)" }}>
              Agendado: {scheduledTime} · {durationMinutes}min
            </div>
          </div>

          {/* Timer */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                fontFamily: "var(--ff)",
                fontSize: 28,
                fontWeight: 300,
                color: isOvertime ? "var(--red)" : "var(--mint)",
                letterSpacing: ".04em",
              }}
            >
              {formatElapsed(elapsed)}
            </div>
            {!sessionStarted ? (
              <button
                type="button"
                onClick={() => setSessionStarted(true)}
                style={{
                  padding: "8px 18px",
                  background: "var(--mint)",
                  color: "#060E09",
                  borderRadius: 10,
                  border: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ▶ Iniciar
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEndSession}
                disabled={saving}
                style={{
                  padding: "8px 18px",
                  background: "var(--red)",
                  color: "#fff",
                  borderRadius: 10,
                  border: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                ⏹ Encerrar
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: "var(--border)" }}>
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: isOvertime
                ? "var(--red)"
                : "var(--mint)",
              transition: "width 1s linear",
            }}
          />
        </div>

        {/* Video iframe placeholder */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg2)",
            margin: 16,
            borderRadius: 16,
            border: "1px solid var(--border)",
          }}
        >
          {roomUrl ? (
            <iframe
              src={roomUrl}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                borderRadius: 16,
              }}
              allow="camera; microphone; fullscreen; display-capture"
              title="Videochamada"
            />
          ) : (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎥</div>
              <div style={{ fontSize: 16, color: "var(--ivoryD)" }}>Sala de vídeo</div>
              <div style={{ fontSize: 12, color: "var(--ivoryDD)", marginTop: 4 }}>
                A videochamada será carregada aqui quando a sala estiver pronta.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Side panel — notes + AI */}
      <div
        style={{
          width: 380,
          borderLeft: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg2)",
        }}
      >
        {/* Panel header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ fontFamily: "var(--ff)", fontSize: 20, fontWeight: 300, color: "var(--ivory)" }}>
            Notas da Sessão
          </div>
        </div>

        {/* Mood before/after */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
          <MoodSelector label="Humor antes" value={moodBefore} onChange={setMoodBefore} />
          <MoodSelector label="Humor depois" value={moodAfter} onChange={setMoodAfter} />
        </div>

        {/* Notes textarea */}
        <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <label htmlFor={textareaId} style={{ fontSize: 11, color: "var(--ivoryDD)", textTransform: "uppercase", letterSpacing: ".08em" }}>
            Anotações do Terapeuta
          </label>
          <textarea
            id={textareaId}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Registre suas observações durante a sessão..."
            style={{
              flex: 1,
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "12px 16px",
              color: "var(--text)",
              fontFamily: "var(--fs)",
              fontSize: 13,
              lineHeight: 1.65,
              resize: "none",
              outline: "none",
            }}
          />
        </div>

        {/* AI summary */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
          <button
            type="button"
            onClick={handleSummarize}
            disabled={summarizing || !notes.trim()}
            style={{
              width: "100%",
              padding: "10px",
              background: summarizing || !notes.trim() ? "var(--card2)" : "var(--mint)",
              color: summarizing || !notes.trim() ? "var(--ivoryDD)" : "#060E09",
              borderRadius: 10,
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              cursor: summarizing || !notes.trim() ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {summarizing ? (
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
                Gerando...
              </>
            ) : (
              <>🧠 Gerar Resumo IA</>
            )}
          </button>

          {summary && (
            <div
              style={{
                marginTop: 12,
                padding: "12px 14px",
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                fontSize: 12,
                color: "var(--ivoryD)",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                animation: "fadeUp .25s var(--ease-out)",
              }}
            >
              {summary}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Mood Selector ─────────────────────────────────────────────────
function MoodSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: "var(--ivoryDD)", minWidth: 100 }}>{label}:</span>
      <div style={{ display: "flex", gap: 4 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              border: "1px solid",
              borderColor: n === value ? "var(--mint)" : "var(--border)",
              background: n === value ? "rgba(82,183,136,.2)" : "var(--card)",
              color: n === value ? "var(--mint)" : "var(--ivoryDD)",
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all .15s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
