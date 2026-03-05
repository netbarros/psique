"use client";

import { useEffect, useState, useId } from "react";


export default function ApoioPage() {
  const [journal, setJournal] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [recentEntries, setRecentEntries] = useState<
    Array<{ id: string; entryText: string; moodScore: number | null; createdAt: string }>
  >([]);
  const [activeSection, setActiveSection] = useState<"diario" | "tecnicas" | "recursos">("diario");
  const textareaId = useId();

  useEffect(() => {
    async function loadJournal() {
      try {
        const res = await fetch("/api/patient/journal?limit=5", { cache: "no-store" });
        if (!res.ok) return;
        const payload = (await res.json()) as {
          data?: Array<{ id: string; entryText: string; moodScore: number | null; createdAt: string }>;
        };
        setRecentEntries(payload.data ?? []);
      } catch {
        // no-op, page remains usable
      }
    }

    void loadJournal();
  }, []);

  const handleSave = async () => {
    if ((!journal.trim() && mood === null) || isSaving) return;
    setSaveError(null);
    setIsSaving(true);

    try {
      if (journal.trim()) {
        const journalRes = await fetch("/api/patient/journal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entryText: journal.trim(),
            moodScore: mood,
          }),
        });

        if (!journalRes.ok) {
          const payload = (await journalRes.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? "Não foi possível salvar o diário");
        }
      } else if (typeof mood === "number") {
        const moodRes = await fetch("/api/patient/mood", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ moodScore: mood, note: null }),
        });
        if (!moodRes.ok) {
          const payload = (await moodRes.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? "Não foi possível salvar o humor");
        }
      }

      const refreshRes = await fetch("/api/patient/journal?limit=5", { cache: "no-store" });
      if (refreshRes.ok) {
        const payload = (await refreshRes.json()) as {
          data?: Array<{ id: string; entryText: string; moodScore: number | null; createdAt: string }>;
        };
        setRecentEntries(payload.data ?? []);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Falha ao salvar");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { key: "diario" as const, label: "Diário", icon: <span className="material-symbols-outlined text-[16px]">menu_book</span>, desc: "Reflexões" },
    { key: "tecnicas" as const, label: "Técnicas", icon: <span className="material-symbols-outlined text-[16px]">air</span>, desc: "Exercícios" },
    { key: "recursos" as const, label: "Recursos", icon: <span className="material-symbols-outlined text-[16px]">import_contacts</span>, desc: "Apoio 24h" },
  ];

  return (
    <div className="w-full max-w-[1000px] mx-auto p-6 md:p-10 lg:p-12 relative z-10">
      {/* Header Area */}
      <header className="mb-10 animate-[fadeUp_0.5s_ease-out_backwards] animate-delay-100 [animation-fill-mode:backwards]">
        <h1 className="text-4xl md:text-5xl font-display font-light text-text-primary tracking-tight">
          Espaço de <span className="text-brand font-medium">Apoio</span>
        </h1>
        <p className="text-[15px] text-text-secondary mt-4 max-w-2xl font-light">
          Seu espaço totalmente seguro e privado para reflexão, exercícios práticos e manutenção do seu bem-estar emocional.
        </p>
      </header>

      {/* Segmented Control Tabs */}
      <div className="mb-10 flex w-max max-w-full overflow-x-auto rounded-2xl p-1.5 shadow-sm glass-panel animate-[fadeUp_0.5s_ease-out_backwards] animate-delay-200 [animation-fill-mode:backwards]">
        {tabs.map((tab) => {
          const isActive = activeSection === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveSection(tab.key)}
              className={`
                relative flex items-center gap-2.5 px-6 py-3 rounded-xl text-[14px] font-medium transition-all duration-300 whitespace-nowrap
                ${isActive 
                  ? "text-bg-base" 
                  : "text-text-secondary hover:text-text-primary hover:bg-surface"
                }
              `}
            >
              {isActive && (
                <div className="absolute inset-0 bg-brand rounded-xl shadow-sm z-0" />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {tab.icon} {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Diário */}
      {activeSection === "diario" && (
        <div className="space-y-8 animate-[fadeUp_0.4s_ease-out_both]">
          {/* Mood Tracker */}
          <div className="glass-card p-6 md:p-8">
            <h2 className="text-[16px] text-text-primary font-medium mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px] text-brand">favorite</span>
              Como você está se sentindo hoje?
            </h2>
            <div className="flex flex-wrap gap-4 justify-start">
              {[
                { score: 1, emoji: "😢", label: "Péssimo" },
                { score: 2, emoji: "😟", label: "Ruim" },
                { score: 3, emoji: "😐", label: "Regular" },
                { score: 4, emoji: "🙂", label: "Bem" },
                { score: 5, emoji: "😊", label: "Ótimo" },
              ].map((m) => {
                const isSelected = mood === m.score;
                return (
                  <button
                    key={m.score}
                    type="button"
                    onClick={() => setMood(m.score)}
                    className={`
                      flex flex-col items-center gap-3 px-6 py-5 rounded-2xl transition-all duration-300 min-w-[90px] border shadow-sm
                      ${isSelected 
                        ? "border-brand bg-brand/10 shadow-[0_4px_20px_rgba(82,183,136,0.15)] scale-105" 
                        : "border-border-subtle bg-surface hover:border-brand/40 hover:bg-surface-hover grayscale-[0.5] opacity-70 hover:opacity-100 hover:grayscale-0"
                      }
                    `}
                  >
                    <span
                      className={`text-[32px] leading-none transition-transform duration-300 ${isSelected ? "scale-110" : "scale-100"}`}
                    >
                      {m.emoji}
                    </span>
                    <span className={`text-[12px] font-medium tracking-wide ${isSelected ? "text-brand" : "text-text-secondary"}`}>
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Journal Entry */}
          <div className="glass-card p-6 md:p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <h2 className="text-[16px] text-text-primary font-medium flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px] text-brand">menu_book</span>
                Registro Livre
              </h2>
            </div>
            
            <label htmlFor={textareaId} className="sr-only">Registro de hoje</label>
            <textarea
              id={textareaId}
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              placeholder="Escreva livremente sobre como foi seu dia, pensamentos, desafios, ou motivos de gratidão..."
              className="w-full min-h-[220px] bg-surface-hover border border-border-subtle rounded-2xl p-6 text-text-primary font-sans text-[15px] leading-relaxed resize-y outline-none focus:border-brand/50 focus:bg-surface focus:ring-1 focus:ring-brand/30 transition-all placeholder:text-text-muted placeholder:font-light shadow-inner scrollbar-custom"
            />
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-5 mt-6 border-t border-border-subtle pt-6">
              <span className="text-[12px] text-text-muted font-medium flex items-center gap-2 uppercase tracking-widest">
                <span className="material-symbols-outlined text-[14px] text-brand">lock</span> 
                Garantia de Privacidade
              </span>
              <button
                type="button"
                onClick={handleSave}
                disabled={(!journal.trim() && mood === null) || isSaving}
                className={`
                  px-8 py-3.5 rounded-xl text-[14px] font-semibold transition-all duration-300 text-center shadow-[0_4px_15px_rgba(82,183,136,0.2)] flex items-center gap-2 justify-center
                  disabled:bg-surface disabled:text-text-muted disabled:cursor-not-allowed disabled:border disabled:border-border-subtle disabled:shadow-none
                  ${saved 
                    ? "bg-bg-base border border-brand text-brand shadow-none" 
                    : "bg-brand text-bg-base hover:bg-brand-hover border border-brand/20 hover:shadow-[0_4px_25px_rgba(82,183,136,0.4)]"
                  }
                `}
              >
                {isSaving ? "Salvando..." : saved ? <><span className="material-symbols-outlined text-[18px]">check_circle</span> Salvo de forma segura!</> : "Salvar Registro"}
              </button>
            </div>

            {saveError ? (
              <p className="mt-3 rounded-xl border border-portal-danger-soft/30 bg-portal-danger-soft/10 px-3 py-2 text-sm text-portal-danger-soft">
                {saveError}
              </p>
            ) : null}
          </div>

          {recentEntries.length > 0 ? (
            <div className="glass-card p-6 md:p-8">
              <h3 className="mb-4 text-[15px] font-medium text-text-primary">
                Últimos registros
              </h3>
              <div className="space-y-3">
                {recentEntries.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-xl border border-border-subtle bg-surface p-4"
                  >
                    <div className="mb-2 flex items-center justify-between text-xs text-text-muted">
                      <span>
                        {new Date(entry.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                      <span>{entry.moodScore ? `Humor ${entry.moodScore}/10` : "Sem humor registrado"}</span>
                    </div>
                    <p className="line-clamp-3 text-sm text-text-secondary">{entry.entryText}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Técnicas */}
      {activeSection === "tecnicas" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-[fadeUp_0.4s_ease-out_both]">
          {[
            {
              icon: "🫁",
              title: "Respiração 4-7-8",
              desc: "Acalma o sistema nervoso",
              color: "text-brand",
              steps: [
                "Inspire pelo nariz (4s)",
                "Segure a respiração (7s)",
                "Expire pela boca (8s)",
                "Repita o ciclo 4 vezes",
              ],
            },
            {
              icon: "🦶",
              title: "Grounding 5-4-3-2-1",
              desc: "Reconecta com o presente",
              color: "text-blue-400",
              steps: [
                "Identifique 5 coisas que vê",
                "Toque em 4 objetos",
                "Ouça 3 sons diferentes",
                "Sinta 2 aromas",
                "Note 1 sabor na boca",
              ],
            },
            {
              icon: "🧘",
              title: "Scan Corporal",
              desc: "Relaxamento tensão a tensão",
              color: "text-purple-400",
              steps: [
                "Feche os olhos",
                "Respire profundamente",
                "Foque na cabeça e relaxe",
                "Desça lentamente pelo corpo",
                "Termine nos pés",
              ],
            },
            {
              icon: "✍",
              title: "Reflexão Guiada",
              desc: "Perguntas de clareza",
              color: "text-amber-400",
              steps: [
                "O que estou sentindo?",
                "Onde sinto isso no corpo?",
                "O que causou essa emoção?",
                "O que preciso agora?",
              ],
            },
          ].map((t, i) => (
            <div
              key={t.title}
              className={`glass-card p-6 md:p-8 h-full flex flex-col hover:border-brand/50 transition-colors duration-300 animate-[fadeUp_0.4s_ease-out_backwards] [animation-fill-mode:backwards] ${
                i === 0
                  ? "animate-delay-100"
                  : i === 1
                    ? "animate-delay-200"
                    : i === 2
                      ? "animate-delay-300"
                      : "animate-delay-400"
              }`}
            >
              <div className="flex items-center gap-5 mb-6 pb-6 border-b border-border-subtle">
                <span className="text-[32px] shrink-0 w-14 h-14 bg-surface-hover rounded-2xl border border-border-subtle shadow-inner flex items-center justify-center">
                  {t.icon}
                </span>
                <div>
                  <h3 className={`text-[17px] font-semibold tracking-wide ${t.color}`}>
                    {t.title}
                  </h3>
                  <p className="text-[13px] text-text-secondary mt-1.5 font-light">
                    {t.desc}
                  </p>
                </div>
              </div>
              <ol className="flex flex-col gap-4 pl-2">
                {t.steps.map((step, idx) => (
                  <li key={idx} className="text-[14px] text-text-primary leading-relaxed flex gap-4 relative items-center">
                    <span className="text-bg-base bg-brand font-bold text-[11px] shrink-0 w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                      {idx + 1}
                    </span>
                    <span className="flex-1 font-light tracking-wide">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      {/* Recursos */}
      {activeSection === "recursos" && (
        <div className="flex flex-col gap-5 animate-[fadeUp_0.4s_ease-out_both]">
          {[
            {
              icon: <span className="material-symbols-outlined text-[24px]">phone</span>,
              title: "Centro de Valorização da Vida (CVV)",
              desc: "Ligue 188 ou acesse www.cvv.org.br — Atendimento 24h, gratuito e 100% sigiloso.",
              color: "text-red-400",
              bg: "bg-red-500/10 hover:bg-red-500/15",
              border: "border-red-500/20 hover:border-red-500/40",
              urgent: true,
            },
            {
              icon: <span className="material-symbols-outlined text-[24px]">local_hospital</span>,
              title: "CAPS — Centro de Atenção Psicossocial",
              desc: "Atendimento público especializado em saúde mental. Procure a unidade referenciada mais próxima da sua residência.",
              color: "text-blue-400",
              bg: "glass-card hover:border-blue-400/40",
              border: "",
              urgent: false,
            },
            {
              icon: <span className="material-symbols-outlined text-[24px]">error</span>,
              title: "Emergência SAMU — 192",
              desc: "Em emergências severas que envolvam risco agudo de vida. Acione imediatamente.",
              color: "text-red-400",
              bg: "bg-red-500/10 hover:bg-red-500/15",
              border: "border-red-500/20 hover:border-red-500/40",
              urgent: true,
            },
            {
              icon: <span className="material-symbols-outlined text-[24px]">psychology</span>,
              title: "Fundamentos: Psicanálise",
              desc: "Um método de investigação elaborado por Freud. Foca na escuta analítica de padrões emocionais profundos, permitindo ao paciente ressignificar suas dores estruturais.",
              color: "text-amber-400",
              bg: "glass-card hover:border-amber-400/40",
              border: "",
              urgent: false,
            },
            {
              icon: <span className="material-symbols-outlined text-[24px]">lightbulb</span>,
              title: "Como otimizar seu processo",
              desc: "Seja irrestritamente transparente em sessão. O trabalho terapêutico não produz resultados mágicos imediatos; demanda sustentação da angústia e elaboração contínua.",
              color: "text-brand",
              bg: "glass-card hover:border-brand/40",
              border: "",
              urgent: false,
            },
          ].map((r, i) => (
            <div
              key={r.title}
              className={`
                p-6 rounded-2xl flex gap-5 md:gap-6 items-start transition-all duration-300 animate-[fadeUp_0.4s_ease-out_backwards] [animation-fill-mode:backwards]
                ${r.bg} ${r.border}
                ${i === 0 ? "animate-delay-100" : i === 1 ? "animate-delay-200" : i === 2 ? "animate-delay-300" : i === 3 ? "animate-delay-400" : "animate-delay-500"}
              `}
            >
              <div className={`
                w-14 h-14 rounded-xl border shadow-sm shrink-0 flex items-center justify-center
                ${r.urgent ? "bg-red-500/20 border-red-500/30 text-red-400" : "bg-surface-hover border-border-subtle text-text-primary"}
              `}>
                {r.icon}
              </div>
              <div className="flex flex-col gap-2 pt-1">
                <h3 className={`text-[16px] font-semibold tracking-wide ${r.color}`}>
                  {r.title}
                </h3>
                <p className="text-[14px] text-text-secondary font-light leading-relaxed max-w-4xl">
                  {r.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
