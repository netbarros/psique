"use client";

import { useState } from "react";
import Link from "next/link";

type AgendaAppointmentActionsProps = {
  appointmentId: string;
  scheduledAt: string;
  status: string;
  videoRoomId: string | null;
};

export function AgendaAppointmentActions({
  appointmentId,
  scheduledAt,
  status,
  videoRoomId,
}: AgendaAppointmentActionsProps) {
  const [loading, setLoading] = useState<"cancel" | "reschedule" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canMutate = status === "pending" || status === "confirmed";

  async function cancelAppointment() {
    setLoading("cancel");
    setError(null);

    try {
      const response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelado pelo dashboard" }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Falha ao cancelar");
      }

      window.location.reload();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Falha ao cancelar");
      setLoading(null);
    }
  }

  async function rescheduleOneWeek() {
    setLoading("reschedule");
    setError(null);

    try {
      const nextDate = new Date(scheduledAt);
      nextDate.setDate(nextDate.getDate() + 7);

      const response = await fetch(`/api/appointments/${appointmentId}/reschedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newScheduledAt: nextDate.toISOString() }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Falha ao reagendar");
      }

      window.location.reload();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Falha ao reagendar");
      setLoading(null);
    }
  }

  return (
    <div className="mt-2 space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        {videoRoomId ? (
          <Link
            href={`/dashboard/consulta/${videoRoomId}`}
            className="rounded-md border border-brand/40 bg-brand/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand"
          >
            Entrar
          </Link>
        ) : null}

        {canMutate ? (
          <button
            type="button"
            onClick={() => void cancelAppointment()}
            disabled={loading !== null}
            className="rounded-md border border-error/35 bg-error/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-error disabled:opacity-50"
          >
            {loading === "cancel" ? "Cancelando..." : "Cancelar"}
          </button>
        ) : null}

        {canMutate ? (
          <button
            type="button"
            onClick={() => void rescheduleOneWeek()}
            disabled={loading !== null}
            className="rounded-md border border-info/35 bg-info/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-info disabled:opacity-50"
          >
            {loading === "reschedule" ? "Reagendando..." : "+7 dias"}
          </button>
        ) : null}
      </div>

      {error ? <p className="text-[10px] text-error">{error}</p> : null}
    </div>
  );
}
