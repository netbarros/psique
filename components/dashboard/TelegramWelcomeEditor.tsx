"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/Toast";

export function TelegramWelcomeEditor({
  therapistId,
  initialMessage,
}: {
  therapistId: string;
  initialMessage: string;
}) {
  const [message, setMessage] = useState(initialMessage);
  const [saving, setSaving] = useState(false);

  async function saveMessage() {
    if (saving) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("telegram_configs")
        .upsert(
          {
            therapist_id: therapistId,
            welcome_msg: message,
          },
          { onConflict: "therapist_id" }
        );

      if (error) throw error;
      toast.success("Mensagem de boas-vindas salva");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar mensagem";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  function applySuggestion() {
    setMessage(
      "Olá! Sou a assistente virtual da clínica.\n" +
        "Posso ajudar você a agendar sessões, revisar horários e receber lembretes automáticos.\n" +
        "Como posso ajudar agora?"
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl text-text-primary">
          Welcome Message
        </h3>
        <button
          type="button"
          onClick={applySuggestion}
          className="inline-flex items-center gap-1 rounded-full border border-gold/20 bg-gold/10 px-2.5 py-1 text-xs font-medium text-gold transition-colors hover:bg-gold/15"
        >
          <span className="material-symbols-outlined text-sm">auto_awesome</span>
          AI Suggest
        </button>
      </div>

      <div className="group rounded-2xl border border-border-subtle bg-surface p-1 transition-colors focus-within:border-gold/50">
        <textarea
          className="h-32 w-full resize-none bg-transparent px-3 py-3 text-sm leading-relaxed text-text-primary outline-none placeholder:text-text-muted"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Mensagem inicial exibida ao paciente no Telegram..."
        />

        <div className="mt-1 flex gap-2 overflow-x-auto snap-x pb-2 rounded-xl border border-border-subtle bg-bg-elevated px-2 py-2.5">
          <div className="snap-center shrink-0 rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs text-text-secondary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-brand">calendar_month</span>
            Agendar Sessão
          </div>
          <div className="snap-center shrink-0 rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs text-text-secondary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-blue-400">list_alt</span>
            Minhas Sessões
          </div>
          <div className="snap-center shrink-0 rounded-lg border border-dashed border-text-muted/40 bg-surface px-3 py-1.5 text-xs text-text-muted flex items-center gap-1.5 opacity-50">
            <span className="material-symbols-outlined text-[14px]">add</span>
            Add Button
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] text-text-muted">
          Botões de navegação padrão são adicionados automaticamente.
        </p>
        <button
          type="button"
          onClick={saveMessage}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-gold/30 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-sm">save</span>
          {saving ? "Salvando..." : "Salvar mensagem"}
        </button>
      </div>
    </section>
  );
}
