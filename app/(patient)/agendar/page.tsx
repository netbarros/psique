import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { formatBRL, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Agendar Sessão" };

export default async function AgendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: patient } = await supabase
    .from("patients")
    .select("id, name, therapist_id")
    .eq("user_id", user.id)
    .single();
  if (!patient) redirect("/dashboard");

  const therapistId = (patient as unknown as { therapist_id: string }).therapist_id;

  // Fetch therapist info
  const { data: therapist } = await supabase
    .from("therapists")
    .select("name, session_price, session_duration, slug")
    .eq("id", therapistId)
    .single();

  const t = therapist as unknown as {
    name: string;
    session_price: number;
    session_duration: number;
    slug: string;
  } | null;

  // Fetch weekly availability
  const { data: availability } = await supabase
    .from("availability")
    .select("day_of_week, start_time, end_time")
    .eq("therapist_id", therapistId)
    .eq("active", true)
    .order("day_of_week")
    .order("start_time");

  const slots = (availability ?? []) as unknown as Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>;

  // Fetch existing appointments to mark unavailable
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 14);

  const { data: existingAppts } = await supabase
    .from("appointments")
    .select("scheduled_at")
    .eq("therapist_id", therapistId)
    .in("status", ["pending", "confirmed", "in_progress"])
    .gte("scheduled_at", new Date().toISOString())
    .lte("scheduled_at", nextWeek.toISOString());

  const booked = (existingAppts ?? []).map(
    (a: unknown) => (a as { scheduled_at: string }).scheduled_at
  );

  const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Group slots by day
  const slotsByDay: Record<number, typeof slots> = {};
  for (const slot of slots) {
    if (!slotsByDay[slot.day_of_week]) slotsByDay[slot.day_of_week] = [];
    slotsByDay[slot.day_of_week].push(slot);
  }

  // Generate next 14 days
  const days: Array<{ date: Date; dayOfWeek: number; dateStr: string }> = [];
  for (let i = 1; i <= 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    days.push({
      date: d,
      dayOfWeek: d.getDay(),
      dateStr: d.toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
      }),
    });
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "var(--ff)",
            fontSize: 34,
            fontWeight: 200,
            color: "var(--ivory)",
          }}
        >
          Agendar Sessão
        </h1>
        <p style={{ fontSize: 14, color: "var(--ivoryDD)", marginTop: 4 }}>
          Escolha o melhor horário para sua próxima sessão
          {t && (
            <span>
              {" "}com <span style={{ color: "var(--blue)" }}>{t.name}</span>
            </span>
          )}
        </p>
      </div>

      {/* Session info */}
      {t && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 14,
            marginBottom: 24,
          }}
        >
          <InfoCard label="Duração" value={`${t.session_duration} min`} icon="⏱" />
          <InfoCard label="Valor" value={formatBRL(Number(t.session_price))} icon="💳" />
          <InfoCard label="Modalidade" value="Online" icon="🎥" />
        </div>
      )}

      {/* Availability grid */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 18,
          padding: "24px 28px",
          marginBottom: 24,
        }}
      >
        <h2
          style={{
            fontFamily: "var(--ff)",
            fontSize: 22,
            fontWeight: 300,
            color: "var(--ivory)",
            marginBottom: 18,
          }}
        >
          Horários Disponíveis
        </h2>

        {slots.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "32px",
              color: "var(--ivoryDD)",
              fontSize: 14,
            }}
          >
            O terapeuta ainda não configurou seus horários disponíveis.
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {days
              .filter((d) => slotsByDay[d.dayOfWeek])
              .map((day) => (
                <div key={day.dateStr}>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--ivoryD)",
                      fontWeight: 500,
                      marginBottom: 8,
                    }}
                  >
                    {DAYS[day.dayOfWeek]} · {formatDate(day.date)}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {slotsByDay[day.dayOfWeek].map((slot) => {
                      // Generate hourly slots between start and end
                      const times = generateTimeSlots(
                        slot.start_time,
                        slot.end_time,
                        t?.session_duration ?? 50
                      );
                      return times.map((time) => {
                        const slotDate = new Date(day.date);
                        const [h, m] = time.split(":").map(Number);
                        slotDate.setHours(h, m, 0, 0);
                        const isBooked = booked.some(
                          (b) =>
                            Math.abs(
                              new Date(b).getTime() - slotDate.getTime()
                            ) < 3600000
                        );

                        return (
                          <div
                            key={`${day.dateStr}-${time}`}
                            style={{
                              padding: "8px 16px",
                              borderRadius: 10,
                              fontSize: 13,
                              fontWeight: 500,
                              background: isBooked
                                ? "var(--bg3)"
                                : "rgba(82,183,136,.08)",
                              color: isBooked
                                ? "var(--ivoryDD)"
                                : "var(--mint)",
                              border: isBooked
                                ? "1px solid var(--border)"
                                : "1px solid rgba(82,183,136,.3)",
                              cursor: isBooked ? "not-allowed" : "pointer",
                              opacity: isBooked ? 0.5 : 1,
                              textDecoration: isBooked
                                ? "line-through"
                                : "none",
                              transition: "all .15s var(--ease-out)",
                            }}
                          >
                            {time}
                          </div>
                        );
                      });
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Info note */}
      <div
        style={{
          padding: "14px 18px",
          background: "rgba(74,143,168,.08)",
          border: "1px solid rgba(74,143,168,.2)",
          borderRadius: 14,
          fontSize: 13,
          color: "var(--ivoryDD)",
          lineHeight: 1.6,
        }}
      >
        💡 Após selecionar o horário, você será redirecionado para a página de
        pagamento. A sessão será confirmada após o pagamento.
        {t && (
          <span>
            {" "}
            Ou agende diretamente via{" "}
            <a
              href={`/booking/${t.slug}`}
              style={{ color: "var(--mint)", fontWeight: 500 }}
            >
              página pública
            </a>
            .
          </span>
        )}
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: "16px 20px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          color: "var(--ivoryDD)",
          marginBottom: 6,
        }}
      >
        <span>{icon}</span> {label}
      </div>
      <div
        style={{
          fontFamily: "var(--ff)",
          fontSize: 22,
          fontWeight: 300,
          color: "var(--ivory)",
        }}
      >
        {value}
      </div>
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
