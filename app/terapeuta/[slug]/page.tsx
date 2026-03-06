import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function TherapistPublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: therapist } = await admin
    .from("therapists")
    .select(
      "id, name, slug, crp, bio, photo_url, specialties, session_price, session_duration, timezone, therapist_public_profiles!inner(display_name, profile_photo_url, short_bio, long_bio, city, state, therapeutic_approaches, modality_online, modality_presential, availability_summary, trust_indicators, opt_in_directory, profile_published)",
    )
    .eq("slug", slug)
    .eq("active", true)
    .eq("therapist_public_profiles.opt_in_directory", true)
    .eq("therapist_public_profiles.profile_published", true)
    .maybeSingle();

  if (!therapist) {
    notFound();
  }

  const profileSource = (therapist as { therapist_public_profiles?: unknown }).therapist_public_profiles;
  const profile = (Array.isArray(profileSource) ? profileSource[0] : profileSource ?? {}) as Record<
    string,
    unknown
  >;

  const { data: posts } = await admin
    .from("therapist_public_posts")
    .select("id, slug, title, excerpt, published_at")
    .eq("therapist_id", therapist.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(6);

  const trustIndicators = (profile.trust_indicators as string[] | undefined) ?? [];
  const approaches = (profile.therapeutic_approaches as string[] | undefined) ?? [];
  const availabilitySummary = (profile.availability_summary as string | undefined) ?? "Agenda atualizada semanalmente.";

  return (
    <main className="min-h-screen bg-bg-base text-text-primary">
      <section className="relative overflow-hidden border-b border-border-subtle bg-bg-elevated">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(82,183,136,0.18),transparent_55%)]" />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-5 px-4 py-12 text-center sm:px-6">
          <div className="h-28 w-28 overflow-hidden rounded-full border-2 border-gold/30 bg-surface shadow-[0_0_20px_rgba(196,163,90,0.15)]">
            {((profile.profile_photo_url as string | undefined) ?? therapist.photo_url) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={((profile.profile_photo_url as string | undefined) ?? therapist.photo_url) as string}
                alt={((profile.display_name as string | undefined) ?? therapist.name) as string}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl text-brand">
                {((profile.display_name as string | undefined) ?? therapist.name).slice(0, 1)}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gold">Perfil profissional verificado</p>
            <h1 className="mt-2 font-display text-5xl text-text-primary">
              {(profile.display_name as string | undefined) ?? therapist.name}
            </h1>
            <p className="mt-2 text-sm uppercase tracking-[0.18em] text-text-muted">CRP {therapist.crp}</p>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-text-secondary">
              {(profile.short_bio as string | undefined) ?? therapist.bio}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {trustIndicators.map((indicator) => (
              <span
                key={indicator}
                className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-gold"
              >
                {indicator}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-2 text-xs text-text-muted">
            <span className="rounded-full border border-border-subtle bg-surface px-3 py-1">
              {(profile.city as string | undefined) ?? "Online"}
              {(profile.state as string | undefined) ? `, ${profile.state as string}` : ""}
            </span>
            {Boolean(profile.modality_online) ? (
              <span className="rounded-full bg-info/10 px-3 py-1 text-info">Online</span>
            ) : null}
            {Boolean(profile.modality_presential) ? (
              <span className="rounded-full bg-brand/10 px-3 py-1 text-brand">Presencial</span>
            ) : null}
          </div>

          <div className="flex w-full max-w-md gap-3">
            <Link
              href={`/booking/${therapist.slug}`}
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-bg-base shadow-[0_4px_20px_rgba(82,183,136,0.25)] transition hover:bg-brand-hover"
            >
              Agendar sessão
            </Link>
            <Link
              href="#conteudos"
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-border-subtle bg-surface px-4 py-3 text-sm text-text-primary transition hover:border-brand/40"
            >
              Ver conteúdos
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-3">
        <article className="rounded-2xl border border-border-subtle bg-surface p-5 lg:col-span-2">
          <h2 className="font-display text-3xl text-text-primary">Sobre a abordagem</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
            {(profile.long_bio as string | undefined) ?? therapist.bio ?? ""}
          </p>
          {approaches.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {approaches.map((approach) => (
                <span key={approach} className="rounded-full border border-border-subtle bg-bg-elevated px-3 py-1 text-xs text-text-secondary">
                  {approach}
                </span>
              ))}
            </div>
          ) : null}
        </article>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border-subtle bg-surface p-5">
            <h3 className="font-display text-2xl text-text-primary">Disponibilidade</h3>
            <p className="mt-2 text-sm text-text-secondary">{availabilitySummary}</p>
            <p className="mt-3 text-xs text-text-muted">
              Duração padrão: {therapist.session_duration} min • Fuso: {therapist.timezone}
            </p>
          </div>
          <div className="rounded-2xl border border-border-subtle bg-surface p-5">
            <h3 className="font-display text-2xl text-text-primary">Especialidades</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {(therapist.specialties ?? []).map((specialty) => (
                <span key={specialty} className="rounded-full border border-border-subtle bg-bg-elevated px-3 py-1 text-xs text-text-secondary">
                  {specialty}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section id="conteudos" className="mx-auto max-w-5xl px-4 pb-12 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-3xl text-text-primary">Conteúdos publicados</h2>
          <span className="text-xs uppercase tracking-[0.18em] text-text-muted">Hub terapêutico</span>
        </div>
        {(posts ?? []).length === 0 ? (
          <div className="rounded-2xl border border-border-subtle bg-surface p-6 text-sm text-text-secondary">
            Ainda não há conteúdos públicos disponíveis.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {(posts ?? []).map((post) => (
              <article key={post.id} className="rounded-2xl border border-border-subtle bg-surface p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-brand">Revisado</p>
                <h3 className="mt-2 font-display text-2xl text-text-primary">{post.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{post.excerpt ?? "Sem resumo."}</p>
                <Link
                  href={`/terapeuta/${therapist.slug}/posts/${post.slug}`}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand transition hover:text-brand-hover"
                >
                  Ler conteúdo
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
