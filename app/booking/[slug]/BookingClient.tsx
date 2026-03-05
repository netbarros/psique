"use client";

import { useState, useMemo, useCallback, useId } from "react";
import { validateCPF, formatCPF } from "@/lib/utils";

interface BookingClientProps {
  therapistId: string;
  therapistName: string;
  sessionPrice: number;
  sessionDuration: number;
  availabilitySlots: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>;
  bookedTimes: string[];
  slug: string;
  uiContent: {
    title: string;
    subtitle: string;
    footerNote: string;
    stepSelectLabel: string;
    stepFormLabel: string;
    stepCheckoutLabel: string;
    noSlotsLabel: string;
    formTitle: string;
    submitLabel: string;
    processingTitle: string;
    processingSubtitle: string;
    formValidationError: string;
    invalidCpfError: string;
    checkoutError: string;
  };
}

interface BookingForm {
  name: string;
  email: string;
  phone: string;
  cpf: string;
}

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function BookingClient({
  therapistId,
  therapistName,
  sessionPrice,
  sessionDuration,
  availabilitySlots,
  bookedTimes,
  slug,
  uiContent,
}: BookingClientProps) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "form" | "processing">("select");
  const [form, setForm] = useState<BookingForm>({
    name: "",
    email: "",
    phone: "",
    cpf: "",
  });
  const [error, setError] = useState<string | null>(null);
  const formId = useId();

  // Generate next 21 days with available slots
  const daysWithSlots = useMemo(() => {
    const slotsByDay: Record<number, typeof availabilitySlots> = {};
    for (const slot of availabilitySlots) {
      if (!slotsByDay[slot.day_of_week]) slotsByDay[slot.day_of_week] = [];
      slotsByDay[slot.day_of_week].push(slot);
    }

    const result: Array<{
      date: Date;
      dayOfWeek: number;
      label: string;
      times: Array<{ time: string; iso: string; booked: boolean }>;
    }> = [];

    for (let i = 1; i <= 21; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      const dow = d.getDay();

      if (!slotsByDay[dow]) continue;

      const times: Array<{ time: string; iso: string; booked: boolean }> = [];
      for (const slot of slotsByDay[dow]) {
        const generated = generateTimeSlots(slot.start_time, slot.end_time, sessionDuration);
        for (const t of generated) {
          const [h, m] = t.split(":").map(Number);
          const slotDate = new Date(d);
          slotDate.setHours(h, m, 0, 0);
          const iso = slotDate.toISOString();
          const isBooked = bookedTimes.some(
            (b) => Math.abs(new Date(b).getTime() - slotDate.getTime()) < 3600000
          );
          times.push({ time: t, iso, booked: isBooked });
        }
      }

      if (times.length > 0) {
        result.push({
          date: d,
          dayOfWeek: dow,
          label: d.toLocaleDateString("pt-BR", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
          }),
          times,
        });
      }
    }

    return result;
  }, [availabilitySlots, bookedTimes, sessionDuration]);

  const handleSlotClick = useCallback(
    (iso: string, booked: boolean) => {
      if (booked) return;
      setSelectedSlot(iso);
      setStep("form");
      setError(null);
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (!selectedSlot || !form.name.trim() || !form.email.includes("@")) {
      setError(uiContent.formValidationError);
      return;
    }

    if (form.cpf && !validateCPF(form.cpf)) {
      setError(uiContent.invalidCpfError);
      return;
    }

    setStep("processing");
    setError(null);

    try {
      const res = await fetch("/api/booking/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          therapistId,
          scheduledAt: selectedSlot,
          patientName: form.name,
          patientEmail: form.email,
          patientPhone: form.phone,
          patientCpf: form.cpf || undefined,
          slug,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `Erro ${res.status}`);
      }

      const json = (await res.json()) as { data: { checkoutUrl: string } };
      window.location.href = json.data.checkoutUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : uiContent.checkoutError);
      setStep("form");
    }
  }, [selectedSlot, form, therapistId, slug, uiContent]);

  const selectedDate = selectedSlot
    ? new Date(selectedSlot).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      })
    : "";
  const selectedTime = selectedSlot
    ? new Date(selectedSlot).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  /* ─── Canonical token inputClassName — stitch S02 dark_core ─── */
  const inputClassName =
    "w-full rounded-xl border border-border-subtle bg-bg-elevated px-4 py-3 text-sm text-text-primary outline-none transition focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-text-muted";

  return (
    <div>
      {/* ── Step indicator ── */}
      <div className="mb-6 flex items-center gap-2">
        {[
          { n: 1, label: uiContent.stepSelectLabel },
          { n: 2, label: uiContent.stepFormLabel },
          { n: 3, label: uiContent.stepCheckoutLabel },
        ].map((s, i, arr) => {
          const isActive =
            (s.n === 1 && step === "select") ||
            (s.n === 2 && step === "form") ||
            (s.n === 3 && step === "processing");
          return (
            <div key={s.n} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-[12px] font-semibold transition-colors duration-300 ${
                  isActive
                    ? "border-brand bg-brand text-bg-base"
                    : "border-border-subtle bg-surface text-text-muted"
                }`}
              >
                {s.n}
              </div>
              <span
                className={`text-[13px] ${
                  isActive ? "font-medium text-text-primary" : "text-text-muted"
                }`}
              >
                {s.label}
              </span>
              {i < arr.length - 1 && <div className="h-px w-8 bg-border-subtle" />}
            </div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-[13px] text-error">
          <span>❌</span> {error}
        </div>
      )}

      {/* ── Step 1: Select slot — stitch S02 3-col grid ── */}
      {(step === "select" || step === "form") && (
        <div className="mb-5 rounded-2xl border border-border-subtle bg-surface/40 p-7 backdrop-blur-md">
          <h2 className="mb-5 font-display text-2xl font-light text-text-primary">
            {uiContent.title}
          </h2>
          <p className="mb-4 text-[12px] text-text-muted">
            {uiContent.subtitle}
          </p>

          {daysWithSlots.length === 0 ? (
            <div className="py-8 text-center text-text-muted">{uiContent.noSlotsLabel}</div>
          ) : (
            <div
              className={`flex flex-col gap-5 ${
                step === "form" ? "max-h-[320px] overflow-y-auto pr-2" : ""
              }`}
            >
              {daysWithSlots.map((day) => (
                <div key={day.label}>
                  <div className="mb-2.5 text-[13px] font-medium text-text-secondary">
                    {DAYS[day.dayOfWeek]} ·{" "}
                    {day.date.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </div>
                  {/* 3-col slot grid — stitch S02 */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {day.times.map((t) => {
                      const isSelected = selectedSlot === t.iso;
                      return (
                        <button
                          key={t.iso}
                          type="button"
                          disabled={t.booked}
                          onClick={() => handleSlotClick(t.iso, t.booked)}
                          className={`rounded-xl border py-2.5 text-[14px] font-medium transition-all duration-200 ${
                            isSelected
                              ? "border-brand bg-brand text-bg-base shadow-[0_0_10px_rgba(82,183,136,0.2)]"
                              : t.booked
                              ? "cursor-not-allowed border-border-subtle bg-surface opacity-40 line-through"
                              : "border-border-subtle bg-surface text-text-primary hover:border-brand hover:text-brand"
                          }`}
                        >
                          {t.time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Form ── */}
      {step === "form" && selectedSlot && (
        <div className="animate-[fadeUp_.25s_ease-out_both] rounded-2xl border border-border-subtle bg-surface/50 p-7 backdrop-blur-md">
          <h2 className="mb-1.5 font-display text-2xl font-light text-text-primary">{uiContent.formTitle}</h2>
          <p className="mb-5 text-[13px] text-text-muted">
            Sessão com{" "}
            <span className="text-info">{therapistName}</span> em{" "}
            <span className="text-gold">
              {selectedDate} às {selectedTime}
            </span>
          </p>

          <div className="flex flex-col gap-3">
            <div>
              <label
                htmlFor={`${formId}-name`}
                className="mb-1.5 block text-[11px] uppercase tracking-[0.08em] text-text-muted"
              >
                Nome completo *
              </label>
              <input
                id={`${formId}-name`}
                className={inputClassName}
                placeholder="Seu nome"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                aria-label="Nome completo"
              />
            </div>

            <div>
              <label
                htmlFor={`${formId}-email`}
                className="mb-1.5 block text-[11px] uppercase tracking-[0.08em] text-text-muted"
              >
                Email *
              </label>
              <input
                id={`${formId}-email`}
                className={inputClassName}
                placeholder="seu@email.com"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                aria-label="Email"
              />
            </div>

            <div>
              <label
                htmlFor={`${formId}-phone`}
                className="mb-1.5 block text-[11px] uppercase tracking-[0.08em] text-text-muted"
              >
                Telefone (opcional)
              </label>
              <input
                id={`${formId}-phone`}
                className={inputClassName}
                placeholder="(11) 99999-0000"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                aria-label="Telefone"
              />
            </div>

            <div>
              <label
                htmlFor={`${formId}-cpf`}
                className="mb-1.5 block text-[11px] uppercase tracking-[0.08em] text-text-muted"
              >
                CPF (opcional)
              </label>
              <input
                id={`${formId}-cpf`}
                className={inputClassName}
                placeholder="000.000.000-00"
                value={form.cpf ? formatCPF(form.cpf) : ""}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
                  setForm((f) => ({ ...f, cpf: raw }));
                }}
                inputMode="numeric"
                aria-label="CPF"
              />
            </div>
          </div>

          {/* Summary & submit — stitch S02 sticky-like bottom summary */}
          <div className="mt-5 flex flex-col items-center justify-between gap-4 rounded-xl border border-border-subtle bg-surface-hover/30 p-4 sm:flex-row sm:items-start">
            <div className="text-center sm:text-left">
              <div className="mb-1 text-[11px] text-text-muted">Valor da sessão</div>
              <div className="font-display text-[28px] font-light text-gold">
                R$ {sessionPrice.toFixed(2)}
              </div>
            </div>
            {/* Stitch S02: bg-brand, text-bg-base, glow shadow */}
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full rounded-xl bg-brand px-8 py-3.5 text-[15px] font-semibold text-bg-base shadow-[0_4px_20px_rgba(82,183,136,0.25)] transition-all duration-300 hover:scale-[1.02] hover:bg-brand-hover hover:shadow-[0_4px_32px_rgba(82,183,136,0.4)] sm:w-auto"
            >
              {uiContent.submitLabel}
            </button>
          </div>

          <div className="mt-3 text-center text-[11px] font-light tracking-wide text-text-muted">
            {uiContent.footerNote}
          </div>
        </div>
      )}

      {/* ── Step 3: Processing ── */}
      {step === "processing" && (
        <div className="rounded-2xl border border-border-subtle bg-surface/50 p-[60px_28px] text-center backdrop-blur-md">
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-border-subtle border-t-brand" />
          <div className="mb-2 font-display text-[22px] font-light text-text-primary">{uiContent.processingTitle}</div>
          <div className="text-[13px] text-text-muted">{uiContent.processingSubtitle}</div>
        </div>
      )}
    </div>
  );
}

function generateTimeSlots(start: string, end: string, durationMin: number): string[] {
  const slots: string[] = [];
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let current = sh * 60 + sm;
  const endMin = eh * 60 + em;

  while (current + durationMin <= endMin) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    current += durationMin;
  }

  return slots;
}
