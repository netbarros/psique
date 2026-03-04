import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BookingClient from "./BookingClient";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: therapist } = await supabase
    .from("therapists")
    .select("name, bio")
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (!therapist) return { title: "Terapeuta não encontrado" };

  return {
    title: `Agendar com ${therapist.name} — Psique`,
    description:
      therapist.bio ?? `Agende uma sessão com ${therapist.name} pela plataforma Psique.`,
  };
}

export default async function BookingPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch therapist by slug (public page — no auth required)
  const { data: therapist } = await supabase
    .from("therapists")
    .select(
      "id, name, crp, bio, photo_url, slug, specialties, session_price, session_duration, timezone"
    )
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (!therapist) notFound();

  const t = therapist as unknown as {
    id: string;
    name: string;
    crp: string;
    bio: string | null;
    photo_url: string | null;
    slug: string;
    specialties: string[];
    session_price: number;
    session_duration: number;
    timezone: string;
  };

  // Fetch weekly availability
  const { data: availability } = await supabase
    .from("availability")
    .select("day_of_week, start_time, end_time")
    .eq("therapist_id", t.id)
    .eq("active", true)
    .order("day_of_week")
    .order("start_time");

  const slots = (availability ?? []) as unknown as Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>;

  // Fetch booked appointments (next 21 days)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 21);

  const { data: bookedAppts } = await supabase
    .from("appointments")
    .select("scheduled_at")
    .eq("therapist_id", t.id)
    .in("status", ["pending", "confirmed", "in_progress"])
    .gte("scheduled_at", new Date().toISOString())
    .lte("scheduled_at", futureDate.toISOString());

  const bookedTimes = (bookedAppts ?? []).map(
    (a: unknown) => (a as { scheduled_at: string }).scheduled_at
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "16px 32px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 24,
              color: "var(--mint)",
              fontFamily: "var(--ff)",
              fontWeight: 200,
            }}
          >
            Ψ
          </span>
          <span
            style={{
              fontFamily: "var(--ff)",
              fontSize: 18,
              fontWeight: 200,
              color: "var(--ivory)",
            }}
          >
            Psique
          </span>
        </div>
        <a
          href="/auth/login"
          style={{
            fontSize: 13,
            color: "var(--ivoryDD)",
            textDecoration: "none",
          }}
        >
          Já tem conta? Entrar
        </a>
      </header>

      {/* Content */}
      <main
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          padding: "40px 24px",
        }}
      >
        <div style={{ maxWidth: 900, width: "100%" }}>
          {/* Therapist profile */}
          <div
            style={{
              display: "flex",
              gap: 24,
              marginBottom: 36,
              alignItems: "flex-start",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                flexShrink: 0,
                background:
                  "radial-gradient(circle at 35% 35%, rgba(82,183,136,.44), rgba(82,183,136,.22))",
                border: "2px solid rgba(82,183,136,.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--ff)",
                fontSize: 28,
                fontWeight: 200,
                color: "var(--mint)",
              }}
            >
              {t.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <div>
              <h1
                style={{
                  fontFamily: "var(--ff)",
                  fontSize: 36,
                  fontWeight: 200,
                  color: "var(--ivory)",
                  lineHeight: 1.1,
                  marginBottom: 6,
                }}
              >
                {t.name}
              </h1>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--ivoryDD)",
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <span>CRP {t.crp}</span>
                <span>·</span>
                <span>{t.session_duration} min</span>
                <span>·</span>
                <span style={{ color: "var(--gold)", fontWeight: 500 }}>
                  R$ {Number(t.session_price).toFixed(2)}
                </span>
              </div>
              {t.bio && (
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--ivoryD)",
                    lineHeight: 1.7,
                    maxWidth: 500,
                  }}
                >
                  {t.bio}
                </p>
              )}
              {t.specialties && t.specialties.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 10,
                  }}
                >
                  {t.specialties.map((s) => (
                    <span
                      key={s}
                      style={{
                        fontSize: 11,
                        padding: "3px 10px",
                        borderRadius: 20,
                        background: "rgba(82,183,136,.1)",
                        color: "var(--mint)",
                        border: "1px solid rgba(82,183,136,.25)",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Booking client component */}
          <BookingClient
            therapistId={t.id}
            therapistName={t.name}
            sessionPrice={Number(t.session_price)}
            sessionDuration={t.session_duration}
            availabilitySlots={slots}
            bookedTimes={bookedTimes}
            slug={t.slug}
          />
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: "16px 32px",
          borderTop: "1px solid var(--border)",
          textAlign: "center",
          fontSize: 11,
          color: "var(--ivoryDD)",
        }}
      >
        Psique — Plataforma Terapêutica · Seus dados são protegidos por criptografia e LGPD
      </footer>
    </div>
  );
}
