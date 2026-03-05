import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { getContentSection, getPublicContent } from "@/lib/frontend/public-catalog-client";
import { mapBookingSuccessContent } from "@/lib/frontend/content-mappers";

export const metadata: Metadata = {
  title: "Agendamento Confirmado — Psique",
  description: "Sua sessão foi agendada com sucesso!",
};

type BookingSuccessProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ at?: string; email?: string; session_id?: string }>;
};

export default async function BookingSuccessPage({
  params,
  searchParams,
}: BookingSuccessProps) {
  const { slug } = await params;
  const resolvedSearch = await searchParams;
  const stripeSessionId = resolvedSearch.session_id;

  const supabase = await createClient();
  const bookingSuccessContent = await getPublicContent("booking_success", "pt-BR").catch(() => null);
  const bookingSuccessSection = bookingSuccessContent ? getContentSection(bookingSuccessContent, "main") : null;
  const bookingSuccessUi = mapBookingSuccessContent(bookingSuccessSection);
  const { data: therapist } = await supabase
    .from("therapists")
    .select("name")
    .eq("slug", slug)
    .maybeSingle();

  let appointmentDateIso: string | null = resolvedSearch.at ?? null;
  let recipientEmail = resolvedSearch.email ?? null;

  if (stripeSessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
      recipientEmail =
        session.customer_details?.email ?? session.customer_email ?? recipientEmail;

      const appointmentId = session.metadata?.appointmentId;
      if (appointmentId) {
        const { data: appointment } = await supabase
          .from("appointments")
          .select("scheduled_at")
          .eq("id", appointmentId)
          .maybeSingle();

        if (appointment?.scheduled_at) {
          appointmentDateIso = appointment.scheduled_at;
        }
      }
    } catch {
      // keep fallback from query params
    }
  }

  const therapistName = therapist?.name ?? "Terapeuta Psique";
  const scheduledAt = appointmentDateIso ? new Date(appointmentDateIso) : null;
  const formattedDate = scheduledAt
    ? scheduledAt.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "A confirmar no email";
  const formattedTime = scheduledAt
    ? scheduledAt.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
  const recipientEmailLabel = recipientEmail ?? "seu email cadastrado";
  const calendarHref =
    scheduledAt &&
    buildGoogleCalendarUrl({
      title: `Sessão Psique com ${therapistName}`,
      description: "Sessão terapêutica agendada via Psique.",
      start: scheduledAt,
      end: new Date(scheduledAt.getTime() + 50 * 60 * 1000),
    });

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-base px-4 py-8">
      <section className="w-full max-w-lg text-center">
        <p className="mx-auto mb-4 inline-flex rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-gold">
          {bookingSuccessUi.badge}
        </p>
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-brand/30 bg-brand/10 shadow-[0_0_35px_rgba(82,183,136,0.2)]">
          <span className="material-symbols-outlined text-[40px] text-brand">check_circle</span>
        </div>

        <h1 className="font-display text-4xl font-semibold text-text-primary">
          {bookingSuccessUi.title}
        </h1>

        <p className="mx-auto mb-6 mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
          {bookingSuccessUi.subtitle}
        </p>

        <div className="mb-6 rounded-2xl border border-border-subtle bg-surface p-4 text-left">
          <h2 className="mb-2 font-display text-2xl text-text-primary">
            {bookingSuccessUi.nextStepsTitle}
          </h2>
          <ul className="space-y-1.5 text-sm text-text-secondary">
            {bookingSuccessUi.nextSteps.map((item, index) => (
              <li key={`next-step-${index}`}>
                {index + 1}. {item}
              </li>
            ))}
          </ul>
        </div>

        <article className="mb-6 rounded-2xl border border-border-subtle bg-bg-elevated p-5 text-left">
          <h2 className="mb-4 font-display text-2xl text-text-primary">
            {bookingSuccessUi.detailsTitle}
          </h2>
          <div className="space-y-2.5 text-sm">
            <DetailRow
              icon={<span className="material-symbols-outlined text-[16px] text-brand">calendar_month</span>}
              label={bookingSuccessUi.detailsDateLabel}
              value={formattedDate}
            />
            <DetailRow
              icon={<span className="material-symbols-outlined text-[16px] text-brand">schedule</span>}
              label={bookingSuccessUi.detailsTimeLabel}
              value={formattedTime}
            />
            <DetailRow
              icon={<span className="material-symbols-outlined text-[16px] text-brand">person</span>}
              label={bookingSuccessUi.detailsTherapistLabel}
              value={therapistName}
            />
            <DetailRow
              icon={<span className="material-symbols-outlined text-[16px] text-brand">videocam</span>}
              label={bookingSuccessUi.detailsAccessLabel}
              value={bookingSuccessUi.detailsAccessValue}
            />
          </div>
        </article>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/portal"
            className="w-full rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-bg-base transition-colors hover:bg-brand-hover sm:w-auto"
          >
            {bookingSuccessUi.primaryCtaLabel}
          </Link>
          {calendarHref ? (
            <Link
              href={calendarHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-xl border border-border-subtle bg-surface px-5 py-3 text-sm text-text-secondary transition-colors hover:bg-surface-hover sm:w-auto"
            >
              {bookingSuccessUi.secondaryCtaLabel}
            </Link>
          ) : (
            <span className="w-full rounded-xl border border-border-subtle bg-surface px-5 py-3 text-sm text-text-muted sm:w-auto">
              {bookingSuccessUi.secondaryCtaUnavailableLabel}
            </span>
          )}
        </div>

        <p className="mt-4 flex items-center justify-center gap-1 text-xs text-text-muted">
          <span className="material-symbols-outlined text-[14px]">mail</span>
          {bookingSuccessUi.confirmationEmailPrefix} {recipientEmailLabel}
        </p>
      </section>
    </main>
  );
}

function buildGoogleCalendarUrl({
  title,
  description,
  start,
  end,
}: {
  title: string;
  description: string;
  start: Date;
  end: Date;
}) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details: description,
    dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function formatGoogleDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface px-3 py-2.5">
      <span className="inline-flex items-center gap-2 text-text-secondary">
        {icon}
        {label}
      </span>
      <span className="text-right font-medium text-text-primary">{value}</span>
    </div>
  );
}
