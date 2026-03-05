"use client";

import { useMemo, useState } from "react";

type TimeSlot = {
  label: string;
  iso: string;
  isBooked: boolean;
};

type DayGroup = {
  weekLabel: string;
  dateLabel: string;
  fullLabel: string;
  times: TimeSlot[];
};

export function PortalScheduleClient({
  dayGroups,
  patient,
  sessionPrice,
}: {
  dayGroups: DayGroup[];
  patient: { name: string; email: string; phone?: string | null };
  sessionPrice: number;
}) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedIso, setSelectedIso] = useState<string | null>(() => {
    const firstDay = dayGroups[0];
    const firstSlot = firstDay?.times.find((item) => !item.isBooked);
    return firstSlot?.iso ?? null;
  });

  const [name, setName] = useState(patient.name);
  const [email, setEmail] = useState(patient.email);
  const [phone, setPhone] = useState(patient.phone ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDay = dayGroups[selectedDayIndex] ?? null;

  const selectedLabel = useMemo(() => {
    if (!selectedIso) return "Selecione um horário disponível";
    const selectedDate = new Date(selectedIso);
    return (
      selectedDate.toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
      }) +
      " às " +
      selectedDate.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  }, [selectedIso]);

  async function handleCheckout() {
    if (!selectedIso || loading) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/patient/appointments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt: selectedIso,
          patientName: name,
          patientEmail: email,
          patientPhone: phone || undefined,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        data?: { checkoutUrl?: string };
      };

      if (response.status === 409) {
        throw new Error(
          payload.error ?? "Este horário já foi reservado. Por favor escolha outro."
        );
      }

      if (!response.ok || !payload.data?.checkoutUrl) {
        throw new Error(payload.error ?? "Falha ao iniciar checkout");
      }

      window.location.href = payload.data.checkoutUrl;
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Erro no checkout"
      );
      setLoading(false);
    }
  }

  if (!dayGroups.length) {
    return (
      <p className="rounded-xl border border-dashed border-portal-border bg-portal-bg-muted p-4 text-sm text-portal-text-muted">
        Não há disponibilidade configurada para os próximos dias.
      </p>
    );
  }

  return (
    <>
      {/* ── Seleção de data ── */}
      <section className="mb-6 rounded-3xl border border-portal-border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-portal-brand">
          <h2 className="font-display text-2xl text-portal-text-heading">
            Selecione uma data
          </h2>
        </div>

        {/* Date chips — horizontal scroll (stitch S23) */}
        <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
          {dayGroups.slice(0, 14).map((day, index) => {
            const active = index === selectedDayIndex;
            return (
              <button
                key={`${day.fullLabel}-${day.dateLabel}`}
                type="button"
                onClick={() => {
                  setSelectedDayIndex(index);
                  const firstAvailable = day.times.find((item) => !item.isBooked);
                  setSelectedIso(firstAvailable?.iso ?? null);
                }}
                className={`min-w-[68px] rounded-2xl border px-3 py-2 text-center transition-colors ${
                  active
                    ? "border-portal-brand bg-portal-brand text-white shadow-[0_0_15px_rgba(74,143,168,0.30)]"
                    : "border-portal-border bg-portal-bg-muted text-portal-text-secondary hover:border-portal-brand/40"
                }`}
              >
                <span className="block text-[10px] font-semibold uppercase tracking-wider">
                  {day.weekLabel}
                </span>
                <span className="block text-lg font-semibold">{day.dateLabel}</span>
              </button>
            );
          })}
        </div>

        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-portal-text-muted">
          Horários para {selectedDay?.fullLabel}
        </p>

        {/* Time slots — 3-col grid (stitch S23) */}
        <div className="grid grid-cols-3 gap-2">
          {selectedDay?.times.map((time) => {
            const selected = selectedIso === time.iso;
            return (
              <button
                key={time.iso}
                type="button"
                disabled={time.isBooked}
                onClick={() => setSelectedIso(time.iso)}
                className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                  time.isBooked
                    ? "cursor-not-allowed border-portal-border bg-portal-bg-muted text-portal-text-placeholder line-through opacity-50"
                    : selected
                      ? "border-portal-brand bg-portal-brand text-white shadow-[0_0_10px_rgba(74,143,168,0.20)]"
                      : "border-portal-border bg-white text-portal-text-primary hover:border-portal-brand/50"
                }`}
              >
                {time.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Dados do paciente ── */}
      <section className="mb-24 rounded-3xl border border-portal-border bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-display text-2xl text-portal-text-heading">
          Seus dados
        </h2>
        <div className="grid gap-3">
          <Field label="Nome" value={name} onChange={setName} placeholder="Como prefere ser chamado?" />
          <Field label="Email" value={email} onChange={setEmail} placeholder="seu@email.com" type="email" />
          <Field label="Telefone" value={phone} onChange={setPhone} placeholder="(00) 00000-0000" type="tel" />
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-portal-danger/25 bg-portal-danger/10 px-3 py-2 text-sm text-portal-danger">
            {error}
          </p>
        ) : null}
      </section>

      {/* ── Footer CTA fixo (stitch S23) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-portal-border bg-white/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-portal-text-heading">{selectedLabel}</p>
            <p className="text-xs text-portal-brand">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(sessionPrice)}
            </p>
          </div>
          <button
            type="button"
            disabled={!selectedIso || loading}
            onClick={() => void handleCheckout()}
            className="rounded-xl bg-portal-brand px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-portal-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Processando..." : "Confirmar e pagar"}
          </button>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "email" | "tel";
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-portal-text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-portal-border bg-white px-4 py-3 text-sm text-portal-text-primary outline-none transition-colors placeholder:text-portal-text-placeholder focus:border-portal-brand focus:ring-2 focus:ring-portal-brand/20"
      />
    </label>
  );
}
