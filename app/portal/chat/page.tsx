"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";


type Message = {
  role: "user" | "assistant";
  content: string;
};

type AIErrorCode =
  | "AI_NOT_CONFIGURED"
  | "AI_PROVIDER_AUTH"
  | "AI_PROVIDER_RATE_LIMIT"
  | "AI_PROVIDER_UNAVAILABLE"
  | "AI_INTERNAL_ERROR";

const QUICK_SUGGESTIONS = [
  "Estou ansioso(a) agora. Pode me guiar em 2 minutos?",
  "Quero organizar meus pensamentos antes da sessão.",
  "Me ajude com uma técnica curta de respiração.",
  "Como registrar meu dia no diário terapêutico?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  useEffect(() => {
    async function loadLatestThread() {
      try {
        const threadRes = await fetch("/api/patient/chat/threads?limit=1", {
          cache: "no-store",
        });
        if (!threadRes.ok) return;

        const threadPayload = (await threadRes.json()) as {
          data?: Array<{ id: string }>;
        };
        const latestThread = threadPayload.data?.[0];
        if (!latestThread) return;

        const messagesRes = await fetch(
          `/api/patient/chat/threads/${latestThread.id}/messages`,
          { cache: "no-store" }
        );
        if (!messagesRes.ok) return;

        const messagesPayload = (await messagesRes.json()) as {
          data?: { messages?: Array<{ role: "user" | "assistant"; content: string }> };
        };

        setThreadId(latestThread.id);
        setMessages(messagesPayload.data?.messages ?? []);
      } catch {
        // silent fallback
      }
    }

    void loadLatestThread();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = useCallback(async () => {
    const content = input.trim();
    if (!content || isLoading) return;

    const nextMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/patient/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          threadId: threadId ?? undefined,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
          code?: AIErrorCode;
        };

        if (payload.code === "AI_NOT_CONFIGURED") {
          throw new Error("Assistente indisponível: seu terapeuta ainda não configurou a IA.");
        }
        if (payload.code === "AI_PROVIDER_AUTH") {
          throw new Error("Assistente indisponível no momento. Tente novamente em alguns minutos.");
        }
        if (payload.code === "AI_PROVIDER_RATE_LIMIT") {
          throw new Error("Assistente com alto volume agora. Aguarde um pouco e tente novamente.");
        }

        throw new Error(payload.error ?? "Falha ao responder");
      }

      const payload = (await response.json()) as { data: { reply: string; threadId: string } };
      setThreadId(payload.data.threadId);
      setMessages([...nextMessages, { role: "assistant", content: payload.data.reply }]);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível responder no momento"
      );
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, threadId]);

  function handleEnter(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100svh-124px)] w-full max-w-4xl flex-col overflow-x-hidden px-4 pb-3 pt-4 sm:px-6 sm:pt-6">
      <header className="mb-4 rounded-2xl border border-portal-border-soft bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-portal-bg-subtle-2 text-portal-brand">
            <span className="material-symbols-outlined text-[20px]">sparkles</span>
          </span>
          <div>
            <h1 className="font-display text-2xl text-portal-text-primary">
              Assistente terapêutico
            </h1>
            <p className="text-xs uppercase tracking-wider text-portal-text-muted">
              Apoio entre sessões • resposta em tempo real
            </p>
          </div>
        </div>
      </header>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-portal-border-soft bg-white shadow-sm">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {messages.length === 0 ? (
            <div className="mx-auto max-w-xl rounded-2xl border border-portal-border-softer bg-portal-bg-muted p-6 text-center">
              <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-portal-bg-subtle-2 text-portal-brand">
                <span className="material-symbols-outlined text-[28px]">psychology</span>
              </div>
              <h2 className="font-display text-2xl text-portal-text-primary">
                Como você está hoje?
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-portal-text-secondary">
                Este espaço ajuda você a organizar emoções e preparar reflexões para a próxima sessão.
              </p>
              <div className="mt-5 grid gap-2">
                {QUICK_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setInput(suggestion)}
                    className="rounded-xl border border-portal-border-soft bg-white px-3 py-2.5 text-left text-sm text-portal-text-primary transition-colors hover:border-portal-brand/40 hover:bg-portal-bg-soft"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isUser = message.role === "user";
                return (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[86%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[74%] ${
                        isUser
                          ? "rounded-tr-sm bg-portal-brand text-white"
                          : "rounded-tl-sm border border-portal-border-soft bg-portal-bg-muted text-portal-text-primary"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                );
              })}

              {isLoading ? (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-xl border border-portal-border-soft bg-portal-bg-muted px-3 py-2 text-xs text-portal-text-muted">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-portal-brand" />
                    IA está respondendo...
                  </div>
                </div>
              ) : null}

              {error ? (
                <div className="rounded-xl border border-portal-danger/25 bg-portal-danger/10 px-3 py-2 text-xs text-portal-danger">
                  {error}
                </div>
              ) : null}

              <div ref={endRef} />
            </div>
          )}
        </div>

        <div className="border-t border-portal-border-weak bg-portal-bg-surface-alt px-4 py-3 sm:px-6">
          <div className="flex items-end gap-2">
            <label htmlFor={inputId} className="sr-only">
              Mensagem para o assistente
            </label>
            <textarea
              id={inputId}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleEnter}
              rows={1}
              placeholder="Escreva sua mensagem..."
              className="max-h-24 min-h-[46px] flex-1 resize-none rounded-xl border border-portal-border-soft bg-white px-4 py-3 text-sm text-portal-text-primary outline-none transition-colors placeholder:text-portal-text-placeholder focus:border-portal-brand focus:ring-2 focus:ring-portal-brand/20"
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={isLoading || !input.trim()}
              className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-portal-brand text-white transition-colors hover:bg-portal-brand-hover disabled:cursor-not-allowed disabled:bg-portal-brand-disabled"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              <span className="sr-only">Enviar</span>
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-portal-text-soft">
            O assistente não substitui atendimento clínico. Em crise, ligue 188.
          </p>
        </div>
      </section>
    </div>
  );
}
