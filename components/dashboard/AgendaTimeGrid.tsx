"use client";

import { useState, useEffect } from "react";
import { AgendaAppointmentActions } from "./AgendaAppointmentActions";

export type AgendaPatient =
  | { id?: string; name?: string | null; telegram_chat_id?: string | null }
  | Array<{ id?: string; name?: string | null; telegram_chat_id?: string | null }>
  | null;

export type AgendaAppointment = {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string;
  type: string;
  video_room_id: string | null;
  patient: AgendaPatient;
};

function getPatientName(patient: AgendaPatient): string {
  if (!patient) return "Paciente";
  if (Array.isArray(patient)) return patient[0]?.name ?? "Paciente";
  return patient.name ?? "Paciente";
}

const START_HOUR = 7;
const END_HOUR = 22;
const ROW_HEIGHT = 80; // 80px per hour

export function AgendaTimeGrid({
  appointments,
  startDate,
  viewMode,
}: {
  appointments: AgendaAppointment[];
  startDate: Date;
  viewMode: "day" | "week";
}) {
  const [now, setNow] = useState(new Date());
  const [selectedAppt, setSelectedAppt] = useState<AgendaAppointment | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [localAppts, setLocalAppts] = useState<AgendaAppointment[]>(appointments);

  useEffect(() => {
    setLocalAppts(appointments);
  }, [appointments]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Generate days array
  const daysCount = viewMode === "week" ? 7 : 1;
  const gridDays = Array.from({ length: daysCount }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  const hours = [];
  for (let i = START_HOUR; i <= END_HOUR; i++) {
    hours.push(i);
  }

  const handleApptClick = (appt: AgendaAppointment) => {
    setSelectedAppt(appt);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setTimeout(() => setSelectedAppt(null), 300); // clear after animation
  };

  return (
    <div className="relative mt-4">
      {/* ── Weekly/Daily Header (Labels) ── */}
      <div className="flex border-b border-border-strong mb-2 pb-2">
        <div className="w-16 shrink-0" /> {/* Spacing for time column */}
        {gridDays.map((day, idx) => {
          const isCurrentDay =
            now.getFullYear() === day.getFullYear() &&
            now.getMonth() === day.getMonth() &&
            now.getDate() === day.getDate();
            
          return (
            <div key={idx} className="flex-1 text-center relative border-l border-border-subtle/30 first:border-l-0">
              <div className={`text-[11px] font-semibold uppercase tracking-wider ${isCurrentDay ? "text-brand" : "text-text-muted"}`}>
                {viewMode === "day" ? day.toLocaleDateString("pt-BR", { weekday: "long" }) : DAY_LABELS[(day.getDay() + 6) % 7]}
              </div>
              <div
                className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full font-display text-lg ${
                  isCurrentDay ? "bg-brand text-bg-base shadow-[0_4px_10px_rgba(82,183,136,0.3)]" : "text-text-primary"
                }`}
              >
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Y-Axis Time Grid ── */}
      <div className="relative flex">
        {/* Time labels column */}
        <div className="w-16 shrink-0 border-r border-border-strong bg-bg-base z-20">
          {hours.map((hour) => (
            <div
              key={`label-${hour}`}
              className="relative text-right text-[11px] font-medium text-text-muted pr-3"
              style={{ height: `${ROW_HEIGHT}px` }}
            >
              <span className="relative -top-2.5 bg-bg-base py-1">{String(hour).padStart(2, "0")}:00</span>
            </div>
          ))}
        </div>

        {/* 7-Days Columns Container */}
        <div className="relative flex-1 flex min-h-[1200px]">
          {/* Horizontal Grid Lines (span across all days) */}
          <div className="absolute inset-0 pointer-events-none">
            {hours.map((hour) => (
              <div
                key={`line-${hour}`}
                className="absolute w-full border-t border-border-subtle/50"
                style={{ top: `${(hour - START_HOUR) * ROW_HEIGHT}px` }}
              />
            ))}
          </div>

          {/* Render 7 or 1 day columns */}
          {gridDays.map((day, dayIndex) => {
            const isCurrentDay =
              now.getFullYear() === day.getFullYear() &&
              now.getMonth() === day.getMonth() &&
              now.getDate() === day.getDate();

            const currentTimeTop = isCurrentDay
              ? ((now.getHours() - START_HOUR) + now.getMinutes() / 60) * ROW_HEIGHT
              : -1;

            const dayAppts = localAppts.filter(
              (a) => new Date(a.scheduled_at).getDate() === day.getDate() &&
                     new Date(a.scheduled_at).getMonth() === day.getMonth()
            );

            return (
              <div
                key={dayIndex}
                className={`relative flex-1 cursor-crosshair border-l border-border-subtle/30 first:border-l-0 transition-colors hover:bg-surface-hover/20`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  const apptId = e.dataTransfer.getData("text/plain");
                  if (!apptId) return;

                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  
                  const hoursFromStart = y / ROW_HEIGHT;
                  const totalHours = START_HOUR + hoursFromStart;
                  
                  const snappedHours = Math.floor(totalHours * 2) / 2;
                  const h = Math.floor(snappedHours);
                  const m = Math.round((snappedHours % 1) * 60);

                  const newDate = new Date(day);
                  newDate.setHours(h, m, 0, 0);

                  setLocalAppts((prev) =>
                    prev.map((a) => (a.id === apptId ? { ...a, scheduled_at: newDate.toISOString() } : a))
                  );

                  // Dispatch toast event implicitly, user sees it immediately
                  window.dispatchEvent(
                    new CustomEvent("toast", {
                      detail: { title: "Consulta Remarcada", message: "A sessão foi reposicionada na agenda.", type: "success" },
                    })
                  );

                  try {
                    const { createClient } = await import("@/lib/supabase/client");
                    const supabase = createClient();
                    await supabase.from("appointments").update({ scheduled_at: newDate.toISOString() }).eq("id", apptId);
                  } catch (err) {
                    console.error(err);
                    setLocalAppts(appointments);
                  }
                }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  
                  const hoursFromStart = y / ROW_HEIGHT;
                  const totalHours = START_HOUR + hoursFromStart;
                  
                  const snappedHours = Math.floor(totalHours * 2) / 2;
                  const h = Math.floor(snappedHours);
                  const m = Math.round((snappedHours % 1) * 60);

                  const yyyy = day.getFullYear();
                  const mm = String(day.getMonth() + 1).padStart(2, "0");
                  const dd = String(day.getDate()).padStart(2, "0");
                  const dateStr = `${yyyy}-${mm}-${dd}`;
                  const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

                  window.dispatchEvent(
                    new CustomEvent("open-new-appointment", {
                      detail: { date: dateStr, time: timeStr },
                    })
                  );
                }}
              >
                {/* Current Time Indicator neon line (Only in current day column) */}
                {isCurrentDay && currentTimeTop >= 0 && currentTimeTop <= (END_HOUR - START_HOUR + 1) * ROW_HEIGHT && (
                  <div
                    className="absolute z-20 w-full flex items-center pointer-events-none"
                    style={{ top: `${currentTimeTop}px` }}
                  >
                    <div className="h-2.5 w-2.5 rounded-full border-[1.5px] border-bg-base bg-brand shadow-[0_0_8px_rgba(82,183,136,0.8)] -ml-1.5 z-30 drop-shadow-md" />
                    <div className="h-px bg-brand w-full opacity-80 shadow-[0_0_10px_rgba(82,183,136,0.4)]" />
                  </div>
                )}

                {/* Day Appointments */}
                {dayAppts.map((appt) => {
                  const startDate = new Date(appt.scheduled_at);
                  const hoursDec = startDate.getHours() + startDate.getMinutes() / 60;
                  if (hoursDec < START_HOUR || hoursDec > END_HOUR + 1) return null;

                  const top = (hoursDec - START_HOUR) * ROW_HEIGHT;
                  const durationMins = appt.duration_minutes ?? 50;
                  const height = (durationMins / 60) * ROW_HEIGHT;

                  /* Cor Aleatoria baseada no Hash do ID para imitar as Colors customizadas do GCalendar */
                  const hash = appt.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                  const colors = [
                    "border-brand bg-brand/10 hover:bg-brand/20 text-brand", 
                    "border-info bg-info/10 hover:bg-info/20 text-info", 
                    "border-gold bg-gold/10 hover:bg-gold/20 text-gold",
                    "border-purple-500 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400"
                  ];
                  const colorClass = colors[hash % colors.length];

                  return (
                    <div
                      key={appt.id}
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        e.dataTransfer.setData("text/plain", appt.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApptClick(appt);
                      }}
                      className={`absolute left-1 right-1 sm:left-2 sm:right-2 z-10 cursor-grab active:cursor-grabbing rounded-lg border-l-4 p-2 shadow-sm drop-shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg group overflow-hidden ${colorClass}`}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        minHeight: "40px", 
                      }}
                    >
                      <div className="flex flex-col h-full pointer-events-none">
                        <div className="flex items-center justify-between">
                          <p className="text-[12px] font-semibold tracking-wide truncate pr-4 text-text-primary">
                            {getPatientName(appt.patient)}
                          </p>
                        </div>
                        <p className="mt-0.5 text-[10px] opacity-80 flex items-center gap-1">
                          {String(startDate.getHours()).padStart(2, "0")}:{String(startDate.getMinutes()).padStart(2, "0")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Appointment Insight Drawer (Sheet) ── */}
      <div
        className={`fixed inset-0 z-50 flex justify-end transition-all ${
          sheetOpen && selectedAppt ? "visible bg-bg-base/60 backdrop-blur-[2px]" : "invisible"
        }`}
      >
        <div
          className="absolute inset-0"
          onClick={closeSheet}
        />
        <div
          className={`relative flex h-full w-full max-w-sm flex-col border-l border-border-strong bg-surface shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out ${
            sheetOpen && selectedAppt ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {selectedAppt && (
            <>
              {/* Header Drawer */}
              <div className="flex items-center justify-between border-b border-border-subtle px-6 py-5 bg-bg-elevated/50 backdrop-blur-md">
                <h2 className="font-display text-xl font-medium text-text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-brand">event_note</span>
                  Detalhes da Sessão
                </h2>
                <button
                  onClick={closeSheet}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-text-muted mb-1">Paciente</p>
                  <p className="text-lg font-medium text-text-primary">
                    {getPatientName(selectedAppt.patient)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border-subtle bg-bg-elevated p-3">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-text-muted mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      Horário
                    </p>
                    <p className="text-sm font-medium text-text-primary">
                      {new Date(selectedAppt.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border-subtle bg-bg-elevated p-3">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-text-muted mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">timer</span>
                      Duração
                    </p>
                    <p className="text-sm font-medium text-text-primary">
                      {selectedAppt.duration_minutes ?? 50} min
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-text-muted mb-1">Status</p>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand animate-[pulse_2s_infinite]"></span>
                    {selectedAppt.status === "confirmed" ? "Confirmada" : selectedAppt.status}
                  </div>
                </div>

                <div className="rounded-xl border border-border-subtle bg-brand/5 p-4 border-l-2 border-l-brand relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <span className="material-symbols-outlined text-[60px]">lightbulb</span>
                  </div>
                  <h3 className="text-xs font-semibold text-brand mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">psychology</span>
                    Insight Automático
                  </h3>
                  <p className="text-[13px] leading-relaxed text-text-secondary z-10 relative">
                    O acompanhamento prévio indicou evolução positiva. Recomendado rever os exercícios de respiração do último encontro.
                  </p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="border-t border-border-subtle bg-bg-elevated p-6">
                <AgendaAppointmentActions
                  appointmentId={selectedAppt.id}
                  scheduledAt={selectedAppt.scheduled_at}
                  status={selectedAppt.status}
                  videoRoomId={selectedAppt.video_room_id}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
