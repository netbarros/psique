"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/Toast";

interface TelegramAutomationsProps {
  initialAutomations: Record<string, boolean>;
}

const AUTOMATIONS_LIST = [
  {
    key: "reminder_24h",
    label: "Lembrete 24h",
    desc: "Envia lembrete automático 24 horas antes da sessão",
  },
  {
    key: "reminder_1h",
    label: "Lembrete 1h",
    desc: "Envia lembrete automático 1 hora antes com link da sala",
  },
  {
    key: "post_session_billing",
    label: "Cobrança Pós-Sessão",
    desc: "Envia link de pagamento automaticamente após a sessão",
  },
  {
    key: "nps_collection",
    label: "Coleta NPS",
    desc: "Pede avaliação da sessão via teclado inline",
  },
  {
    key: "lead_nurture",
    label: "Nutrição de Leads",
    desc: "Mensagens automáticas para leads que não agendaram",
  },
  {
    key: "reengagement",
    label: "Reengajamento",
    desc: "Reativação de pacientes inativos com mensagens personalizadas",
  },
];

export default function TelegramAutomations({
  initialAutomations,
}: TelegramAutomationsProps) {
  const [automations, setAutomations] = useState(initialAutomations);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const toggleAutomation = async (key: string) => {
    if (loadingKey) return;

    const newValue = !automations[key];
    setLoadingKey(key);
    setAutomations((prev) => ({ ...prev, [key]: newValue }));

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data: therapist } = await supabase
        .from("therapists")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!therapist) throw new Error("Terapeuta não encontrado");

      const newAutomations = { ...automations, [key]: newValue };

      const { error } = await supabase
        .from("telegram_configs")
        .update({ automations: newAutomations })
        .eq("therapist_id", therapist.id);

      if (error) throw error;

      toast.success("Automação atualizada");
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message ?? "Erro ao salvar");
      setAutomations((prev) => ({ ...prev, [key]: !newValue }));
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="flex flex-col gap-0">
      {AUTOMATIONS_LIST.map((item, i, arr) => {
        const enabled = Boolean(automations[item.key]);
        const pending = loadingKey === item.key;

        return (
          <div
            key={item.key}
            className={`flex items-center justify-between gap-4 px-4 py-3.5 ${
              i < arr.length - 1
                ? "border-b border-border-subtle"
                : ""
            }`}
          >
            <div>
              <div className="text-base font-medium text-text-primary">
                {item.label}
              </div>
              <div className="mt-0.5 text-[13px] text-text-muted">
                {item.desc}
              </div>
            </div>

            <button
              type="button"
              onClick={() => toggleAutomation(item.key)}
              disabled={pending}
              aria-label={`Alternar ${item.label}`}
              className={`relative h-6 w-11 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 focus:ring-offset-bg-base ${
                enabled
                  ? "bg-brand"
                  : "bg-border-subtle"
              } ${pending ? "cursor-wait opacity-70" : "cursor-pointer"}`}
            >
              <span
                className={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full border border-gray-300 bg-white transition-transform duration-300 ${
                  enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
