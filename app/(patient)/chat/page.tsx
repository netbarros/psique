"use client";

import { useState, useRef, useCallback, useId, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaId = useId();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error ?? `Erro ${res.status}`
        );
      }

      const json = (await res.json()) as { data: { reply: string } };
      setMessages([
        ...newMessages,
        { role: "assistant", content: json.data.reply },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [input, messages, loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 0px)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 32px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            fontFamily: "var(--ff)",
            fontSize: 28,
            fontWeight: 200,
            color: "var(--ivory)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 24 }}>🧠</span> Chat IA
        </h1>
        <p style={{ fontSize: 12, color: "var(--ivoryDD)", marginTop: 4 }}>
          Converse com a IA sobre reflexões, exercícios e bem-estar emocional.
          Suas mensagens não são compartilhadas com o terapeuta.
        </p>
      </div>

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ textAlign: "center", maxWidth: 380 }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🧠</div>
              <div
                style={{
                  fontFamily: "var(--ff)",
                  fontSize: 24,
                  color: "var(--ivoryD)",
                  fontWeight: 300,
                  marginBottom: 10,
                }}
              >
                IA de Apoio Emocional
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--ivoryDD)",
                  lineHeight: 1.7,
                }}
              >
                Pergunte sobre exercícios de respiração, técnicas de
                mindfulness, ou reflita sobre o que está sentindo. A IA está
                aqui para ajudar no seu bem-estar.
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  justifyContent: "center",
                  marginTop: 20,
                }}
              >
                {[
                  "Como posso lidar com ansiedade?",
                  "Exercício de respiração",
                  "Estou me sentindo triste hoje",
                  "Técnica de grounding",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setInput(suggestion);
                    }}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 20,
                      fontSize: 12,
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      color: "var(--ivoryD)",
                      cursor: "pointer",
                      transition: "all .15s",
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent:
                msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "72%",
                padding: "14px 18px",
                borderRadius: 16,
                fontSize: 14,
                lineHeight: 1.65,
                color:
                  msg.role === "user" ? "#060E09" : "var(--ivoryD)",
                background:
                  msg.role === "user"
                    ? "var(--mint)"
                    : "var(--card)",
                border:
                  msg.role === "user"
                    ? "none"
                    : "1px solid var(--border)",
                borderBottomRightRadius:
                  msg.role === "user" ? 4 : 16,
                borderBottomLeftRadius:
                  msg.role === "assistant" ? 4 : 16,
                whiteSpace: "pre-wrap",
                animation: "fadeUp .2s var(--ease-out)",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "14px 18px",
                borderRadius: 16,
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderBottomLeftRadius: 4,
                display: "flex",
                gap: 6,
                alignItems: "center",
              }}
            >
              {[0, 1, 2].map((n) => (
                <span
                  key={n}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--ivoryDD)",
                    display: "inline-block",
                    animation: `pulse 1.4s ease-in-out ${n * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(184,84,80,.1)",
              border: "1px solid rgba(184,84,80,.3)",
              borderRadius: 12,
              color: "var(--red)",
              fontSize: 13,
            }}
          >
            ❌ {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "16px 32px 20px",
          borderTop: "1px solid var(--border)",
          background: "var(--bg2)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-end",
          }}
        >
          <label htmlFor={textareaId} className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
            Mensagem
          </label>
          <textarea
            id={textareaId}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            rows={1}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 14,
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              fontFamily: "var(--fs)",
              fontSize: 14,
              lineHeight: 1.5,
              resize: "none",
              outline: "none",
              maxHeight: 120,
            }}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              padding: "12px 22px",
              borderRadius: 12,
              background:
                loading || !input.trim()
                  ? "var(--card2)"
                  : "var(--mint)",
              color:
                loading || !input.trim()
                  ? "var(--ivoryDD)"
                  : "#060E09",
              border: "none",
              fontSize: 14,
              fontWeight: 600,
              cursor:
                loading || !input.trim()
                  ? "not-allowed"
                  : "pointer",
              transition: "all .15s",
              flexShrink: 0,
            }}
          >
            Enviar
          </button>
        </div>
        <div
          style={{
            fontSize: 10,
            color: "var(--ivoryDD)",
            marginTop: 6,
            textAlign: "center",
          }}
        >
          Este chat usa IA para apoio emocional. Não substitui a terapia. Em
          caso de emergência, ligue 188 (CVV).
        </div>
      </div>
    </div>
  );
}
