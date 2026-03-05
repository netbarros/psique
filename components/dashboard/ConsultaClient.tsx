"use client";

import { useState, useEffect, useRef, useCallback, useId } from "react";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ConsultaClientProps {
  roomUrl: string;
  sessionId: string;
  patientName: string;
  scheduledAt: string;
  durationMinutes: number;
}

// ── ConsultaClient — S03 dark_theater ──────────────────────────────────────────
// Fiel ao stitch: bg-black fullscreen, video full-bleed, timer pill, PiP 100×140,
// painel clínico deslizante bottom, waveform 3 barras ping, botão danger gradient.
export default function ConsultaClient({
  roomUrl,
  sessionId,
  patientName,
  scheduledAt,
  durationMinutes,
}: ConsultaClientProps) {
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [moodBefore, setMoodBefore] = useState<number | null>(null);
  const [moodAfter, setMoodAfter] = useState<number | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaId = useId();
  const router = useRouter();

  // ── Timer ──────────────────────────────────────────────────────────────────
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

  // ── AI Summarize ────────────────────────────────────────────────────────────
  const handleSummarize = useCallback(async () => {
    if (!notes.trim()) return;
    setSummarizing(true);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, notes, moodBefore, moodAfter }),
      });
      if (res.status === 429) {
        setSummary("Limite de uso atingido. Aguarde alguns instantes e tente novamente.");
        return;
      }
      if (!res.ok) throw new Error("Falha ao gerar resumo");
      const json = (await res.json()) as { data?: { summary?: string } };
      setSummary(json.data?.summary ?? "Resumo gerado sem conteúdo.");
    } catch {
      setSummary("Erro ao gerar resumo IA.");
    } finally {
      setSummarizing(false);
    }
  }, [notes, sessionId, moodBefore, moodAfter]);

  // ── End Session ─────────────────────────────────────────────────────────────
  const handleEndSession = useCallback(async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/close`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          moodBefore,
          moodAfter,
          endedAt: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error("Falha ao encerrar sessão");
      router.push("/dashboard/agenda");
    } catch {
      setSaving(false);
    }
  }, [router, sessionId, notes, moodBefore, moodAfter]);

  const scheduledTime = new Date(scheduledAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    // dark_theater: bg-black fullscreen, overflow-hidden
    <div className="relative h-[calc(100dvh-64px)] w-full overflow-hidden bg-black font-sans" data-theme="dark">

      {/* ── Video full-bleed background + overlays (stitch S03) ─────────────── */}
      <div className="absolute inset-0 z-0">
        {roomUrl ? (
          <iframe
            src={roomUrl}
            className="h-full w-full border-none"
            allow="camera; microphone; fullscreen; display-capture"
            title="Videochamada"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-bg-base">
            <div className="text-center animate-[fadeIn_.4s_ease-out]">
              <div className="mb-4 text-6xl opacity-60">🎥</div>
              <p className="font-display text-xl text-text-secondary">Sala de vídeo</p>
              <p className="mt-2 text-sm text-text-muted max-w-xs mx-auto">
                A videochamada será carregada quando a sala estiver pronta.
              </p>
            </div>
          </div>
        )}
        {/* Dark vignette gradient — topo e base */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-bg-base/90 via-transparent to-bg-base/95" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(8,15,11,1)_100%)] opacity-50 mix-blend-multiply" />
      </div>

      {/* ── Top bar: timer pill + controls (stitch S03) ─────────────────────── */}
      <div className="absolute top-0 z-10 flex w-full items-center justify-between px-6 pt-8 pb-4">
        {/* Timer pill */}
        <div className="flex items-center gap-2 rounded-full border border-border-subtle bg-bg-elevated/60 px-3 py-1.5 backdrop-blur-md">
          <div className={`h-2 w-2 rounded-full ${isOvertime ? "bg-error animate-pulse shadow-[0_0_8px_rgba(184,84,80,0.8)]" : "bg-brand animate-pulse shadow-[0_0_8px_rgba(82,183,136,0.8)]"}`} />
          <span
            className={`font-display text-xs font-medium tracking-widest ${isOvertime ? "text-error" : "text-brand"}`}
          >
            {sessionStarted ? formatElapsed(elapsed) : scheduledTime}
          </span>
        </div>

        {/* Right controls: lock badge */}
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-border-subtle bg-bg-elevated/60 p-1.5 backdrop-blur-md">
            <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── PiP (Picture-in-Picture) — 100×140 top right (stitch S03) ─────── */}
      <div className="absolute right-5 top-28 z-10 flex h-[140px] w-[100px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-brand/30 bg-bg-elevated glow-mint backdrop-blur-xl">
        <span className="text-center text-xs leading-relaxed text-text-muted">Câmera<br />local</span>
      </div>

      {/* ── Patient name (stitch) ─────────────────────────────────────────── */}
      {sessionStarted && (
        <div className="absolute top-20 left-6 z-10 animate-[fadeIn_.3s_ease-out]">
          <p className="text-sm font-medium text-ivory">{patientName}</p>
          <p className="text-xs text-text-muted mt-0.5">{durationMinutes}min · {scheduledTime}</p>
        </div>
      )}

      {/* ── Bottom clinical panel (stitch S03) ─────────────────────────────── */}
      <div
        className={`absolute bottom-0 z-20 w-full rounded-t-[32px] border-t border-border-subtle bg-bg-elevated/95 px-5 pb-8 pt-3 shadow-[0_-20px_50px_rgba(8,15,11,0.9)] backdrop-blur-2xl transition-transform duration-500 ${panelOpen ? "translate-y-0" : "translate-y-[calc(100%-80px)]"}`}
      >
        {/* Drag handle */}
        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          className="mx-auto mb-5 block h-1.5 w-10 rounded-full bg-border-subtle"
          aria-label={panelOpen ? "Fechar painel clínico" : "Abrir painel clínico"}
        />

        <div className="flex flex-col gap-5">
          {/* Panel header */}
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="font-display text-gold text-2xl tracking-wide leading-none">
                Clinical Intelligence
              </h2>
              <p className="mt-1 text-xs text-text-muted">
                {sessionStarted ? "Análise em tempo real ativa" : "Inicie a sessão para ativar"}
              </p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle bg-bg-base">
              <svg className="h-4 w-4 animate-pulse text-brand" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>

          {/* Mood selectors (only visible when panel open) */}
          {panelOpen && (
            <div className="space-y-2 border-t border-border-subtle pt-4">
              <MoodSelector label="Humor antes" value={moodBefore} onChange={setMoodBefore} />
              <MoodSelector label="Humor depois" value={moodAfter} onChange={setMoodAfter} />
            </div>
          )}

          {/* Notes textarea + waveform */}
          {panelOpen && (
            <div className="relative">
              <label htmlFor={textareaId} className="sr-only">Anotações clínicas</label>
              <textarea
                id={textareaId}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Capture clinical observations..."
                className="h-28 w-full resize-none rounded-2xl border border-border-subtle bg-bg-base p-4 text-sm font-light leading-relaxed text-ivory placeholder:text-text-muted focus:border-brand/40 focus:outline-none focus:ring-1 focus:ring-brand/20 transition-all"
              />
              {/* Waveform badge (stitch S03) */}
              {micActive && (
                <div className="absolute bottom-3 right-4 flex items-center gap-1.5">
                  <div className="flex h-2 items-center gap-0.5">
                    <div className="h-1 w-0.5 animate-[ping_1s_ease-in-out_0ms_infinite] rounded-full bg-brand" />
                    <div className="h-2 w-0.5 animate-[ping_1s_ease-in-out_200ms_infinite] rounded-full bg-brand" />
                    <div className="h-1 w-0.5 animate-[ping_1s_ease-in-out_400ms_infinite] rounded-full bg-brand" />
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">Listening</span>
                </div>
              )}
            </div>
          )}

          {/* AI generate + action row */}
          {panelOpen && summary && (
            <div className="rounded-xl border border-border-subtle bg-bg-base p-4 text-xs font-light leading-relaxed text-text-secondary whitespace-pre-wrap animate-[fadeIn_.3s_ease-out]">
              {summary}
            </div>
          )}

          {/* Main control row (stitch S03) — always visible */}
          <div className="flex gap-3">
            {/* Mic */}
            <button
              type="button"
              onClick={() => setMicActive((v) => !v)}
              className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[18px] border transition-colors active:scale-95 ${micActive ? "border-border-subtle bg-bg-base text-ivory hover:bg-bg-elevated" : "border-error/30 bg-error/10 text-error"}`}
              aria-label={micActive ? "Silenciar microfone" : "Ativar microfone"}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={micActive ? "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" : "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"} />
              </svg>
            </button>

            {/* Video */}
            <button
              type="button"
              onClick={() => setVideoActive((v) => !v)}
              className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[18px] border transition-colors active:scale-95 ${videoActive ? "border-border-subtle bg-bg-base text-ivory hover:bg-bg-elevated" : "border-error/30 bg-error/10 text-error"}`}
              aria-label={videoActive ? "Desligar câmera" : "Ligar câmera"}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.361a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>

            {/* AI Summarize (middle — only if panel open and has notes) */}
            {panelOpen && (
              <button
                type="button"
                onClick={() => void handleSummarize()}
                disabled={summarizing || !notes.trim()}
                className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[18px] border transition-colors active:scale-95 ${summarizing || !notes.trim() ? "border-border-subtle bg-bg-base text-text-muted opacity-50 cursor-not-allowed" : "border-gold/30 bg-gold/10 text-gold hover:bg-gold/20"}`}
                aria-label="Gerar resumo IA"
              >
                {summarizing ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-text-muted border-t-transparent" />
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                )}
              </button>
            )}

            {/* End session — danger gradient (stitch S03) */}
            <button
              type="button"
              onClick={sessionStarted ? () => void handleEndSession() : () => setSessionStarted(true)}
              disabled={saving}
              className={`flex flex-1 items-center justify-center gap-2 rounded-[18px] border font-medium text-[15px] text-white transition-all active:scale-95 ${
                sessionStarted
                  ? "border-error/30 bg-linear-to-br from-error to-[#8a3f3c] shadow-[0_0_20px_rgba(184,84,80,0.25)] hover:shadow-[0_0_25px_rgba(184,84,80,0.35)] disabled:opacity-60 disabled:cursor-not-allowed"
                  : "border-brand/30 bg-linear-to-br from-brand to-brand-hover shadow-[0_0_15px_rgba(82,183,136,0.30)]"
              }`}
            >
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : sessionStarted ? (
                <>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                  Encerrar e Gerar Resumo
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Iniciar Sessão
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MoodSelector — 10-point scale ─────────────────────────────────────────────
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
    <div className="flex items-center gap-3">
      <span className="min-w-[90px] text-xs font-medium tracking-wide text-text-muted">{label}:</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
          const isSelected = n === value;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`flex h-[26px] w-[26px] items-center justify-center rounded-md text-[10px] font-medium transition-all duration-200 ${
                isSelected
                  ? "bg-brand/10 text-brand ring-1 ring-brand/30 shadow-[0_0_8px_rgba(82,183,136,0.15)]"
                  : "border border-border-subtle bg-surface text-text-muted hover:border-brand/50 hover:text-text-secondary hover:bg-surface-hover"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
