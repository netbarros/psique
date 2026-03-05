"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PatientOption = { id: string; name: string };

export function NewAppointmentSheet({
  patients,
}: {
  patients: PatientOption[];
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"sessao" | "bloqueio">("sessao");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;
    const duration = 50; // default for simplicity

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data: therapist } = await supabase
        .from("therapists")
        .select("id")
        .eq("user_id", user.id)
        .single();
      
      if (!therapist) throw new Error("Acesso negado");

      const scheduledAt = new Date(`${date}T${time}:00`);

      if (tab === "sessao") {
        const patientId = formData.get("patient") as string;
        if (!patientId) throw new Error("Selecione um paciente");

        const { error: insertError } = await supabase.from("appointments").insert({
          therapist_id: therapist.id,
          patient_id: patientId,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: duration,
          status: "confirmed",
          type: "online", 
        });

        if (insertError) throw insertError;
      } else {
        const { error: insertError } = await supabase.from("availability_blocks").insert({
          therapist_id: therapist.id,
          blocked_at: scheduledAt.toISOString(),
          reason: "Bloqueio manual",
        });

        if (insertError) throw insertError;
      }

      setOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand text-bg-base shadow-[0_10px_30px_rgba(82,183,136,0.35)] transition-transform hover:scale-105 lg:hidden"
        aria-label="Nova sessão"
      >
        <span className="material-symbols-outlined text-[20px]">add</span>
      </button>

      <button
        onClick={() => setOpen(true)}
        className="hidden w-max items-center gap-2 rounded-xl border border-border-strong bg-surface px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-brand/30 hover:text-text-primary lg:inline-flex"
      >
        <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
        Nova Sessão / Bloqueio
      </button>

      <div
        className={`fixed inset-0 z-50 flex justify-end transition-all ${
          open ? "visible bg-bg-base/80 backdrop-blur-sm" : "invisible"
        }`}
      >
        <div
          className={`absolute inset-0`}
          onClick={() => setOpen(false)}
        />
        <div
          className={`relative flex h-full w-full max-w-md flex-col border-l border-border-subtle bg-surface shadow-2xl transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
            <h2 className="font-display text-xl font-semibold text-text-primary">
              Adicionar à Agenda
            </h2>
            <button
              onClick={() => setOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="flex border-b border-border-subtle p-2">
            <button
              onClick={() => setTab("sessao")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                tab === "sessao"
                  ? "bg-bg-elevated text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              Nova Sessão
            </button>
            <button
              onClick={() => setTab("bloqueio")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                tab === "bloqueio"
                  ? "bg-error/10 text-error shadow-sm"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              Bloqueio de Horário
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form id="appointment-form" onSubmit={handleSubmit} className="space-y-5">
              {tab === "sessao" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-secondary">
                    Paciente
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-text-muted">
                      person
                    </span>
                    <select
                      name="patient"
                      required
                      className="w-full appearance-none rounded-xl border border-border-strong bg-bg-base py-2.5 pl-10 pr-4 text-sm text-text-primary outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
                    >
                      <option value="">Selecione um paciente...</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[18px] text-text-muted">
                      expand_more
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-secondary">
                    Data
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-text-muted">
                      event
                    </span>
                    <input
                      type="date"
                      name="date"
                      required
                      data-theme="dark"
                      className="w-full rounded-xl border border-border-strong bg-bg-base py-2.5 pl-10 pr-3 text-sm text-text-primary outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand scheme-dark"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-secondary">
                    Horário
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-text-muted">
                      schedule
                    </span>
                    <input
                      type="time"
                      name="time"
                      required
                      step="1800"
                      data-theme="dark"
                      className="w-full rounded-xl border border-border-strong bg-bg-base py-2.5 pl-10 pr-3 text-sm text-text-primary outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand scheme-dark"
                    />
                  </div>
                </div>
              </div>
              
              {tab === "bloqueio" && (
                <div className="rounded-xl border border-border-subtle bg-bg-elevated p-4">
                  <p className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="material-symbols-outlined text-[16px] text-error">info</span>
                    O horário selecionado será preenchido como indisponível na sua agenda e não poderá ser marcado por pacientes.
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-error/25 bg-error/10 px-4 py-3 text-sm text-error">
                  {error}
                </div>
              )}
            </form>
          </div>

          <div className="border-t border-border-subtle bg-bg-elevated px-6 py-4">
            <button
              form="appointment-form"
              type="submit"
              disabled={isLoading}
              className={`w-full rounded-xl py-3 text-sm font-semibold transition-transform active:scale-[0.98] ${
                tab === "sessao"
                  ? "bg-brand text-bg-base hover:bg-brand-hover shadow-[0_4px_20px_rgba(82,183,136,0.2)] disabled:bg-brand/50"
                  : "bg-error text-white hover:bg-error/90 shadow-[0_4px_20px_rgba(239,68,68,0.2)] disabled:bg-error/50"
              }`}
            >
              {isLoading ? "Salvando..." : tab === "sessao" ? "Confirmar Sessão" : "Bloquear Horário"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
