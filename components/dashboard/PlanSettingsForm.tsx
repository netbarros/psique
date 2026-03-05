"use client";

import { useState } from "react";
import { toast } from "@/components/ui/Toast";

type PlanSettingsFormProps = {
  initialSessionPrice: number;
  initialSessionDuration: number;
};

export default function PlanSettingsForm({
  initialSessionPrice,
  initialSessionDuration,
}: PlanSettingsFormProps) {
  const [sessionPrice, setSessionPrice] = useState(String(initialSessionPrice));
  const [sessionDuration, setSessionDuration] = useState(String(initialSessionDuration));
  const [saving, setSaving] = useState(false);

  const savePlan = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const response = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionPrice: Number(sessionPrice),
          sessionDuration: Number(sessionDuration),
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Falha ao salvar plano");
      }

      toast.success("Plano atualizado com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar plano");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border-subtle bg-surface p-6">
      <h2 className="mb-1 font-display text-2xl text-gold">Configuração de plano</h2>
      <p className="mb-5 text-sm text-text-secondary">
        Ajuste preço e duração padrão das sessões para refletir sua oferta atual.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-widest text-text-muted">
            Preço da sessão (R$)
          </span>
          <input
            type="number"
            min={1}
            step="1"
            value={sessionPrice}
            onChange={(event) => setSessionPrice(event.target.value)}
            className="w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-brand/50"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-widest text-text-muted">
            Duração padrão (min)
          </span>
          <input
            type="number"
            min={20}
            max={180}
            step="5"
            value={sessionDuration}
            onChange={(event) => setSessionDuration(event.target.value)}
            className="w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-brand/50"
          />
        </label>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={savePlan}
          disabled={saving}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
            saving
              ? "cursor-not-allowed border border-border-subtle bg-surface text-text-muted"
              : "bg-brand text-bg-base hover:bg-brand-hover"
          }`}
        >
          {saving ? "Salvando..." : "Salvar Plano"}
        </button>
      </div>
    </section>
  );
}
