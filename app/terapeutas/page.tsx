import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function TherapistsDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    specialty?: string;
    approach?: string;
    city?: string;
    modality?: string;
  }>;
}) {
  const params = await searchParams;
  const admin = createAdminClient();

  let query = admin
    .from("therapists")
    .select(
      "id, name, slug, bio, photo_url, specialties, therapist_public_profiles!inner(display_name, short_bio, city, state, therapeutic_approaches, modality_online, modality_presential, trust_indicators, opt_in_directory, profile_published)",
    )
    .eq("active", true)
    .eq("therapist_public_profiles.opt_in_directory", true)
    .eq("therapist_public_profiles.profile_published", true)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (params.specialty) {
    query = query.contains("specialties", [params.specialty]);
  }

  if (params.approach) {
    query = query.contains("therapist_public_profiles.therapeutic_approaches", [params.approach]);
  }

  if (params.city) {
    query = query.ilike("therapist_public_profiles.city", `%${params.city}%`);
  }

  if (params.modality === "online") {
    query = query.eq("therapist_public_profiles.modality_online", true);
  }

  if (params.modality === "presencial") {
    query = query.eq("therapist_public_profiles.modality_presential", true);
  }

  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,bio.ilike.%${params.q}%`);
  }

  const { data } = await query;

  const rows = (data ?? []).map((item) => {
    const profileSource = (item as { therapist_public_profiles?: unknown }).therapist_public_profiles;
    const profile = (Array.isArray(profileSource) ? profileSource[0] : profileSource ?? {}) as Record<
      string,
      unknown
    >;

    return {
      id: item.id,
      name: (profile.display_name as string | undefined) ?? item.name,
      slug: item.slug,
      summary: (profile.short_bio as string | undefined) ?? item.bio ?? "",
      photoUrl: item.photo_url,
      specialties: item.specialties ?? [],
      approaches: (profile.therapeutic_approaches as string[] | undefined) ?? [],
      city: (profile.city as string | undefined) ?? null,
      state: (profile.state as string | undefined) ?? null,
      online: Boolean(profile.modality_online),
      presencial: Boolean(profile.modality_presential),
      trustIndicators: (profile.trust_indicators as string[] | undefined) ?? [],
    };
  });

  return (
    <main className="min-h-screen bg-bg-base px-4 py-8 text-text-primary sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-border-subtle bg-bg-elevated p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
          <p className="text-[11px] uppercase tracking-[0.2em] text-brand">Diretório Psique</p>
          <h1 className="mt-2 font-display text-4xl text-text-primary sm:text-5xl">Encontre terapeuta ideal para sua jornada</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">
            Descubra profissionais por especialidade, abordagem e modalidade de atendimento.
          </p>
          <form className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" method="GET">
            <input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Buscar nome ou tema"
              className="rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none"
            />
            <input
              name="specialty"
              defaultValue={params.specialty ?? ""}
              placeholder="Especialidade"
              className="rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none"
            />
            <input
              name="approach"
              defaultValue={params.approach ?? ""}
              placeholder="Abordagem"
              className="rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none"
            />
            <input
              name="city"
              defaultValue={params.city ?? ""}
              placeholder="Cidade"
              className="rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none"
            />
            <select
              name="modality"
              defaultValue={params.modality ?? ""}
              className="rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none"
            >
              <option value="">Modalidade</option>
              <option value="online">Online</option>
              <option value="presencial">Presencial</option>
            </select>
            <button
              type="submit"
              className="sm:col-span-2 lg:col-span-5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-bg-base transition hover:bg-brand-hover"
            >
              Aplicar filtros
            </button>
          </form>
        </header>

        {rows.length === 0 ? (
          <section className="rounded-2xl border border-border-subtle bg-surface p-8 text-center text-sm text-text-secondary">
            Nenhum terapeuta encontrado com os filtros atuais.
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((therapist) => (
              <article
                key={therapist.id}
                className="rounded-2xl border border-border-subtle bg-surface p-5 transition hover:-translate-y-0.5 hover:border-brand/40"
              >
                <div className="mb-3 flex items-start gap-3">
                  <div className="h-14 w-14 overflow-hidden rounded-xl border border-border-subtle bg-bg-elevated">
                    {therapist.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={therapist.photoUrl} alt={therapist.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-brand">
                        {therapist.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-display text-2xl text-text-primary">{therapist.name}</h2>
                    <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
                      {therapist.city ? `${therapist.city}${therapist.state ? `, ${therapist.state}` : ""}` : "Atendimento nacional"}
                    </p>
                  </div>
                </div>

                <p className="line-clamp-3 text-sm leading-relaxed text-text-secondary">{therapist.summary}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {therapist.specialties.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full border border-border-subtle bg-bg-elevated px-2.5 py-1 text-[11px] text-text-secondary">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-text-muted">
                  <span className={`rounded-full px-2 py-0.5 ${therapist.online ? "bg-info/10 text-info" : "bg-border-subtle/60 text-text-muted"}`}>
                    Online
                  </span>
                  <span className={`rounded-full px-2 py-0.5 ${therapist.presencial ? "bg-brand/10 text-brand" : "bg-border-subtle/60 text-text-muted"}`}>
                    Presencial
                  </span>
                </div>

                {therapist.trustIndicators.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {therapist.trustIndicators.slice(0, 2).map((indicator) => (
                      <span
                        key={indicator}
                        className="rounded-md border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-gold"
                      >
                        {indicator}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-5 flex items-center justify-between gap-2">
                  <Link
                    href={`/terapeuta/${therapist.slug}`}
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-border-subtle px-3 py-2 text-sm text-text-primary transition hover:border-brand/40"
                  >
                    Ver perfil
                  </Link>
                  <Link
                    href={`/booking/${therapist.slug}`}
                    className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-bg-base transition hover:bg-brand-hover"
                  >
                    Agendar
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
