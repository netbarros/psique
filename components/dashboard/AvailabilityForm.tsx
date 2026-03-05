"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type DayConfig = {
  index: number;
  label: string;
  active: boolean;
  start: string;
  end: string;
};

export function AvailabilityForm({
  initialDays,
  therapistId,
}: {
  initialDays: DayConfig[];
  therapistId: string;
}) {
  const [days, setDays] = useState<DayConfig[]>(initialDays);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleToggle = (index: number) => {
    setDays((prev) =>
      prev.map((d) => (d.index === index ? { ...d, active: !d.active } : d))
    );
  };

  const handleChangeTime = (index: number, field: "start" | "end", value: string) => {
    setDays((prev) =>
      prev.map((d) => (d.index === index ? { ...d, [field]: value } : d))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const supabase = createClient();

      const { error: deleteError } = await supabase
        .from("availability")
        .delete()
        .eq("therapist_id", therapistId);

      if (deleteError) throw deleteError;

      const payload = days.map((d) => ({
        therapist_id: therapistId,
        day_of_week: d.index,
        start_time: `${d.start}:00`,
        end_time: `${d.end}:00`,
        is_off: !d.active,
      }));

      const { error: insertError } = await supabase
        .from("availability")
        .insert(payload);

      if (insertError) throw insertError;

      setMessage({ type: "success", text: "Horários salvos com sucesso!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Erro ao salvar horários." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface shadow-xs">
      <div className="flex items-center justify-between border-b border-border-subtle px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <span className="material-symbols-outlined">event_available</span>
          </div>
          <div>
            <h2 className="text-lg font-medium text-text-primary">Horário Padrão</h2>
            <p className="text-sm text-text-muted">Semanalmente repetido em seu calendário.</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-border-subtle">
        {days.map((day) => (
          <div
            key={`day-${day.index}`}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-bg-elevated/50"
          >
            <div className="flex items-center gap-4">
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={day.active}
                  onChange={() => handleToggle(day.index)}
                />
                <div className="h-6 w-11 rounded-full bg-border-strong peer-checked:bg-brand transition-colors peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand peer-focus:ring-offset-2 peer-focus:ring-offset-bg-base after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              </label>
              <span
                className={`w-20 font-medium ${
                  day.active ? "text-text-primary" : "text-text-muted"
                }`}
              >
                {day.label}
              </span>
            </div>

            <div
              className={`flex items-center gap-3 transition-opacity ${
                day.active ? "opacity-100" : "opacity-30 pointer-events-none"
              }`}
            >
              <div className="relative">
                <select
                  className="appearance-none rounded-lg border border-border-strong bg-bg-base py-1.5 pl-3 pr-8 text-sm text-text-primary outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand scheme-dark"
                  value={day.start}
                  onChange={(e) => handleChangeTime(day.index, "start", e.target.value)}
                >
                  {Array.from({ length: 24 }).map((_, h) =>
                    [`${String(h).padStart(2, "0")}:00`, `${String(h).padStart(2, "0")}:30`].map(
                      (time) => (
                        <option key={`start-${day.index}-${time}`} value={time}>
                          {time}
                        </option>
                      )
                    )
                  )}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 pointer-events-none -translate-y-1/2 text-[16px] text-text-muted">
                  expand_more
                </span>
              </div>
              <span className="px-1 text-sm text-text-muted">até</span>
              <div className="relative">
                <select
                  className="appearance-none rounded-lg border border-border-strong bg-bg-base py-1.5 pl-3 pr-8 text-sm text-text-primary outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand scheme-dark"
                  value={day.end}
                  onChange={(e) => handleChangeTime(day.index, "end", e.target.value)}
                >
                  {Array.from({ length: 24 }).map((_, h) =>
                    [`${String(h).padStart(2, "0")}:00`, `${String(h).padStart(2, "0")}:30`].map(
                      (time) => (
                        <option key={`end-${day.index}-${time}`} value={time}>
                          {time}
                        </option>
                      )
                    )
                  )}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 pointer-events-none -translate-y-1/2 text-[16px] text-text-muted">
                  expand_more
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border-subtle bg-bg-elevated px-6 py-4">
        <div>
          {message && (
            <p
              className={`text-sm ${
                message.type === "success" ? "text-brand" : "text-error"
              }`}
            >
              {message.text}
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-bg-base shadow-[0_4px_20px_rgba(82,183,136,0.2)] transition-transform hover:bg-brand-hover active:scale-[0.98] disabled:opacity-70 lg:mb-0 mb-4"
        >
          {isSaving ? (
            <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
          ) : (
            <span className="material-symbols-outlined text-[18px]">save</span>
          )}
          {isSaving ? "Salvando..." : "Salvar Horários"}
        </button>
      </div>
    </div>
  );
}
