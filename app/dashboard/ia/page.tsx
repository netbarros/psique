"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type AIErrorCode =
  | "AI_NOT_CONFIGURED"
  | "AI_PROVIDER_AUTH"
  | "AI_PROVIDER_RATE_LIMIT"
  | "AI_PROVIDER_UNAVAILABLE"
  | "AI_INTERNAL_ERROR";

const QUICK_TEMPLATES = [
  "Gerar estudo de caso da última sessão.",
  "Analisar saúde da carteira de pacientes desta semana.",
  "Revisar risco clínico dos pacientes com faltas recorrentes.",
];

export default function IAPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<AIErrorCode | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const canSubmit = draft.trim().length > 0 && !loading;

  const transcriptForApi = useMemo(
    () => messages.map((message) => ({ role: message.role, content: message.content })),
    [messages]
  );

  function pushMessage(message: ChatMessage) {
    setMessages((prev) => [...prev, message]);
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 30);
  }

  async function submitMessage(content: string) {
    const cleaned = content.trim();
    if (!cleaned || loading) return;

    setError(null);
    setErrorCode(null);
    const userMessage: ChatMessage = {
      role: "user",
      content: cleaned,
      createdAt: new Date().toISOString(),
    };
    pushMessage(userMessage);
    setDraft("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...transcriptForApi, { role: "user", content: cleaned }] }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        code?: AIErrorCode;
        data?: { reply?: string };
      };

      if (response.status === 429) {
        setErrorCode("AI_PROVIDER_RATE_LIMIT");
        setError("Limite de uso da IA atingido. Aguarde alguns instantes e tente novamente.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setErrorCode(payload.code ?? null);
        if (payload.code === "AI_NOT_CONFIGURED") {
          setError("IA não configurada para sua conta. Conecte um provedor em Configurações > Integrações.");
          setLoading(false);
          return;
        }
        if (payload.code === "AI_PROVIDER_AUTH") {
          setError("A autenticação do provedor de IA falhou. Revalide sua integração em Configurações.");
          setLoading(false);
          return;
        }
        throw new Error(payload.error ?? "Não foi possível processar sua solicitação.");
      }

      pushMessage({
        role: "assistant",
        content: payload.data?.reply?.trim() || "Sem resposta da IA no momento.",
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      setErrorCode(null);
      setError(err instanceof Error ? err.message : "Erro inesperado ao consultar a IA.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] w-full max-w-5xl flex-col overflow-hidden px-4 pb-4 pt-4 sm:px-6 lg:px-8">
      <header className="shrink-0 border-b border-border-subtle bg-bg-elevated px-2 py-4 sm:px-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-surface text-text-secondary transition-colors hover:text-text-primary"
              aria-label="Voltar ao dashboard"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </Link>

            <div>
              <h1 className="font-display text-xl font-semibold text-text-primary">
                Therapeutic AI
              </h1>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
                <span className="h-2 w-2 rounded-full bg-brand shadow-[0_0_8px_rgba(82,183,136,0.5)]" />
                <span className="rounded-full border border-border-subtle bg-surface px-2 py-0.5">
                  Claude 3.5 Sonnet
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-surface text-text-secondary transition-colors hover:text-text-primary"
            aria-label="Histórico da IA"
          >
            <span className="material-symbols-outlined text-[20px]">history</span>
          </button>
        </div>
      </header>

      <div className="shrink-0 border-b border-border-subtle/60 px-2 py-4 sm:px-4">
        <div className="[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex w-full gap-2 overflow-x-auto">
          {QUICK_TEMPLATES.map((template) => (
            <button
              key={template}
              type="button"
              onClick={() => setDraft(template)}
              className="whitespace-nowrap rounded-full border border-border-subtle bg-surface px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-brand/50 hover:text-text-primary"
            >
              {template}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-1 space-y-5 overflow-y-auto px-2 py-5 sm:px-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-brand/30 bg-surface shadow-[0_0_30px_rgba(82,183,136,0.1)]">
              <span className="material-symbols-outlined text-[32px] text-brand">auto_awesome</span>
            </div>
            <div>
              <h2 className="font-display text-2xl text-text-primary">
                Como posso apoiar sua prática hoje?
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-muted">
                Ambiente seguro para sumarização clínica, hipóteses e orientação operacional.
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isUser = message.role === "user";
            return (
              <div key={`${message.createdAt}-${index}`} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                {isUser ? (
                  <div className="max-w-[88%] rounded-2xl rounded-tr-sm border border-border-subtle bg-surface px-5 py-4 text-sm text-text-primary">
                    <p className="leading-relaxed">{message.content}</p>
                    <span className="mt-2 block text-right text-[10px] text-text-muted">
                      {new Date(message.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ) : (
                  <div className="max-w-[92%] space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-brand/40 bg-brand/15 text-brand">
                        <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                      </span>
                      <span className="text-xs font-medium uppercase tracking-wider text-brand">Psique AI</span>
                    </div>
                    <div className="rounded-2xl rounded-tl-sm border border-brand/30 bg-bg-elevated px-5 py-4">
                      <div className="border-l border-brand/50 pl-3 text-sm leading-relaxed text-text-secondary">
                        {message.content}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="sticky bottom-0 shrink-0 border-t border-border-subtle bg-bg-base px-2 pb-2 pt-4 sm:px-4">
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            await submitMessage(draft);
          }}
          className="space-y-3"
        >
          <div className="flex items-end gap-2 rounded-2xl border border-border-subtle bg-surface p-2 transition-colors focus-within:border-brand/60">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
              aria-label="Anexar contexto"
            >
              <span className="material-symbols-outlined text-[20px]">attach_file</span>
            </button>
            <textarea
              className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-1 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none"
              placeholder="Pergunte sobre pacientes, peça análise ou resumo clínico..."
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-bg-base shadow-[0_4px_12px_rgba(82,183,136,0.3)] transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Enviar mensagem"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-bg-base border-t-transparent" />
              ) : (
                <span className="material-symbols-outlined text-[20px]">send</span>
              )}
            </button>
          </div>
          <div className="text-center text-[10px] uppercase tracking-widest text-text-muted">
            Confidencial • Fluxo clínico LGPD
          </div>
          {error ? (
            <div className="space-y-2 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-xs text-error/70">
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
          ) : null}
        </form>
      </div>
    </div>
  );
}
