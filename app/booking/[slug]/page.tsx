import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BookingClient from "./BookingClient";
import { getContentSection, getPublicContent } from "@/lib/frontend/public-catalog-client";
import { mapBookingContent } from "@/lib/frontend/content-mappers";

type Props = { params: Promise<{ slug: string }> };

async function getPublicBookingClient() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createAdminClient();
  }
  return createServerClient();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await getPublicBookingClient();
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
  const supabase = await getPublicBookingClient();
  const bookingContent = await getPublicContent("booking", "pt-BR").catch(() => null);
  const bookingSection = bookingContent ? getContentSection(bookingContent, "main") : null;
  const bookingUi = mapBookingContent(bookingSection);

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
    .eq("is_off", false)
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

  const { data: blocks } = await supabase
    .from("availability_blocks")
    .select("blocked_at")
    .eq("therapist_id", t.id)
    .gte("blocked_at", new Date().toISOString())
    .lte("blocked_at", futureDate.toISOString());

  const bookedTimes = [
    ...(bookedAppts ?? []).map((a: unknown) => (a as { scheduled_at: string }).scheduled_at),
    ...(blocks ?? []).map((b: unknown) => (b as { blocked_at: string }).blocked_at)
  ];

  return (
    <div className="min-h-screen bg-bg-base flex flex-col font-sans animate-[fadeUp_.4s_ease-out_both]">
      {/* Header */}
      <header className="px-8 py-5 border-b border-border-subtle bg-surface/30 backdrop-blur-md flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <span className="text-[26px] text-brand font-display font-light leading-none">
            Ψ
          </span>
          <span className="font-display text-[20px] font-light text-text-primary tracking-wide">
            Psique
          </span>
        </div>
        <a
          href="/auth/login"
          className="text-[13px] text-text-muted no-underline hover:text-text-primary transition-colors font-medium tracking-wide"
        >
          Já tem conta? Entrar
        </a>
      </header>

      {/* Content */}
      <main className="flex-1 flex justify-center py-12 px-6">
        <div className="max-w-[900px] w-full">
          {/* Therapist profile */}
          <div className="flex flex-col sm:flex-row gap-8 mb-12 items-start animate-[fadeUp_.4s_ease-out_.1s_both]">
            {/* Avatar */}
            <div className="w-[100px] h-[100px] shrink-0 rounded-full flex items-center justify-center font-display text-[32px] font-light text-brand bg-brand/5 border-2 border-brand/20 shadow-[0_0_30px_rgba(82,183,136,0.1)] relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10">
                {t.name
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="font-display text-[42px] font-light text-text-primary leading-[1.1] mb-3 tracking-tight">
                {t.name}
              </h1>
              <div className="text-[14px] text-text-muted flex flex-wrap gap-x-3 gap-y-1 items-center mb-5 font-light">
                <span className="tracking-wide">CRP {t.crp}</span>
                <span className="opacity-50">·</span>
                <span>{t.session_duration} min</span>
                <span className="opacity-50">·</span>
                <span className="text-[#fbbf24] font-medium tracking-wide">
                  R$ {Number(t.session_price).toFixed(2)}
                </span>
              </div>
              {t.bio && (
                <p className="text-[15px] text-text-secondary leading-[1.75] max-w-[600px] font-light mb-6">
                  {t.bio}
                </p>
              )}
              {t.specialties && t.specialties.length > 0 && (
                <div className="flex flex-wrap gap-2.5 mt-2">
                  {t.specialties.map((s) => (
                    <span
                      key={s}
                      className="text-[12px] px-3.5 py-1.5 rounded-full bg-brand/5 text-brand border border-brand/20 tracking-wide"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Booking client component */}
          <div className="animate-[fadeUp_.4s_ease-out_.2s_both]">
            <BookingClient
              therapistId={t.id}
              therapistName={t.name}
              sessionPrice={Number(t.session_price)}
              sessionDuration={t.session_duration}
              availabilitySlots={slots}
              bookedTimes={bookedTimes}
              slug={t.slug}
              uiContent={bookingUi}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-8 border-t border-border-subtle text-center text-[11px] text-text-muted tracking-wide font-light bg-surface/10 backdrop-blur-sm relative z-10">
        {bookingUi.footerNote}
      </footer>
    </div>
  );
}
