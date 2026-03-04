"use client";

import { useState, useId } from "react";

export default function ApoioPage() {
  const [journal, setJournal] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<"diario" | "tecnicas" | "recursos">("diario");
  const textareaId = useId();

  const handleSave = () => {
    // In production: POST /api/patient/journal
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ padding: "32px 40px", maxWidth: 900 }}>
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
          Espaço de Apoio
        </h1>
        <p style={{ fontSize: 14, color: "var(--ivoryDD)", marginTop: 4 }}>
          Seu espaço seguro para reflexão, exercícios e bem-estar emocional
        </p>
      </div>

      {/* Section tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "var(--card)",
          borderRadius: 14,
          padding: 4,
          border: "1px solid var(--border)",
          marginBottom: 24,
        }}
      >
        {(
          [
            { key: "diario", label: "📖 Diário", desc: "Reflexões pessoais" },
            { key: "tecnicas", label: "🧘 Técnicas", desc: "Exercícios" },
            { key: "recursos", label: "📚 Recursos", desc: "Informações" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveSection(tab.key)}
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 500,
              border:
                activeSection === tab.key
                  ? "1px solid rgba(82,183,136,.3)"
                  : "1px solid transparent",
              background:
                activeSection === tab.key ? "var(--g1)" : "transparent",
              color:
                activeSection === tab.key
                  ? "var(--mint)"
                  : "var(--ivoryDD)",
              cursor: "pointer",
              transition: "all .2s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Diário */}
      {activeSection === "diario" && (
        <div>
          {/* Mood tracker */}
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 18,
              padding: "24px 28px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 14,
                color: "var(--ivory)",
                fontWeight: 500,
                marginBottom: 14,
              }}
            >
              Como você está se sentindo hoje?
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              {[
                { score: 1, emoji: "😢", label: "Péssimo" },
                { score: 2, emoji: "😟", label: "Ruim" },
                { score: 3, emoji: "😐", label: "Regular" },
                { score: 4, emoji: "🙂", label: "Bem" },
                { score: 5, emoji: "😊", label: "Ótimo" },
              ].map((m) => (
                <button
                  key={m.score}
                  type="button"
                  onClick={() => setMood(m.score)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    padding: "12px 18px",
                    borderRadius: 14,
                    border:
                      mood === m.score
                        ? "2px solid var(--mint)"
                        : "1px solid var(--border)",
                    background:
                      mood === m.score
                        ? "rgba(82,183,136,.1)"
                        : "var(--bg2)",
                    cursor: "pointer",
                    transition: "all .15s",
                    minWidth: 70,
                  }}
                >
                  <span style={{ fontSize: 28 }}>{m.emoji}</span>
                  <span
                    style={{
                      fontSize: 11,
                      color:
                        mood === m.score
                          ? "var(--mint)"
                          : "var(--ivoryDD)",
                    }}
                  >
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Journal entry */}
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 18,
              padding: "24px 28px",
            }}
          >
            <label
              htmlFor={textareaId}
              style={{
                fontSize: 14,
                color: "var(--ivory)",
                fontWeight: 500,
                display: "block",
                marginBottom: 12,
              }}
            >
              Registro de hoje
            </label>
            <textarea
              id={textareaId}
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              placeholder="Escreva livremente sobre como foi seu dia, o que está sentindo, reflexões..."
              style={{
                width: "100%",
                minHeight: 180,
                background: "var(--bg2)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: "14px 18px",
                color: "var(--text)",
                fontFamily: "var(--fs)",
                fontSize: 14,
                lineHeight: 1.7,
                resize: "vertical",
                outline: "none",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 14,
              }}
            >
              <span style={{ fontSize: 11, color: "var(--ivoryDD)" }}>
                🔒 Privado — apenas você tem acesso
              </span>
              <button
                type="button"
                onClick={handleSave}
                disabled={!journal.trim() && mood === null}
                style={{
                  padding: "10px 24px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  background:
                    !journal.trim() && mood === null
                      ? "var(--card2)"
                      : "var(--mint)",
                  color:
                    !journal.trim() && mood === null
                      ? "var(--ivoryDD)"
                      : "#060E09",
                  border: "none",
                  cursor:
                    !journal.trim() && mood === null
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {saved ? "✓ Salvo!" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Técnicas */}
      {activeSection === "tecnicas" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 16,
          }}
        >
          {[
            {
              icon: "🫁",
              title: "Respiração 4-7-8",
              desc: "Inspire por 4s, segure por 7s, expire por 8s. Repita 4 vezes.",
              color: "var(--mint)",
              steps: [
                "Sente-se confortavelmente",
                "Inspire pelo nariz contando até 4",
                "Segure a respiração contando até 7",
                "Expire pela boca contando até 8",
                "Repita 3-4 vezes",
              ],
            },
            {
              icon: "🦶",
              title: "Grounding 5-4-3-2-1",
              desc: "Conecte-se com o presente usando seus 5 sentidos.",
              color: "var(--blue)",
              steps: [
                "Identifique 5 coisas que pode ver",
                "Identifique 4 coisas que pode tocar",
                "Identifique 3 coisas que pode ouvir",
                "Identifique 2 coisas que pode cheirar",
                "Identifique 1 coisa que pode provar",
              ],
            },
            {
              icon: "🧘",
              title: "Body Scan",
              desc: "Observe as sensações do corpo da cabeça aos pés.",
              color: "var(--purple)",
              steps: [
                "Deite-se ou sente-se confortavelmente",
                "Feche os olhos e respire profundamente",
                "Direcione a atenção para o topo da cabeça",
                "Desça lentamente, observando cada parte do corpo",
                "Termine nos pés e respire profundamente novamente",
              ],
            },
            {
              icon: "✍",
              title: "Journaling Guiado",
              desc: "Perguntas para guiar sua reflexão diária.",
              color: "var(--gold)",
              steps: [
                "O que eu estou sentindo agora?",
                "O que me trouxe alegria hoje?",
                "O que gostaria de processar?",
                "O que sou grato(a)?",
                "O que posso fazer por mim amanhã?",
              ],
            },
          ].map((t) => (
            <div
              key={t.title}
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 18,
                padding: "24px 28px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 28 }}>{t.icon}</span>
                <div>
                  <div
                    style={{
                      fontSize: 16,
                      color: t.color,
                      fontWeight: 600,
                    }}
                  >
                    {t.title}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ivoryDD)",
                      marginTop: 2,
                    }}
                  >
                    {t.desc}
                  </div>
                </div>
              </div>
              <ol
                style={{
                  paddingLeft: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {t.steps.map((step, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: 13,
                      color: "var(--ivoryD)",
                      lineHeight: 1.5,
                    }}
                  >
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      {/* Recursos */}
      {activeSection === "recursos" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {[
            {
              icon: "📞",
              title: "Centro de Valorização da Vida (CVV)",
              desc: "Ligue 188 ou acesse www.cvv.org.br — 24h, gratuito, sigiloso",
              color: "var(--red)",
              urgent: true,
            },
            {
              icon: "🏥",
              title: "CAPS — Centro de Atenção Psicossocial",
              desc: "Atendimento público especializado em saúde mental. Procure o CAPS mais próximo de você.",
              color: "var(--blue)",
              urgent: false,
            },
            {
              icon: "📱",
              title: "SAMU — 192",
              desc: "Em emergências que envolvam risco de vida, ligue imediatamente.",
              color: "var(--red)",
              urgent: true,
            },
            {
              icon: "📖",
              title: "O que é Psicanálise?",
              desc: "A psicanálise é um método de investigação do inconsciente criado por Sigmund Freud. No processo terapêutico, terapeuta e paciente trabalham juntos para compreender padrões emocionais, traumas e conflitos interiores.",
              color: "var(--gold)",
              urgent: false,
            },
            {
              icon: "🧠",
              title: "Benefícios da Terapia",
              desc: "Autoconhecimento profundo, manejo de ansiedade e depressão, melhora nos relacionamentos, identificação de padrões repetitivos, desenvolvimento de estratégias de enfrentamento.",
              color: "var(--mint)",
              urgent: false,
            },
            {
              icon: "💡",
              title: "Como aproveitar melhor as sessões",
              desc: "Seja honesto com seu terapeuta, registre pensamentos entre sessões, não espere resultados imediatos, confie no processo, e use este espaço para anotações.",
              color: "var(--purple)",
              urgent: false,
            },
          ].map((r) => (
            <div
              key={r.title}
              style={{
                background: r.urgent
                  ? "rgba(184,84,80,.06)"
                  : "var(--card)",
                border: `1px solid ${
                  r.urgent ? "rgba(184,84,80,.25)" : "var(--border)"
                }`,
                borderRadius: 16,
                padding: "20px 24px",
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>
                {r.icon}
              </span>
              <div>
                <div
                  style={{
                    fontSize: 15,
                    color: r.color,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  {r.title}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--ivoryD)",
                    lineHeight: 1.65,
                  }}
                >
                  {r.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
