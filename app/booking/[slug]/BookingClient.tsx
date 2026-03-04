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
        const generated = generateTimeSlots(
          slot.start_time,
          slot.end_time,
          sessionDuration
        );
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
      setError("Preencha todos os campos corretamente.");
      return;
    }

    if (form.cpf && !validateCPF(form.cpf)) {
      setError("CPF inválido. Verifique e tente novamente.");
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
        throw new Error(
          (err as { error?: string }).error ?? `Erro ${res.status}`
        );
      }

      const json = (await res.json()) as { data: { checkoutUrl: string } };

      // Redirect to Stripe checkout
      window.location.href = json.data.checkoutUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao processar agendamento");
      setStep("form");
    }
  }, [selectedSlot, form, therapistId, slug]);

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

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 12,
    background: "var(--card2)",
    border: "1px solid var(--border2)",
    color: "var(--text)",
    fontFamily: "var(--fs)",
    fontSize: 14,
    outline: "none",
  };

  return (
    <div>
      {/* Step indicator */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          alignItems: "center",
        }}
      >
        {[
          { n: 1, label: "Horário" },
          { n: 2, label: "Dados" },
          { n: 3, label: "Pagamento" },
        ].map((s, i, arr) => (
          <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 600,
                background:
                  (s.n === 1 && step === "select") ||
                  (s.n === 2 && step === "form") ||
                  (s.n === 3 && step === "processing")
                    ? "var(--mint)"
                    : "var(--card)",
                color:
                  (s.n === 1 && step === "select") ||
                  (s.n === 2 && step === "form") ||
                  (s.n === 3 && step === "processing")
                    ? "#060E09"
                    : "var(--ivoryDD)",
                border: "1px solid var(--border)",
              }}
            >
              {s.n}
            </div>
            <span
              style={{
                fontSize: 13,
                color: "var(--ivoryDD)",
              }}
            >
              {s.label}
            </span>
            {i < arr.length - 1 && (
              <div
                style={{
                  width: 32,
                  height: 1,
                  background: "var(--border)",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            background: "rgba(184,84,80,.1)",
            border: "1px solid rgba(184,84,80,.3)",
            borderRadius: 12,
            color: "var(--red)",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          ❌ {error}
        </div>
      )}

      {/* Step 1: Select slot */}
      {(step === "select" || step === "form") && (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            padding: "28px",
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontFamily: "var(--ff)",
              fontSize: 24,
              fontWeight: 300,
              color: "var(--ivory)",
              marginBottom: 20,
            }}
          >
            Escolha o horário
          </h2>

          {daysWithSlots.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px",
                color: "var(--ivoryDD)",
              }}
            >
              Não há horários disponíveis no momento.
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 18,
                maxHeight: step === "form" ? 320 : undefined,
                overflowY: step === "form" ? "auto" : undefined,
              }}
            >
              {daysWithSlots.map((day) => (
                <div key={day.label}>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--ivoryD)",
                      fontWeight: 500,
                      marginBottom: 8,
                    }}
                  >
                    {DAYS[day.dayOfWeek]} ·{" "}
                    {day.date.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {day.times.map((t) => {
                      const isSelected = selectedSlot === t.iso;
                      return (
                        <button
                          key={t.iso}
                          type="button"
                          disabled={t.booked}
                          onClick={() => handleSlotClick(t.iso, t.booked)}
                          style={{
                            padding: "10px 18px",
                            borderRadius: 10,
                            fontSize: 14,
                            fontWeight: 500,
                            background: isSelected
                              ? "var(--mint)"
                              : t.booked
                                ? "var(--bg3)"
                                : "rgba(82,183,136,.08)",
                            color: isSelected
                              ? "#060E09"
                              : t.booked
                                ? "var(--ivoryDD)"
                                : "var(--mint)",
                            border: isSelected
                              ? "2px solid var(--mint)"
                              : t.booked
                                ? "1px solid var(--border)"
                                : "1px solid rgba(82,183,136,.3)",
                            cursor: t.booked ? "not-allowed" : "pointer",
                            opacity: t.booked ? 0.4 : 1,
                            textDecoration: t.booked
                              ? "line-through"
                              : "none",
                            transition: "all .15s var(--ease-out)",
                          }}
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

      {/* Step 2: Form */}
      {step === "form" && selectedSlot && (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            padding: "28px",
            animation: "fadeUp .25s var(--ease-out)",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--ff)",
              fontSize: 24,
              fontWeight: 300,
              color: "var(--ivory)",
              marginBottom: 6,
            }}
          >
            Seus dados
          </h2>
          <p style={{ fontSize: 13, color: "var(--ivoryDD)", marginBottom: 20 }}>
            Sessão com <span style={{ color: "var(--blue)" }}>{therapistName}</span> em{" "}
            <span style={{ color: "var(--gold)" }}>
              {selectedDate} às {selectedTime}
            </span>
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div>
              <label
                htmlFor={`${formId}-name`}
                style={{
                  fontSize: 11,
                  color: "var(--ivoryDD)",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Nome completo *
              </label>
              <input
                id={`${formId}-name`}
                style={inputStyle}
                placeholder="Seu nome"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                aria-label="Nome completo"
              />
            </div>

            <div>
              <label
                htmlFor={`${formId}-email`}
                style={{
                  fontSize: 11,
                  color: "var(--ivoryDD)",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Email *
              </label>
              <input
                id={`${formId}-email`}
                style={inputStyle}
                placeholder="seu@email.com"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                aria-label="Email"
              />
            </div>

            <div>
              <label
                htmlFor={`${formId}-phone`}
                style={{
                  fontSize: 11,
                  color: "var(--ivoryDD)",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Telefone (opcional)
              </label>
              <input
                id={`${formId}-phone`}
                style={inputStyle}
                placeholder="(11) 99999-0000"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                aria-label="Telefone"
              />
            </div>

            <div>
              <label
                htmlFor={`${formId}-cpf`}
                style={{
                  fontSize: 11,
                  color: "var(--ivoryDD)",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                CPF (opcional)
              </label>
              <input
                id={`${formId}-cpf`}
                style={inputStyle}
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

          {/* Summary & submit */}
          <div
            style={{
              marginTop: 20,
              padding: "16px 20px",
              background: "var(--bg2)",
              borderRadius: 14,
              border: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "var(--ivoryDD)", marginBottom: 4 }}>
                Valor da sessão
              </div>
              <div
                style={{
                  fontFamily: "var(--ff)",
                  fontSize: 28,
                  fontWeight: 200,
                  color: "var(--gold)",
                }}
              >
                R$ {sessionPrice.toFixed(2)}
              </div>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              style={{
                padding: "14px 32px",
                background: "var(--mint)",
                color: "#060E09",
                borderRadius: 12,
                border: "none",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 24px rgba(82,183,136,.25)",
                transition: "all .2s",
              }}
            >
              Ir para Pagamento →
            </button>
          </div>

          <div
            style={{
              marginTop: 12,
              fontSize: 11,
              color: "var(--ivoryDD)",
              textAlign: "center",
            }}
          >
            🔒 Pagamento seguro via Stripe · Dados protegidos por LGPD
          </div>
        </div>
      )}

      {/* Step 3: Processing */}
      {step === "processing" && (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            padding: "60px 28px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              border: "3px solid var(--border)",
              borderTopColor: "var(--mint)",
              borderRadius: "50%",
              margin: "0 auto 20px",
              animation: "spin 1s linear infinite",
            }}
          />
          <div
            style={{
              fontFamily: "var(--ff)",
              fontSize: 22,
              fontWeight: 300,
              color: "var(--ivory)",
              marginBottom: 8,
            }}
          >
            Redirecionando para pagamento...
          </div>
          <div style={{ fontSize: 13, color: "var(--ivoryDD)" }}>
            Você será redirecionado ao Stripe em instantes.
          </div>
        </div>
      )}
    </div>
  );
}

function generateTimeSlots(
  start: string,
  end: string,
  durationMin: number
): string[] {
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
